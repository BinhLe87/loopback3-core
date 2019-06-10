'use strict';

const path = require('path');
const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
  });


var utils = {};
module.exports = exports = utils;


utils.rabbitmq = require('./lib/rabbitmq');
utils.validators = require('./lib/validators/joiValidator');
utils.redis = require('./lib/redis');
utils.

