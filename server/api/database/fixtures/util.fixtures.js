'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const { app } = require('../../helpers/includeAllModules');
const faker = require('faker');

exports = module.exports = {};

/**
 * Support following random patterns:
 * - Case 1: fakerjs pure function
 * - Case 2: fakerjs function with arguments: declared by object has {func, args}
 * - Case 3: refer to other field's value: ${<field_referred_to>}
 * - Case 4: lodash string pattern: example is 'Library <%= %d %>'
 * - Case 5: array of object data [{<object_1>, {object_2}}]  //use for `item_attribute` field in `item` model
 * - Case 6: primitive data type (string, array, number, etc.)
 *
 * @param {*} fields
 * @param {object} options
 * @param {number} [options.numberRecordsWillGenerate] number dummy records needed to generate, it will be set as max number in %d in lodash string pattern
 * @param {object} [options.replacement] replacement obtions using in lodash string pattern
 * @returns
 */
exports.parseRecordFields = function parseRecordFields(fields, options) {
  let record = {};

  const REFER_TO_OTHER_FIELD_PATTERN = '\\${(.*)}'; //refer to a other field's value
  const LODASH_STRING_PATTERN = '<%=(.*?)%>';
  var fields_refer_to_other_array = []; //array contains fields that refer to other nature field. This array will be processed last, means after other nature fields done for generating data.

  var number_records_will_generate = _.get(
    options,
    'numberRecordsWillGenerate',
    1000
  );

  _.forOwn(fields, function(field_faker_type, field_name) {
    record[field_name] = __determineMatchingRandomPattern(
      field_faker_type,
      field_name
    );
  });

  //processing for array of fields refer to other field
  for (let field of fields_refer_to_other_array) {
    let __field_name = field.field_name;
    let __field_faker_type = field.field_faker_type;

    let matched = RegExp(REFER_TO_OTHER_FIELD_PATTERN).exec(__field_faker_type);
    let __field_name_referred_to = matched && matched[1];

    if (typeof record[__field_name_referred_to] == 'undefined') {
      throw new Error(
        `Not found target field name '${__field_name_referred_to}' that field name '${__field_name}' referred to`
      );
    } else {
      record[__field_name] = record[__field_name_referred_to];
    }
  }

  return record;

  function __determineMatchingRandomPattern(field_pattern, field_name) {
    var field_pattern_clone = _.cloneDeepWith(field_pattern, value => {
      if (typeof value == 'function') {
        return value;
      }
    });

    //Case 1: fakerjs pure function
    if (typeof field_pattern_clone == 'function') {
      return field_pattern_clone();
    } else if (
      //(Case 2: fakerjs function with arguments: declared by object has { func, args }
      typeof field_pattern_clone == 'object' &&
      !Array.isArray(field_pattern_clone)
    ) {
      if (
        typeof field_pattern_clone != 'object' ||
        !field_pattern_clone.func ||
        !field_pattern_clone.args
      ) {
        throw new Error(`Wrong format of field '${field_name}'.
                    Must be an object type and has 2 properties are 'func' and 'args'`);
      }
      return field_pattern_clone.func(field_pattern_clone.args);
    } else if (RegExp(REFER_TO_OTHER_FIELD_PATTERN).test(field_pattern_clone)) {
      //Case 3: refer to other field's value: ${<field_referred_to>}

      fields_refer_to_other_array.push({
        field_name: field_name,
        field_faker_type: field_pattern_clone
      });
    } else if (RegExp(LODASH_STRING_PATTERN).test(field_pattern_clone, 'gi')) {
      //Case 4: lodash string pattern: example is 'Library <%= %d %>'

      return parseAndReplaceLodashStringPattern(field_pattern_clone, {
        '%d': faker.random.number({
          min: 1,
          max: number_records_will_generate
        }),
        '%long_text': faker.lorem.paragraphs()
      });
    } else if (Array.isArray(field_pattern_clone)) {
      // Case 5: array of object data[{< object_1 >, { object_2 }}]  //use for `item_attribute` field in `item` model
      for (let field_item of field_pattern_clone) {
        if (typeof field_item == 'object') {
          _.forOwn(field_item, (field_item_value, field_item_name) => {
            var result_random = __determineMatchingRandomPattern(
              field_item_value,
              field_name
            );
            field_item[field_item_name] = result_random;
          });
        }
      }

      return field_pattern_clone; //new value after generating random data
    } else {
      //primitive type (string, number, etc.) => return original value
      return field_pattern_clone;
    }
  }
};

function parseAndReplaceLodashStringPattern(input_string, object_replacements) {
  var formatted_input_string = input_string;
  const LODASH_STRING_PATTERN = '<%=\\s*(.*?)\\s*%>';
  var lodash_string_matched = input_string.match(
    RegExp(LODASH_STRING_PATTERN, 'gi')
  );

  if (!_.isEmpty(lodash_string_matched)) {
    lodash_string_matched.forEach(origin_ele_pattern => {
      let origin_ele_pattern_matched = RegExp(LODASH_STRING_PATTERN).exec(
        origin_ele_pattern
      );

      if (!_.isEmpty(origin_ele_pattern_matched)) {
        var varible_name = origin_ele_pattern_matched[1];
        //replace matched pattern with new value
        let new_value = _.get(object_replacements, varible_name);
        if (_.isUndefined(new_value)) {
          throw new Error(
            `Unspecified replacement value for variable name '${varible_name}'`
          );
        }
        var new_ele_pattern = origin_ele_pattern.replace(
          varible_name,
          new_value
        );

        formatted_input_string = formatted_input_string.replace(
          origin_ele_pattern,
          new_value
        );
      }
    });

    return formatted_input_string;
  }
}

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

  var result = await insertPromise(record);

  return result;
};
