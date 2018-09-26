'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';


function parseAndReplaceLodashStringPattern(input_string, object_replacements) {

var formatted_input_string = input_string;
    const LODASH_STRING_PATTERN = '<%=\\s*(.*?)\\s*%>';
var lodash_string_matched = input_string.match(RegExp(LODASH_STRING_PATTERN, 'gi'))

if (!_.isEmpty(lodash_string_matched)) {

    lodash_string_matched.forEach(origin_ele_pattern => {

        let origin_ele_pattern_matched = RegExp(LODASH_STRING_PATTERN).exec(origin_ele_pattern);
        
        if (!_.isEmpty(origin_ele_pattern_matched)) {

            var varible_name = origin_ele_pattern_matched[1];
            //replace matched pattern with new value
            let new_value = _.get(object_replacements, varible_name);
            if (_.isUndefined(new_value)) {
                throw new Error(`Unspecified replacement value for variable name '${varible_name}'`);
            }
            var new_ele_pattern = origin_ele_pattern.replace(varible_name, new_value);

            formatted_input_string = formatted_input_string.replace(origin_ele_pattern, new_value);
        }
    });

    return formatted_input_string;
}
}    

var input_string = 'Library number <%= %d %>';
console.log(parseAndReplaceLodashStringPattern(input_string, {
    '%d': faker.random.number({min: 1, max: 10}),
    password: 'mat khau'
}));
  



