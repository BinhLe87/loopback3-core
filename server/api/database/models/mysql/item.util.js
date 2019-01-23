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
  const preQueryValidtionJoi = Joi.object().keys({
    item_typeId: Joi.number()
      .empty()
      .required(),
    item_attributes: Joi.array(),
    insert_after_item_id: Joi.number()
  });
  var origin_query_params = ctx.req.query;

  var query_params_validation = Joi.validate(
    origin_query_params,
    preQueryValidtionJoi,
    baseJoiOptions
  );

  if (query_params_validation.error) {
    logger.error(query_params_validation, __filename);
    throw Boom.badRequest('Invalid parameters!', query_params_validation.error);
  }

  var item_typeId = _.get(query_params_validation, 'value.item_typeId');
  var [item_type, attribute] = await determineItemTypeIdAndAttributeIdAsync(
    ctx,
    item_typeId
  );
  if (_.isNull(item_type)) {
    throw Boom.badRequest(`Not found item_type has id '${item_typeId}'`);
  }

  await saveFile(ctx.req, ctx.res, {
    silentEmptyFiles: true
  });

  var upload_files = ctx.req.file || ctx.req.files;
  upload_files = _.isUndefined(upload_files) ? [] : _.castArray(upload_files);

  var convertImageFilePromises = _.map(upload_files, file => {
    return convertImageFileAsync(file.path).catch(error => {
      logger.error(`Error converting the image at ${file.path}`, __filename);
    });
  });

  await Promise.all([...convertImageFilePromises])
    .spread((...sharpFilesArray) => {
      //Save query parameters into ctx.args.data, except `item_attributes` will be handled later
      _.forOwn(query_params_validation.value, (value, key) => {
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
          _.find(sharpFile, { target_device: 'desktop' }).resized_file_path
        );
        var mobile_file_name = path.basename(
          _.find(sharpFile, { target_device: 'mobile' }).resized_file_path
        );

        item_attributes.push({
          id: attribute.id,
          value: {
            high_url: origin_file_name,
            medium_url: desktop_file_name,
            low_url: mobile_file_name
          }
        });
      }

      ctx.args.data['item_attributes'] = item_attributes.concat(
        _.get(query_params_validation, 'value.item_attributes')
      );
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

function determineItemTypeIdAndAttributeIdAsync(ctx, item_typeId) {
  //get or create item_type=image in DB
  var app = ctx.req.app;
  var itemTypeModel = app.models.item_type;
  var attributeModel = app.models.attribute;
  var itemTypeFindByIdPromise = Promise.promisify(itemTypeModel.findById).bind(
    itemTypeModel
  );
  var attributeUpsertPromise = Promise.promisify(
    attributeModel.upsertWithWhere
  ).bind(attributeModel);

  return Promise.all([
    itemTypeFindByIdPromise(item_typeId),
    attributeUpsertPromise(
      { code: 'image' },
      {
        code: 'image',
        label: 'Image',
        data_type: 'url',
        is_active: 1
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
  //HACK:
  return true;

  var req_header_content_type = req.headers['content-type'];

  if (req_header_content_type.includes('multipart/form-data')) {
    return true;
  }

  return false;
}
