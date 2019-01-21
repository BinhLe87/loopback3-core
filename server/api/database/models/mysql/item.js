'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const AttributeUtil = require('./attribute.util');
const { saveFile } = require('../../../controllers/upload/uploadFile');
const Promise = require('bluebird');
const loopback_util = require('../../../helpers/loopbackUtil');
const URI = require('urijs');
const { ImageConverter } = require('../../../helpers/imageConverter');
const app = require('../../../server');
const Joi = require('joi');

//determine the path of static files
const fs = require('fs');
var static_files_dir = '';
fs.readFile(path.join(__dirname, '../../../middleware.json'), (err, data) => {
  if (!err) {
    let middlewares = JSON.parse(data);
    var static_data = _.get(middlewares, 'files.loopback#static');
    var filesInArray;

    if (Array.isArray(static_data)) {
      filesInArray = static_data;
    } else if (typeof static_data == 'object') {
      filesInArray = [static_data];
    }

    var staticUploadURL = _.filter(filesInArray, { name: 'upload' });
    static_files_dir = _.get(staticUploadURL[0], 'paths[0]', '');
  }
});

module.exports = function(Item) {
  Item.beforeRemote('create', async function(ctx, modelInstance) {
    if (_isReqTypeIsUploadFile(ctx.req)) {
      //request type is uploading file

      await uploadFileAndAddFilePathIntoCtx(ctx);
    }
  });

  Item.beforeRemote('upsert', async function(ctx, modelInstance) {
    if (_isReqTypeIsUploadFile(ctx.req)) {
      //request type is uploading file

      ctx = await uploadFileAndAddFilePathIntoCtx(ctx);
    }
  });

  Item.observe('access', async function(ctx) {
    console.log(ctx);
  });

  /**
   * - Iterates through all `item_attributes` elements, adding additional `attribute` model's fields (code, label, data_type) for each element
   *
   */
  Item.observe('loaded', async function(ctx) {
    if (
      ctx.data &&
      !_.get(ctx, 'options.is_ignore_query_item_attributes', false)
    ) {
      var item_attributes = _.get(ctx.data, 'item_attributes');
      if (typeof item_attributes === 'string') {
        item_attributes = JSON.parse(item_attributes);
      }

      if (Array.isArray(item_attributes)) {
        var item_attributes_new = [];
        for (const [
          index,
          item_attribute_origin
        ] of item_attributes.entries()) {
          var attribute_id = item_attribute_origin.id;
          var AttributeModel = app.models.attribute;
          var findByIdPromise = Promise.promisify(AttributeModel.findById).bind(
            AttributeModel
          );

          var attribute_found = await findByIdPromise(attribute_id);

          var item_attribute_new = Object.assign(
            {},
            {
              id: attribute_found.id,
              code: attribute_found.code,
              label: attribute_found.label,
              data_type: attribute_found.data_type
            },
            item_attribute_origin
          );

          item_attributes_new.push(item_attribute_new);
        }

        ctx.data.item_attributes = JSON.stringify(item_attributes_new);
      }
    }
  });

  /**
   * In case of duplicating an item, fetch source item's data and fill in candidate item will be created
   *
   * @param {object} modelInstance model instance
   */
  Item.observe('before save', async function(ctx) {
    var data = ctx.instance || ctx.data;
    var ItemModel = app.models.item;

    var is_duplicate_item_req =
      typeof data.duplicate_from_item_id == 'undefined' ? false : true;

    if (is_duplicate_item_req) {
      var duplicate_from_item_id = data.duplicate_from_item_id;

      var findByIdPromise = Promise.promisify(ItemModel.findById).bind(
        ItemModel
      );
      var source_item = await findByIdPromise(duplicate_from_item_id);

      if (_.isNull(source_item)) {
        throw boom.notFound(
          `Not found duplicate_from_item_id with id '${duplicate_from_item_id}'`
        );
      } else {
        //skip some fields will not be copied from
        ctx.instance = _.mergeWith(
          ctx.instance,
          source_item,
          (objValue, srcValue, key, object, source) => {
            if (!_.isUndefined(objValue)) {
              return objValue;
            }
          }
        );

        ctx.instance.id = undefined;
        ctx.instance.updatedAt = undefined;

        debug(ctx.instance);
      }
    }
  });

  Item.observe('persist', async function(ctx, modelInstance) {
    await validateItemData(ctx);
  });

  /**
   * - Transform image file name to image url
   */
  Item.afterRemote('**', function(ctx, modelInstance, next) {
    var ctx_result = ctx.result;

    if (_.isEmpty(ctx_result)) return next();

    var item_array = Array.isArray(ctx_result) ? ctx_result : [ctx_result];

    for (let item_ele of item_array) {
      var item_attributes = _.get(item_ele, 'item_attributes');

      if (Array.isArray(item_attributes)) {
        for (let attribute_item of item_attributes) {
          var attribute_values = _.get(attribute_item, 'values'); //object type

          _.forOwn(attribute_values, (field_value, field_name) => {
            if (['high_url', 'medium_url', 'low_url'].includes(field_name)) {
              var transformed_file_name = field_value;
              var transformed_file_url = loopback_util.convertTransformedFileNameToFileURL(
                ctx,
                transformed_file_name
              );

              //update new image url back to ctx.result
              attribute_values[field_name] = transformed_file_url;
            }
          });
        }
      }
    }

    next();
  });
};

/**
 * Process storing uploaded file and adding file storage path into `ctx.args.data` argument was passed.
 * It also convert additional metadata fields in req.body into `ctx.args.data` in order to save into DB
 *
 * @param {*} ctx
 */
async function uploadFileAndAddFilePathIntoCtx(ctx) {
  await saveFile(ctx.req, ctx.res);

  var upload_files = _.castArray(ctx.req.file || ctx.req.files);

  var convertImageFilePromises = _.map(upload_files, file => {
    return convertImageFileAsync(file.path).catch(error => {
      logger.error(`Error converting the image at ${file.path}`, __filename);
    });
  });

  await Promise.all([
    determineItemTypeIdAndAttributeIdAsync(ctx).catch(error => {
      logger.error(
        'Error determine item_type and attribute for uploaded file',
        __filename
      );
      throw error;
    }),
    ...convertImageFilePromises
  ])
    .spread((itemTypeAttributeArray, ...sharpFilesArray) => {
      var [item_type, attribute] = itemTypeAttributeArray;

      //Add 3 urls: original url, desktop image url and mobile image url into http response
      ctx.args.data['item_typeId'] = item_type.id;

      //iterate list of upload files, then set item_attributes for each of file
      ctx.args.data['item_attributes'] = [];
      for (const [index, sharpFile] of sharpFilesArray.entries()) {
        var origin_file_name = path.basename(
          _.get(sharpFile, '[0].origin_file_path')
        );
        var desktop_file_name = path.basename(
          _.find(sharpFile, { target_device: 'desktop' }).resized_file_path
        );
        var mobile_file_name = path.basename(
          _.find(sharpFile, { target_device: 'mobile' }).resized_file_path
        );

        ctx.args.data['item_attributes'].push({
          id: attribute.id,
          values: {
            high_url: origin_file_name,
            medium_url: desktop_file_name,
            low_url: mobile_file_name
          }
        });
      }

      //TODO: temporarily adding all metadata fields into same attribute with image
      //Add additional metadata fields from req.body
      if (typeof ctx.req.body == 'object') {
        var image_attribute = ctx.args.data['item_attributes'][0];
        image_attribute.values = Object.assign(
          {},
          image_attribute.values,
          ctx.req.body
        );
      }

      return ctx;
    })
    .catch(error => {
      logger.error(error, __filename);
      throw error;
    });
}

async function validateItemData(ctx) {
  var data = ctx.instance || ctx.data;

  const UPDATE_ITEM_VALIDATION = Joi.object()
    .keys({
      item_typeId: Joi.number(),
      item_attributes: Joi.any(),
      is_active: Joi.boolean()
    })
    .and('item_typeId', 'item_attributes');

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
      data.item_attributes,
      data.item_typeId
    );
  }

  //check whether the insert_after_item_id exists if this param was passed and not equal 0 (will insert in top list)
  if (
    !_.isUndefined(data.insert_after_item_id) &&
    data.insert_after_item_id !== 0
  ) {
    var ItemModel = app.models.item;
    var findByIdPromise = Promise.promisify(ItemModel.findById).bind(ItemModel);

    var dest_item_id = await findByIdPromise(data.insert_after_item_id);

    if (_.isNull(dest_item_id)) {
      throw boom.notFound(
        `Not found insert_after_item_id with id '${data.insert_after_item_id}'`
      );
    }
  }
  _.set(ctx, 'options.insert_after_item_id', data.insert_after_item_id);
}

function determineItemTypeIdAndAttributeIdAsync(ctx) {
  //get or create item_type=image in DB
  var app = ctx.req.app;
  var itemTypeModel = app.models.item_type;
  var attributeModel = app.models.attribute;
  var imageItemTypeUpsertPromise = Promise.promisify(
    itemTypeModel.upsertWithWhere
  ).bind(itemTypeModel);
  var attributeUpsertPromise = Promise.promisify(
    attributeModel.upsertWithWhere
  ).bind(attributeModel);

  return Promise.all([
    imageItemTypeUpsertPromise(
      { code: 'image' },
      { code: 'image', label: 'image', is_active: 1 }
    ).catch(error => {
      logger.error(`Unable to create item_type is 'image' in DB`, __filename);
      throw error;
    }),
    attributeUpsertPromise(
      { code: 'image' },
      {
        code: 'image',
        label: 'image',
        data_type: 'url',
        is_active: 1,
        op_required: 1
      }
    ).catch(error => {
      logger.error(`Unable to create attribute is 'image' in DB`, __filename);
      throw error;
    })
  ]);
}

function convertImageFileAsync(savedAbsoluteImagePath) {
  var imageConverter = new ImageConverter({
    desktop: {
      width: process.env.IMAGE_DESKTOP_WIDTH,
      height: process.env.IMAGE_DESKTOP_HEIGHT
    },
    mobile: {
      width: process.env.IMAGE_MOBILE_WIDTH,
      height: process.env.IMAGE_MOBILE_HEIGHT
    },
    display_mode: 'fitting'
  });

  var convertToMobilePromise = imageConverter.resizeAsync(
    savedAbsoluteImagePath,
    'mobile'
  );
  var convertToDesktopPromise = imageConverter.resizeAsync(
    savedAbsoluteImagePath,
    'desktop'
  );
  return Promise.all([convertToMobilePromise, convertToDesktopPromise]);
}

function _isReqTypeIsUploadFile(req) {
  var req_header_content_type = req.headers['content-type'];

  if (req_header_content_type.includes('multipart/form-data')) {
    return true;
  }

  return false;
}
