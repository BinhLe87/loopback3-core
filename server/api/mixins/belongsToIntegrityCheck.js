'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
const HttpErrors = require('http-errors');

var checkBelongsToIntegrity = function(ctx, next) {
  var relationsArray = [];
  if (ctx.instance) {
    let relations = ctx.Model.definition.settings.relations;
    relationsArray = _.map(relations, rel => {
      //use the default foreignKey name (suggested by Loopback) if it was undefined.
      return {
        modelName: rel.model,
        fk: _.defaultTo(rel.foreignKey, rel.model + 'Id'),
        type: rel.type
      };
    });

    let thisModel = ctx.Model;
    let promiseArray = [];

    for (let relation of relationsArray) {
      if (ctx.instance[relation.fk]) {
        //only check the existing value of foreign key if user passed specific value into http request
        let model = thisModel.app.models[relation.modelName];

        var findValueOfForeignKeyPromise = model
          .findById(ctx.instance[relation.fk])
          .then(value => {
            if (value === null) {
              return `Not found value '${
                ctx.instance[relation.fk]
              }' of foreign key '${relation.fk}'`;
            }
          });

        promiseArray.push(findValueOfForeignKeyPromise);
      }
    }

    Promise.all(promiseArray)
      .then(error_messages => {
        let myError = new HttpErrors.BadRequest();
        myError.data = '';

        for (let error_message of error_messages) {
          if (error_message) {
            myError.data += error_message + '; ';
          }
        }

        if (!_.isEmpty(myError.data)) {
          return next(myError);
        }

        next();
      })
      .catch(err => {
        next(err);
      });
  }

  next();
};

module.exports = function(Model, options) {
  Model.observe('before save', checkBelongsToIntegrity);
};
