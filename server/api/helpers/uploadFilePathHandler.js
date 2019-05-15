'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const fs = require('fs-extra');
const { EventEmitter } = require('events');
const utils = require('util');
const moment = require('moment');
const crypto = require('crypto');
const FileUtil = require('../../utils/fileUtil');
const slugify = require('@sindresorhus/slugify');
const _ = require('lodash');

const HASH_RANDOM_FORMAT = '(\\w{6})';
const FILE_NAME_FORMAT_REGEXP = RegExp(
  `^(.*)_(.*)_([a-zA-Z0-9]{1,3})_(\\d{8})_${HASH_RANDOM_FORMAT}_?([^\.]*)\\.?(\\w*)$`
);

/**
 * This class will transform file name into following format
 *
 * `<baseFileName>_<server_id>_<service_name>_YYYYMMDD_<random_hash_six_chars>.<file_type>`
 *
 * @example  `svr01_master-yoga-in-30-days_abc-20180705-zmnrhb.mp4`
 *
 * @param {object} [options={}] the setting options for current service
 * @param {string} [options.uploadDir] the absolute path of upload directory of current service. This value will override `ROOT_UPLOAD_DIR` env
 */
function uploadFilePathHandler(options = {}) {
  EventEmitter.call(this);
  this.options = options;
}

utils.inherits(uploadFilePathHandler, EventEmitter);

Object.defineProperty(uploadFilePathHandler.prototype, 'ROOT_UPLOAD_DIR', {
  enumerable: true,
  get() {
    let root_dir = process.env.ROOT_UPLOAD_DIR;
    if (_.isEmpty(root_dir)) {
      //return default path

      return path.resolve(process.cwd(), 'upload');
    }

    return root_dir;
  }
});

Object.defineProperty(uploadFilePathHandler.prototype, 'SERVICE_NAME', {
  enumerable: true,
  get() {
    var service_name = process.env.SERVICE_NAME;

    if (!service_name) {
      var err_message = `${path.basename(
        __filename
      )} this class requires Node env SERVICE_NAME`;
      logger.error(err_message);
      throw new Error(err_message);
    }

    return service_name;
  }
});

function _isValidFileNameFormat(file_name) {
  return FILE_NAME_FORMAT_REGEXP.test(file_name);
}
/**
 *
 *
 * @param {*} transformedFileName
 * @returns {object} an object contains extracted fileds. For example:  
    {  
        base_file_name: 'workbook-1',  
        server_id: 's01',  
        service_name: 'api',  
        datetime: '20180928',  
        random_hash: 'd98a3e',  
        image_dimension: '',  
        file_extension: 'jpeg'  
    }  
 */
function _extractFieldsFromFileName(transformedFileName) {
  if (!_isValidFileNameFormat(transformedFileName)) {
    throw new Error(`File name '${transformedFileName}' has invalid format`);
  }

  var extracted_fields = FILE_NAME_FORMAT_REGEXP.exec(transformedFileName);

  return {
    base_file_name: extracted_fields[1],
    server_id: extracted_fields[2],
    service_name: extracted_fields[3],
    datetime: extracted_fields[4],
    random_hash: extracted_fields[5],
    image_dimension: extracted_fields[6],
    file_extension: extracted_fields[7]
  };
}

function _generateRandomHashHasSixChars() {
  function __isValidHash(hash) {
    return RegExp(`${HASH_RANDOM_FORMAT}`).test(hashSixChars);
  }

  //Note: in javascript, each string character is 16-bit length => be 3 bytes for 6 characters
  var remainingAttempts = 10;
  var hashSixChars;
  const buf = Buffer.alloc(3);
  do {
    hashSixChars = crypto.randomFillSync(buf).toString('hex'); //This method is used to encode each byte as two hexadecimal characters.
    remainingAttempts--;
  } while (remainingAttempts > 0 && !__isValidHash(hashSixChars));

  if (!__isValidHash(hashSixChars)) {
    throw new Error(
      `${path.basename(
        __filename
      )}: Can not generate random 6 characters at the moment. Please try again later`
    );
  }

  return hashSixChars;
}

uploadFilePathHandler.prototype.transformFileNameToSave = function(file_name) {
  var service_name = this.SERVICE_NAME;
  var server_id = process.env.SERVER_ID;

  var fileExt = FileUtil.getFileExtension(file_name);
  var baseFileName = file_name.replace(fileExt ? `.${fileExt}` : fileExt, '');
  var slugifiedBaseFileName = slugify(baseFileName);

  var now = moment(); //current locale time
  var dateString = now.format('YYYYMMDD');

  var sixchars_hash = _generateRandomHashHasSixChars();

  let dirStructureOfFile = [service_name, dateString, sixchars_hash].join('_');
  let fileExtHasPoint = _.isEmpty(fileExt) ? fileExt : `.${fileExt}`;
  let fileNameToSave = [
    `${slugifiedBaseFileName}_`,
    `${server_id}_`,
    dirStructureOfFile,
    fileExtHasPoint
  ].join('');

  //Re-check the code to ensure it run properly if you're on development environment
  if (process.env.NODE_ENV == 'development') {
    if (!_isValidFileNameFormat(fileNameToSave)) {
      throw new Error(`${path.basename(
        __filename
      )}: func _transformFileNameToSave() generate incorrect file name format. 
                Check your code again: generated filename is ${fileNameToSave}`);
    }
  }

  return fileNameToSave;
};
/**
 * Return the directory structure as below
 * 
 * ```
  path.resolve(this.rootUploadDir, serviceName,
    date.year().toString(),
    _.padStart((date.month() + 1).toString(), 2, '0'),
    _.padStart(date.date().toString(), 2, '0'),
    transformedFileName);
 * ```
 * Notice that: the `rootUploadDir` will be one in the priority order: `[options.uploadDir]` > `process.env.ROOT_UPLOAD_DIR`
 * @param {string} baseFileName
 * @returns
 */
uploadFilePathHandler.prototype.identifyAbsoluteFilePathWillSave = function(
  baseFileName
) {
  var transformedFileName = this.transformFileNameToSave(baseFileName);

  var dirPathWillSave = this.identifyAbsoluteDirPathWillSave();

  var pathWillSave = path.resolve(dirPathWillSave, transformedFileName);

  return pathWillSave;
};

uploadFilePathHandler.prototype.identifyRelativeDirPathWillSave = function(
  transformedFileName
) {
  var {
    service_name,
    datetime //YYYYMMDD
  } = _extractFieldsFromFileName(transformedFileName);

  var file_created_at = moment(datetime, 'YYYYMMDD');

  return path.join(
    service_name,
    file_created_at.year().toString(),
    _.padStart((file_created_at.month() + 1).toString(), 2, '0'),
    _.padStart(file_created_at.date().toString(), 2, '0')
  );
};


/**
 *  Identify directory hierarchy path will store uploaded file.
 *
 * @param {boolean} [shouldCreateDirs=true] If the returned path hierarchy doesn't exists, it's created
 * @returns
 */
uploadFilePathHandler.prototype.identifyAbsoluteDirPathWillSave = function(
  transformedFileName,
  shouldCreateDirs = true
) {
  var uploadDir = this.options.uploadDir || this.ROOT_UPLOAD_DIR;
  var relativeDirPathWillSave = this.identifyRelativeDirPathWillSave(
    transformedFileName
  );

  var dirPathWillSave = path.resolve(uploadDir, relativeDirPathWillSave);

  if (shouldCreateDirs) {
    if (!fs.existsSync(dirPathWillSave)) {
      fs.mkdirsSync(dirPathWillSave);
    }
  }

  return dirPathWillSave;
};

module.exports = uploadFilePathHandler;
