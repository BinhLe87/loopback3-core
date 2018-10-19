'use strict';
const app = require('../../../server');
const Promise = require('bluebird');
const debug = require('debug')('workbook-chapter.util.js');

exports = module.exports = {};

async function swapTwoChapterPositionsController(req, res, next) {
  var {
    workbookId: req_workbookId,
    chapterId: req_chapterId,
    destChapterId: req_destChapterId
  } = req.params;

  var sorted_chapter_positions = await getListChapterPositionsByWorkbookId(
    req_workbookId
  );

  req_destChapterId = _.isUndefined(req_destChapterId)
    ? null
    : req_destChapterId; //always check, so set it to null instead of undefined
  var validation_result = _validateMovingPositionCond(
    sorted_chapter_positions,
    req_chapterId,
    req_destChapterId
  );
  if (validation_result instanceof Error) {
    return next(validation_result);
  } else {
    var { source_instance, dest_instance } = validation_result;

    var swap_position_result = await swapPositionTwoChapters(
      source_instance,
      dest_instance
    );

    if (swap_position_result instanceof Error) {
      return next(validation_result);
    } else {
      //successfully swap

      var success_message_template = _.template(
        `Done swap positions between chapterId '<%= source_chapter_id %>' and chapterId <%= dest_chapter_id %>!`
      );
      res.send(
        success_message_template({
          source_chapter_id: source_instance.chapterId,
          dest_chapter_id: dest_instance.chapterId
        })
      );
    }
  }
}

async function moveChapterPositionController(req, res, next) {
  var {
    workbookId: req_workbookId,
    chapterId: req_chapterId,
    destChapterId: req_destChapterId
  } = req.params;

  var sorted_chapter_positions = await getListChapterPositionsByWorkbookId(
    req_workbookId
  );

  var validation_result = _validateMovingPositionCond(
    sorted_chapter_positions,
    req_chapterId,
    req_destChapterId
  );
  if (validation_result instanceof Error) {
    return next(validation_result);
  } else {
    var { source_instance, dest_instance } = validation_result;
  }

  var success_message_template = _.template(
    `Updated chapterId '<%= chapter_id %>' with new position is <%= new_position %>!`
  );
  if (_.isUndefined(req_destChapterId)) {
    //insert at last position

    var cur_last_position = _.last(sorted_chapter_positions).display_index;
    var new_last_position = cur_last_position + 1;

    //update new position for this chapter
    await updatePositionForWorkbookChapterInstance(
      source_instance,
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
    var dest_instance_idx = _.findIndex(
      sorted_chapter_positions,
      dest_instance
    );

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
          var updated_source_instance = await updatePositionForWorkbookChapterInstance(
            source_instance,
            sorted_chapter_positions[dest_instance_idx].display_index,
            transaction_options
          );

          for (let [
            cur_idx,
            cur_instance
          ] of sorted_chapter_positions.entries()) {
            //only move down chapter starts from found_dest_workbook_chapter_idx in sorted_chapter_positions array
            if (cur_idx >= dest_instance_idx) {
              var updated_dest_chapter = await updatePositionForWorkbookChapterInstance(
                cur_instance,
                cur_instance.display_index + 1,
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
}

/**
 * Swap two chapter positions within a workbook
 *
 * @param {*} source_chapter source chapter instance
 * @param {*} dest_chapter destination chapter instance
 * @return {true|error} if any error occurs, return an error instance of Boom; otherwise return true
 */
async function swapPositionTwoChapters(source_chapter, dest_chapter) {
  const Workbook_ChapterModel = app.models.workbook_chapter;

  Workbook_ChapterModel.beginTransaction(
    {
      isolationLevel: 'READ COMMITTED',
      timeout: 10000 //10 seconds
    },
    async function(err, tx) {
      const transaction_options = { transaction: tx };
      var cloned_source_chapter = _.cloneDeep(source_chapter);
      var cloned_dest_chapter = _.cloneDeep(dest_chapter);

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
          source_chapter,
          cloned_dest_chapter.display_index,
          transaction_options
        );

        var updated_dest_chapter = await updatePositionForWorkbookChapterInstance(
          dest_chapter,
          cloned_source_chapter.display_index,
          transaction_options
        );

        tx.commit()
          .then(function() {
            return true;
          })
          .catch(function(commit_err) {
            throw commit_err;
          });
      } catch (update_position_error) {
        logger.error(
          `Error committing transaction when swap positions between chapterId ${
            source_chapter.id
          } and chapterId ${dest_chapter.id}`,
          __filename
        );
        logger.error(update_position_error, __filename);

        tx.rollback(function(rollback_err) {});

        return Boom.badImplementation(
          `Unable to swap positions between chapterId ${
            source_chapter.id
          } and chapterId ${dest_chapter.id} at the moment.`,
          update_position_error
        );
      }
    }
  );
}

/**
 * validate moving position conditions
 *
 * @param {array} list_chapter_positions
 * @param {number} req_source_chapter_id
 * @param {undefined|number} req_dest_chapter_id if undefined, it will ignore checking
 * @returns {Error|object} if valid, return an object contains instances {source_instance, dest_instance}, otherwise returns an error instance of Boom
 */
function _validateMovingPositionCond(
  list_chapter_positions,
  req_source_chapter_id,
  req_dest_chapter_id
) {
  if (_.isEmpty(list_chapter_positions)) {
    return Boom.notFound(`Not found any chapters in the workbook'`);
  }

  //check whether req_chapterId exists in workbook
  var found_source_workbook_chapter = _.find(list_chapter_positions, item => {
    return item.chapterId == req_source_chapter_id;
  });

  if (_.isUndefined(found_source_workbook_chapter)) {
    return Boom.notFound(
      `Not found source chapterId is '${req_source_chapter_id}' in the workbook`
    );
  }

  //in case req_dest_chapter_id argument is passed, check whether the destination chapter exists in workbook_chapter
  var found_dest_workbook_chapter;
  if (!_.isUndefined(req_dest_chapter_id)) {
    found_dest_workbook_chapter = _.find(list_chapter_positions, item => {
      return item.chapterId == req_dest_chapter_id;
    });

    if (_.isUndefined(found_dest_workbook_chapter)) {
      return Boom.notFound(
        `Not found destination chapterId is '${req_dest_chapter_id}' in the workbook`
      );
    }
  }

  return {
    source_instance: found_source_workbook_chapter,
    dest_instance: found_dest_workbook_chapter
  };
}

/**
 *
 *
 * @param {*} workbook_chapter_instance
 * @param {*} new_position
 * @param {*} db_transaction_options
 * @returns
 */
async function updatePositionForWorkbookChapterInstance(
  workbook_chapter_instance,
  new_position,
  db_transaction_options
) {
  var updateChapterPositionPromise = Promise.promisify(
    workbook_chapter_instance.updateAttributes
  ).bind(workbook_chapter_instance);

  var updated_instance = await updateChapterPositionPromise(
    {
      display_index: new_position
    },
    db_transaction_options
  );

  return updated_instance;
}

/**
 * Return list chapters of the workbook, sorted by display_index ASC
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
    order: 'display_index ASC'
  });

  return chapter_positions;
}

exports.moveChapterPositionController = moveChapterPositionController;
exports.swapTwoChapterPositionsController = swapTwoChapterPositionsController;
