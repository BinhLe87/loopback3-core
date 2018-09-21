'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const { app } = require('../../helpers/includeAllModules');

exports = module.exports = {};

exports.parseRecordFields = function parseRecordFields(fields) {
  let record = {};

  const REFER_TO_OTHER_FIELD_PATTERN = '\\${(.*)}'; //refer to a other field's value
  var fields_refer_to_other_array = []; //array contains fields that refer to other nature field. This array will be processed last, means after other nature fields done for generating data.

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
    } else if (RegExp(REFER_TO_OTHER_FIELD_PATTERN).test(field_faker_type)) {
      //refer to other field's value

      fields_refer_to_other_array.push({
        field_name: field_name,
        field_faker_type: field_faker_type
      });
    } else {
      //primitive type (string, number, etc.)
      record[field_name] = field_faker_type;
    }

    //processing for array of fields refer to other field
    for (let field of fields_refer_to_other_array) {
      let __field_name = field.field_name;
      let __field_faker_type = field.field_faker_type;

      let matched = RegExp(REFER_TO_OTHER_FIELD_PATTERN).exec(
        __field_faker_type
      );
      let __field_name_referred_to = matched && matched[1];

      if (typeof record[__field_name_referred_to] == 'undefined') {
        throw new Error(
          `Not found target field name '${__field_name_referred_to}' that field name '${__field_name}' referred to`
        );
      } else {
        record[__field_name] = record[__field_name_referred_to];
      }
    }
  });

  return record;
};
/**
 *
 *
 * @param {model_instance|model_name} model
 * @param {*} record
 * @returns {number|undefined} If succeed, return created record id. Otherwise, return undefined
 */
exports.insertRecordInDB = async function insertRecordInDB(model, record) {
  var modelInstance;
  if (typeof model == 'string') {
    //param is model name

    modelInstance = app.models.model;
  } else {
    modelInstance = model;
  }

  var insertPromise = Promise.promisify(modelInstance.create).bind(
    modelInstance
  );

  try {
    var result = await insertPromise(record);
    debug(`model '${modelInstance.name}': ${util.inspect(result)}`);
    return result.id;
  } catch (err) {
    debug(`model '${modelInstance.name}': ${util.inspect(err)}`);
    return undefined;
  }
};
