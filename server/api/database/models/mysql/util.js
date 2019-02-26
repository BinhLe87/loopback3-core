'use strict';

const debug = require('debug')('util.js');
const {
  uploadFileController
} = require('../../../controllers/upload/uploadFile');
const validation_utils = require('../../../../utils/validators');

const { create_channel, send_message } = require('../../../../config/rabbitmq');
const queue_name = 'move_position';
var rabbitmq_channel = create_channel(queue_name);

module.exports = async function(Util) {
  Util.upload = async function(ctx, options, cb) {
    var result = await uploadFileController(ctx);

    return result;
  };

  Util.move_position = async function(tree_view, ctx, options, cb) {
    var req = ctx.req;

    //validate format of tree view
    //-----------------

    var tree_view_joi_result = validation_utils.workbook_chapter_tree_view_joi.validate(
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

    var channel = await rabbitmq_channel;

    var result = await send_message(
      channel,
      tree_view_joi_result.value,
      queue_name,
      request_id
    );

    cb(null, 'OK');
  };
};
