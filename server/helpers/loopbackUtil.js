'use strict';
module.exports = exports = {};

var _builtInModelNames = [
    "KeyValue",
    "Email",
    "Application",
    "AccessToken",
    "User",
    "RoleMapping",
    "Role",
    "ACL",
    "Scope",
    "Change",
    "Checkpoint"
];

exports.isBuiltInModel = function isBuiltInModel(model_name) {

    return _builtInModelNames.includes(model_name);
}
