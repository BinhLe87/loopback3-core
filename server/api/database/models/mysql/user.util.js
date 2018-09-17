'use strict';

const { app } = require('../../../helpers/includeAllModules');
const RoleMapping = require('loopback').RoleMapping;

module.exports = exports = {};

async function getRoles(user_id) {
  var RoleMappingModel = app.models.RoleMapping;

  var roles = await RoleMappingModel.find({
    where: { principalType: RoleMapping.USER, principalId: user_id }
  });

  return roles;
}

/**
 * Ensure role's permission: sharing user is 'attendee' and shared user is 'host'
 *
 * @param {*} sharing_user_id
 * @param {*} shared_user_id
 * @returns {boolean} true or false
 */
async function ensureWorkbookSharingRole(sharing_user_id, shared_user_id) {
  var sharingUserRoles = await getRoles(sharing_user_id);

  //HACK:
  return true;
}

/**
 * Ensure there's an existing connection between sharing user and shared user.
 *
 * @param {*} sharing_user_id
 * @param {*} shared_user_id
 */
async function ensureWorkbookSharingConnection(
  sharing_user_id,
  shared_user_id
) {
  //HACK:
  return true;
}

async function shareWorkBook(sharing_user_id, shared_user_id, workbook_id) {
  //Ensure sharing roles
  if (!(await ensureWorkbookSharingRole(sharing_user_id, shared_user_id))) {
    throw new Error(
      'Invalid role permissions either of sharing user or of shared user'
    );
  }

  //Ensure sharing connections
  if (!(await ensureWorkbookSharingConnection())) {
    throw new Error(
      'There is no connection between sharing user and shared user'
    );
  }

  //If all conditions are okay
  let WorkbookShareModel = app.models.workbook_share;
  let created_workbookshare = await WorkbookShareModel.create({
    userId: shared_user_id,
    workbookId: workbook_id,
    shared_by: sharing_user_id
  });

  return created_workbookshare;
}

exports.getRoles = getRoles;
exports.ensureWorkbookSharingRole = ensureWorkbookSharingRole;
exports.ensureWorkbookSharingConnection = ensureWorkbookSharingConnection;
exports.shareWorkBook = shareWorkBook;
