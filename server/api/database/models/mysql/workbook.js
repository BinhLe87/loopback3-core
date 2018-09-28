'use strict';
const app = require('../../../server');
const Promise = require('bluebird');
const WorkbookUtil = require('./workbook.util');
const loopback_util = require('../../../helpers/loopbackUtil');

module.exports = function(Workbook) {
  Workbook.observe('after save', async function(ctx) {
    var instance = ctx.instance || ctx.currentInstance;
    var created_workbook_id = instance.id;

    //trigger autoshare workbook by current logged in user
    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;

    if (userId) {
      //already logged-in

      WorkbookUtil.autoShareWorkBook(userId, created_workbook_id);
    }
  });

  //Delete this workbook from any place has relation to, may be from libary or program, etc.
  Workbook.observe('after delete', async function(ctx) {
    var deleted_workbook_id = ctx.where.id;

    //find relations in library_workbook table
    const LibraryWorkbookModel = app.models.library_workbook;
    let findLibraryWorkbookPromise = Promise.promisify(
      LibraryWorkbookModel.find
    ).bind(LibraryWorkbookModel);

    var library_workbooks = await findLibraryWorkbookPromise({
      where: { workbookId: deleted_workbook_id }
    });

    for (let library_workbook in library_workbooks) {
    }
  });

  Workbook.observe('persist', function(ctx, next) {
    var instance = ctx.currentInstance;
    var image_url = instance.image_url;
    if (typeof image_url == 'string') {
      instance.image_url = image_url.trim();
    }

    next();
  });

  /**
   * - Transform image file name to image url
   */
  Workbook.afterRemote('**', function(ctx, modelInstance, next) {
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
