'use strict';

const debug = require('debug')('util.js');
const {
  uploadFileController
} = require('../../../controllers/upload/uploadFile');

const Channel = require('../../../../config/rabbitmq')();

module.exports = async function(Util) {
  Util.upload = async function(ctx, options, cb) {
    var result = await uploadFileController(ctx);

    return result;
  };

  Util.move_position = async function(tree_view, ctx, options, cb) {
    var queue = 'move_position';
    var req = ctx.req;

    Channel(queue, function(err, channel, conn) {
      if (err) {
        logger.error(err, req);
      } else {
        var tree_view = _.get(req.body, 'tree_view');

        channel.sendToQueue(queue, encode(tree_view), {
          persistent: true
        });

        setImmediate(function() {
          channel.close();
          conn.close();
        });
      }

      cb(null, 'OK');
    });

    function encode(message) {
      return new Buffer(JSON.stringify(message));
    }
  };
};
