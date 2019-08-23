'use strict';

const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');

module.exports = function(Page) {
  Page.beforeRemote('prototype.__create__items', async function(
    ctx,
    modelInstance
  ) {});

  
};
