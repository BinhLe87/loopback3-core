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
 * @param {Object} fields Each property contains key is field name, value is fakerjs type
 * @returns list of generated ids
 */
function generateModelData(numberRecordsWillGenerate = 0, model, fields) {

    if (_.isEmpty(numberRecordsWillGenerate)) return;

    if (_.isEmpty(fields)) {

        let err_msg = 'Error: Must pass fields to declare fields along with faker type';
        debug(err_msg);
        throw new Error(err_msg);
    }

    if (typeof model != 'function') {

        model = app.loopback.getModel(model);
    }

    if (!model) {

        debug('Not found model ' + model);
        return;
    }

    const debug = require('debug')(`${path.basename(__filename)} with model '${model.name}'`);

    var createdIds = [];

    for (var i = 0; i < numberRecordsWillGenerate; i++) {

        let record = {}
        try {
            record = fixtures_util.parseRecordFields(fields);
        } catch(e) {
            debug(e);
            throw e;
        }
        
        model.create(record, function (err, result) {

            if (!err) {

                createdIds.push(result.id);
                debug(`model '${model.name}': ${util.inspect(result)}`);
            } else {

                debug(`model '${model.name}': ${util.inspect(err)}`);
            }
        });
    }

    return createdIds;
};


module.exports = generateModelData;
