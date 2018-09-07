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

async function ensureTaggedUsersExists(tagged_userId_array) {
  if (_.isUndefined(tagged_userId_array)) return;

  if (!Array.isArray(tagged_userId_array)) {
    throw new Error(
      `message_tags must be an array, but got ${typeof tagged_userId_array}`
    );
  }

  var User = app.models.user;
  var filter_conds = tagged_userId_array.map(user_id => {
    id: user_id;
  });
  var filter_conds_string = filter_conds.join(',');

  var findByIDsPromise = Promise.promisify(User.find).bind(User);

  var found_users = await findByIDsPromise({ where: { or: filter_conds } });
  var found_user_ids = found_users.map(user => user.id);
  var not_found_user_ids = _.difference(tagged_userId_array, found_user_ids);

  if (not_found_user_ids.length > 0) {
    throw new Error(
      `Not found tagged users have ID are ` +
        not_found_user_ids.join(',') +
        ' (user_id seperated by comma)'
    );
  }

  return;
}

exports.ensureCommentOwnerExists = ensureCommentOwnerExists;
exports.ensureTaggedUsersExists = ensureTaggedUsersExists;
