'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const AttributeUtil = require('./attribute.util');
const uploadItem = require('../../../controllers/item/uploadItem');
const Promise = require('bluebird');
const loopback_util = require('../../../helpers/loopbackUtil');
const URI = require('urijs');
const { ImageConverter } = require('../../../helpers/imageConverter');
const app = require('../../../server');

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
            if (['createdAt'].includes(key)) {
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
  var { relativeFilePathWillSave, absoluteFilePathWillSave } = await uploadItem(
    ctx
  );

  await Promise.all([
    determineItemTypeIdAndAttributeIdAsync(ctx, relativeFilePathWillSave).catch(
      error => {
        logger.error(
          'Error determine item_type and attribute for uploaded file',
          __filename
        );
        throw error;
      }
    ),
    convertImageFileAsync(absoluteFilePathWillSave).catch(error => {
      logger.error('Error convert the image', __filename);
      throw error;
    })
  ])
    .spread((itemTypeAttributeArray, sharpFilesArray) => {
      var [item_type, attribute] = itemTypeAttributeArray;
      var [mobileFileName, desktopFileName] = sharpFilesArray;

      var origin_file_name = path.basename(relativeFilePathWillSave);
      var desktop_file_name = desktopFileName;
      var mobile_file_name = mobileFileName;

      //Add 3 urls: original url, desktop image url and mobile image url into http response
      ctx.args.data['item_typeId'] = item_type.id;
      ctx.args.data['item_attributes'] = [
        {
          id: attribute.id,
          values: {
            high_url: origin_file_name,
            medium_url: desktop_file_name,
            low_url: mobile_file_name
          }
        }
      ];

      //FIXME: temporarily adding all metadata fields into same attribute with image
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
  if (
    typeof data.item_typeId == 'undefined' ||
    typeof data.item_attributes == 'undefined'
  ) {
    throw new Error(
      `Must input 2 required fields are 'item_typeId' and 'item_attributes'`
    );
  }

  await AttributeUtil.validateAttributesByItemtypeId(
    data.item_attributes,
    data.item_typeId
  );

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

function determineItemTypeIdAndAttributeIdAsync(ctx, savedRelativeFilePath) {
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
