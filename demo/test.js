'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';


const HASH_RANDOM_FORMAT = '(\\w{6})';
    const FILE_NAME_FORMAT_REGEXP = RegExp(
        `^(.*)_(.*)_([a-zA-Z0-9]{1,3})_(\\d{8})_${HASH_RANDOM_FORMAT}_?([^\.]*)\\.?(\\w*)$`
    );

    //`<baseFileName>_<server_id>_<service_name>_YYYYMMDD_<random_hash_six_chars>.<file_type>`
function _extractFieldsFromFileName(transformedFileName) {
    
    var extracted_fields = FILE_NAME_FORMAT_REGEXP.exec(transformedFileName);

    return {
        base_file_name: extracted_fields[1],
        server_id: extracted_fields[2],
        service_name: extracted_fields[3],
        datetime: extracted_fields[4],
        random_hash: extracted_fields[5],
        image_dimension: extracted_fields[6],
        file_extension: extracted_fields[7]
    }

}

var result = _extractFieldsFromFileName('workbook-1_s01_api_20180928_d98a3e.jpeg');

console.log(result);

