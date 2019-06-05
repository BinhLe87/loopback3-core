'use strict';

const debug = require('debug')('util.js');
const {
  uploadFileController
} = require('../../../controllers/upload/uploadFile');
const validation_utils = require('../../../helpers/validators/joiValidator');

const { create_channel, send_message } = require('@cc_server/utils').rabbitmq;
const routing_key = 'move_position';
const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
const app = require('../../../server');
const mysql_db = app.dataSources.cc_mysql;
const Promise = require('bluebird');

module.exports = async function(Util) {
  Util.upload = async function(ctx, options, cb) {
    var result = await uploadFileController(ctx);

    return result;
  };

  Util.move_position = async function(tree_view, ctx, options, cb) {
    var req = ctx.req;

    var tree_view_joi_result = validation_utils.workbook_chapter_page_item_joi.validate(
      tree_view,
      validation_utils.baseJoiOptions
    );
    if (tree_view_joi_result.error) {
      return cb(
        Boom.badRequest(
          'Wrong format of tree view!!!',
          tree_view_joi_result.error
        )
      );
    }

    var request_id = req.headers['X-Request-ID'];

    var channel = await create_channel({ auto_close_connection: true });

    var tree_view_string = _.isPlainObject(tree_view_joi_result.value)
      ? JSON.stringify(tree_view_joi_result.value)
      : tree_view_joi_result.value;

    var result = send_message(tree_view_string, routing_key, channel, {
      request_id
    });

    cb(null, 'OK');
  };

  Util.search = async function(ctx, cb) {
    var req = ctx.req;

    const req_params_joi = Joi.alternatives().try(
      Joi.object().keys({
        query: Joi.string().required(),
        scope: Joi.string().valid(['workbook']),
        collection: Joi.string()
          .valid(['title', 'description'])
          .default('title,description')
      }),
      Joi.object().keys({
        query: Joi.string().required(),
        scope: Joi.string().valid(['competency'])
      })
    );

    var req_params_joi_result = req_params_joi.validate(
      req.query,
      baseJoiOptions
    );
    if (req_params_joi_result.error) {
      return cb(
        Boom.badRequest(
          'Invalid request query params!!!',
          req_params_joi_result.error
        )
      );
    }

    var req_params = req_params_joi_result.value;

    //decoded URI
    req_params.query = decodeURI(req_params.query);

    const common_error_message = `Unable to search at the moment`;

    //Routing search by scope
    try {
      var result;
      if (req_params.scope === 'workbook') {
        let text_search = req_params.query;
        //adding '*' after `text_search` for support auto-complete search
        let wildcard_text_search = text_search + '*';

        result = await _mysql_fulltext_search(
          'workbook',
          req_params.collection,
          wildcard_text_search,
          'BOOLEAN MODE'
        );
      } else if (req_params.scope === 'competency') {
        let text_search = req_params.query;
        //adding '*' after `text_search` for support auto-complete search
        let wildcard_text_search = text_search + '*';

        result = await _mysql_fulltext_search(
          'competency',
          'name',
          wildcard_text_search,
          'BOOLEAN MODE'
        );

        //only show children keywords if finish typing a complete word at parent level
        var parent_result_filtered = await _mysql_fulltext_search(
          'competency',
          'name',
          text_search,
          'NATURAL LANGUAGE MODE'
        );
        if (parent_result_filtered) {
          if (Array.isArray(parent_result_filtered)) {
            var CompetencyModel = app.models.competency;
            var findCompetencyPromise = Promise.promisify(
              CompetencyModel.find
            ).bind(CompetencyModel);

            for (let parent_ele of parent_result_filtered) {
              var children_ele = await findCompetencyPromise({
                where: { mPath: { like: `${parent_ele.mPath}%` } }
              });

              result = result.concat(children_ele);
            }
          }
        }

        //remove duplicate elements
        result = _.uniqBy(result, 'id');
      }

      if (result) {
        cb(null, result);
      } else {
        cb(
          Boom.badImplementation(
            common_error_message,
            'Can not determine search result'
          )
        );
      }
    } catch (error) {
      cb(Boom.badImplementation(common_error_message, error));
    }

    async function _mysql_fulltext_search(
      table_name,
      columns_search,
      text_search,
      search_mode = 'BOOLEAN MODE'
    ) {
      if (!mysql_db) {
        throw Boom.notImplemented(
          common_error_message,
          'Only support search in mysql but it is not running'
        );
      }

      const search_sql = `select *
      from ${table_name}
      WHERE MATCH (${columns_search}) AGAINST ('${text_search}' IN ${search_mode});`;

      var search_promise = Promise.promisify(mysql_db.connector.execute).bind(
        mysql_db.connector
      );

      return await search_promise(search_sql);
    }
  };
};
