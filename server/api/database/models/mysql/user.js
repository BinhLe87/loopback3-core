'use strict';

const debug = require('debug')('user.js');
const UserUtil = require('./user.util');
const { app } = require('../../../helpers/includeAllModules');

/**
 * Sharing workbook API inspired by https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/sharing.htm
 */

module.exports = function(User) {
  /**
   * @todo Ensure ownership of workbook
   * @todo Ensure role's permission: sharing user is 'attendee' and shared user is 'host'
   * @param {*} workbook_id
   * @param {*} sharingProperties an object {sharedWith: <an array of shared user id>, sharingType: <view|edit>}
   * @param {*} options
   * @param {*} cb
   */
  
};
