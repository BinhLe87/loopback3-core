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

exports.ensureParentCommentExists = ensureParentCommentExists;
