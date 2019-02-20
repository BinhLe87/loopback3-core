'use strict';
const app = require('../server');
const Promise = require('bluebird');
const debug = require('debug')('workbook-chapter.util.js');
const Joi = require('joi');

exports = module.exports = {};
exports.moveItemPositionController = moveItemPositionController;
exports.moveItemPosition = moveItemPosition;

/**
 * validate url params of moving position inside one parent object
 *
 * @param {*} params
 * @returns {object|Boom} if valid, return an object contains valid values including default values,
 * otherwise return an instance of Boom
 */
function _validateURLParams_move_inside(params) {
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
    return Boom.badRequest(
      `Invalid url of moving position! Sample valid url has format like ${app.get(
        'restApiRoot'
      )}/workbooks/9/chapters/{from_chapter_id}/move/{to_chapter_id}`,
      url_params_validate_result.error
    );
  }

  return url_params_validate_result.value;
}

/**
 * validate url params of moving position outside one parent object
 *
 * @param {*} params
 * @returns {object|Boom} if valid, return an object contains valid values including default values,
 * otherwise return an instance of Boom
 */
function _validateURLParams_move_outside(params) {
  const url_params_joi = Joi.alternatives().try(
    Joi.object()
      .keys({
        scope_model: Joi.string()
          .valid('pages')
          .required(),
        scope_model_id: Joi.any().required(),
        from_model_id: Joi.any().required(),
        to_model_id: Joi.any().required(),
        relation_model_name: Joi.string().default('page_item'),
        scope_model_foreign_key: Joi.string().default('pageId'),
        from_model_foreign_key: Joi.string().default('itemId')
      })
      .unknown()
  );

  var url_params_validate_result = url_params_joi.validate(params);

  if (url_params_validate_result.error) {
    return Boom.badRequest(
      `Invalid url of moving position! Sample valid url has format like ${app.get(
        'restApiRoot'
      )}/pages/9/move_from/{from_chapter_id}/move_to/{to_chapter_id}`,
      url_params_validate_result.error
    );
  }

  return url_params_validate_result.value;
}
/**
 * Determine moving type is inside or outside in one parent object
 * @param {object} params
 * @returns {object} {
 *                      moving_type: (one of values inside/outside/unknown),
 *                      value: (value returns from joi validation)
 *                    }
 */
function _determineMovingType(params) {
  //attempt to validate one by one type
  var result;
  result = _validateURLParams_move_inside(params);

  if (!(result instanceof Boom))
    return { moving_type: 'inside', value: result.value };

  result = _validateURLParams_move_outside(params);

  if (!(result instanceof Boom))
    return { moving_type: 'outside', value: result.value };

  return { moving_type: 'unknown', value: params };
}

async function moveItemPositionController(req, res, next) {
  try {
    var { value: url_params, moving_type } = _determineMovingType(req.params);

    if (moving_type == 'unknown') {
      throw Boom.badRequest('Invalid URL params');
    }

    if (moving_type == 'inside') {
      moveInsideController(req, res, next, url_params);
    } else if (moving_type == 'outside') {
      //test
      logger.info('test');
    }
  } catch (move_error) {
    next(move_error);
  }
}

async function moveInsideController(req, res, next, url_params) {
  switch (url_params.action) {
    case 'swap':
      await swapTwoItemPositions(url_params);

      var swap_success_message_template = _.template(
        `Done swap positions between from_model_id '<%= from_model_id %>' and to_model_id <%= to_model_id %>!`
      );

      res.send(
        swap_success_message_template({
          from_model_id: url_params.from_model_id,
          to_model_id: url_params.to_model_id
        })
      );
      break;

    case 'move':
      var { new_position_string } = await _moveItemPosition(url_params);

      var move_success_message_template = _.template(
        `Updated from_model_id '<%= from_model_id %>' with new position is <%= new_position_string %>!`
      );

      res.send(
        move_success_message_template({
          from_model_id: url_params.from_model_id,
          new_position_string: new_position_string
        })
      );

      break;

    default:
      next();
  }
}

async function moveOutsideController(req, res, next, url_params) {
  var { new_position_string } = await _moveItemPosition(url_params);

  var move_success_message_template = _.template(
    `Updated from_model_id '<%= from_model_id %>' with new position is <%= new_position_string %>!`
  );

  res.send(
    move_success_message_template({
      from_model_id: url_params.from_model_id,
      new_position_string: new_position_string
    })
  );
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
 * public method, so it will validate url params before call actual _moveItemPosition()
 *
 * @param {*} url_params
 * @param {object} [options]
 * @returns {string} if success, return new position string and new position index of from_model, otherwise throw an error instance of Boom if any errors occurred
 */
async function moveItemPosition(url_params, options) {
  url_params = _validateURLParams_move_inside(url_params);
  return await _moveItemPosition(url_params, options);
}

/**
 * move item position
 *
 * @param {*} url_params
 * @param {object} [options]
 * @returns {string} if success, return new position string and new position index of from_model, otherwise throw an error instance of Boom if any errors occurred
 */
async function _moveItemPosition(url_params, options = {}) {
  function ___willMoveToTopPosition(url_params) {
    return url_params.to_model_id == 0 ? true : false;
  }

  var sorted_positions = await getListPositionsInModelScope(
    url_params.relation_model_name,
    url_params.scope_model_foreign_key,
    url_params.scope_model_id
  );

  var existing_result = _checkAllModelIDsExists(
    sorted_positions,
    url_params.from_model_foreign_key,
    url_params.from_model_id,
    url_params.to_model_id,
    options
  );

  var { from_model_instance, to_model_instance } = existing_result;

  if (_.isUndefined(url_params.to_model_id)) {
    //insert at last position

    var cur_last_position = _.isEmpty(sorted_positions)
      ? 0
      : _.last(sorted_positions).display_index;
    var new_last_position = cur_last_position + 1;

    if (options.is_processing_create_page_item != true) {
      await updatePositionForObjectInstance(
        from_model_instance,
        new_last_position
      );
    }

    return {
      new_position_string: 'last position in model scope',
      new_position_index: new_last_position
    };
  } else {
    var from_model_new_position;
    var new_position_string;
    var will_move_down_from_array_idx;

    if (___willMoveToTopPosition(url_params)) {
      from_model_new_position = 0;
      new_position_string = `top position in model scope`;
      will_move_down_from_array_idx = 0; //including 'from_model' item, it will update new position later
    } else {
      //move some items down in the list from the item was at destination position
      var to_model_intance_idx = _.findIndex(
        sorted_positions,
        to_model_instance
      );
      var cloned_to_model_instance = _.cloneDeep(
        sorted_positions[to_model_intance_idx]
      );

      from_model_new_position = cloned_to_model_instance.display_index + 1;
      new_position_string = `right below to_model_id '${
        url_params.to_model_id
      }'`;
      will_move_down_from_array_idx = to_model_intance_idx + 1;
    }

    const relation_model = app.models[url_params.relation_model_name];

    return new Promise((resolve, reject) => {
      relation_model.beginTransaction(
        {
          isolationLevel: 'READ COMMITTED',
          timeout: 10000 //10 seconds
        },
        async function(err, tx) {
          const transaction_options = {
            transaction: tx
          };

          //Need to fix: not sure why timeout event is fired even if transaction was committed
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
            //and only move down instances start from will_move_down_from_array_idx in sorted_positions array
            //NOTE: moving order matters: move down other items first, then move `from_model` later
            var cur_idx;
            for (
              cur_idx = sorted_positions.length - 1;
              cur_idx >= will_move_down_from_array_idx;
              cur_idx--
            ) {
              let cur_instance = sorted_positions[cur_idx];

              var updated_to_model = await updatePositionForObjectInstance(
                cur_instance,
                cur_instance.display_index + 1,
                transaction_options
              );
            }

            if (options.is_processing_create_page_item != true) {
              var updated_from_model = await updatePositionForObjectInstance(
                from_model_instance,
                from_model_new_position,
                transaction_options
              );
            }

            tx.commit()
              .then(function() {
                resolve({
                  new_position_string: new_position_string,
                  new_position_index: from_model_new_position
                });
              })
              .catch(function(commit_err) {
                throw commit_err;
              });
          } catch (update_position_error) {
            tx.rollback(function(rollback_err) {});

            reject(
              Boom.badImplementation(
                `Unable to move position of from_model_id is '${
                  url_params.from_model_id
                }' in scope_model_id '${
                  url_params.scope_model_id
                }' at the moment.`,
                update_position_error
              )
            );
          }
        }
      );
    });
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
      const transaction_options = {
        transaction: tx
      };
      var cloned_from_model_instance = _.cloneDeep(from_model_instance);
      var cloned_to_model_instance = _.cloneDeep(to_model_instance);

      //Need to fix: not sure why timeout event is fired even if transaction was committed
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
        await updatePositionForObjectInstance(
          to_model_instance,
          -1,
          transaction_options
        );

        await updatePositionForObjectInstance(
          from_model_instance,
          cloned_to_model_instance.display_index,
          transaction_options
        );

        await updatePositionForObjectInstance(
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
 * @param {object} [options] validation options
 * @returns {Error|object} if valid, return an object contains instances {from_model_instance, to_model_instance}, otherwise throw an error instance of Boom
 */
function _checkAllModelIDsExists(
  list_positions,
  from_model_foreign_key,
  from_model_id,
  to_model_id,
  options = {}
) {
  if (options.is_processing_create_page_item == true) {
    //ignore checking the exists of `from_model_id` and `to_model_id`
    // because this is creating 'page_item relationship' process, not move/swap position process

    return {
      from_model_instance: undefined,
      to_model_instance: undefined
    };
  }

  //check whether from_model_id exists in model scope
  var found_from_model_instance;
  if (options.skip_update_from_model_position != true) {
    found_from_model_instance = _.find(list_positions, item => {
      return item[from_model_foreign_key] == from_model_id;
    });

    if (_.isUndefined(found_from_model_instance)) {
      throw Boom.notFound(
        `Not found from_model id is '${from_model_id}' in the model scope`
      );
    }
  }

  //in case to_model_id argument is passed and not equal 0 (not case of moving top/last position),
  //check whether the to_model_id exists in model scope
  var found_to_model_instance;
  if (!_.isUndefined(to_model_id) && to_model_id != 0) {
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
 * @param {*} object_instance
 * @param {*} new_position
 * @param {*} db_transaction_options
 * @returns
 */
async function updatePositionForObjectInstance(
  object_instance,
  new_position,
  db_transaction_options
) {
  var updateObjectPositionPromise = Promise.promisify(
    object_instance.updateAttributes
  ).bind(object_instance);

  var updated_instance = await updateObjectPositionPromise(
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

  return _.isEmpty(position_array) ? [] : position_array;
}
