'use strict';
var Promise = require('bluebird');
var app = require('../../../server');

module.exports = function(Pageitem) {
  Pageitem.validatesPresenceOf('pageId', 'itemId');

  Pageitem.observe('before save', function(ctx, next) {
    var instance = ctx.instance || ctx.currentInstance;

    instance.isValid(async function(valid) {
      if (valid) {
        let page_id = instance.pageId;
        let item_id = instance.itemId;
        let new_display_order_id = _.get(instance, 'display_order_id', 0);

        try {
          await ensureUniqueDisplayOrderIdInPage(
            page_id,
            item_id,
            new_display_order_id
          );
          next();
        } catch (unique_error) {
          next(unique_error);
        }
      } else {
        next();
      }
    });
  });
};

async function ensureUniqueDisplayOrderIdInPage(
  page_id,
  item_id,
  new_display_order_id
) {
  var PageItemModel = app.models.page_item;

  var findDisplayOrderIdPromise = Promise.promisify(PageItemModel.find).bind(
    PageItemModel
  );
  var found_record = await findDisplayOrderIdPromise({
    where: {
      display_order_id: new_display_order_id,
      pageId: page_id,
      itemId: item_id
    }
  });

  if (!_.isEmpty(found_record))
    throw new Error(
      `This display order id '${new_display_order_id}' already exists. Please specify other value`
    );

  return true;
}