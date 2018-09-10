'use strict';

const CommentReplyUtil = require('./comment-reply.util');
const CommentUtil = require('./comment.util');
const app = require('../../../server');

module.exports = function(CommentReply) {
  //Validation 1: parent comment must exists
  //Validation 2: commment_owner must exists
  CommentReply.observe('before save', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      //check whether comment owner exists
      var comment_owner_id = instance.comment_owner;
      var parent_comment_id = instance.parent;
      var tagged_userId_array = instance.message_tags;

      await Promise.all([
        CommentUtil.ensureCommentOwnerExists(comment_owner_id),
        CommentReplyUtil.ensureParentCommentExists(parent_comment_id),
        CommentUtil.ensureTaggedUsersExists(tagged_userId_array)
      ]);
    }

    return;
  });

  //Increase reply_count by 1 in Comment model
  CommentReply.observe('after save', async function(ctx) {
    var instance = ctx.instance;

    const Comment = app.models.Comment;
    const parent_comment_id = instance.parent;

    CommentReplyUtil.adjustReplyCountInParentComment(parent_comment_id, 1);
  });

  CommentReply.observe('before delete', function(ctx, next) {
    var replyId_will_delete = ctx.where.id;
    const Reply = app.models.comment_reply;

    Reply.findById(replyId_will_delete, (err, found_reply) => {
      if (found_reply) {
        ctx.hookState.deleted_reply = found_reply;
      }

      next();
    });
  });

  CommentReply.observe('after delete', async function(ctx) {
    var deleted_replies_count = _.get(ctx, 'info.count', 0);

    if (deleted_replies_count > 0 && ctx.hookState.deleted_reply) {
      let deleted_reply = ctx.hookState.deleted_reply;
      CommentReplyUtil.adjustReplyCountInParentComment(
        deleted_reply.parent,
        -1
      );
    }
  });
};
