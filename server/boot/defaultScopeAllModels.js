'use strict';
const debug = require('debug')(`${__filename}`);

module.exports = function(app) {
  var models = app._models;

  for (let model of models) {
    if (model.name == 'page') {
      model.defaultScope = function(target, inst) {
        var scope = this.definition.settings.scope;
        Object.assign(scope, { limit: 2 });

        return scope;
      };
    }
  }
};
