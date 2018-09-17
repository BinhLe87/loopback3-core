'use strict';

const debug = require('debug')('user.js');
const WorkbookUtil = require('./workbook.util');
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
  User.prototype.share_workbook = async function(
    workbook_id,
    sharingProperties,
    options,
    cb
  ) {
    //check ownership of workbook
    const token = options && options.accessToken;
    const sharingUserId = token && token.userId;
    var workbook_share = await WorkbookUtil.getWorkbookById(workbook_id);

    if (sharingUserId !== workbook_share.owner_id) {
      throw Boom.forbidden(
        `Unable to share because current user id '${sharingUserId}' does not own the workbook id '${workbook_id}'`,
        'thong tin loi'
      );
    }

    var sharedUserIds = _.get(sharingProperties, 'sharedWith', []);

    if (sharedUserIds.length == 0) {
      throw Boom.badRequest(
        'sharingProperties[sharedWith] is an empty array. sharingProperties[sharedWith] must contain at least one shared user id'
      );
    }

    for (let sharedUserId of sharedUserIds) {
      var created_workbook_share = UserUtil.shareWorkBook(
        sharingUserId,
        sharedUserId,
        workbook_id
      );

      debug(created_workbook_share);
    }
  };
};