'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');

exports = module.exports = {};

//TODO: support a field reference to other field's value
exports.parseRecordFields = function parseRecordFields(fields) {
  let record = {};
  _.forOwn(fields, function(field_faker_type, field_name) {
    if (typeof field_faker_type == 'function') {
      //invoke directly without arguments
      record[field_name] = field_faker_type();
    } else if (typeof field_faker_type == 'object') {
      //invoke with arguments
      if (
        typeof field_faker_type != 'object' ||
        !field_faker_type.func ||
        !field_faker_type.args
      ) {
        throw new Error(`Wrong format of field '${field_name}'.
                    Must be an object type and has 2 properties are 'func' and 'args'`);
      }

      record[field_name] = field_faker_type.func(field_faker_type.args);
    } else {
      //primitive type (string, number, etc.)
      record[field_name] = field_faker_type;
    }
  });

  return record;
};
/**
 *
 *
 * @param {*} model
 * @param {*} record
 * @returns {number|undefined} If succeed, return created record id. Otherwise, return undefined
 */
exports.insertRecordInDB = async function insertRecordInDB(model, record) {
  var insertPromise = Promise.promisify(model.create).bind(model);

  try {
    var result = await insertPromise(record);
    debug(`model '${model.name}': ${util.inspect(result)}`);
    return result.id;
  } catch (err) {
    debug(`model '${model.name}': ${util.inspect(err)}`);
    return undefined;
  }
};
