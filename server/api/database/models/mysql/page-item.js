'use strict';
var Promise = require('bluebird');
var app = require('../../../server');
var {
  moveItemPosition
} = require('../../../controllers/workbook/moveItemPositionController');

module.exports = function(Pageitem) {
  Pageitem.validatesPresenceOf('pageId', 'itemId');
  Pageitem.validatesNumericalityOf('display_index', {
    int: true
  });

  Pageitem.observe('before save', async function(ctx, next) {
    var is_create_mode = _.isUndefined(ctx.instance) ? false : true;

    if (is_create_mode) {
      //just loopup and update new position in case of creating new an instance

      var instance = ctx.instance || ctx.currentInstance;
      var new_position;

      var is_pagetitle_itemtype = await isPageTitleItemType(instance);

      if (is_pagetitle_itemtype === true) {
        new_position = -1; //make sure the page item always on top
      } else {
        //if param 'insert_after_item_id' is passed, insert new item right below `insert_after_item_id` in page
        //otherwise, by default, it will insert in last position in page if insert_after_item_id = undefined
        var insert_after_item_id = _.get(
          ctx,
          'options.req.body.insert_after_item_id'
        );
        //create url_params argument to call function in api 'moving position of item within a page'
        var url_params = {
          scope_model: 'pages',
          scope_model_id: instance.pageId,
          from_model: 'items',
          from_model_id: instance.itemId,
          to_model_id: insert_after_item_id,
          action: 'move'
        };

        var { new_position_index } = await moveItemPosition(url_params, {
          is_create_activity: true
        });
        new_position = new_position_index;
      }

      //update back display_index
      instance.display_index = new_position;
    }
  });

  async function isPageTitleItemType(instance) {
    var item_id = instance.itemId;

    if (item_id) {
      var itemModel = app.models.item;
      var item_instance = await itemModel.findOne({
        where: { id: item_id },
        include: { relation: 'itemtype' }
      });

      var item_instance_json = item_instance && item_instance.toJSON();
      var item_type = _.get(item_instance_json, 'itemtype');
      var item_type_code =
        _.isPlainObject(item_type) && _.get(item_type, 'code');
      if (/page_title/i.test(item_type_code)) {
        return true;
      }
    }

    return false;
  }
};
