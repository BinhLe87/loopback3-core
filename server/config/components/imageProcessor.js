'use strict';
const sharp = require('sharp');
const joi = require('joi');
const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const fileUtil = require('../../../utils/fileUtil');
const _ = require('lodash');


const dimensionValueTypeJoi = joi.number().required();

const dimensionValueJoi = joi.object({

    width: dimensionValueTypeJoi.label('image width'),
    height: dimensionValueTypeJoi.label('image height')
});

const deviceJoi = joi.string().valid('mobile', 'desktop').label('target device type');

const baseJoiOptions = {
    abortEarly: false,
    convert: true,
    allowUnknown: true
};


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
                    return this.createError('imagePath.extension', { v: value }, state, options);
                }

                return value;
            }
        },
        {
            name: 'isFile',
            validate(params, value, state, options) {

                if (_.endsWith(value, '/')) {

                    return this.createError('imagePath.isFile', { v: value }, state, options);
                }

                return value;
            }
        }
    ]
});

const resizeProcessJoi = joi.object({

    input_image_path: customJoi.imagePath().isFile().extension(),
    output_image_path: customJoi.imagePath().isFile().extension(),
    device_type: deviceJoi,
}).concat(dimensionValueJoi);

/**
 * This class will use converting params in following order:
 * + The params passed in constructor
 * + The default params read from ENV variables, including `IMAGE_DESKTOP_WIDTH`, `IMAGE_DESKTOP_HEIGHT`, `IMAGE_MOBILE_WIDTH`, `IMAGE_MOBILE_HEIGHT`
 *
 * @class ImageProcessor
 */
class ImageProcessor {

    constructor(options) {

        this.desktop = {};
        this.desktop.width = _.get(options, 'desktop.width');
        this.desktop.height = _.get(options, 'desktop.height');

        this.mobile = {};
        this.mobile.width = _.get(options, 'mobile.width');
        this.mobile.height = _.get(options, 'mobile.height');

        this.options = options;
    }

    getDefaultSizeByDevice(device_type) {

        var { error, value: device } = joi.validate(device_type, deviceJoi);

        if (error) throw error;

        var { width, height } = this[device];

        if (_.isUndefined(width) || _.isUndefined(height)) {

            throw new Error(`Not yet set up target default size for device ${device}`);
        }

        return { 'width': width, 'height': height };
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
     */
    resize(inputImagePath, targetDevice, outputImage) {

        var outputImagePath = this._determineOutputImageFilePath(inputImagePath, outputImage, targetDevice);

        this.resizeWithParams(inputImagePath, outputImagePath, targetDevice);
    }

    resizeWithParams(inputImagePath, outputImage, targetDevice, width, height) {

        var outputImageFilePath = this._determineOutputImageFilePath(inputImagePath, outputImage, targetDevice, width, height);

        if (_.isUndefined(width) && _.isUndefined(height)) {

            var destSize = this.getDefaultSizeByDevice(targetDevice);
            width = _.get(destSize, 'width');
            height = _.get(destSize, 'height');
        }

        var { error, value: inputResize } = resizeProcessJoi.validate({
            input_image_path: inputImagePath,
            output_image_path: outputImageFilePath,
            width: width,
            height: height,
            device_type: targetDevice
        }, baseJoiOptions);

        if (error) {
            throw error;
        }

        // //HACK:
        // var fileOutputDir = '/Users/steven_lee/Documents/CoachingCloud/Projects/cc-automated-push-content/upload/resized/';
        // var outputImage = 'resized_' + crypto.randomFillSync(Buffer.alloc(3)).toString('hex') + '.jpg';
        // fs.mkdirp(fileOutputDir);

        sharp(inputImagePath).resize().toFile(outputImageFilePath, (error, info) => {

            if (error) throw error;

            console.log(info);

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
    _determineOutputImageFilePath(inputImagePath, outputImage, device_type, width, height) {

        //determine which cases of outputImage (see above notes in function description)
        var outputFileName;
        var outputFileDir;
        if (!_.isUndefined(outputImage)) {

            let { error, value } = customJoi.imagePath().isFile().validate(outputImage);
            if (!error) { //this is a file, it can be either file path or file name

                let outputFilePathParser = path.parse(outputImage);
                outputFileDir = _.isEmpty(outputFilePathParser.dir) ? undefined : outputFilePathParser.dir;
                outputFileName = outputFilePathParser.base;
            } else {

                outputFileDir = outputImage;
            }
        }

        if (_.isUndefined(outputFileName)) { //will auto generate output file name

            outputFileName = this._generateOutputImageFileName(inputImagePath, device_type);
        }


        if (_.isUndefined(outputFileDir)) { //will store in same directory with inputImagePath

            let inputFilePathParser = path.parse(inputImagePath);
            if (_.isEmpty(_.get(inputFilePathParser, 'dir'))) {

                throw new Error('Unable to determine output directory via inputImagePath');
            }

            outputFileDir = _.get(inputFilePathParser, 'dir');
        }

        var outputImagePath = path.join(outputFileDir, outputFileName);

        return outputImagePath;
    }

    _generateOutputImageFileName(inputImagePath, device_type, width, height) {

        var { error, value } = customJoi.imagePath().isFile().validate(inputImagePath);
        if (error) throw error;

        var inputFilePathParser = path.parse(inputImagePath);

        var inputFileNameWithoutExt = inputFilePathParser.name;
        var inputFileExtension = inputFilePathParser.ext;
        var suffixSizeInFileName = this._generateSuffixFileNameWithSize(width, height, device_type);

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
        } else { //argument is device_type

            if (_.isUndefined(device_type) && !_.isUndefined(width)) {//pass 1 argument => device type
                device_type = width;
            }

            var { error, value: device } = joi.validate(device_type, deviceJoi);

            if (error) throw error;

            var { width, height } = this.getDefaultSizeByDevice(device_type);

            return [width, height].join('_');
        }
    }


}

var imageProcessor = new ImageProcessor({
    mobile: {
        width: 200,
        height: 200
    }
});
//imageProcessor.resize("/Users/steven_lee/Documents/MYDATA/Miscellaneous/Screen shot/test", 400, 400);
imageProcessor.resize("/Users/steven_lee/Documents/MYDATA/Miscellaneous/Screen shot/test_portrait.jpg", "mobile", 
"image_1008_01.jpg");
