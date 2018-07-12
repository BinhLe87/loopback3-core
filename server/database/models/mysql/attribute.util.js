
const Joi = require('joi');
const assert = require('assert');
const app = require('../../../server');
const debug = require('debug')('attribute.util.js');
const itemTypeUtil = require('./item-type.util');

//Define Joi schema for each of data types
const joiSchemas = {
    stringSchema: Joi.string(),
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

async function validateAttributesByItemType(attributes, itemTypeId) {

    if(!Array.isArray(attributes)) {

        var detailMsg = `validateAttributesByItemType() requires 'attributes' argument must be an array, but got ${typeof attributes}`; 
        logger.error(detailMsg);

        let error = new Error(`Error: Can not validate attributes of item type at the moment. Please try again later`);
        error.data = detailMsg;

        throw error;
    }

    var attributes = itemTypeUtil.getAttributesByItemtypeId(itemTypeId);
    

}

//HACK: Test cases
// describe('identifyJoiSchemaForDataType', () => {

//     it('should return stringSchema with is_required option', () => {

//         var result = identifyJoiSchemaForDataType('string', { is_required: 1 });
//         assert.deepEqual(result, joiSchemas.stringSchema.required());

//     })
// })

validateAttributesInJSON({
    attributes: [
        {
            "id": "attribute_id",
            "values": [
                {
                    "value": "value"
                }]
        }],
},
    1
).then(function (result) {

    debug(result);
});