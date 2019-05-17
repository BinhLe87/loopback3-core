'use strict';
var Promise = require('bluebird');
var uuid = require('uuid');
const app = require('../../../server');
var {
  moveItemPosition
} = require('../../../controllers/moveItemPositionController');

function formatResourceData(value, type, included) {
  if (value.id) {
    var notIncluded = _.concat(['id'], included);
    var attributes = value.toJSON ? value.toJSON() : value;
    attributes = _.omit(attributes, notIncluded);

    return {
      id: value.id,
      type: type,
      attributes: attributes,
      included: _.chain(included)
        .map(relation => [
          relation,
          formatResourceData(value[relation], relation, [])
        ])
        .fromPairs()
        .value()
    };
  } else if (value.count) {
    return {
      type: type,
      data: _.chain(value)
        .map(item => formatResourceData(item, type, []))
        .filter()
        .value()
    };
  }
}

var uuidMapping = {};

function generateUuidMapping(id) {
  var newUuid = uuid.v4();
  uuidMapping[id] = newUuid;

  return newUuid;
}

function retrieveUuidMapping(id) {
  return uuidMapping[id];
}

module.exports = function(WorkbookVersion) {
  WorkbookVersion.observe('before save', async function(ctx) {
    var app = ctx.Model.app;
    var is_create_mode = _.isUndefined(ctx.instance) ? false : true;

    if (is_create_mode) {
      //just loopup and update new position in case of creating new an instance

      var instance = ctx.instance || ctx.currentInstance;

      var Workbook = app.models.workbook;

      var workbooks = await Promise.promisify(Workbook.find).call(Workbook, {
        where: { id: instance.workbookId }
      });

      var WorkbookChapter = app.models.workbook_chapter;
      var workbook_chapter = await Promise.promisify(WorkbookChapter.find).call(
        WorkbookChapter,
        {
          where: {
            workbookId: {
              inq: _.map(workbooks, _.property('id'))
            }
          }
        }
      );

      var Chapter = app.models.chapter;
      var chapters = await Promise.promisify(Chapter.find).call(Chapter, {
        where: {
          id: {
            inq: _.map(workbook_chapter, _.property('chapterId'))
          }
        }
      });

      var ChapterPage = app.models.chapter_page;
      var chapter_page = await Promise.promisify(ChapterPage.find).call(
        ChapterPage,
        {
          where: {
            chapterId: {
              inq: _.map(chapters, _.property('id'))
            }
          }
        }
      );

      var Page = app.models.page;
      var pages = await Promise.promisify(Page.find).call(Page, {
        where: {
          id: {
            inq: _.map(chapter_page, _.property('pageId'))
          }
        }
      });

      var PageItem = app.models.page_item;
      var page_item = await Promise.promisify(PageItem.find).call(PageItem, {
        where: {
          pageId: {
            inq: _.map(pages, _.property('id'))
          }
        }
      });

      var Item = app.models.item;
      var items = await Promise.promisify(Item.find).call(Item, {
        where: {
          id: {
            inq: _.map(page_item, _.property('itemId'))
          }
        }
      });

      var ItemType = app.models.item_type;
      var item_types = await Promise.promisify(ItemType.find).call(ItemType, {
        where: {
          id: {
            inq: _.map(items, _.property('item_typeId'))
          }
        },
        include: {
          relation: 'attributes'
        }
      });

      var content = {
        workbooks: _.chain(workbooks)
          .map(wb =>
            _.assign(wb.toJSON(), {
              id: generateUuidMapping(`workbook-${wb.id}`)
            })
          )
          .values()
          .value(),
        chapters: _.chain(chapters)
          .map(ch =>
            _.assign(ch.toJSON(), {
              id: generateUuidMapping(`chapter-${ch.id}`)
            })
          )
          .values()
          .value(),
        pages: _.chain(pages)
          .map(pg =>
            _.assign(pg.toJSON(), { id: generateUuidMapping(`page-${pg.id}`) })
          )
          .values()
          .value(),
        items: _.chain(items)
          .map(it =>
            _.assign(it.toJSON(), {
              id: generateUuidMapping(`item-${it.id}`),
              // item_typeId: generateUuidMapping(`item_type-${it.item_typeId}`),
              item_attributes: _.chain(it.item_attributes)
                .filter('id')
                .map(at =>
                  _.assign(at, {
                    id: generateUuidMapping(`attribute-${at.id}`)
                  })
                )
                .values()
                .value()
            })
          )
          .values()
          .value(),
        item_types: _.chain(item_types)
          .map(it =>
            _.assign(it.toJSON(), {
              // id: generateUuidMapping(`item_type-${it.id}`),
              attributes: _.chain(it.attributes)
                .filter('id')
                .map(at =>
                  _.assign(at, {
                    id: generateUuidMapping(`attribute-${at.id}`)
                  })
                )
                .values()
                .value()
            })
          )
          .values()
          .value(),
        workbook_chapter: _.chain(workbook_chapter)
          .map(wc =>
            _.assign(wc.toJSON(), {
              id: generateUuidMapping(`workbook_chapter-${wc.id}`),
              workbookId: retrieveUuidMapping(`workbook-${wc.workbookId}`),
              chapterId: retrieveUuidMapping(`chapter-${wc.chapterId}`)
            })
          )
          .values()
          .value(),
        chapter_page: _.chain(chapter_page)
          .map(cp =>
            _.assign(cp.toJSON(), {
              id: generateUuidMapping(`chapter_page-${cp.id}`),
              chapterId: retrieveUuidMapping(`chapter-${cp.chapterId}`),
              pageId: retrieveUuidMapping(`page-${cp.pageId}`)
            })
          )
          .values()
          .value(),
        page_item: _.chain(page_item)
          .map(pi =>
            _.assign(pi.toJSON(), {
              id: generateUuidMapping(`page_item-${pi.id}`),
              pageId: retrieveUuidMapping(`page-${pi.pageId}`),
              itemId: retrieveUuidMapping(`item-${pi.itemId}`)
            })
          )
          .values()
          .value()
      };

      var Version = app.models.version;
      Version.updateAll({ id: instance.versionId }, { content: content });
    }
  });
};
