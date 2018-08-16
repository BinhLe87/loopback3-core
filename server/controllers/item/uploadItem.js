'use strict';
var multer = require('multer'),
  http = require('http'),
  util = require('util'),
  path = require('path'),
  crypto = require('crypto'),
  moment = require('moment'),
  createError = require('http-errors'),
  FilePathHandler = require('../../helpers/uploadFilePathHandler'),
  debug = require('debug')(path.basename(__filename));

// Error Messages
var ERR_UPLOAD_FAILED =
  'Error file uploading has failed at <%=method%> <%=url%>. Please try again';
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

// module.exports = function uploadItem(req, res, next) {
//   //parse a file upload
//   var form = new formidable.IncomingForm();

//   form.keepExtensions = true;

//   form.parse(req, function(err, fields, files) {
//     if (err) {
//       logger.error(err, __filename);

//       let error_message = logger.assert(!err, ERR_UPLOAD_FAILED, {
//         url: req.url,
//         method: req.method
//       });
//       let respErr = new createError.BadRequest(error_message);
//       respErr.data = err;

//       return next(respErr);
//     }

//     res.writeHead(200, { 'content-type': 'text/plain' });
//     res.write('received upload:\n\n');
//     return res.end(util.inspect({ fields: fields, files: files }));
//   });

//   //off auto rename file, it also disables `form.uploadDir` and `form.keepExtensions` parameters
//   form.on('fileBegin', function(name, file) {
//     //Only accept invoking SYNC functions
//     file.path = uploadFilePathHandler.identifyPathWillSave(file.name);
//     file.name = uploadFilePathHandler.transformFileNameToSave(file.name);
//   });

//   var fields = {};
//   form.on('field', function(name, value) {
//     fields[name] = value;
//     debug(util.inspect(fields));
//   });

//   form.onPart = function(part) {
//     if (part.filename) {
//       this.handlePartFile(part);
//       debug('file');
//     } else {
//       this.handlePartFields(part);
//       debug('field');
//     }
//   };
// };
