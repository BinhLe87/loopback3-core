'use strict';

const debug = require('debug')('user.js');
const WorkbookUtil = require('./workbook.util');

/**
 * Sharing workbook API inspired by https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/sharing.htm
 */

module.exports = function(User) {
  User.prototype.share_workbook = async function(
    workbook_id,
    sharingProperties,
    options,
    cb
  ) {
    //check ownership of workbook
    const token = options && options.accessToken;
    const userId = token && token.userId;
    var workbook_share = await WorkbookUtil.getWorkbookById(workbook_id);

    if (userId !== workbook_share.owner_id) {
      throw Boom.forbidden(
        `Unable to share because current user id '${userId}' does not own the workbook id '${workbook_id}'`,
        'thong tin loi'
      );
    }
  };
};
