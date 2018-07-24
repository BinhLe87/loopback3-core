'use strict';
const util = require('util');

exports = module.exports = {};

exports.inspect = function(object_message) {

    return util.inspect(object_message, { compact: true, depth: 5, breakLength: 80 })
};