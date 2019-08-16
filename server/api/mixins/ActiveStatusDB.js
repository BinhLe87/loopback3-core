'use strict';

const Promise = require('bluebird');
const Boom = require('boom');

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

module.exports = function(Model, options) {
  // Model is the model class
  // options is an object containing the config properties from model definition
  Model.defineProperty('is_active', { type: Boolean, default: true });

  var deleteById = Model.deleteById;

  Model.deleteById = async function(id, filter, callback) {
    var findByIdPromise = Promise.promisify(Model.findById).bind(Model);
    var found_model_item = await findByIdPromise(id);

    if (!found_model_item) {
      throw Boom.notFound(`Not found any record has id '${id}'`);
    }

    var updateAttributePromise = Promise.promisify(
      found_model_item.updateAttribute
    ).bind(found_model_item);
    var deleted_model_item = await updateAttributePromise('is_active', false);

    if (!deleted_model_item) {
      throw Boom.badRequest(`Failed to delete record has id '${id}'`);
    }

    deleted_model_item.cc_hook_options = {
      resultType: Model.modelName
    };
    //add resultType in order to parse later in jsonApiFormatter.js

    const context = {
      Model: Model,
      hookState: {},
      options: {},
      instance: deleted_model_item
    };
    Model.notifyObserversOf('after delete', context, function(err) {

      callback(null, deleted_model_item);
    });
  };

  Model.observe('access', async function(ctx) {
    //set is_active = true as default filter query
    var is_active_will_query = _.get(ctx, 'query.where.is_active', true);

    _.set(ctx, 'query.where.is_active', is_active_will_query);
  });
};
