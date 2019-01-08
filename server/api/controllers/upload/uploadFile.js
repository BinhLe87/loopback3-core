const Joi = require('joi');
const app = require('../../server');
const Promise = require('bluebird');
const path = require('path');
const assert = require('assert');
const multer = require('multer'),
  FilePathHandler = require('../../helpers/uploadFilePathHandler');

const uploadFilePathHandler = new FilePathHandler();

exports = module.exports = {};
exports.uploadFileController = uploadFileController;
exports.saveFile = saveFile;

const baseJoiOptions = {
  abortEarly: false,
  convert: true,
  allowUnknown: true
};

var uploadQueryParamsJoi = Joi.alternatives().try(

  Joi.object()
  .keys({
    file_type: Joi.string()
      .valid('workbook_image')
      .required(),
    workbook_id: Joi.string().required()
  })
);

async function uploadFileController(ctx) {

  try {

    var {req, res} = ctx;
    var query_params_origin = req.query;

    var url_params_joi_result = uploadQueryParamsJoi.validate(query_params_origin, baseJoiOptions);
    if (url_params_joi_result.error) {

      throw Boom.badRequest('Invalid parameters for upload api', url_params_joi_result.error);
    }

    var query_params = url_params_joi_result.value;

    //although it's able to query query params via ctx.req.query but still pass query_params 
    //because it maybe changed after Joi validation
    var result = await _routeUploadControllerByFileType(ctx, query_params);

    ctx.resultType_alias = result.resultType; //save it for reset resultType later 
    //because it would be changed to returns 'type' field value configured in shareMethod function in util.json

    return result.result; //will be return by shareMethod built-in function as default
  } catch (upload_error) {

    logger.error(upload_error, __filename);
    throw upload_error;
  }

}

/**
 * Process to store uploaded file in calculated path
 *
 * @param {*} req http request
 * @param {*} res http response
 * @param {object} options options
 * @returns {object} if upload OK, return object {relativeFilePathWillSave, absoluteFilePathWillSave}, otherwise throw err
 */
async function saveFile(req, res, options) {
  //multer.bind(app);

  var relativeFilePathWillSave;
  var absoluteFilePathWillSave;

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

      absoluteFilePathWillSave = path.join(
        uploadFilePathHandler.identifyAbsoluteDirPathWillSave(fileNameWillSave),
        fileNameWillSave
      );
      relativeFilePathWillSave = path.join(
        uploadFilePathHandler.identifyRelativeDirPathWillSave(fileNameWillSave),
        fileNameWillSave
      );
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

  var my_upload = upload.single('image');

  //handle when upload finished
  var my_uploadPromise = Promise.promisify(my_upload).bind(my_upload);

  await my_uploadPromise(req, res);

  return {
    relativeFilePathWillSave: relativeFilePathWillSave,
    absoluteFilePathWillSave: absoluteFilePathWillSave
  };
};


async function _routeUploadControllerByFileType(ctx, query_params) {

  var file_type = query_params.file_type;
  var result = {};
  var resultType;

  switch (file_type) {

    case 'workbook_image':
        result = await _workbook_image_uploader(ctx, query_params);        
        resultType = 'workbook';
        break;
    default:        
  }

  if(_.isEmpty(result) || _.isEmpty(resultType)) {

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
async function _workbook_image_uploader({req, res}, query_params) {

  var WorkbookModel = app.models.workbook;
  var findByIdPromise = Promise.promisify(WorkbookModel.findById).bind(
    WorkbookModel
  );

  var workbook_id = query_params.workbook_id;
  var workbook_found = await findByIdPromise(workbook_id);

  if (!workbook_found) {

    throw Boom.notFound(`Not found workbook_id is ${workbook_id}`);
  }

var {
  relativeFilePathWillSave,
  absoluteFilePathWillSave
} = await saveFile(
  req, res
);

var standardized_file_name = path.basename(relativeFilePathWillSave);
var updateAttributeWorkbookPromise = Promise.promisify(workbook_found.updateAttribute).bind(workbook_found);
var updateAttribute_result = await updateAttributeWorkbookPromise('image_url', standardized_file_name);

return updateAttribute_result;
}


