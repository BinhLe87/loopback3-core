'use strict';
const app = require('../../../server');
const Promise = require('bluebird');

module.exports = function(Workbook) {
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
};
