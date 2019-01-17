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

  Model.deleteById = async function(id) {
    var findByIdPromise = Promise.promisify(Model.findById).bind(Model);
    var found_model_item = await findByIdPromise(id);

    if (!found_model_item) {
      throw Boom.notFound(`Not found any record has id '${id}'`);
    }

    var updateAttributePromise = Promise.promisify(
      found_model_item.updateAttribute
    ).bind(found_model_item);
    var updated_model_item = await updateAttributePromise('is_active', false);

    if (!updated_model_item) {
      throw Boom.badRequest(`Failed to delete record has id '${id}'`);
    }
  };
};
