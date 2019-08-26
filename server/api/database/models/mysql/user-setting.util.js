'use strict';

const { app } = require('../../../helpers/includeAllModules');

module.exports = exports = {};
/**
 *
 * @param {id} user_id
 * @param {string} setting_code
 * @return {user_setting|null} return user_setting object if the user has setting_code, otherwise return null
 */
async function getUserSettingBySettingCode(user_id, setting_code) {
  var UserSettingModel = app.models.user_setting;

  var found_settings = await UserSettingModel.find({
    where: { userId: user_id, code: setting_code }
  });

  if (Array.isArray(found_settings) && found_settings.length > 1) {
    throw new Error(
      `Found duplicate ${
        found_settings.length
      } settings has same setting_code is '${setting_code}'`
    );
  }

  return Array.isArray(found_settings) ? found_settings[0] : null;
}

exports.getUserSettingBySettingCode = getUserSettingBySettingCode;
