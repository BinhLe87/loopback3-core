'use strict';

const debug = require('debug')('comment.js');
const app = require('../../../server');
const CommentUtil = require('./comment.util');

module.exports = function(Comment) {
  //Validation 1: commment_owner must exists
  Comment.observe('before save', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      //check whether comment owner exists
      var comment_owner_id = instance.comment_owner;

      let isCommentOwnerExists = await CommentUtil.ensureCommentOwnerExists(
        comment_owner_id
      );
      if (isCommentOwnerExists) {
        return;
      }
    }
  });

  Comment.observe('after delete', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;
    var deleted_comment_id = ctx.where.id;
    if (!_.isUndefined(deleted_comment_id)) {
      const Reply = app.models.comment_reply;

      Reply.destroyAll({ parent: deleted_comment_id }, (err, info) => {
        if (err) {
          logger.error(
            `Error deleting related replies of comment has ID is ${deleted_comment_id}`
          );
          logger.error(err);
        }

        logger.info(
          `Finish deleting ${
            info.count
          } replies of comment has ID is ${deleted_comment_id}`
        );
      });
    }
  });
};