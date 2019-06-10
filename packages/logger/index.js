'use strict';

const path = require('path');

const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
  });

module.exports = exports = {};

exports.logger = require('./lib/logger').logger;
