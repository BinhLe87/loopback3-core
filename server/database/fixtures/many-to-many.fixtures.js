'use strict';

const app = require('../../server');
const faker = require('faker/locale/en_US');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const Promise = require('bluebird');
const _ = require('lodash');

/**
 *Generate fake data for many-to-many relationship between sourceModel and destinationModel
 *
 * @param {number} [numberRecordsWillGenerate=0]
 * @param {Model} sourceModel
 * @param {Model} destinationModel
 * @param {Model} joinModel
 * @param {Object} [options.sourceModelId] source Model name
 * @param {Object} [options.destinationModelId] destination Model name
 * @param {Object} [options.maxIdSourceModel] maximum Id of source Model
 * @param {Object} [options.maxIdDestinationModel] maximum Id of destination Model
 * @param {Object} [options.fields] fields other than foreignKey. It is a key value pair, key is field nam and value is fakerjs type
 * @returns list of generated ids
 */
async function generateManyToManyData(numberRecordsWillGenerate = 0, sourceModel, destinationModel, joinModel, options = {}) {

    if (_.isEmpty(numberRecordsWillGenerate)) return;

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

    const datasource = app.dataSources.cc_mysql;
    const mysqlConnector = datasource.connector;

    async function getMaxIdOfModel(model) {

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

    var maxIdSourceModel = await getMaxIdOfModel(sourceModel);
    var maxIdDestinationModel = await getMaxIdOfModel(destinationModel);

    maxIdSourceModel = maxIdSourceModel || options.maxIdSourceModel || numberRecordsWillGenerate;
    maxIdDestinationModel = maxIdDestinationModel || options.maxIdDestinationModel || numberRecordsWillGenerate;

    var createdIds = [];


    for (var i = 0; i < numberRecordsWillGenerate; i++) {

        let record = {};
        record[`${sourceModel.name}Id`] = faker.random.number({ min: 1, max: maxIdSourceModel });
        record[`${destinationModel.name}Id`] = faker.random.number({ min: 1, max: maxIdDestinationModel });

        //add other fields
        _.forOwn(options.fields, function (field_faker_type, field_name) {

            record[field_name] = field_faker_type;
        })

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

module.exports = generateManyToManyData;

