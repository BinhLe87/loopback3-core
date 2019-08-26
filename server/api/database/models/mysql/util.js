'use strict';

const debug = require('debug')('util.js');
const {
  uploadFileController
} = require('../../../controllers/upload/uploadFile');
const validation_utils = require('../../../helpers/validators/joiValidator');

const { create_channel, send_message } = require('@cc_server/utils').rabbitmq;
const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
const app = require('../../../server');
const mysql_db = app.dataSources.cc_mysql;
const Promise = require('bluebird');

module.exports = async function(Util) {
  Util.upload = async function(ctx, options, cb) {
    var result = await uploadFileController(ctx);

    return result;
  };
};
