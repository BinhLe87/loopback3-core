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
const Promise = require('bluebird');

const HASH_RANDOM_FORMAT = '(\\w{6})';
const FILE_NAME_FORMAT_REGEXP = RegExp(`^(.*)_([a-zA-Z0-9]{1,3})-(\\d{8})-${HASH_RANDOM_FORMAT}\\.(\\w+)$`);

function filePathHanlder() {

    EventEmitter.call(this);
}

utils.inherits(filePathHanlder, EventEmitter);

function _isValidFileNameFormat(file_name) {

    return FILE_NAME_FORMAT_REGEXP.test(file_name);
}

function _extractFieldsFromFileName(file_name, cb) {

    if (!_isValidFileNameFormat(file_name)) {

        throw new Error(`File name '${file_name}' has invalid format`);
    }

    var ext_fields = [];

    file_name.replace(FILE_NAME_FORMAT_REGEXP, function (match, ...fields) {

        ext_fields = fields.splice(0, fields.length - 2); //remove the 2 last elements are found offset and origin string
    });

    return ext_fields;
}

async function _generateRandomHashWithSixChars() {

    var randomBytesPromise = Promise.promisify(crypto.randomBytes).bind(crypto);

    function __isValidHash(hash) {

        return RegExp(`${HASH_RANDOM_FORMAT}`).test(hashSixChars);
    }

    //Note: in javascript, each string character is 16-bit length => be 3 bytes for 6 characters
    var runIndex = 0;
    var hashSixChars;
    do {
        let buf = await randomBytesPromise(3);
        hashSixChars = buf.toString('hex');
        runIndex++;
    } while (runIndex < 10 && !__isValidHash(hashSixChars))

    if (!__isValidHash(hashSixChars)) {

        throw new Error(`${path.basename(__filename)}: Can not generate random 6 characters at the moment. Please try again later`);
    }

    return hashSixChars;
}

async function _transformFileNameToSave(file_name) {

    var service_name = process.env.SERVICE_NAME;

    if (!service_name) {

        throw new Error(`${path.basename(__filename)} function _generateFileName() requires Node env SERVICE_NAME`);
    }

    var baseFileName = /[.]/.exec(file_name) ? /^[^.]+/.exec(file_name)[0] : file_name;
    var fileExt = FileUtil.getFileExtension(file_name);
    var slugifiedBaseFileName = slugify(baseFileName);

    var now = moment(); //current locale time
    var dateString = now.format('YYYYMMDD');
    //Note: in javascript, each string character is 16-bit length
    var sixchars_hash = await _generateRandomHashWithSixChars();


    let dirStructureOfFile = [service_name, dateString, sixchars_hash].join('-');
    let fileExtWithPoint = _.isEmpty(fileExt) ? fileExt : `.${fileExt}`;
    let fileNameToSave = [`${slugifiedBaseFileName}_`, dirStructureOfFile, fileExtWithPoint].join('');

    //Re-check the code to ensure it run properly if you're on development stage
    if (process.env.NODE_ENV == 'development') {

        if (!_isValidFileNameFormat(fileNameToSave)) {
            throw new Error(`${path.basename(__filename)}: func _transformFileNameToSave() generate incorrect file name format. 
                Check your code again: generated filename is ${fileNameToSave}`);
        }
    }

    return fileNameToSave;

}

filePathHanlder.prototype.saveFile = async function (file_name) {

    try {

        var [file_title, service_id, date, hash, file_type] = _extractFieldsFromFileName(file_name);
        




    } catch (e) {


    }
}

//HACK:
var file_name = 'master_yoga!!in 30@@days.txt';
_transformFileNameToSave(file_name).then(function(result) {
    
    console.log(result);
});





