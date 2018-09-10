'use strict';
var multer = require('multer'),
  path = require('path'),
  FilePathHandler = require('../../helpers/uploadFilePathHandler');

// Error Messages
// var ERR_UPLOAD_FAILED =
//   'Error file uploading has failed at <%=method%> <%=url%>. Please try again';
const uploadFilePathHandler = new FilePathHandler();

module.exports = function uploadItem(app, next, callback) {
  multer.bind(app);

  var relativeFilePathWillSave;
  var absoluteFilePathWillSave;
  var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      var pathWillSave = uploadFilePathHandler.identifyAbsoluteDirPathWillSave();
      cb(null, pathWillSave);
    },
    filename: function(req, file, cb) {
      var origin_filename = file.originalname;
      var fileNameWillSave = uploadFilePathHandler.transformFileNameToSave(
        origin_filename
      );
      cb(null, fileNameWillSave);

      absoluteFilePathWillSave = path.join(
        uploadFilePathHandler.identifyAbsoluteDirPathWillSave(),
        fileNameWillSave
      );
      relativeFilePathWillSave = path.join(
        uploadFilePathHandler.identifyRelativeDirPathWillSave(),
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
  my_upload(app.req, app.res, err => {
    callback(err, relativeFilePathWillSave, absoluteFilePathWillSave);
  });
};
