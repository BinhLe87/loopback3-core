'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const Promise = require('bluebird');
const loopback_util = require('../../../helpers/loopbackUtil');
const URI = require('urijs');
const app = require('../../../server');
const Joi = require('joi');
const { baseJoiOptions } = require('../../../helpers/validators/joiValidator');
const { validateItemData } = require('./item.util');

//determine the path of static files
const fs = require('fs');
var static_files_dir = '';
fs.readFile(path.join(__dirname, '../../../middleware.json'), (err, data) => {
  if (!err) {
    let middlewares = JSON.parse(data);
    var static_data = _.get(middlewares, 'files.loopback#static');
    var filesInArray;

    if (Array.isArray(static_data)) {
      filesInArray = static_data;
    } else if (typeof static_data == 'object') {
      filesInArray = [static_data];
    }

    var staticUploadURL = _.filter(filesInArray, {
      name: 'upload'
    });
    static_files_dir = _.get(staticUploadURL[0], 'paths[0]', '');
  }
});

module.exports = function(Item) {
  // Item.beforeRemote('create', async function(ctx, modelInstance) {
  //   await validateItemData(ctx);
  // });

  // Item.beforeRemote('upsert', async function(ctx, modelInstance) {
  //   await uploadFileAndAddFilePathIntoCtx(ctx);
  // });

  /**
   * - Iterates through all `item_attributes` elements, adding additional `attribute` model's fields (code, label, data_type) for each element
   *
   */
  Item.observe('loaded', async function(ctx) {
    if (
      ctx.data &&
      !_.get(ctx, 'options.is_ignore_query_item_attributes', false)
    ) {
      var item_attributes = _.get(ctx.data, 'item_attributes');
      if (typeof item_attributes === 'string') {
        item_attributes = JSON.parse(item_attributes);
      }

      if (Array.isArray(item_attributes)) {
        var item_attributes_new = [];
        for (const [
          index,
          item_attribute_origin
        ] of item_attributes.entries()) {
          var attribute_id = item_attribute_origin.id;
          var AttributeModel = app.models.attribute;
          var findByIdPromise = Promise.promisify(AttributeModel.findById).bind(
            AttributeModel
          );

          var attribute_found = await findByIdPromise(attribute_id);

          var item_attribute_new = Object.assign(
            {},
            {
              id: attribute_found.id,
              code: attribute_found.code,
              label: attribute_found.label,
              data_type: attribute_found.data_type
            },
            item_attribute_origin
          );

          item_attributes_new.push(item_attribute_new);
        }

        ctx.data.item_attributes = JSON.stringify(item_attributes_new);
      }
    }
  });

  /**
   * In case of duplicating an item, fetch source item's data and fill in candidate item will be created
   *
   * @param {object} modelInstance model instance
   */
  Item.observe('before save', async function(ctx) {
    var data = ctx.instance || ctx.data;
    var ItemModel = app.models.item;
    var is_create_mode = _.isUndefined(ctx.instance) ? false : true;

    var is_duplicate_item_req =
      typeof data.duplicate_from_item_id == 'undefined' ? false : true;

    if (is_duplicate_item_req) {
      var duplicate_from_item_id = data.duplicate_from_item_id;

      var findByIdPromise = Promise.promisify(ItemModel.findById).bind(
        ItemModel
      );
      var source_item = await findByIdPromise(duplicate_from_item_id);

      if (_.isNull(source_item)) {
        throw boom.notFound(
          `Not found duplicate_from_item_id with id '${duplicate_from_item_id}'`
        );
      } else {
        //skip some fields will not be copied from
        ctx.instance = _.mergeWith(
          ctx.instance,
          source_item,
          (objValue, srcValue, key, object, source) => {
            if (!_.isUndefined(objValue)) {
              return objValue;
            }
          }
        );

        ctx.instance.id = undefined;
        ctx.instance.updatedAt = undefined;

        debug(ctx.instance);
      }
    } else if (!is_create_mode) {
      //update new item

      await validateItemData(data);
    }
  });

  //validate position was passed or specify default display position of item in a page (bottom in a page)
  Item.observe('persist', async function(ctx, modelInstance) {
    var data = ctx.instance || ctx.data;

    //check whether the insert_after_item_id exists if this param was passed and not equal 0 (will insert in top list)
    if (
      !_.isUndefined(data.insert_after_item_id) &&
      data.insert_after_item_id !== 0
    ) {
      var ItemModel = app.models.item;
      var findByIdPromise = Promise.promisify(ItemModel.findById).bind(
        ItemModel
      );

      var dest_item_id = await findByIdPromise(data.insert_after_item_id);

      if (_.isNull(dest_item_id)) {
        throw boom.notFound(
          `Not found insert_after_item_id with id '${
            data.insert_after_item_id
          }'`
        );
      }
    }
    _.set(ctx, 'options.insert_after_item_id', data.insert_after_item_id); //by default, set 'undefined' means it will be inserted at bottom of a page
  });

  /**
   * - Transform image file name to image url
   */
  Item.afterRemote('**', function(ctx, modelInstance, next) {
    var ctx_result = ctx.result;

    if (_.isEmpty(ctx_result)) return next();

    var item_array = Array.isArray(ctx_result) ? ctx_result : [ctx_result];

    for (let item_ele of item_array) {
      var item_attributes = _.get(item_ele, 'item_attributes');

      if (Array.isArray(item_attributes)) {
        for (let attribute_item of item_attributes) {
          var attribute_values = _.get(attribute_item, 'values'); //object type

          _.forOwn(attribute_values, (field_value, field_name) => {
            if (['high_url', 'medium_url', 'low_url'].includes(field_name)) {
              var transformed_file_name = field_value;
              var transformed_file_url = loopback_util.convertTransformedFileNameToFileURL(
                ctx,
                transformed_file_name
              );

              //update new image url back to ctx.result
              attribute_values[field_name] = transformed_file_url;
            }
          });
        }
      }
    }

    next();
  });
};
