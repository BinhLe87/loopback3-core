'use strict';
const app = require('../../../server');
const Promise = require('bluebird');

module.exports = exports = {};

/**
 *
 *
 * @param {*} workbookId
 * @returns {workbook|null} return a found workbook, otherwise return null.
 */
async function getWorkbookById(workbookId) {
  const WorkBookModel = app.models.workbook;

  const findWorkBookByIdPromise = Promise.promisify(
    WorkBookModel.findById
  ).bind(WorkBookModel);
  var found_workbok = await findWorkBookByIdPromise(workbookId);

  return found_workbok;
}

exports.getWorkbookById = getWorkbookById;
