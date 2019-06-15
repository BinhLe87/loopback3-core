'use strict';

const debug = require('debug')('util.js');
const app = require('../../../server');
const mysql_db = app.dataSources.cc_mysql;
const Promise = require('bluebird');

function getDeliveryContent(versionContent, state) {
  const workbooks = _.get(versionContent, 'workbooks', []);
  const workbook_chapter = _.chain(versionContent)
    .get('workbook_chapter', [])
    .filter(row => _.includes(
      _.get(state, 'chapters', []), row.chapterId
    ))
    .value()
  const chapters = _.chain(versionContent)
    .get('chapters', [])
    .filter(row => _.includes(
      _.get(state, 'chapters', []), row.id
    ))
    .value()

  const chapter_page = _.chain(versionContent)
    .get('chapter_page', [])
    .filter(row => _.includes(
      _.get(state, 'chapters', []), row.chapterId
    ) && _.includes(
      _.get(state, 'pages', []), row.pageId
    ))
    .value()
  const pages = _.chain(versionContent)
    .get('pages', [])
    .filter(row => _.includes(
      _.get(state, 'pages', []), row.id
    ))
    .value()

  const page_item = _.chain(versionContent)
    .get('page_item', [])
    .filter(row => _.includes(
      _.get(state, 'pages', []), row.pageId
    ) && _.includes(
      _.get(state, 'items', []), row.itemId
    ))
    .value()
  const items = _.chain(versionContent)
    .get('items', [])
    .filter(row => _.includes(
      _.get(state, 'items', []), row.id
    ))
    .value()

  return _.assign({}, versionContent, {
    workbooks, chapters, pages, items,
    workbook_chapter, chapter_page, page_item,
  })
}

module.exports = async function(WorkbookDelivery) {
  WorkbookDelivery.observe('before save', async function(ctx, next) {
    var instance = ctx.instance || ctx.currentInstance;
    instance.user_id = _.get(ctx, 'options.current_user_id');
  });

  WorkbookDelivery.observe('loaded', async function(ctx, next) {
    if (_.get(ctx, 'options.req.params.id') && _.get(ctx, 'data.version_id')) {
      var version = await ctx.Model.relations.version.modelTo.findById(ctx.data.version_id);

      if (version) {
        ctx.data.content = getDeliveryContent(version.content, ctx.data.state);
      }
    }
  });
};
