'use strict';

const path = require('path');
const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
  });


var utils = {};
module.exports = exports = utils;


utils.rabbitmq = require('./lib/rabbitmq');


