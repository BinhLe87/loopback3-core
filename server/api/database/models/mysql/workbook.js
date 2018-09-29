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
};
