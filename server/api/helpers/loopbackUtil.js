'use strict';

const URI = require('urijs');
const path = require('path');
const FilePathHandler = require('./uploadFilePathHandler');
const uploadFilePathHandler = new FilePathHandler();

module.exports = exports = {};

var _builtInModelNames = [
  'KeyValue',
  'Email',
  'Application',
  'AccessToken',
  'User',
  'RoleMapping',
  'Role',
  'ACL',
  'Scope',
  'Change',
  'Checkpoint',
  'user'
];

exports.isBuiltInModel = function isBuiltInModel(model_name) {
  return _builtInModelNames.includes(model_name);
};

exports.builtInModelNames = _builtInModelNames;
/**
 *
 *
 * @param {ctx.req} req ctx.request
 * @returns
 */
exports.getBaseURL = function getBaseURL(req) {
  var url_parts = {
    protocol: req.protocol,
    hostname: req.get('host')
  };
  return URI.build(url_parts);
};

exports.buildAbsoluteURLFromReqAndRelativePath = function buildAbsoluteURLFromReqAndRelativePath(
  req,
  relative_path
) {
  return new URI(relative_path, exports.getBaseURL(req)).toString();
};
/**
 * Attempt to convert transformed file name like `workbook-1_s01_api_20180928_b8c752_299_168.jpeg`
 * to file url like `http:/localhost:8080/upload/api/2018/09/28/workbook-1_s01_api_20180928_b8c752_299_168.jpeg`
 * Notice: If failed, it returns original file name that was passed as an argument
 * @param {*} ctx
 * @param {*} transformed_file_name
 * @returns
 */
exports.convertTransformedFileNameToFileURL = function convertTransformedFileNameToFileURL(
  ctx,
  transformed_file_name
) {
  var relative_file_path;
  try {
    relative_file_path = uploadFilePathHandler.identifyRelativeFilePathWillSave(
      transformed_file_name
    );
  } catch (transform_error) {}

  var transformed_url = exports.buildAbsoluteURLFromReqAndRelativePath(
    ctx.req,
    path.join(
      _.defaultTo(STATIC_FILE_DIR, ''), //based on GLOBAL static directory configuration in Loopback#static middleware
      _.isUndefined(relative_file_path)
        ? transformed_file_name
        : relative_file_path
    )
  );

  return transformed_url;
};

exports.getStaticFileDir = function getStaticFileDir(callback) {
  const fs = require('fs-extra');
  fs.readFile(path.join(__dirname, '../middleware.json'), (err, data) => {
    if (err) {
      callback(err);
    } else {
      let middlewares = JSON.parse(data);
      var static_data = _.get(middlewares, 'files.loopback#static');
      var filesInArray;

      if (Array.isArray(static_data)) {
        filesInArray = static_data;
      } else if (typeof static_data == 'object') {
        filesInArray = [static_data];
      }

      var staticUploadURL = _.filter(filesInArray, { name: 'upload' });
      var static_files_dir = _.get(staticUploadURL[0], 'paths[0]', '');

      callback(null, static_files_dir);
    }
  });
};
