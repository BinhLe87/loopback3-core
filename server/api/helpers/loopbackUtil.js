'use strict';

const URI = require('urijs');
const path = require('path');
const FilePathHandler = require('./uploadFilePathHandler');
const uploadFilePathHandler = new FilePathHandler();
const replace_in_file = require('replace-in-file');
module.exports = exports = {};

var _builtInModelNames = [
  'KeyValue',
  'Email',
  'Application',
  'AccessToken',
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
exports.determineHostBaseURL = function determineHostBaseURL(req) {
  var cc_source_header = _.get(req, 'headers.cc-source');

  if (cc_source_header) {
    return cc_source_header;
  }

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
  return new URI(relative_path, exports.determineHostBaseURL(req)).toString();
};
/**
 * Attempt to convert transformed file name like `workbook-1_s01_api_20180928_b8c752_299_168.jpeg`
 * to file url like `http:/localhost:8080/upload/api/2018/09/28/workbook-1_s01_api_20180928_b8c752_299_168.jpeg`
 * Notice: If failed, it returns original file name that was passed as an argument
 * @param {*} req http request
 * @param {*} transformed_file_name
 * @returns
 */
exports.convertTransformedFileNameToFileURL = function convertTransformedFileNameToFileURL(
  req,
  transformed_file_name
) {
  var relative_file_path;
  try {
    relative_file_path = uploadFilePathHandler.identifyRelativeFilePathWillSave(
      transformed_file_name
    );
  } catch (transform_error) {}

  var transformed_url = exports.buildAbsoluteURLFromReqAndRelativePath(
    req,
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

/**
 * Replace code to make hot fix issue 'Unsupport hasMany invert polymorphic relation' as pull request
 * https://github.com/strongloop/loopback-datasource-juggler/pull/1574/commits/25afde065fd27a4fb5de9c65883013881babd93e
 */
exports.apply_hot_fix = async function apply_hot_fix() {
  var code_block_would_fix_regx = `if\\s*\\(polymorphic\\)\\s+\\{[\\s\\S]*(.*?throughFilter\\.where\\[polymorphic\\.discriminator\\][\\s\\S]*?)\\}`;
  var code_hot_fix = `//Notice: Binh hot fix 10-Octorber-2018 \n
    var throughModel = polymorphic.invert ? relation.modelTo : relation.modelFrom; \n
    throughFilter.where[polymorphic.discriminator] = throughModel.definition.name; //fixed-flag \n`;

  var file_path_would_fix = path.join(
    __dirname,
    '../node_modules/loopback/node_modules/loopback-datasource-juggler/lib/include.js'
  );
  //HACK: just for local
  //var file_path_would_fix ='/Users/steven_lee/Documents/MYDATA/Miscellaneous/Screen shot/test_replace/include.js';

  const options = {
    files: file_path_would_fix,
    from: file => RegExp(code_block_would_fix_regx, 'gi'),
    to: input_match => {
      var input_match_results = RegExp(code_block_would_fix_regx, 'gi').exec(
        input_match
      );
      if (
        Array.isArray(input_match_results) &&
        input_match_results.length > 1
      ) {
        //skip if it was replaced previously via check whether exists `//fixed-flag` symbol
        var matched_string = input_match_results[1];

        if (!matched_string.includes(`//fixed-flag`)) {
          //was not replaced

          return input_match.replace(matched_string, code_hot_fix);
        } else {
          return input_match;
        }
      }
    }
  };

  try {
    var changes = await replace_in_file(options);
    return changes;
  } catch (error) {
    logger.error(
      `apply_hot_fix(): Unable to apply hot fix code for issue 'Unsupport hasMany invert polymorphic relation'`,
      __filename
    );
    throw error;
  }
};

exports.isImageFile = function(file_name) {
  var IMAGE_EXT_REGX = /.(jpg|jpeg|png|gif)$/i;
  return IMAGE_EXT_REGX.test(file_name);
};
