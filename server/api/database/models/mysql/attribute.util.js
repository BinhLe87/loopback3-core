const Joi = require('joi');
const assert = require('assert');
const debug = require('debug')('attribute.util.js');
const itemTypeUtil = require('./item-type.util');
const util = require('util');

//Define Joi schema for each of data types
const joiSchemas = {
  stringSchema: Joi.string().empty(''),
  textSchema: Joi.string().empty(''),
  urlSchema: Joi.string().empty(''),
  fileSchema: Joi.string().empty(''),
  booleanSchema: Joi.boolean()
    .truthy(['Y', 'yes'])
    .falsy(['N', 'no']),
  arraySchema: Joi.array(),
  htmlSchema: Joi.string()
    .base64()
    .empty(''),
  //numberic type
  integerSchema: Joi.number().integer(),
  floatSchema: Joi.number()
};

Object.defineProperty(joiSchemas, 'numberSchema', {
  get: function() {
    return Joi.alternatives().try(this.floatSchema);
  }
});

/**
 *
 *
 * @param {string} data_type
 * @param {object} [options={}] addtional constraints for this data type
 * @returns joi schema corresponds to data_type defined in DB. Return Joi.any() for unknown data_type as default
 */
function _identifyJoiSchemaForDataType(data_type, options = {}) {
  if (typeof data_type != 'string') {
    logger.error(
      `method identifyJoiSchemaForDataType(): data_type must be a string, but got ${typeof data_type}`,
      __filename
    );
    throw new TypeError('data_type must be a string type');
  }

  data_type = data_type.toLowerCase().trim();

  //NOTE: set Joi.any() for unknown data type
  var _joiSchema = joiSchemas[`${data_type}Schema`] || Joi.any();

  //add additional constraints if needed
  _.forOwn(options, function(method_param, method_name) {
    if (typeof method_name == 'string') {
      method_name = method_name.toLowerCase().trim();
    }

    //check whether method name is supported by Joi
    if (typeof _joiSchema[method_name] == 'function') {
      _joiSchema = _joiSchema[method_name](method_param);
    }
  });

  return _joiSchema;
}
/**
 *
 *
 * @param {Array} attributesWillCheck an array of attributes will be checked validations
 * @param {string|integer} itemTypeId item type id
 * @param {Boolean} [shouldUseDefaultValue=true] if true, will replace default value for missed/omitted attribute value
 * @returns {boolean} true if all attributes are valid, or throw error if any errors occured
 */
async function validateAttributesByItemtypeId(
  attributesWillCheck,
  itemTypeId,
  shouldUseDefaultValue = true
) {
  if (!Array.isArray(attributesWillCheck)) {
    var detailMsg = `validateAttributesByItemtypeId() requires 'attributesWillCheck' argument must be an array, but got ${typeof attributesWillCheck}`;
    logger.error(detailMsg);

    let error = new Error(
      `Error: Can not validate attributes of item type at the moment. Please try again later`
    );
    error.data = detailMsg;

    throw error;
  }

  //convert from array of items to a object has property name is 'id' field in array item

  var attributesInDB = await itemTypeUtil.getAttributesByItemtypeId(itemTypeId);

  var validateErrorMessages = __validateInputAttributesWithInDB(
    itemTypeId,
    attributesWillCheck,
    attributesInDB,
    shouldUseDefaultValue
  );

  if (!_.isEmpty(validateErrorMessages)) {
    throw boom.badRequest(
      'One of attribute values is invalid. Please check again',
      validateErrorMessages
    );
  }

  return attributesWillCheck;
}

/**
 *
 *
 * @param {object} attributesWillCheck
 * @param {object} attributesInDB
 * @returns {object} return object of error if any, otherwise return empty object if non-error exists.
 */
function __validateInputAttributesWithInDB(
  itemTypeId,
  attributesWillCheck,
  attributesInDB,
  shouldUseDefaultValue
) {
  var validateErrorMessages = {};
  //Some notice rules to validate:
  //- All attributes defined in database must be in 'attributes' array be passed through 'id' field
  //- 'Attributes' passed must fulfill constraints defined in DB if any (ex: data type, additional constrains about op_required, etc.)

  for (let attributeInDB of attributesInDB) {
    var sameAttrIds = _.filter(attributesWillCheck, function(req_attribute) {
      return req_attribute.id == attributeInDB.id;
    });

    //extra constraints of an attribute in database will has prefix column name is 'op_'
    var extraConstraints = _parseAttributeOptions(attributeInDB);

    if (_.isEmpty(sameAttrIds)) {
      sameAttrIds = [{}]; //add dummy element to go into validation process because it maybe a required attribute in DB
    }

    for (let attrWillCheck of sameAttrIds) {
      //convert attribute will check to corresponding Joi schema through data type of attribute
      let curJoiSchema = _identifyJoiSchemaForDataType(
        attributeInDB.data_type,
        extraConstraints
      );

      var valueOfAttrWillCheck = attrWillCheck.values;
      if (_.isUndefined(valueOfAttrWillCheck)) {
        valueOfAttrWillCheck = attrWillCheck.value; //'value' and 'values' are alias
      }
      //valueWillValidate maybe a array type (if has multiple values) or a primitive value (if only has one value)
      var valuesWillValidateByJoi;
      if (Array.isArray(valueOfAttrWillCheck)) {
        valuesWillValidateByJoi = valueOfAttrWillCheck;
      } else {
        //only has one value
        //in case property name 'values' but only has one element => add a property name 'value' to treat as single attribute
        attrWillCheck.value = valueOfAttrWillCheck;
        delete attrWillCheck.values;
        valuesWillValidateByJoi = [attrWillCheck]; //convert to array
      }
      validateErrorMessages = Object.assign(
        validateErrorMessages,
        ___validateValuesByJoi(
          valuesWillValidateByJoi,
          curJoiSchema,
          attributeInDB,
          shouldUseDefaultValue
        )
      );
    }
  }

  return validateErrorMessages;
}
/**
 *
 *
 * @param {array} valuesWillValidateByJoi
 * @param {*} curJoiSchema
 * @param {*} attrWillCheck
 * @returns {object} error object
 */
function ___validateValuesByJoi(
  valuesWillValidateByJoi,
  curJoiSchema,
  attrWillCheck,
  shouldUseDefaultValue
) {
  var validateErrorMessages = {};

  if (!Array.isArray(valuesWillValidateByJoi)) {
    let msg_error = `___validateValuesByJoi() requires 'valuesWillValidateByJoi' is array type, but got ${typeof valuesWillValidateByJoi}`;
    logger.error(msg_error);
    throw new boom.badImplementation('Internal Server Error', msg_error);
  }

  for (let valueWillValidate of valuesWillValidateByJoi) {
    Joi.validate(
      valueWillValidate.value,
      curJoiSchema,
      {
        abortEarly: false,
        convert: true,
        language: {
          any: {
            required: `property of attribute id '${
              attrWillCheck.id
            }' has code='${attrWillCheck.code}' was not specified`
          }
        }
      },
      function(err, result) {
        if (err) {
          let err_message_ele = `item_attributes[id=${attrWillCheck.id}]`;
          validateErrorMessages[err_message_ele] = {};
          validateErrorMessages[err_message_ele].attribute_code =
            attrWillCheck.code;
          validateErrorMessages[err_message_ele].data_type =
            attrWillCheck.data_type;
          validateErrorMessages[err_message_ele].errors = err.details;
        }
        if (shouldUseDefaultValue) {
          valueWillValidate.value = result;
        }
      }
    );
  }
  return validateErrorMessages;
}

function _parseAttributeOptions(attribute) {
  if (typeof attribute != 'object') {
    var detailMsg = `parseAttributeOptions() requires 'attribute' argument must be an object, but got ${typeof attribute}`;
    logger.error(detailMsg);

    let error = new Error(
      `Error: Unable to identify the constraint options of attribute ${attribute}. Please try again later`
    );
    error.data = detailMsg;

    throw error;
  }

  var options = _.reduce(
    attribute,
    function(accum, value, key) {
      //remove the prefix 'op_' in option name for matching with Joi validation method name.
      //Ex: 'op_required' will be formatted to 'required'
      let option_names = /^(?:op_)(.+)/.exec(key);
      if (!_.isEmpty(option_names) && !_.isNull(value)) {
        //attemp to cast to number
        value = _.isNumber(value) ? _.toNumber(value) : value;

        if (_.isNumber(value) || _.isBoolean(value)) {
          //is number or is boolean
          accum[option_names[1]] = value;
        } else if (!_.isEmpty(value)) {
          //is string and not empty
          accum[option_names[1]] = value;
        }
      }
      return accum;
    },
    {}
  );

  //Perform extra steps for some special validators, such as: op_required, op_regex
  //op_required: remove op_required if it was set to false
  var isRequired = options['required'] ? !!options['required'] : false;
  if (isRequired == false) {
    delete options['required'];
  } else {
    //omit op_required if there's a default value for this attribute

    if (typeof options['default'] != 'undefined') {
      delete options['required'];
    }
  }

  //op_regex: initialize RegExp constructor
  var RegExpObj = options['regex']
    ? RegExp(options['regex'].trim())
    : undefined;
  if (RegExpObj) {
    options['regex'] = RegExpObj;
  }

  return options;
}

module.exports = exports = {};
exports.validateAttributesByItemtypeId = validateAttributesByItemtypeId;

//HACK: Test cases
// describe('identifyJoiSchemaForDataType', () => {

//     it('should return stringSchema with is_required option', () => {

//         var result = identifyJoiSchemaForDataType('string', { is_required: 1 });
//         assert.deepEqual(result, joiSchemas.stringSchema.required());

//     })
// })

// validateAttributesByItemtypeId(
//     [
//         {
//             id: 1,
//             values: [
//                 {value: "1"}
//             ]
//         }]
//     ,
//     1
// ).then(function (result) {

//     debug(result);
// }).catch(function (err) {

//     debug(util.inspect(err, { compact: true, depth: 5, breakLength: 80 }));
// });
