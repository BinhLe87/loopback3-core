'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const AttributeUtil = require('./attribute.util');
const uploadItem = require('../../../controllers/item/uploadItem');

module.exports = function(Item) {

  Item.beforeRemote('create', function (ctx, modelInstance, next) {
    //...
    var req_header_content_type = ctx.req.headers['content-type'];

    if (req_header_content_type.includes('multipart/form-data')) {

      uploadItem(ctx, next);
    } else {

      next();
    }
    
    



  });

  Item.observe('before save', function(ctx, next) {
    var data = ctx.instance || ctx.data;
    if (
      typeof data.item_typeId == 'undefined' ||
      typeof data.item_attributes == 'undefined'
    ) {
      return next(
        new Error(
          `Must input 2 required fields are 'item_typeId' and 'item_attributes'`
        )
      );
    }

    AttributeUtil.validateAttributesByItemtypeId(
      data.item_attributes,
      data.item_typeId
    )
      .then(function(result) {
        //all attributes are valid
        next();
      })
      .catch(function(err) {
        next(err);
      });
  });
};
