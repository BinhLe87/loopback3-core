'use strict';

const debug = require('debug')('util.js');
const {
  uploadFileController
} = require('../../../controllers/upload/uploadFile');

module.exports = async function(Util) {
  Util.upload = async function(ctx, options, cb) {
    var result = await uploadFileController(ctx);

    return result;
  };
};
