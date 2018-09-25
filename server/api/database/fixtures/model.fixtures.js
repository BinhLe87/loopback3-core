'use strict';

const app = require('../../server');
const faker = require('faker/locale/en_US');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const _ = require('lodash');
const util = require('util');
const fixtures_util = require('./util.fixtures');

/**
 * Generate fake data for model
 *
 * @param {number} [numberRecordsWillGenerate=0]
 * @param {Model} model model will to generate data
 * @param {Object} fields Each property contains key is field name, value is fakerjs type.
 * In order to refer to other field's value, using format `'${<field_referred_to>}'`
 */
async function generateModelData(numberRecordsWillGenerate = 0, model, fields) {
  if (numberRecordsWillGenerate <= 0) return;

  if (_.isEmpty(fields)) {
    let err_msg = `Error in ${model}: Must pass fields to declare fields along with faker type`;
    debug(err_msg);
    return;
  }

  if (typeof model != 'function') {
    model = app.loopback.getModel(model);
  }

  if (!model) {
    debug('Not found model ' + model);
    return;
  }

  const debug = require('debug')(
    `${path.basename(__filename)} with model '${model.name}'`
  );

  for (var i = 0; i < numberRecordsWillGenerate; i++) {
    let record = {};
    try {
      record = fixtures_util.parseRecordFields(fields);

      var result = await model.create(record);
      debug(`model '${model.name}': ${util.inspect(result)}`);
    } catch (e) {
      debug(`Error model '${model.name}': ${util.inspect(e)}`);
    }
  }
}

module.exports = generateModelData;
