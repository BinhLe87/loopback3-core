'use strict';
var {
  moveItemPosition
} = require('../../../controllers/moveItemPositionController');

module.exports = function(Workbookchapter) {
  Workbookchapter.observe('before save', async function(ctx, next) {
    var is_create_mode = _.isUndefined(ctx.instance) ? false : true;

    if (is_create_mode) {
      //just loopup and update new position in case of creating new an instance

      var instance = ctx.instance || ctx.currentInstance;

      //if param 'insert_after_item_id' is passed, insert new item right below `insert_after_item_id` in page
      //otherwise, by default, it will insert in last position in page if insert_after_item_id = undefined
      var insert_after_item_id = _.get(ctx, 'options.insert_after_item_id');
      //create url_params argument to call function in api 'moving position of item within a page'
      var url_params = {
        scope_model: 'workbooks',
        scope_model_id: instance.workbookId,
        from_model: 'chapters',
        from_model_id: instance.chapterId,
        to_model_id: insert_after_item_id,
        action: 'move'
      };

      var { new_position_index: new_position } = await moveItemPosition(
        url_params,
        {
          is_processing_create_page_item: true
        }
      );

      //update back display_index
      instance.display_index = new_position;
    }
  });
};
