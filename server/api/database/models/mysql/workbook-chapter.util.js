'use strict';
const app = require('../../../server');
const Promise = require('bluebird');
const debug = require('debug')('workbook-chapter.util.js');

exports = module.exports = {};

async function moveChapterPositionController(req, res, next) {
  var {
    workbookId: req_workbookId,
    chapterId: req_chapterId,
    destChapterId: req_destChapterId
  } = req.params;

  var sorted_chapter_positions = await getListChapterPositionsByWorkbookId(
    req_workbookId
  );

  if (_.isEmpty(sorted_chapter_positions)) {
    return next(
      Boom.notFound(
        `Not found chapters in workbook has id is '${req_workbookId}'`
      )
    );
  }

  //check whether req_chapterId exists in workbook
  var found_source_workbook_chapter = _.find(sorted_chapter_positions, item => {
    return item.chapterId == req_chapterId;
  });

  if (_.isUndefined(found_source_workbook_chapter)) {
    return next(
      Boom.notFound(
        `Not found chapterId is '${req_chapterId}' in workbookId '${req_workbookId}'`
      )
    );
  }

  var success_message_template = _.template(
    `Updated chapterId '<%= chapter_id %>' with new position is <%= new_position %>!`
  );
  if (_.isUndefined(req_destChapterId)) {
    //insert at last position

    var cur_last_position = _.last(sorted_chapter_positions)
      .chapter_display_index;
    var new_last_position = cur_last_position + 1;

    //update new position for this chapter
    await updatePositionForWorkbookChapterInstance(
      found_source_workbook_chapter,
      new_last_position
    );

    res.send(
      success_message_template({
        chapter_id: req_chapterId,
        new_position: 'last position in workbook'
      })
    );
  } else {
    //move some chapters down in the list from the chapter was at position destination position

    //check whether the destination chapter exists in workbook_chapter
    var found_dest_workbook_chapter_idx = _.findIndex(
      sorted_chapter_positions,
      item => {
        return item.chapterId == req_destChapterId;
      }
    );

    if (found_dest_workbook_chapter_idx == -1) {
      return next(
        Boom.notFound(
          `Not found destination chapterId is '${req_destChapterId}' in workbookId '${req_workbookId}'`
        )
      );
    }

    //update new position for source chapter and move down position for chapters starts from destination chapter
    const Workbook_ChapterModel = app.models.workbook_chapter;
    Workbook_ChapterModel.beginTransaction(
      {
        isolationLevel: 'READ COMMITTED',
        timeout: 10000 //10 seconds
      },
      async function(err, tx) {
        const transaction_options = { transaction: tx };

        //FIXME: not sure why timeout event is fired even if transaction was committed
        // tx.observe('timeout', function (context, timeout_next) {

        //     logger.error('moveChapterPositionController(): Timeout committing transaction', __filename);
        //     return next(
        //         Boom.badGateway(
        //             `Unable to move position of chapterId is '${req_chapterId}' in workbookId '${req_workbookId}' at the moment.`,
        //             __filename + ':moveChapterPositionController(): Timeout committing transaction'
        //         )
        //     );
        // });

        try {
          var updated_source_chapter = await updatePositionForWorkbookChapterInstance(
            found_source_workbook_chapter,
            sorted_chapter_positions[found_dest_workbook_chapter_idx]
              .chapter_display_index,
            transaction_options
          );

          for (let [
            cur_idx,
            cur_instance
          ] of sorted_chapter_positions.entries()) {
            //only move down chapter starts from found_dest_workbook_chapter_idx in sorted_chapter_positions array
            if (cur_idx >= found_dest_workbook_chapter_idx) {
              var updated_dest_chapter = await updatePositionForWorkbookChapterInstance(
                cur_instance,
                cur_instance.chapter_display_index + 1,
                transaction_options
              );
            }
          }

          tx.commit()
            .then(function() {
              res.send(
                success_message_template({
                  chapter_id: req_chapterId,
                  new_position: `right before chapterId '${req_destChapterId}'`
                })
              );
            })
            .catch(function(commit_err) {
              throw commit_err;
            });
        } catch (update_position_error) {
          logger.error(
            `Error committing transaction when updating new position for chapterId ${req_chapterId} in workbookId ${req_workbookId}`,
            __filename
          );
          logger.error(update_position_error, __filename);

          tx.rollback(function(rollback_err) {});

          return next(
            Boom.badImplementation(
              `Unable to move position of chapterId is '${req_chapterId}' in workbookId '${req_workbookId}' at the moment.`,
              update_position_error
            )
          );
        }
      }
    );
  }

  async function updatePositionForWorkbookChapterInstance(
    workbook_chapter_instance,
    new_position,
    db_transaction
  ) {
    var updateChapterPositionPromise = Promise.promisify(
      workbook_chapter_instance.updateAttributes
    ).bind(workbook_chapter_instance);

    var updated_instance = await updateChapterPositionPromise(
      {
        chapter_display_index: new_position
      },
      db_transaction
    );

    return updated_instance;
  }
}

/**
 * Return list chapters of the workbook, sorted by chapter_display_index ASC
 *
 * @param {*} workbook_id
 * @returns {array} list chapters of the workbook
 */
async function getListChapterPositionsByWorkbookId(workbook_id) {
  var Workbook_ChapterModel = app.models.workbook_chapter;

  var findChapterPositionsPromise = Promise.promisify(
    Workbook_ChapterModel.find
  ).bind(Workbook_ChapterModel);

  var chapter_positions = await findChapterPositionsPromise({
    where: { workbookId: workbook_id },
    order: 'chapter_display_index ASC'
  });

  return chapter_positions;
}

exports.moveChapterPositionController = moveChapterPositionController;
