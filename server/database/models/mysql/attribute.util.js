
const Joi = require('joi');
const assert = require('assert');
const app = require('../../../server');
const debug = require('debug')('attribute.util.js');
const itemTypeUtil = require('./item-type.util');
const util = require('util');

//Define Joi schema for each of data types
const joiSchemas = {
    stringSchema: Joi.any(),
    htmlSchema: Joi.string().base64(),
    //Test url regx at here https://regex101.com/r/p3hrOH/1
    urlSchema: Joi.string().regex(/((https?:\/\/)?(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|(https?:\/\/)?(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/),
    //numberic type
    integerSchema: Joi.number().integer(),
    floatSchema: Joi.number()
}

Object.defineProperty(joiSchemas, 'numberSchema', {
    get: function () {
        
        return Joi.alternatives().try(this.integerSchema, this.floatSchema);
    }
})

/**
 * 
 *
 * @param {string} data_type
 * @param {object} [options={}] addtional constraints for this data type
 * @returns joi schema corresponds to data_type defined in DB. Return Joi.any() for unknown data_type as default
 */
function identifyJoiSchemaForDataType(data_type, options = {}) {

    if (typeof data_type != 'string') {

        logger.error(`method identifyJoiSchemaForDataType(): data_type must be a string, but got ${typeof data_type}`, __filename);
        throw new TypeError('data_type must be a string type');
    }

    data_type = data_type.toLowerCase().trim();

    //NOTE: set Joi.any() for unknown data type
    var _joiSchema = joiSchemas[`${data_type}Schema`] || Joi.any();

    //add additional constraints if needed
    var isRequired = options['is_required'] ? !!options['is_required'] : false;
    if (isRequired) {

        _joiSchema = _joiSchema.required();
    }

    return _joiSchema;
}

async function validateAttributesByItemType(attributesWillCheck, itemTypeId) {

    if (!Array.isArray(attributesWillCheck)) {

        var detailMsg = `validateAttributesByItemType() requires 'attributesWillCheck' argument must be an array, but got ${typeof attributesWillCheck}`;
        logger.error(detailMsg);

        let error = new Error(`Error: Can not validate attributes of item type at the moment. Please try again later`);
        error.data = detailMsg;

        throw error;
    }

    //convert from array of items to a object has property name is 'id' field in array item
    var validateErrorMessages = {};

    var attributesInDB = await itemTypeUtil.getAttributesByItemtypeId(itemTypeId);
    //Some notice rules to validate:
    //- All attributes defined in database must be in 'attributes' array be passed through 'id' field
    //- 'Attributes' passed must fulfill constraints defined in DB if any (ex: data type, additional constrains about is_required, etc.)
    for (let attributeInDB of attributesInDB) {

        var sameAttrIds = _.filter(attributesWillCheck, { id: attributeInDB.id });

        if (_.isEmpty(sameAttrIds)) {

            throw new Error(`Error: Invalid attributes. The itemtypeId '${itemTypeId}' must contain at least one attribute has id '${attributeInDB.id}' as in template`)
        }

        //extra constraints of an attribute in database will has prefix column name is 'is_'
        var extraConstraints = _.reduce(attributeInDB, function (accum, value, key) {

            if (/^(is_).+/.test(key)) {
                accum[key] = value;
            }
            return accum;
        }, {});

        for (let attrWillCheck of sameAttrIds) {

            //convert attribute will check to corresponding Joi schema through data type of attribute
            let curJoiSchema = identifyJoiSchemaForDataType(attributeInDB.data_type, extraConstraints);

            valueOfAttrWillCheck = attrWillCheck.values || attrWillCheck.value; //property name alias

            //valueWillValidate maybe a array type (if has multiple values) or a primitive value (if only has one value)
            var valuesWillValidateByJoi = Array.isArray(valueOfAttrWillCheck) ? valueOfAttrWillCheck : [{value: valueOfAttrWillCheck}];

            //tips: in case valuesWillValidateByJoi is empty array, insert a dummy element in order to 
            //jump in Joi.validate() if is_required constraint is defined in DB
            if (_.isEmpty(valuesWillValidateByJoi)) {
                valuesWillValidateByJoi = [{value: undefined}];
            }
            
            for (let valueWillValidate of valuesWillValidateByJoi) {

                Joi.validate(valueWillValidate.value, curJoiSchema, {
                    abortEarly: false,
                    convert: true,
                    language: {
                        any: {
                            required: `property of attribute id '${attrWillCheck.id}' was not specified`
                        }
                    }
                }, function (err, result) {

                    if (err) {

                        validateErrorMessages[`${attrWillCheck.id}:${attributeInDB.code}`] = err.details;
                    }
                })
            }
        }
    }

    if (!_.isEmpty(validateErrorMessages)) {

        var validError = new Error();
        validError.message = 'one of field value is invalid. Please check again';
        validError.data = validateErrorMessages;

        throw validError;
    }

    return true;
}

//HACK: Test cases
// describe('identifyJoiSchemaForDataType', () => {

//     it('should return stringSchema with is_required option', () => {

//         var result = identifyJoiSchemaForDataType('string', { is_required: 1 });
//         assert.deepEqual(result, joiSchemas.stringSchema.required());

//     })
// })

validateAttributesByItemType(
    [
        {
            id: 1,
            values: [
                {name: "binh", "value": "123a"}
            ]
        }]
    ,
    1
).then(function (result) {

    debug(result);
}).catch(function (err) {

    debug(util.inspect(err, { compact: true, depth: 5, breakLength: 80 }));
});