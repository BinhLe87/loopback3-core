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

exports.getRoles = getRoles;
