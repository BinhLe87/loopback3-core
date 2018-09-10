'use strict';

const debug = require('debug')('comment.js');
const path = require('path');
const app = require(path.join(__dirname, '../../../server'));
const CommentUtil = require('./comment.util');

module.exports = function(Comment) {
  //Validation 1: commment_owner must exists
  Comment.observe('before save', async function(ctx) {
    if (_isDerivedModel(ctx)) return;

    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      //check whether comment owner exists
      var comment_owner_id = instance.comment_owner;
      var tagged_userId_array = instance.message_tags;

      await Promise.all([
        CommentUtil.ensureCommentOwnerExists(comment_owner_id),
        CommentUtil.ensureTaggedUsersExists(tagged_userId_array)
      ]);
    }
  });

  Comment.observe('after delete', async function(ctx) {
    if (_isDerivedModel(ctx)) return;

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
/**
 * Check whether the model in current context isn't base `comment` model, intended to distinguish with derived class as comment_reply
 *
 * @param {*} ctx
 * @returns true if this is derived model of Comment model
 */
function _isDerivedModel(ctx) {
  var actualModelName = _.get(ctx, 'Model.name');

  if (actualModelName !== 'comment') return true;

  return false;
}
