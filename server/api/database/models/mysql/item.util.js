const path = require('path');
const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
const Promise = require('bluebird');
const { saveFile } = require('../../../controllers/upload/uploadFile');
const { ImageConverter } = require('../../../helpers/imageConverter');
const AttributeUtil = require('./attribute.util');

exports = module.exports = {};
exports.uploadFileAndAddFilePathIntoCtx = uploadFileAndAddFilePathIntoCtx;
exports.validateItemData = validateItemData;

/**
 * Process storing uploaded file and adding file storage path into `ctx.args.data` argument was passed.
 * It also convert additional metadata fields in req.body into `ctx.args.data` in order to save into DB
 *
 * @param {*} ctx
 */
async function uploadFileAndAddFilePathIntoCtx(ctx) {
  var query_params = ctx.req.query;

  query_params = await validateItemData(query_params);

  var item_typeId = _.get(query_params, 'item_typeId');
  var item_type = await checkItemType(ctx, item_typeId);
  if (_.isNull(item_type)) {
    throw Boom.badRequest(`Not found item_type has id '${item_typeId}'`);
  }

  await saveFile(ctx.req, ctx.res, {
    silentEmptyFiles: true
  });

  var upload_files = ctx.req.file || ctx.req.files;
  upload_files = _.isUndefined(upload_files) ? [] : _.castArray(upload_files);

  var convertImageFilePromises = _.map(upload_files, file => {
    return convertImageFileAsync(file.path, {
      fieldname_upload: file.fieldname
    }).catch(error => {
      logger.warn(`Error converting the image at ${file.path}`, ctx.req);
    });
  });

  return new Promise(async (resolve, reject) => {
    await Promise.all([...convertImageFilePromises])
      .spread(async (...sharpFilesArray) => {
        //Save query parameters into ctx.args.data, except `item_attributes` will be handled later
        _.forOwn(query_params, (value, key) => {
          if (key != 'item_attributes' && key != 'access_token') {
            ctx.args.data[key] = value;
          }
        });
        ctx.args.data['item_typeId'] = item_type.id;

        //Add 3 urls: original url, desktop image url and mobile image url into http response
        //iterate list of upload files, then set item_attributes for each of file
        var item_attributes = [];
        for (const [index, sharpFile] of sharpFilesArray.entries()) {
          var origin_file_name = path.basename(
            _.get(sharpFile, '[0].origin_file_path')
          );
          var desktop_file_name = path.basename(
            _.find(sharpFile, {
              target_device: 'desktop'
            }).resized_file_path
          );
          var mobile_file_name = path.basename(
            _.find(sharpFile, {
              target_device: 'mobile'
            }).resized_file_path
          );

          var attribute_id = _.chain(sharpFile)
            .find(ele => {
              return !_.isUndefined(ele.fieldname_upload);
            })
            .get('fieldname_upload')
            .value();

          //fieldname of uploaded file is maybe equal to `attribute_id` if found in DB
          var attribute = await checkAttributeId(ctx, attribute_id);

          item_attributes.push({
            id: attribute.id,
            value: {
              high_url: origin_file_name,
              medium_url: desktop_file_name,
              low_url: mobile_file_name
            }
          });
        }

        Array.prototype.push.apply(
          item_attributes,
          _.get(query_params, 'item_attributes')
        );
        ctx.args.data['item_attributes'] = item_attributes;

        resolve();
      })
      .catch(error => {
        logger.warn(error, ctx.req);
        reject(error);
      });
  });
}

/**
 * Validate and return 'new' item_object is maybe changed after converting values if any
 *
 * @param {*} item_object
 * @returns {object} a (new) item_object
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
    logger.warn(`Unable to create attribute is 'file' in DB`);
    throw error;
  }
}
/**
 *
 *
 * @param {string} savedAbsoluteImagePath
 * @param {object} [file_params] optional file parameters
 * @returns
 */
function convertImageFileAsync(savedAbsoluteImagePath, file_params) {
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

  var fileParamsPromise = new Promise((resolve, reject) => {
    return resolve(file_params);
  });

  return Promise.all([
    convertToMobilePromise,
    convertToDesktopPromise,
    fileParamsPromise
  ]);
}

function _isReqTypeIsUploadFile(req) {
  var req_header_content_type = req.headers['content-type'];

  if (req_header_content_type.includes('multipart/form-data')) {
    return true;
  }

  return false;
}
