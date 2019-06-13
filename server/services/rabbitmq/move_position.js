var {
  create_channel,
  consume_message_direct
} = require("@cc_server/utils").rabbitmq;
const axios = require("axios");
const debug = require("debug")(__filename);
const _ = require("lodash");
const validation_utils = require("../../utils/validators");
const { logger } = require("@cc_server/logger");
const { inspect } = require("@cc_server/utils/lib/printHelper");
const api_util = require("../api_util");
const URI = require("urijs");
const { promisify } = require("util");
const qs = require("qs");

module.exports = exports = {};
exports.__convert_to_page_positions_format = __convert_to_page_positions_format;

var routing_key = "move_position";

axios.interceptors.request.use(request => {
  logger.info(`Starting send request: ${inspect(request)}`);
  return request;
});

axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    logger.warn(error);
  }
);

const channel = create_channel()
  .then(channel => {
    consume_message_direct(
      routing_key,
      async function(msg) {
        var message = msg.content.toString();
        logger.info(`=> received: ${message}`);
        const { correlationId, replyTo } = msg.properties;

        await move_position_handler(JSON.parse(message));
      },
      channel
    );
  })
  .catch(error => {
    logger.error(error);
    process.exit(1); //make pm2 auto-restart service
  });

async function move_position_handler(tree_view_client) {
  try {
    //login to get access_token api
    var login_url = new URI("/api/login", process.env.API_URL).toString();
    await api_util.login(
      login_url,
      process.env.API_LOGIN_EMAIL,
      process.env.API_LOGIN_PASSWORD
    );

    var positions_need_update = __convert_to_page_positions_format(
      tree_view_client
    );

    //send update_position command to queue
    _.forOwn(positions_need_update, async (value, key) => {
      try {
        let where_filter = {
          [value.to_model_field]: value.to_model_value
        };

        var req_body = {
          display_index: value.display_index,
          [value.from_model_field]: value.from_model_value
        };

        var { data, status } = await _update_position(
          value.relation_model_name,
          where_filter,
          req_body
        );
        if (status === 200) {
          logger.info(
            `Done updating position at path ${key} with new value is:` +
              inspect(req_body)
          );
        }
      } catch (error) {
        logger.warn(
          `Error updating position at path ${key}!!!: ` +
            inspect(_.get(error, "response.data", error))
        );
      }
    });
  } catch (error) {
    logger.info(error);
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
   'workbook-12-chapter-21': {
          display_index: 4, 
          relation_model_name: 'workbook_chapter',
          from_model_field: 'workbookId',
          from_model_value: '12',
          to_model_field: 'chapterId',
          to_model_value: '21',
      }
   }
 * ```
 * `key` is a path string has format is series of <type>-<id>
 * `value` is object contain position table info
 */
function __convert_to_page_positions_format(
  tree_view,
  parent_key_id,
  final_result = {}
) {
  if (_.isPlainObject(tree_view)) {
    _.transform(
      tree_view,
      (result, value, key, object) => {
        if (["elements"].includes(key)) {
          parent_key_id = ___generateKeyID(object.id, object.type);
          return __convert_to_page_positions_format(
            value,
            parent_key_id,
            final_result
          );
        } else if (["display"].includes(key)) {
          try {
            let result_key = ___generateKeyID(
              object.id,
              object.type,
              parent_key_id
            );

            var position_table_fields = ___determinePositionTableFields(
              result_key
            );

            final_result[result_key] = {};
            final_result[result_key].display_index = parseInt(value);
            final_result[result_key] = {
              ...final_result[result_key],
              ...position_table_fields
            };
          } catch (error) {
            //logger.info(error);
            console.error(error);
          }
        }
      },
      final_result
    );

    return final_result;
  } else if (Array.isArray(tree_view)) {
    for (let element of tree_view) {
      __convert_to_page_positions_format(element, parent_key_id, final_result);
    }
  }

  function ___generateKeyID(id, type, parent_key_id) {
    if (typeof parent_key_id == "undefined") {
      parent_key_id = "";
    } else {
      parent_key_id += "-";
    }

    return `${parent_key_id}${type}-${id}`;
  }

  function ___determinePositionTableFields(relation_key) {
    const RELATION_KEY_REGX = /([^-]*)-([^-]*)-([^-]*)-([^-]*)/gi;
    const RELATIONKEY_RELATIONTABLE_MAPPING = {
      "workbook-chapter": "workbook_chapters",
      "chapter-page": "chapter_pages",
      "page-item": "page_items"
    };

    var relation_key_regx_result = RELATION_KEY_REGX.exec(relation_key);
    if (relation_key_regx_result) {
      var from_model_field = relation_key_regx_result[1];
      var from_model_value = relation_key_regx_result[2];
      var to_model_field = relation_key_regx_result[3];
      var to_model_value = relation_key_regx_result[4];

      return {
        from_model_field: from_model_field + "Id",
        from_model_value: parseInt(from_model_value),
        to_model_field: to_model_field + "Id",
        to_model_value: parseInt(to_model_value),
        relation_model_name:
          RELATIONKEY_RELATIONTABLE_MAPPING[
            `${from_model_field}-${to_model_field}`
          ]
      };
    } else {
      throw new Error(
        `Unable to determine position table fields based on relation key is ${relation_key}`
      );
    }
  }
}

/**
 * Update `position_table_name` with `where` filter
 *
 * @param {*} position_table_name
 * @param {*} where_filter where object in update statement
 * @param {*} update_fields update object in update statement
 * @returns
 */
function _update_position(
  position_table_name,
  where_filter,
  update_fields
) {

  return new Promise((resolve, reject) => {

    axios.post(`/${position_table_name}/update`, qs.stringify(update_fields), {
      baseURL: process.env.API_URL,
      params: {
        where: where_filter,
        access_token: process.env.API_ACCESS_TOKEN
      },
      paramsSerializer: params => {
        return qs.stringify(params);
      }
    }).then(response => {
      debug(response);
      resolve(response);
    }).catch(error => {
      reject(error);
    });
  });
}
