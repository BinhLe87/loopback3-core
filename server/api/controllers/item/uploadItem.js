'use strict';
var multer = require('multer'),
  path = require('path'),
  FilePathHandler = require('../../helpers/uploadFilePathHandler'),
  Promise = require('bluebird');

const uploadFilePathHandler = new FilePathHandler();
/**
 * Process to store uploaded file in calculated path
 *
 * @param {*} req http request
 * @param {*} res http response
 * @param {object} options options
 * @returns {object} if upload OK, return object {relativeFilePathWillSave, absoluteFilePathWillSave}, otherwise throw err
 */
module.exports = async function uploadItem(req, res, options) {
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
