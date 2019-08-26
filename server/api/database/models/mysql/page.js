'use strict';

const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');

module.exports = function(Page) {
  Page.beforeRemote('prototype.__create__items', async function(
    ctx,
    modelInstance
  ) {

    console.log(ctx);

    
  });


  Page.observe('after save', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;

    
    var shared_methods = instance.sharedClass.methods();

  });


};
