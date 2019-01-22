'use strict';

const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
var { uploadFileAndAddFilePathIntoCtx } = require('./item.util');

module.exports = function(Page) {
  Page.beforeRemote('prototype.__create__items', async function(
    ctx,
    modelInstance
  ) {
    await uploadFileAndAddFilePathIntoCtx(ctx);
  });
};
