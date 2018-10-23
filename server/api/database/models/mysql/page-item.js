'use strict';
var Promise = require('bluebird');
var app = require('../../../server');
var {
  moveItemPosition
} = require('../../../controllers/moveItemPositionController');

module.exports = function(Pageitem) {
  Pageitem.validatesPresenceOf('pageId', 'itemId');

  Pageitem.observe('before save', async function(ctx, next) {
    var instance = ctx.instance || ctx.currentInstance;

    //if param 'insert_after_item_id' is passed, insert new item right below `insert_after_item_id` in page
    //otherwise, by default, it will insert in last position in page if insert_after_item_id = undefined
    var insert_after_item_id = _.get(ctx, 'options.insert_after_item_id');
    //create url_params argument to call function in api 'moving position of item within a page'
    var url_params = {
      scope_model: 'pages',
      scope_model_id: instance.pageId,
      from_model: 'items',
      from_model_id: instance.itemId,
      to_model_id: insert_after_item_id,
      action: 'move'
    };

    var { new_position_index: new_position } = await moveItemPosition(
      url_params,
      {
        skip_update_from_model_position: true
      }
    );

    //update back display_index
    instance.display_index = new_position;
  });
};
