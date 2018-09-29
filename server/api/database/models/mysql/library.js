'use strict';
const loopback_util = require('../../../helpers/loopbackUtil');

module.exports = function(Library) {
  /**
   * - Transform image file name to image url
   */
  Library.afterRemote('*.__get__workbooks', function(ctx, modelInstance, next) {
    var ctx_result = ctx.result;

    if (_.isEmpty(ctx_result)) return next();

    var item_array = Array.isArray(ctx_result) ? ctx_result : [ctx_result];

    for (let item_ele of item_array) {
      var image_url = _.get(item_ele, 'image_url');

      if (image_url) {
        var transformed_file_name = image_url;
        var transformed_file_url = loopback_util.convertTransformedFileNameToFileURL(
          ctx,
          transformed_file_name
        );

        //update new image url back to ctx.result
        item_ele.image_url = transformed_file_url;
      }
    }

    next();
  });
};
