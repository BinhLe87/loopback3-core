'use strict';

const _ = require('lodash');

exports = module.exports = {};

exports.parseRecordFields = function parseRecordFields(fields) {

    let record = {};
    _.forOwn(fields, function (field_faker_type, field_name) {

        if (typeof field_faker_type == 'function') {
            //invoke directly without arguments
            record[field_name] = field_faker_type();
        } else if (typeof field_faker_type == 'object') {
            //invoke with arguments
            if (typeof field_faker_type != 'object' ||
                !field_faker_type.func ||
                !field_faker_type.args) {

                throw new Error(`Wrong format of field '${field_name}'.
                    Must be an object type and has 2 properties are 'func' and 'args'`)
            }

            record[field_name] = field_faker_type.func(field_faker_type.args);
        } else { //primitive type (string, number, etc.)
            record[field_name] = field_faker_type;
        }
    })

    return record;
};