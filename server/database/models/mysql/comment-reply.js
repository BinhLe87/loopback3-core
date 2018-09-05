'use strict';

const CommentReplyUtil = require('./comment-reply.util');
const CommentUtil = require('./comment.util');

module.exports = function(Commentreply) {
  //Validation 1: parent comment must exists
  //Validation 2: commment_owner must exists
  Commentreply.observe('before save', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      //check whether comment owner exists
      var comment_owner_id = instance.comment_owner;
      var parent_comment_id = instance.parent;

      await Promise.all([
        CommentUtil.ensureCommentOwnerExists(comment_owner_id),
        CommentReplyUtil.ensureParentCommentExists(parent_comment_id)
      ]);
    }

    return;
  });
};
