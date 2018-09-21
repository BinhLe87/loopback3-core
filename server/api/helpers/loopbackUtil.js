'use strict';

const URI = require('urijs');

module.exports = exports = {};

var _builtInModelNames = [
  'KeyValue',
  'Email',
  'Application',
  'AccessToken',
  'User',
  'RoleMapping',
  'Role',
  'ACL',
  'Scope',
  'Change',
  'Checkpoint',
  'user'
];

exports.isBuiltInModel = function isBuiltInModel(model_name) {
  return _builtInModelNames.includes(model_name);
};

exports.builtInModelNames = _builtInModelNames;

exports.getBaseURL = function(req) {
  var url_parts = {
    protocol: req.protocol,
    hostname: req.get('host')
  };
  return URI.build(url_parts);
};
