'use strict';
const app = require('../../../server');
const Promise = require('bluebird');
const UserSettingUtil = require('./user-setting.util');
const UserUtil = require('./user.util');
const debug = require('debug')('workbook.util.js');

module.exports = exports = {};

/**
 *
 *
 * @param {*} workbookId
 * @returns {workbook|null} return a found workbook, otherwise return null.
 */
async function getWorkbookById(workbookId) {
  const WorkBookModel = app.models.workbook;

  const findWorkBookByIdPromise = Promise.promisify(
    WorkBookModel.findById
  ).bind(WorkBookModel);
  var found_workbok = await findWorkBookByIdPromise(workbookId);

  return found_workbok;
}

async function autoShareWorkBook(sharing_user_id, workbook_id) {
  if (!sharing_user_id || !workbook_id) {
    return;
  }

  /**
   *  return list of user_ids will be shared workbook by sharing user_id
   *
   * @param {*} sharing_user_id
   * @returns {array} return an array of user_ids if found.
   * Otherwise, return empty array if the auto_share setting is unavailable due to either inactive or not array type.
   */
  async function __getSharedUserIds(sharing_user_id) {
    const AUTO_SHARE_SETTING_CODE = 'auto_share_workbook';
    var user_setting = await UserSettingUtil.getUserSettingBySettingCode(
      sharing_user_id,
      AUTO_SHARE_SETTING_CODE
    );

    var sharedUserIds = _.get(user_setting, 'value', null);

    if (!Array.isArray(sharedUserIds)) {
      //either null value or not array type
      return [];
    }

    return sharedUserIds;
  }

  var sharedUserIds = await __getSharedUserIds(sharing_user_id);
  for (let sharedUserId of sharedUserIds) {
    var created_workbookshare = await UserUtil.shareWorkBook(
      sharing_user_id,
      sharedUserId,
      workbook_id
    );
    debug(created_workbookshare);
  }
}

exports.getWorkbookById = getWorkbookById;
exports.autoShareWorkBook = autoShareWorkBook;
