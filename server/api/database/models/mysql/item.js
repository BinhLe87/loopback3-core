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
  /**
   * - Iterates through all `item_attributes` elements (the other of invoking matters)
   * 1. adding default style attributes upon item type
   * 2. adding additional `attribute` model's fields (code, label, data_type) for each element
   * 3. tranform image file name to image url
   *
   */
  Item.observe('loaded', async function(ctx) {
    var ctx_req = _.get(ctx, 'options.req');

    //1. adding default style attributes upon item type
    if (ctx.data) {
      var item_type_id = _.get(ctx.data, 'item_typeId');
      let item_attributes = _.get(ctx.data, 'item_attributes');
      let default_style_attributes = [];

      if (typeof item_attributes === 'string') {
        item_attributes = JSON.parse(item_attributes);
      }

      if (item_type_id && Array.isArray(item_attributes)) {
        var ItemAttributeTemplateModel = app.models.item_attribute_template;
        var findItemAttributeTemplatePromise = Promise.promisify(
          ItemAttributeTemplateModel.find
        ).bind(ItemAttributeTemplateModel);

        let active_item_attributes = await findItemAttributeTemplatePromise({
          where: { is_active: 1, item_typeId: item_type_id },
          include: {
            relation: 'attribute',
            scope: {
              where: { is_active: 1 }
            }
          }
        });

        for (let active_item_attribute of active_item_attributes) {
          let attribute = _.get(active_item_attribute, '__data.attribute');

          if (attribute) {
            const StyleAttributeRegx = /style_.*/gi; //style attribute always has prefix is 'style_' in its code
            var attr_id = _.get(attribute, 'id');
            var attr_code = _.get(attribute, 'code');
            var attr_default_value = _.get(attribute, 'op_default');

            if (StyleAttributeRegx.test(attr_code)) {
              //this is style attribute

              default_style_attributes.push({
                id: attr_id,
                code: attr_code,
                label: attribute.label,
                data_type: attribute.data_type,
                value: attr_default_value
              });
            }
          }
        }
      }

      var item_attributes_has_default_style_attributes =  _.chain(_.unionWith(
        item_attributes,
        default_style_attributes,
        (default_arr, item_arr) => {
          return default_arr.id === item_arr.id;
        }
      )).map(value => {
        //current user input value always take precedences over default value
          return _.assign(_.find(default_style_attributes, {id: value.id}), value);
      }).value();

      ctx.data.item_attributes = JSON.stringify(
        item_attributes_has_default_style_attributes
      );
    }

    // 2. adding additional `attribute` model's fields (code, label, data_type) for each element
    if (
      ctx.data &&
      !_.get(ctx, 'options.is_ignore_query_item_attributes', false)
    ) {
      let item_attributes = _.get(ctx.data, 'item_attributes');
      if (typeof item_attributes === 'string') {
        item_attributes = JSON.parse(item_attributes);
      }

      if (Array.isArray(item_attributes)) {
        let item_attribute_ids = _.map(
          item_attributes,
          item_attribute => item_attribute.id
        );

        var item_attributes_new = [];
        var AttributeModel = app.models.attribute;
        var findbyIdArrayAttributePromise = Promise.promisify(
          AttributeModel.find
        ).bind(AttributeModel);

        var found_attributes_db = await findbyIdArrayAttributePromise({
          where: { id: { inq: item_attribute_ids } }
        });

        for (const [
          index,
          item_attribute_origin
        ] of item_attributes.entries()) {
          var attribute_id = item_attribute_origin.id;

          var found_attribute_db = {};
          found_attribute_db = _.find(found_attributes_db, {
            id: attribute_id
          });

          var item_attribute_new = Object.assign(
            {},
            {
              code: _.get(found_attribute_db, 'code'),
              label: _.get(found_attribute_db, 'label'),
              data_type: _.get(found_attribute_db, 'data_type')
            },
            item_attribute_origin //maintain 'value' that user input
          );

          item_attributes_new.push(item_attribute_new);
        }

        ctx.data.item_attributes = JSON.stringify(item_attributes_new);
      }
    }

    //3. transform image file name to image url
    if (ctx.data && ctx_req) {
      let item_attributes = _.get(ctx.data, 'item_attributes');
      if (typeof item_attributes === 'string') {
        item_attributes = JSON.parse(item_attributes);
      }

      if (Array.isArray(item_attributes)) {
        var item_attributes_tranformed = [];

        for (let attribute_item of item_attributes) {
          //object type

          _.forOwn(attribute_item, (field_value, field_name) => {
            //update new image url back to ctx.result
            attribute_item[field_name] = _transformImageFileNameToImageURL(
              ctx_req,
              field_name,
              field_value
            );
          });

          item_attributes_tranformed.push(attribute_item);
        }

        ctx.data.item_attributes = JSON.stringify(item_attributes_tranformed);
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
            //update new image url back to ctx.result
            attribute_values[field_name] = _transformImageFileNameToImageURL(
              ctx.req,
              field_name,
              field_value
            );
          });
        }
      }
    }

    next();
  });
};
/**
 * transform image file name to image url if filed name is one of ['high_url', 'medium_url', 'low_url']
 * or field value has file extension is image type
 * @param {object} req http request
 * @param {string} field_name field name
 * @param {string} field_value may contain image file name
 * @returns {string} would be transformed to image url if needed
 */
function _transformImageFileNameToImageURL(req, field_name, field_value) {
  if (
    ['high_url', 'medium_url', 'low_url'].includes(field_name) ||
    (loopback_util.isImageFileExt(field_value))
  ) {
    var transformed_file_name = field_value;
    var transformed_file_url = loopback_util.convertTransformedFileNameToFileURL(
      req,
      transformed_file_name
    );

    return transformed_file_url;
  }

  return field_value;
}
