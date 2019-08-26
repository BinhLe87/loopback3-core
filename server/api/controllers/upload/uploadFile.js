const Joi = require('joi');
const app = require('../../server');
const Promise = require('bluebird');
const path = require('path');
const assert = require('assert');
const multer = require('multer'),
  FilePathHandler = require('../../helpers/uploadFilePathHandler');
const { ImageConverter } = require('../../helpers/imageConverter');

const uploadFilePathHandler = new FilePathHandler();

exports = module.exports = {};
exports.uploadFileController = uploadFileController;
exports.saveFile = saveFile;

const { baseJoiOptions } = require('../../helpers/validators/joiValidator');

var uploadQueryParamsJoi = Joi.object().keys({
  file_type: Joi.string()
    .allow('workbook_image')
    .default('raw_file'),
  workbook_id: Joi.string().when('file_type', {
    is: Joi.invalid('raw_file'),
    then: Joi.required()
  })
});

async function uploadFileController(ctx) {
  try {
    var { req, res } = ctx;
    var query_params_origin = req.query;

    var url_params_joi_result = uploadQueryParamsJoi.validate(
      query_params_origin,
      baseJoiOptions
    );
    if (url_params_joi_result.error) {
      throw Boom.badRequest(
        'Invalid parameters for upload api',
        url_params_joi_result.error
      );
    }

    var query_params = url_params_joi_result.value;

    //although it's able to query query params via ctx.req.query but still pass query_params
    //because it maybe changed after Joi validation
    var result = await _routeUploadControllerByFileType(ctx, query_params);

    var target_resultType = !_.isUndefined(result.resultType)
      ? result.resultType
      : ctx.resultType;
    _.set(ctx, 'cc_hook_options.resultType', target_resultType); //save it for reset resultType later
    //because it would be changed to returns 'type' field value configured in shareMethod function in util.json

    return _.get(result, 'result', result); //will be return by shareMethod built-in function as default
  } catch (upload_error) {
    logger.error(upload_error, __filename);
    throw upload_error;
  }
}

/**
 * Process to store uploaded file in calculated path.
 *
 * @param {*} req http request
 * @param {*} res http response
 * @param {object} [options] options
 * @param {boolean} [options.silentEmptyFiles] ignore throwing error if upload files is empty
 * @returns Throw error if no any files to upload and `options.silentEmptyFiles` is false
 */
async function saveFile(req, res, options) {
  //multer.bind(app);

  var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      var origin_filename = file.originalname;
      var fileNameWillSave = uploadFilePathHandler.transformFileNameToSave(
        origin_filename
      );

      var pathWillSave = uploadFilePathHandler.identifyAbsoluteDirPathWillSave(
        fileNameWillSave
      );
      cb(null, pathWillSave);
    },
    filename: function(req, file, cb) {
      var origin_filename = file.originalname;
      var fileNameWillSave = uploadFilePathHandler.transformFileNameToSave(
        origin_filename
      );
      cb(null, fileNameWillSave);
    }
  });

  var fileFilter = function(req, file, cb) {
    //cb(new Error('Not allowed to upload at the moment!!!!'));

    cb(null, true);
  };

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {}
  });

  var my_upload = upload.any();

  //handle when upload finished
  var my_uploadPromise = Promise.promisify(my_upload).bind(my_upload);

  await my_uploadPromise(req, res);

  var uploaded_files = req.file || req.files;
  uploaded_files = _.isUndefined(uploaded_files)
    ? []
    : _.castArray(uploaded_files);

  if (_.isEmpty(uploaded_files) && !options.silentEmptyFiles) {
    throw Boom.notFound(
      'Not found any files in multipart-form need to be uploaded'
    );
  }
}

async function _routeUploadControllerByFileType(ctx, query_params) {
  var file_type = query_params.file_type;
  var result = {};
  var resultType;

  switch (file_type) {
    case 'workbook_image':
      result = await _workbook_image_uploader(ctx, query_params);
      resultType = 'workbook';
      break;
    case 'raw_file':
      result = await _raw_file_uploader(ctx, { would_convert_images: true });
      resultType = 'object'; //in order to ignore processing by jsonApiFormatter.js
      break;
    default:
  }

  if (_.isEmpty(result) || _.isEmpty(resultType)) {
    throw new Error('result and resultType must be not empty');
  }

  return {
    result,
    resultType
  };
}
/**
 * Validate the exists of workbook, save file, update image_url in database
 *
 * @param {object} ctx context
 * @param {object} query_params query parameters
 * @returns {object} workbook object after updating
 */
async function _workbook_image_uploader({ req, res }, query_params) {
  var WorkbookModel = app.models.workbook;
  var findByIdPromise = Promise.promisify(WorkbookModel.findById).bind(
    WorkbookModel
  );

  var workbook_id = query_params.workbook_id;
  var workbook_found = await findByIdPromise(workbook_id);

  if (!workbook_found) {
    throw Boom.notFound(`Not found workbook_id is ${workbook_id}`);
  }

  await saveFile(req, res);

  var uploaded_files = req.file || req.files;
  uploaded_files = _.isUndefined(uploaded_files)
    ? []
    : _.castArray(uploaded_files);

  var updateAttribute_result;
  for (const [index, file] of uploaded_files.entries()) {
    var standardized_file_name = file.filename;
    var updateAttributeWorkbookPromise = Promise.promisify(
      workbook_found.updateAttribute
    ).bind(workbook_found);
    updateAttribute_result = await updateAttributeWorkbookPromise(
      'image_url',
      standardized_file_name
    );
  }

  return updateAttribute_result;
}

/**
 * Save raw file and return file path
 *
 * @param {object} ctx context
 * @returns {object} file path
 */
async function _raw_file_uploader({ req, res }, options) {
  await saveFile(req, res);

  var uploaded_files = req.file || req.files;
  uploaded_files = _.isUndefined(uploaded_files)
    ? []
    : _.castArray(uploaded_files);

  var upload_results = [];

  for (const [index, file] of uploaded_files.entries()) {
    var fileNameWillSave = file.filename;
    var file_path = file.path;
    var is_image_type = mime_type =>
      new RegExp(`image\/.*`, 'ig').test(mime_type);

    var image_resizes_result;
    if (is_image_type(file.mimetype) && options.would_convert_images === true) {
      image_resizes_result = await convertImagesInReqToMultipleSizesAsync(
        file_path
      );
    }

    var result = {};
    result.file_url = fileNameWillSave;
    if (!_.isEmpty(image_resizes_result)) {
      result = Object.assign(
        {},
        result,
        _.chain(_.pick(image_resizes_result, ['medium_url', 'low_url']))
          .transform((result, value, key) => {
            result[`file_size_${key}`] = value;
          }, {})
          .value()
      );
    }

    upload_results.push(result);
  }

  return {
    data: upload_results
  };
}

/**
 * Process storing uploaded file and adding file storage path into `ctx.args.data` argument was passed.
 * It also convert additional metadata fields in req.body into `ctx.args.data` in order to save into DB
 *
 * @param {string} file_path path of file would be converted
 * @returns {object} object contains multiple image sizes, including
 * {
 *   high_url,
 *   medium_url,
 *   low_url
 * }
 */
function convertImagesInReqToMultipleSizesAsync(file_path) {
  if (typeof file_path == 'undefined') return [];

  var convertImageFilePromise = convertOneImageFileToSizesAsync(file_path);

  return convertImageFilePromise
    .then(sharpFilesArray => {
      //Add 3 urls: original url, desktop image url and mobile image url into http response
      //iterate list of upload files, then set item_attributes for each of file
      var image_sizes = {};
      var origin_file_name = path.basename(
        _.get(sharpFilesArray, '[0].origin_file_path')
      );
      var desktop_file_name = path.basename(
        _.find(sharpFilesArray, {
          target_device: 'desktop'
        }).resized_file_path
      );
      var mobile_file_name = path.basename(
        _.find(sharpFilesArray, {
          target_device: 'mobile'
        }).resized_file_path
      );

      image_sizes = {
        high_url: origin_file_name,
        medium_url: desktop_file_name,
        low_url: mobile_file_name
      };

      return image_sizes;
    })
    .catch(error => {
      logger.error(`Error converting image at path ${file_path}: ${error}`);
      throw error;
    });
}

/**
 *
 *
 * @param {string} savedAbsoluteImagePath
 * @param {object} [file_params] optional file parameters
 * @returns
 */
function convertOneImageFileToSizesAsync(savedAbsoluteImagePath, file_params) {
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
