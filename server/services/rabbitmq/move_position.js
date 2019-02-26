var { create_channel, consume_message } = require("../../config/rabbitmq");
const axios = require("axios");
const debug = require("debug")(__filename);
const _ = require("lodash");
const validation_utils = require('../../utils/validators');
const {logger} = require('../../errors/errorLogger');
const {inspect} = require('../../utils/printHelper');


module.exports = exports = {};
exports.convert_tree_data_api_to_tree_view_client = convert_tree_data_api_to_tree_view_client;
exports.__convert_to_key_value_for_compare = __convert_to_page_positions_format;

var queue_name = "move_position";

const channel = create_channel(queue_name)
  .then(channel => {

    consume_message(channel, queue_name, async function(msg) {

      var message = msg.content.toString();
      logger.info("=> received", message);
      const { correlationId, replyTo } = msg.properties;

      await move_position_handler(JSON.parse(message));
      
    });
  })
  .catch(error => {
    logger.error(error);
  });

async function move_position_handler(tree_view_client) {

  try {
  //determine workbook_id from tree_view_client
  var workbook_id_client = tree_view_client.id;
  var tree_data_api = await get_tree_data_from_api(workbook_id_client);

  var tree_view_api = convert_tree_data_api_to_tree_view_client(tree_data_api.data);
  
  //determine the differences between tree_view_client and tree_view_api
  var page_positions_tree_view_client = __convert_to_page_positions_format(tree_view_client);
  var page_positions_tree_view_api = __convert_to_page_positions_format(tree_view_api);

  var page_positions_diff = {};
  _.forOwn(page_positions_tree_view_api,  (value, key) => {

    if (!_.isNil(page_positions_tree_view_client[key]) &&
        page_positions_tree_view_client[key].display != page_positions_tree_view_api[key].display ) {

        page_positions_diff[key] = {};
        page_positions_diff[key].display = page_positions_tree_view_client[key].display;
        page_positions_diff[key].position_table_name = value.position_table_name;
        page_positions_diff[key].position_table_id = value.position_table_id;
    }
  });

  //send update_position command to queue
  _.forOwn(page_positions_diff, async (value, key) => {

    try {
    var {data, status} = await _update_position(value.position_table_name, value.position_table_id, value.display);
      if(status === 200) {
        logger.info(`Done updating position at path ${key} at new position is ${value.display}:` + inspect(data));
      }
    
    } catch (error) {
      logger.warn(`Error updating position at path ${key}!!!: ` + inspect(error));
    }
  })


  } catch (error) {

    logger.info(error);
  }

}

async function get_tree_data_from_api(workbook_id) {
  const filter_options = {
    include: {
      relation: "workbook_chapters",
      scope: {
        order: "display_index ASC",
        include: {
          relation: "chapter",
          scope: {
            include: {
              relation: "chapter_pages",
              scope: {
                order: "display_index ASC",
                include: "page"
              }
            }
          }
        }
      }
    }
  };

  var tree_data = await axios.request({
    url: `/workbooks/${workbook_id}`,
    method: "get",
    baseURL: process.env.API_URL,
    params: {
      access_token: process.env.API_ACCESS_TOKEN,
      filter: filter_options
    }
  });

  return tree_data;
}
/**
 *
 *
 * @param {*} tree_data
 * @returns {object|Error} new tree view was converted or throw error if unable to convert
 */
function convert_tree_data_api_to_tree_view_client(tree_data) {
  var workbook_root = {};
  workbook_root.id = tree_data.id;
  workbook_root.type = tree_data.type;
  workbook_root.elements = [];

  __convert_chapters_and_pages(tree_data, workbook_root.elements);

  //validate to make sure the structure of new tree_view is valid
  var tree_view_joi_result = validation_utils.workbook_chapter_tree_view_joi.validate(workbook_root, validation_utils.baseJoiOptions);

  if (tree_view_joi_result.error) {

    logger.error('Wrong format of tree view generated from tree_data read in database' + inspect(tree_view_joi_result.error));
    throw new Error('Wrong format of tree view!!!' + inspect(tree_view_joi_result.error));
  }

  return workbook_root;

  function __convert_chapters_and_pages(tree_data, final_result = []) {
    if (Array.isArray(tree_data) || _.isPlainObject(tree_data)) {
      _.transform(
        tree_data,
        (result, value, key) => {
          if (!["workbook_chapters", "chapter_pages"].includes(key)) {
            return __convert_chapters_and_pages(value, final_result);
          } else {
            if (key == "workbook_chapters") {
              //this is array of chapters

              var chapters = [];
              if (Array.isArray(value)) {
                for (const [index, workbook_chapter] of value.entries()) {
                  var chapter_result = {};
                  chapter_result.id = workbook_chapter.chapterId;
                  chapter_result.display = workbook_chapter.display_index;
                  chapter_result.type = "chapter";
                  __convert_chapters_and_pages(
                    _.get(workbook_chapter, "chapter", {}),
                    chapter_result
                  );

                  chapter_result.position_table = {};
                  chapter_result.position_table.table_name = 'workbook_chapters';
                  chapter_result.position_table.id = workbook_chapter.id;

                  final_result.push(chapter_result);
                }
              }
            } else if (key == "chapter_pages") {
              var pages = [];
              if (Array.isArray(value)) {
                for (const [index, chapter_page] of value.entries()) {
                  var page_id = chapter_page.pageId;
                  var display = chapter_page.display_index;
                  var type = "page";
                  var position_table = {};
                  position_table.table_name = 'chapter_pages';
                  position_table.id = chapter_page.id;
                  pages.push({ id: page_id, type, display, position_table });
                }
              }

              final_result.elements = pages;
            }
          }
        },
        final_result
      );
    }
  }
}
/**
 * convert tree view to object has specified format for compare later
 *
 * @param {*} tree_view
 * @param {*} parent_key_id
 * @param {*} [final_result={}]
 * @returns {object} object has format like that
 * ```
   { 
   'workbook-12-chapter-21-page-40': {display: 4, position_table_name: 'chapter_page', position_table_id: 3},
   'workbook-12-chapter-21-page-45': {display: 5, position_table_name: 'chapter_page', position_table_id: 4}  
   }
 * ```
 * `key` is a path starting from workbook, has format is series of <type>-<id>
 * `value` is display position
 */
function __convert_to_page_positions_format(tree_view, parent_key_id, final_result = {}) {

  if (_.isPlainObject(tree_view)) {

    _.transform(tree_view, (result, value, key, object) => {

      if (["elements"].includes(key)) {
        
        parent_key_id = ___generateKeyID(object.id, object.type, parent_key_id);
        return __convert_to_page_positions_format(value, parent_key_id, final_result);
      } else if (["display"].includes(key) && object.type != 'chapter') {
                
        let result_key = ___generateKeyID(object.id, object.type, parent_key_id);
        final_result[result_key] = {};
        final_result[result_key].display = value;
        if ( object.position_table) {

          final_result[result_key].position_table_name = object.position_table.table_name;
          final_result[result_key].position_table_id = object.position_table.id;
        }        
      }
    }, final_result);

    return final_result;
  } else if (Array.isArray(tree_view)) {

    for(let element of tree_view) {
      __convert_to_page_positions_format(element, parent_key_id, final_result);
    }
  }

  function ___generateKeyID(id, type, parent_key_id) {

    if (typeof parent_key_id == "undefined") {
      parent_key_id = '';
    } else {
      parent_key_id += "-"; 
    }

    return `${parent_key_id}${type}-${id}`;
  }
}

async function _update_position(position_table_name, position_table_id, display_index) {
  
  var update_position_result =  await axios.request({
    url: `/${position_table_name}/${position_table_id}`,
    method: "patch",
    baseURL: process.env.API_URL,
    params: {
      access_token: process.env.API_ACCESS_TOKEN,
    },
    data: {
      display_index
    }
  });

  return update_position_result;
}