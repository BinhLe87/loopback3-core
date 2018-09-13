'use strict';

const debug = require('debug')('user.js');

/**
 * Sharing workbook API inspired by https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/sharing.htm
 */

module.exports = function(User) {
  User.prototype.share_workbook = function(
    workbook_owner_id,
    sharingProperties,
    cb
  ) {
    debug(msg);
  };
};
