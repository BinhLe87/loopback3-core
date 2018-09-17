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

//HACK: Ensure role's permission: sharing user is 'attendee' and shared user is 'host'
/**
 *
 *
 * @param {*} sharingUserId
 * @param {*} sharedUserId
 * @returns {boolean} true or false
 */
async function ensureWorkbookSharingRoles(sharingUserId, sharedUserId) {
  var sharingUserRoles = await getRoles(sharingUserId);

  return true;
}

//HACK: ensure there's an existing connection between sharing user and shared user.
/**
 *
 *
 */
async function ensureWorkbookSharingConnections() {
  return true;
}

exports.getRoles = getRoles;
exports.ensureWorkbookSharingRoles = ensureWorkbookSharingRoles;
exports.ensureWorkbookSharingConnections = ensureWorkbookSharingConnections;
