'use strict';

const app = require('../../server');
const faker = require('faker/locale/en_US');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const Promise = require('bluebird');
const _ = require('lodash');
const fixtures_util = require('./util.fixtures');

/**
 *Generate fake data for many-to-many relationship between sourceModel and destinationModel
 *
 * @param {number} [numberRecordsWillGenerate=0]
 * @param {Model} sourceModel
 * @param {Model} destinationModel
 * @param {Model} joinModel
 * @param {Object} [options.maxIdSourceModel] maximum Id of source Model
 * @param {Object} [options.maxIdDestinationModel] maximum Id of destination Model
 * @param {Object} [options.fields] fields other than foreign key. It is a key value pair, key is field nam and value is fakerjs type
 * @returns list of generated ids
 */
async function generateManyToManyData(numberRecordsWillGenerate = 0, sourceModel, destinationModel, joinModel, options = {}) {

    if (numberRecordsWillGenerate <= 0) return;

    var modelsName = {
        'sourceModel': sourceModel,
        'destinationModel': destinationModel,
        'joinModel': joinModel
    }

    var modelsModel = {};

    const ERR_MISSING_PARAMS = `Must input valid 3 model name to generate many-to-many relationship data.
                    You has passed sourceModel=<%=sourceModel%>, destinationModel=<%=destinationModel%>, joinModel=<%=joinModel%>`;

    var shouldReturnUndefined = false;
    _.forOwn(modelsName, function (model_name, model_type) {

        try {

            modelsModel[model_type] = app.loopback.getModel(model_name);
        } catch (e) {

            let compliedTemplate = _.template(ERR_MISSING_PARAMS);

            logger.error(compliedTemplate({
                'sourceModel': sourceModel,
                'destinationModel': destinationModel,
                'joinModel': joinModel
            }), __filename);
            logger.error(e, __filename);

            shouldReturnUndefined = true;
            return;
        }
    });

    if (shouldReturnUndefined) return undefined;

    var { sourceModel, destinationModel, joinModel } = modelsModel;

    var [maxIdSourceModel, maxIdDestinationModel] = await Promise.all([
        _getMaxIdOfModel(sourceModel),
        _getMaxIdOfModel(destinationModel)
    ]);


    maxIdSourceModel = maxIdSourceModel || options.maxIdSourceModel || numberRecordsWillGenerate;
    maxIdDestinationModel = maxIdDestinationModel || options.maxIdDestinationModel || numberRecordsWillGenerate;

    var createdIds = [];


    for (var i = 0; i < numberRecordsWillGenerate; i++) {

        let record = {};
        record[`${sourceModel.name}Id`] = faker.random.number({ min: 1, max: maxIdSourceModel });
        record[`${destinationModel.name}Id`] = faker.random.number({ min: 1, max: maxIdDestinationModel });

        //add other fields
        let otherFields = {};
        try {
            otherFields = fixtures_util.parseRecordFields(options.fields);
        } catch (e) {
            debug(e);
            throw e;
        }

        Object.assign(record, otherFields);

        joinModel.create(record, function (err, result) {

            if (!err) {

                createdIds.push(result.id);
                debug(`model '${joinModel.name}': ${util.inspect(result)}`);
            } else {

                debug(`model '${joinModel.name}': ${util.inspect(err)}`);
            }
        });
    }

    return createdIds;
}

async function _getMaxIdOfModel(model) {

    const datasource = app.dataSources.cc_mysql;
    const mysqlConnector = datasource.connector;

    if (typeof model != 'function') {

        model = app.loopback.getModel(model);
    }

    var maxId;
    var executeFuncPromise = Promise.promisify(mysqlConnector.execute).bind(mysqlConnector);

    try {

        let resultArray = await executeFuncPromise(`SELECT MAX(id) as MaxId from ${model.name}`);
        maxId = resultArray[0]['MaxId'];

    } catch (e) {

        debug(`Error: SELECT MAX(id) from ${model.name}`);
        debug(e);
    }

    if (_.isEmpty(maxId)) {

        var countFuncPromise = Promise.promisify(model.count).bind(model);
        try {

            maxId = await countFuncPromise();
        } catch (e) {

            debug(`Error: execute ${model.name}.count()`);
            debug(e);
        }
    }

    return maxId;
}

module.exports = generateManyToManyData;