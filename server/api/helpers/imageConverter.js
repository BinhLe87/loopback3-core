'use strict';
const sharp = require('sharp');
const joi = require('joi');
const path = require('path');
const _ = require('lodash');
const image_size = require('image-size');

const displayModeJoi = joi
  .any()
  .allow('fitting', 'filling', 'strict')
  .default('strict');

const dimensionValueTypeJoi = joi.number().required();

const dimensionValueJoi = joi.object().keys({
  width: dimensionValueTypeJoi.label('image width'),
  height: dimensionValueTypeJoi.label('image height'),
  display_mode: displayModeJoi
});

const deviceJoi = joi
  .string()
  .valid('mobile', 'desktop')
  .label('target device type');

const { baseJoiOptions } = require('../helpers/validators/joiValidator');

var customJoi = joi.extend({
  name: 'imagePath',
  base: joi.string().required(),
  language: {
    extension: 'unknown image extension',
    isFile: 'the path is not a file'
  },
  rules: [
    {
      name: 'extension',
      validate(params, value, state, options) {
        var filePathParser = path.parse(value);

        if (_.isEmpty(filePathParser.ext)) {
          return this.createError(
            'imagePath.extension',
            { v: value },
            state,
            options
          );
        }

        return value;
      }
    },
    {
      name: 'isFile',
      validate(params, value, state, options) {
        if (_.endsWith(value, '/')) {
          return this.createError(
            'imagePath.isFile',
            { v: value },
            state,
            options
          );
        }

        return value;
      }
    }
  ]
});

const resizeProcessJoi = joi
  .object({
    input_image_path: customJoi
      .imagePath()
      .isFile()
      .extension(),
    output_image_path: customJoi
      .imagePath()
      .isFile()
      .extension(),
    device_type: deviceJoi
  })
  .concat(dimensionValueJoi);

const constructorValidatorJoi = joi
  .object()
  .keys({
    mobile: dimensionValueJoi.and('width', 'height'),
    desktop: dimensionValueJoi.and('width', 'height'),
    display_mode: displayModeJoi
  })
  .and('mobile', 'desktop');

/**
 * This class will use converting params in following order:
 * + The params passed in constructor
 * + The default params read from ENV variables, including `IMAGE_DESKTOP_WIDTH`, `IMAGE_DESKTOP_HEIGHT`, `IMAGE_MOBILE_WIDTH`, `IMAGE_MOBILE_HEIGHT`
 *
 * @class ImageProcessor
 */
class ImageConverter {
  constructor(options) {
    let { error, value } = constructorValidatorJoi.validate(
      options,
      baseJoiOptions
    );

    if (error) throw error;

    this.desktop = {};
    this.desktop.width = _.get(options, 'desktop.width');
    this.desktop.height = _.get(options, 'desktop.height');

    this.mobile = {};
    this.mobile.width = _.get(options, 'mobile.width');
    this.mobile.height = _.get(options, 'mobile.height');

    this.display_mode = value.display_mode;

    this.options = options;
  }

  getDefaultSizeByDevice(device_type) {
    var { error, value: device } = joi.validate(device_type, deviceJoi);

    if (error) throw error;

    var { width, height } = this[device];

    if (_.isUndefined(width) || _.isUndefined(height)) {
      throw new Error(
        `Not yet set up target default size for device ${device}`
      );
    }

    return { width: width, height: height };
  }

  /**
   *
   *
   * @param {*} inputImagePath the path of input image
   * @param {mobile|desktop} targetDevice
   * @param {string} [outputImage] can be one of 4 following cases:
   *          + image file path
   *          + image file name: it will be stored in the same directory with input image path.
   *          + image file directory: the file name will be generated from inputImagePath
   *          + undefined: the file name will be generated from inputImagePath and then stored in the same directory
   * @memberof ImageProcessor
   * @returns {Promise} return a Promise
   */
  resizeAsync(inputImagePath, targetDevice) {
    return this.resizeWithParamsAsync(inputImagePath, targetDevice);
  }
  /**
   *
   *
   * @param {*} inputImagePath
   * @param {*} targetDevice
   * @param {*} [outputImage]
   * @param {*} [width]
   * @param {*} [height]
   * @memberof ImageConverter
   * @returns {Promise} returns a Promise
   */
  resizeWithParamsAsync(
    inputImagePath,
    targetDevice,
    outputImage,
    width,
    height
  ) {
    return new Promise((resolve, reject) => {
      if (_.isUndefined(width) && _.isUndefined(height)) {
        var destSize = this.getDefaultSizeByDevice(targetDevice);
        width = _.get(destSize, 'width');
        height = _.get(destSize, 'height');
      }

      var source_size = image_size(inputImagePath);
      //if image is portrait, switch the target size into portrait mode as well
      if (source_size.width > source_size.height) {
        let orgin_width = width;
        width = Math.max(orgin_width, height);
        height = Math.min(orgin_width, height);
      }

      //convert size to target display mode, default is 'strict' mode
      if (this.display_mode == 'fitting') {
        let dest_size = this._convertSizeToFittingMode(
          source_size.width,
          source_size.height,
          width,
          height
        );

        width = dest_size.width;
        height = dest_size.height;
      }

      //in case not 'strict' mode, if the image would be stretched in any direction
      //=> should preserve as original size
      if (
        this.display_mode != 'strict' &&
        (width > source_size.width || height > source_size.height)
      ) {
        width = source_size.width;
        height = source_size.height;
      }

      var outputImageFilePath = this._determineOutputImageFilePath(
        inputImagePath,
        outputImage,
        targetDevice,
        width,
        height
      );

      var { error, value: inputResize } = resizeProcessJoi.validate(
        {
          input_image_path: inputImagePath,
          output_image_path: outputImageFilePath,
          width: width,
          height: height,
          device_type: targetDevice
        },
        baseJoiOptions
      );

      if (error) {
        reject(error);
      }

      sharp(inputImagePath)
        .resize(_.toInteger(width), _.toInteger(height))
        .toFile(outputImageFilePath, (error, info) => {
          if (error) reject(error);

          resolve({
            origin_file_path: inputImagePath,
            resized_file_path: outputImageFilePath,
            target_device: targetDevice
          });
        });
    });
  }
  /**
   *
   *
   * @param {*} inputImagePath
   * @param {string} [outputImage] can be one of 4 following cases:
   *          + image file path
   *          + image file name: it will be stored in the same directory with input image path
   *          + image file directory: the file name will be generated from inputImagePath
   *          + undefined: the file name will be generated from inputImagePath and then stored in the same directory
   * @param {*} device_type
   * @param {*} width
   * @param {*} height
   * @returns
   * @memberof ImageProcessor
   */
  _determineOutputImageFilePath(
    inputImagePath,
    outputImage,
    device_type,
    width,
    height
  ) {
    //determine which cases of outputImage (see above notes in function description)
    var outputFileName;
    var outputFileDir;
    if (!_.isUndefined(outputImage)) {
      let { error, value } = customJoi
        .imagePath()
        .isFile()
        .validate(outputImage);
      if (!error) {
        //this is a file, it can be either file path or file name

        let outputFilePathParser = path.parse(outputImage);
        outputFileDir = _.isEmpty(outputFilePathParser.dir)
          ? undefined
          : outputFilePathParser.dir;
        outputFileName = outputFilePathParser.base;
      } else {
        outputFileDir = outputImage;
      }
    }

    if (_.isUndefined(outputFileName)) {
      //will auto generate output file name

      outputFileName = this._generateOutputImageFileName(
        inputImagePath,
        device_type,
        width,
        height
      );
    }

    if (_.isUndefined(outputFileDir)) {
      //will store in same directory with inputImagePath

      let inputFilePathParser = path.parse(inputImagePath);
      if (_.isEmpty(_.get(inputFilePathParser, 'dir'))) {
        throw new Error(
          'Unable to determine output directory via inputImagePath'
        );
      }

      outputFileDir = _.get(inputFilePathParser, 'dir');
    }

    var outputImagePath = path.join(outputFileDir, outputFileName);

    return outputImagePath;
  }

  _generateOutputImageFileName(inputImagePath, device_type, width, height) {
    var { error, value } = customJoi
      .imagePath()
      .isFile()
      .validate(inputImagePath);
    if (error) throw error;

    var inputFilePathParser = path.parse(inputImagePath);

    var inputFileNameWithoutExt = inputFilePathParser.name;
    var inputFileExtension = inputFilePathParser.ext;
    var suffixSizeInFileName = this._generateSuffixFileNameWithSize(
      width,
      height,
      device_type
    );

    var outputFileName = `${inputFileNameWithoutExt}_${suffixSizeInFileName}${inputFileExtension}`;
    return outputFileName;
  }

  /**
   * This method accept following format of input arguments:
   * + width, height
   * + width, height, device_type  => (width, height) always take precedence if they all have valid value
   * + other cases: treated as device type
   * @param {*} device_type
   * @param {*} width
   * @param {*} height
   * @returns
   * @memberof ImageProcessor
   */
  _generateSuffixFileNameWithSize(width, height, device_type) {
    if (!_.isUndefined(width) && !_.isUndefined(height)) {
      return [width, height].join('_');
    } else {
      //argument is device_type

      if (_.isUndefined(device_type) && !_.isUndefined(width)) {
        //pass 1 argument => device type
        device_type = width;
      }

      var { error, value: device } = joi.validate(device_type, deviceJoi);

      if (error) throw error;

      var default_size = this.getDefaultSizeByDevice(device_type);
      width = default_size.width;
      height = default_size.height;

      return [width, height].join('_');
    }
  }

  _convertSizeToFittingMode(
    source_width,
    source_height,
    dest_width,
    dest_height
  ) {
    var scaleW = dest_width / source_width;
    var scaleH = dest_height / source_height;

    var scale_min = Math.min(scaleW, scaleH);

    var fittingW = _.toInteger(source_width * scale_min);
    var fittingH = _.toInteger(source_height * scale_min);

    return {
      width: fittingW,
      height: fittingH
    };
  }
}

module.exports = exports = {};
exports.ImageConverter = ImageConverter;
