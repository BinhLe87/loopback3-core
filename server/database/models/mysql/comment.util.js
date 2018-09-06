'use strict';

const app = require('../../../server');
const Promise = require('bluebird');

module.exports = exports = {};

/**
 *
 *
 * @param {integer} comment_owner_id
 * @return {true|error} return true if comment owner exists. Otherwise, throw error.
 */
async function ensureCommentOwnerExists(comment_owner_id) {
  if (_.isUndefined(comment_owner_id))
    throw new Error('comment_owner was not specified');

  var User = app.models.user;
  var findByIdPromise = Promise.promisify(User.findById).bind(User);

  var found_user = await findByIdPromise(comment_owner_id);

  if (!found_user) {
    throw new Error(`Not found comment_owner has ID is ${comment_owner_id}`);
  }

  return true;
}

exports.ensureCommentOwnerExists = ensureCommentOwnerExists;
