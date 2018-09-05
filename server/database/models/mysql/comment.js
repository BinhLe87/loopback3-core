'use strict';

const debug = require('debug')('comment.js');
const app = require('../../../server');

module.exports = function(Comment) {
  //Validation 1: commment_owner must exists
  Comment.observe('before save', (ctx, next) => {
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      //check whether comment owner exists
      var comment_owner = instance.comment_owner;

      if (_.isUndefined(comment_owner))
        return next(new Error('comment_owner was not specified'));

      var User = app.models.user;
      User.findById(comment_owner, (err, found_user) => {
        if (err) return next(err);

        if (!found_user)
          return next(
            new Error(`Not found comment_owner has ID is ${comment_owner}`)
          );

        return next();
      });
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
