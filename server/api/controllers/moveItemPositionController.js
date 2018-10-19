'use strict';
const app = require('../server');
const Promise = require('bluebird');
const debug = require('debug')('workbook-chapter.util.js');
const Joi = require('joi');

exports = module.exports = moveItemPositionController;

/**
 * validate url params of moving position api
 *
 * @param {*} params
 * @returns {object} if valid, return an object contains valid values including default values,
 * otherwise throws an error instance of Boom
 */
function _validateURLParams(params) {
  const url_params_joi = Joi.alternatives().try(
    Joi.object()
      .keys({
        scope_model: Joi.string()
          .valid('workbooks')
          .required(),
        scope_model_id: Joi.any().required(),
        from_model: Joi.string()
          .valid('chapters')
          .required(),
        from_model_id: Joi.any().required(),
        action: Joi.string()
          .valid('move', 'swap')
          .required(),
        relation_model_name: Joi.string().default('workbook_chapter'),
        scope_model_foreign_key: Joi.string().default('workbookId'),
        from_model_foreign_key: Joi.string().default('chapterId'),
        to_model_id: Joi.number().when('action', {
          is: 'swap',
          then: Joi.required()
        })
      })
      .unknown(),
    Joi.object()
      .keys({
        scope_model: Joi.string()
          .valid('chapters')
          .required(),
        scope_model_id: Joi.any().required(),
        from_model: Joi.string()
          .valid('pages')
          .required(),
        from_model_id: Joi.any().required(),
        action: Joi.string()
          .valid('move', 'swap')
          .required(),
        relation_model_name: Joi.string().default('chapter_page'),
        scope_model_foreign_key: Joi.string().default('chapterId'),
        from_model_foreign_key: Joi.string().default('pageId')
      })
      .unknown(),
    Joi.object()
      .keys({
        scope_model: Joi.string()
          .valid('pages')
          .required(),
        scope_model_id: Joi.any().required(),
        from_model: Joi.string()
          .valid('items')
          .required(),
        from_model_id: Joi.any().required(),
        action: Joi.string()
          .valid('move', 'swap')
          .required(),
        relation_model_name: Joi.string().default('page_item'),
        scope_model_foreign_key: Joi.string().default('pageId'),
        from_model_foreign_key: Joi.string().default('itemId')
      })
      .unknown()
  );

  var url_params_validate_result = url_params_joi.validate(params);

  if (url_params_validate_result.error) {
    throw Boom.badRequest(
      `Invalid url of moving position! Sample valid url has format like ${app.get(
        'restApiRoot'
      )}/workbooks/9/chapters/{from_chapter_id}/move/{to_chapter_id}`,
      url_params_validate_result.error
    );
  }

  return url_params_validate_result.value;
}

async function moveItemPositionController(req, res, next) {
  try {
    var url_params = _validateURLParams(req.params);

    switch (url_params.action) {
      case 'swap':
        await swapTwoItemPositions(url_params);

        var success_message_template = _.template(
          `Done swap positions between from_model_id '<%= from_model_id %>' and to_model_id <%= to_model_id %>!`
        );

        res.send(
          success_message_template({
            from_model_id: url_params.from_model_id,
            to_model_id: url_params.to_model_id
          })
        );
        break;

      case 'move':
        await moveItemPosition(url_params);

        var success_message_template = _.template(
          `Updated from_model_id '<%= from_model_id %>' with new position is right before to_model_id '<%= to_model_id %>'!`
        );

        res.send(
          success_message_template({
            from_model_id: url_params.from_model_id,
            to_model_id: url_params.to_model_id
          })
        );

        break;
    }
  } catch (move_error) {
    next(move_error);
  }
}

async function swapTwoItemPositions(url_params) {
  var sorted_positions = await getListPositionsInModelScope(
    url_params.relation_model_name,
    url_params.scope_model_foreign_key,
    url_params.scope_model_id
  );

  var existing_result = _checkAllModelIDsExists(
    sorted_positions,
    url_params.from_model_foreign_key,
    url_params.from_model_id,
    url_params.to_model_id
  );

  var { from_model_instance, to_model_instance } = existing_result;

  var swap_position_result = await swapPositionFromModelAndToModel(
    url_params.relation_model_name,
    from_model_instance,
    to_model_instance
  );

  //successfully swap
}

/**
 * move item position
 *
 * @param {*} url_params
 * @returns {string} if success, return new position string of from_model, otherwise throw an error instance of Boom if any errors occurred
 */
async function moveItemPosition(url_params) {
  var sorted_positions = await getListPositionsInModelScope(
    url_params.relation_model_name,
    url_params.scope_model_foreign_key,
    url_params.scope_model_id
  );

  var existing_result = _checkAllModelIDsExists(
    sorted_positions,
    url_params.from_model_foreign_key,
    url_params.from_model_id,
    url_params.to_model_id
  );

  var { from_model_instance, to_model_instance } = existing_result;

  if (_.isUndefined(url_params.to_model_id)) {
    //insert at last position

    var cur_last_position = _.last(sorted_positions).display_index;
    var new_last_position = cur_last_position + 1;

    //update new position for this chapter
    await updatePositionForWorkbookChapterInstance(
      from_model_instance,
      new_last_position
    );

    return 'last position in model scope';
  } else {
    //move some chapters down in the list from the chapter was at position destination position
    var to_model_intance_idx = _.findIndex(sorted_positions, to_model_instance);

    //update new position for source chapter and move down position for chapters starts from destination chapter
    const relation_model = app.models[url_params.relation_model_name];
    var cloned_to_model_instance = _.cloneDeep(
      sorted_positions[to_model_intance_idx]
    );

    relation_model.beginTransaction(
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
          //update new position for instance has current higher position first in order to avoid 'duplicate unique key' error
          //and only move down instances start from from_instance in sorted_positions array
          var cur_idx;
          for (
            cur_idx = sorted_positions.length - 1;
            cur_idx >= to_model_intance_idx;
            cur_idx--
          ) {
            let cur_instance = sorted_positions[cur_idx];

            var updated_to_model = await updatePositionForWorkbookChapterInstance(
              cur_instance,
              cur_instance.display_index + 1,
              transaction_options
            );
          }

          var updated_from_model = await updatePositionForWorkbookChapterInstance(
            from_model_instance,
            cloned_to_model_instance.display_index,
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
          tx.rollback(function(rollback_err) {});

          throw Boom.badImplementation(
            `Unable to move position of from_model_id is '${
              url_params.from_model_id
            }' in scope_model_id '${url_params.scope_model_id}' at the moment.`,
            update_position_error
          );
        }
      }
    );
  }
}

/**
 * Swap two chapter positions within a workbook
 *
 * @param {string} relation_model_name relation_model_name
 * @param {*} from_model_instance source chapter instance
 * @param {*} to_model_instance destination chapter instance
 * @return {true|error} if any error occurs, throw an error instance of Boom; otherwise return true
 */
async function swapPositionFromModelAndToModel(
  relation_model_name,
  from_model_instance,
  to_model_instance
) {
  const relation_model = app.models[relation_model_name];

  relation_model.beginTransaction(
    {
      isolationLevel: 'READ COMMITTED',
      timeout: 10000 //10 seconds
    },
    async function(err, tx) {
      const transaction_options = { transaction: tx };
      var cloned_from_model_instance = _.cloneDeep(from_model_instance);
      var cloned_to_model_instance = _.cloneDeep(to_model_instance);

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
        //Use -1 as intermediate value in order to avoid 'duplicate unique key' error
        var updated_from_model_instance = await updatePositionForWorkbookChapterInstance(
          to_model_instance,
          -1,
          transaction_options
        );

        var updated_from_model_instance = await updatePositionForWorkbookChapterInstance(
          from_model_instance,
          cloned_to_model_instance.display_index,
          transaction_options
        );

        var updated_to_model_instance = await updatePositionForWorkbookChapterInstance(
          to_model_instance,
          cloned_from_model_instance.display_index,
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
        tx.rollback(function(rollback_err) {});

        throw Boom.badImplementation(
          `Unable to swap positions between from_model_id ${
            from_model_instance.id
          } and to_model_id ${to_model_instance.id} at the moment.`,
          update_position_error
        );
      }
    }
  );
}

/**
 * validate moving position conditions
 *
 * @param {array} list_positions
 * @param {string} from_model_foreign_key
 * @param {number} from_model_id
 * @param {undefined|number} to_model_id if undefined, it will ignore checking
 * @returns {Error|object} if valid, return an object contains instances {from_model_instance, to_model_instance}, otherwise throw an error instance of Boom
 */
function _checkAllModelIDsExists(
  list_positions,
  from_model_foreign_key,
  from_model_id,
  to_model_id
) {
  if (_.isEmpty(list_positions)) {
    throw Boom.notFound(`Not found any items in the model scope'`);
  }

  //check whether from_model_id exists in model scope
  var found_from_model_instance = _.find(list_positions, item => {
    return item[from_model_foreign_key] == from_model_id;
  });

  if (_.isUndefined(found_from_model_instance)) {
    throw Boom.notFound(
      `Not found from_model id is '${from_model_id}' in the model scope`
    );
  }

  //in case to_model_id argument is passed, check whether the to_model_id exists in model scope
  var found_to_model_instance;
  if (!_.isUndefined(to_model_id)) {
    found_to_model_instance = _.find(list_positions, item => {
      return item[from_model_foreign_key] == to_model_id;
    });

    if (_.isUndefined(found_to_model_instance)) {
      throw Boom.notFound(
        `Not found to_model id is '${to_model_id}' in the model scope`
      );
    }
  }

  return {
    from_model_instance: found_from_model_instance,
    to_model_instance: found_to_model_instance
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
 * Return list positions within a specific model scope, sorted by display_index ASC
 *
 * @param {string} relation_model_name
 * @param {string} scope_model_foreign_key foreign key of model scope in relation model
 * @param {*} scope_model_id
 * @returns {array} list chapters of the workbook
 */
async function getListPositionsInModelScope(
  relation_model_name,
  scope_model_foreign_key,
  scope_model_id
) {
  var model_instance = app.models[relation_model_name];

  var findPromise = Promise.promisify(model_instance.find).bind(model_instance);

  var find_options = {};
  _.set(find_options, `where.${scope_model_foreign_key}`, scope_model_id);
  find_options.order = 'display_index ASC';

  var position_array = await findPromise(find_options);

  return position_array;
}
