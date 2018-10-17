'use strict';

const app = require('../../../server');
const Promise = require('bluebird');

module.exports = exports = {};
/**
 *
 *
 * @param {integer} comment_id
 * @returns {true|error} return true if parent comment exists. Otherwise, throw error.
 */
async function ensureParentCommentExists(comment_id) {
  if (_.isUndefined(comment_id))
    throw new Error('parent commend ID was not specified');

  var Comment = app.models.comment;
  var findByIdPromise = Promise.promisify(Comment.findById).bind(Comment);

  var found_comment = await findByIdPromise(comment_id);

  if (!found_comment) {
    throw new Error(`Not found parent comment has ID is ${comment_id}`);
  }

  return true;
}
/**
 * adjust reply count runs asynchronously
 *
 * @param {*} parent_comment_id
 * @param {integer} value_will_adjust if positive value means increasing reply_count, otherwise means decreasing reply_count
 */
async function adjustReplyCountInParentComment(
  parent_comment_id,
  value_will_adjust
) {
  if (_.isUndefined(parent_comment_id)) {
    throw new Error('parent commend ID was not specified');
  }

  const Comment = app.models.comment;

  Comment.beginTransaction(
    {
      isolationLevel: 'SERIALIZABLE',
      timeout: 10000
    },
    function(err, tx) {
      tx.observe('timeout', function(context, timeout_next) {
        logger.error(
          'adjustReplyCountInParentComment(): Timeout committing transaction',
          __filename
        );
        return next(
          Boom.badGateway(
            `Unable to update reply count at the moment.`,
            __filename +
              ':adjustReplyCountInParentComment(): Timeout committing transaction'
          )
        );
      });

      Comment.findById(
        parent_comment_id,
        { transaction: tx },
        (err, parent_comment) => {
          if (parent_comment) {
            //treat empty value as zero counter
            let cur_reply_count = _.isNaN(parent_comment.reply_count)
              ? 0
              : parent_comment.reply_count;

            parent_comment.updateAttributes(
              { reply_count: cur_reply_count + value_will_adjust },
              { transaction: tx },
              function(update_err, new_parent_comment) {
                if (update_err) {
                  logger.error(
                    `Error adjusting reply_count by ${value_will_adjust}`,
                    __filename
                  );
                  logger.error(update_err, __filename);
                }

                tx.commit(function(commit_err) {
                  if (commit_err) {
                    logger.error(
                      `Error committing transaction after adjusting reply_count by ${value_will_adjust}`,
                      __filename
                    );
                    logger.error(commit_err, __filename);
                  }
                });
              }
            );
          }
        }
      );
    }
  );
}

exports.ensureParentCommentExists = ensureParentCommentExists;
exports.adjustReplyCountInParentComment = adjustReplyCountInParentComment;
