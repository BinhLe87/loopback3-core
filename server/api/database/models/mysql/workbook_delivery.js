'use strict';

const debug = require('debug')('workbook_delivery.js');
const app = require('../../../server');
const mysql_db = app.dataSources.cc_mysql;
const Promise = require('bluebird');
const { performance, PerformanceObserver } = require('perf_hooks');

 //MARK: Activate the performance observer
 const obs = new PerformanceObserver(list => {
  const entries = list.getEntries();

  entries.forEach((entry) => {
    
    debug(`Time for ('${entry.name}')`, entry.duration);
  });

  performance.clearMarks();
 // obs.disconnect();
});
obs.observe({ entryTypes: ['measure'], buffered: false });

function getDeliveryContent(versionContent, state) {
 
  performance.mark('getDeliveryContent' + '-start');
  const workbooks = _.get(versionContent, 'workbooks', []);
  
  const workbook_chapter = _.chain(versionContent)
    .get('workbook_chapter', [])
    .filter(row => _.includes(_.get(state, 'chapters', []), row.chapterId))
    .value();
 

  const chapters = _.chain(versionContent)
    .get('chapters', [])
    .filter(row => _.includes(_.get(state, 'chapters', []), row.id))
    .value();

  const chapter_page = _.chain(versionContent)
    .get('chapter_page', [])
    .filter(
      row =>
        _.includes(_.get(state, 'chapters', []), row.chapterId) &&
        _.includes(_.get(state, 'pages', []), row.pageId)
    )
    .value();
    
  const pages = _.chain(versionContent)
    .get('pages', [])
    .filter(row => _.includes(_.get(state, 'pages', []), row.id))
    .value();

  const page_item = _.chain(versionContent)
    .get('page_item', [])
    .filter(
      row =>
        _.includes(_.get(state, 'pages', []), row.pageId) &&
        _.includes(_.get(state, 'items', []), row.itemId)
    )
    .value();
  const items = _.chain(versionContent)
    .get('items', [])
    .filter(row => _.includes(_.get(state, 'items', []), row.id))
    .value();

   
    performance.mark('getDeliveryContent' + '-end');
    performance.measure('getDeliveryContent', 'getDeliveryContent' + '-start', 'getDeliveryContent' + '-end')
  return _.assign({}, versionContent, {
    workbooks,
    chapters,
    pages,
    items,
    workbook_chapter,
    chapter_page,
    page_item
  });
}

module.exports = async function(WorkbookDelivery) {
  WorkbookDelivery.observe('before save', async function(ctx, next) {
    var instance = ctx.instance || ctx.currentInstance;
    instance.user_id = _.get(ctx, 'options.current_user_id');
  });

  WorkbookDelivery.observe('loaded', async function(ctx, next) {
    if (_.get(ctx, 'options.req.params.id') && _.get(ctx, 'data.version_id')) {

      performance.mark('workbook_chapter' + '-start');
    
      var version = await ctx.Model.relations.version.modelTo.findById(
        ctx.data.version_id
      );
      performance.mark('workbook_chapter' + '-end');
      performance.measure('workbook_chapter', 'workbook_chapter' + '-start', 'workbook_chapter' + '-end')
      if (version) {
        ctx.data.content = getDeliveryContent(version.content, ctx.data.state);
      }
    }
  });
};
