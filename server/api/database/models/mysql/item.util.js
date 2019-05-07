const path = require('path');
const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
const Promise = require('bluebird');
const { saveFile } = require('../../../controllers/upload/uploadFile');

const AttributeUtil = require('./attribute.util');

exports = module.exports = {};
exports.validateItemData = validateItemData;

/**
 * Validate and return 'new' item_object is maybe changed after converting values if any
 *
 * @param {*} item_object
 * @returns {object} a (new) item_object or throw error if invalid item data
 */
async function validateItemData(item_object) {
  var data = item_object;

  const UPDATE_ITEM_VALIDATION = Joi.object().keys({
    item_typeId: Joi.number().required(),
    item_attributes: Joi.array(),
    insert_after_item_id: Joi.number(),
    is_active: Joi.boolean()
  });

  const validation_result = Joi.validate(data, UPDATE_ITEM_VALIDATION, {
    abortEarly: false,
    convert: true,
    allowUnknown: true
  });

  if (validation_result.error) {
    throw Boom.badRequest('Invalid item data', validation_result.error);
  }

  var { item_attributes, item_typeId } = validation_result.value;

  if (item_attributes && item_typeId) {
    await AttributeUtil.validateAttributesByItemtypeId(
      item_attributes,
      item_typeId
    );
  }

  return validation_result.value;
}

function checkItemType(ctx, item_typeId) {
  var app = ctx.req.app;
  var itemTypeModel = app.models.item_type;
  var itemTypeFindByIdPromise = Promise.promisify(itemTypeModel.findById).bind(
    itemTypeModel
  );

  return itemTypeFindByIdPromise(item_typeId);
}

async function checkAttributeId(ctx, attribute_id) {
  //get or create item_type=image in DB
  var app = ctx.req.app;
  var attributeModel = app.models.attribute;

  var attributeFindByIdPromise = Promise.promisify(
    attributeModel.findById
  ).bind(attributeModel);

  var attribute_found = await attributeFindByIdPromise(
    _.defaultTo(
      _.toNumber(attribute_id) > 0 ? _.toNumber(attribute_id) : undefined,
      'id_not_exists'
    )
  );

  if (!_.isNull(attribute_found)) {
    return attribute_found;
  }

  var attributeFindOrCreatePromise = Promise.promisify(
    attributeModel.findOrCreate
  ).bind(attributeModel);

  try {
    return await attributeFindOrCreatePromise(
      {
        where: {
          code: 'file'
        }
      },
      {
        code: 'file',
        label: 'File',
        data_type: 'file',
        is_active: 1
      }
    );
  } catch (error) {
    logger.error(`Unable to create attribute is 'file' in DB`, __filename);
    throw error;
  }
}
