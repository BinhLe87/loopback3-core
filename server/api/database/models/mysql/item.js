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

      ctx = await uploadFileAndAddFilePathIntoCtx(ctx);
    }
  });

  Item.beforeRemote('upsert', async function(ctx, modelInstance) {
    if (_isReqTypeIsUploadFile(ctx.req)) {
      //request type is uploading file

      ctx = await uploadFileAndAddFilePathIntoCtx(ctx);
    }
  });

  Item.observe('persist', async function(ctx, modelInstance) {
    await validateItemData(ctx);
  });

  /**
   * - Transform image file path to image url
   */
  Item.afterRemote('**', function(ctx, modelInstance, next) {
    var ctx_result = ctx.result;
    var item_attributes = _.get(ctx_result, 'item_attributes');

    if (Array.isArray(item_attributes)) {
      for (let attribute_item of item_attributes) {
        var attribute_values = _.get(attribute_item, 'values');
        for (let attribute_value_item of attribute_values) {
          //atribute_value is object type

          if (typeof attribute_value_item == 'object') {
            _.forOwn(attribute_value_item, function(field_value, field_name) {
              if (['high_url', 'medium_url', 'low_url'].includes(field_name)) {
                var transformed_url = path.join(
                  loopback_util.getBaseURL(ctx.req),
                  static_files_dir,
                  field_value
                );

                //update new image url back to ctx.result
                attribute_value_item[field_name] = transformed_url;
              }
            });
          }
        }
      }
    }

    next();
  });
};

/**
 * Process storing uploaded file and adding file storage path into `ctx.args.data`
 *
 * @param {*} ctx
 * @returns {object} ctx return customized ctx after adding file storage path into `ctx.args.data`
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

      var origin_uri = relativeFilePathWillSave;

      var relativeUploadDir = path.dirname(relativeFilePathWillSave);
      var desktop_uri = path.join(relativeUploadDir, desktopFileName);
      var mobile_uri = path.join(relativeUploadDir, mobileFileName);

      //Add 3 urls: original url, desktop image url and mobile image url into http response
      ctx.args.data['item_typeId'] = item_type.id;
      ctx.args.data['item_attributes'] = [
        {
          id: attribute.id,
          values: [
            { high_url: URI.decode(origin_uri.normalize().toString()) },
            {
              medium_url: URI.decode(desktop_uri.normalize().toString())
            },
            { low_url: URI.decode(mobile_uri.normalize().toString()) }
          ]
        }
      ];

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
