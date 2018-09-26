'use strict';

const app = require('../../server');
const faker = require('faker/locale/en_US');
const path = require('path');
const debug = require('debug')(path.basename(__filename));
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
 * @param {Object} [options.ForeignKeySourceModel] foreign key of source Model
 * @param {Object} [options.ForeignKeyDestinationModel] foreign key of destination Model
 * @param {Object} [options.fields] fields other than foreign key. It is a key value pair, key is field nam and value is fakerjs type
 */
async function generateManyToManyData(
  numberRecordsWillGenerate = 0,
  sourceModel,
  destinationModel,
  joinModel,
  options = {}
) {
  if (numberRecordsWillGenerate <= 0) return;

  var modelsName = {
    sourceModel: sourceModel,
    destinationModel: destinationModel,
    joinModel: joinModel
  };

  var modelsModel = __validateModelIsExistsInDB(modelsName, modelsModel);

  if (_.isEmpty(modelsModel)) return undefined;

  await __generateEntireFakeData(
    modelsModel,
    numberRecordsWillGenerate,
    options
  );
}

/**
 * Generate fake data and afterwards insert into database
 * @param {*} modelsModel
 * @param {*} numberRecordsWillGenerate
 * @param {*} options
 */
async function __generateEntireFakeData(
  modelsModel,
  numberRecordsWillGenerate,
  options
) {
  try {
    var { sourceModel, destinationModel, joinModel } = modelsModel;

    var [maxIdSourceModel, maxIdDestinationModel] = await Promise.all([
      _getMaxIdOfModel(sourceModel),
      _getMaxIdOfModel(destinationModel)
    ]);

    maxIdSourceModel =
      maxIdSourceModel || options.maxIdSourceModel || numberRecordsWillGenerate;
    maxIdDestinationModel =
      maxIdDestinationModel ||
      options.maxIdDestinationModel ||
      numberRecordsWillGenerate;

    var foreignKeySourceModel =
      options.ForeignKeySourceModel || `${sourceModel.name}Id`;
    var foreignKeyDestinationModel =
      options.ForeignKeyDestinationModel || `${destinationModel.name}Id`;

    for (var i = 0; i < numberRecordsWillGenerate; i++) {
      try {
        let record = {};
        record[foreignKeySourceModel] = faker.random.number({
          min: 1,
          max: maxIdSourceModel
        });
        record[foreignKeyDestinationModel] = faker.random.number({
          min: 1,
          max: maxIdDestinationModel
        });
        //add other fields
        let otherFields = {};

        otherFields = fixtures_util.parseRecordFields(options.fields, {
          numberRecordsWillGenerate: numberRecordsWillGenerate
        });

        Object.assign(record, otherFields);

        var created_record = await fixtures_util.insertRecordInDB(
          joinModel,
          record
        );

        debug(
          `model '${joinModel.name}': ${helper.inspect(created_record.id)}`
        );
      } catch (insert_err) {
        debug(`Error model '${joinModel.name}': ${helper.inspect(insert_err)}`);
      }
    }
  } catch (model_err) {
    debug(`Can not generate many-to-many relationship data for models:`);
    debug(modelsModel);
    debug(helper.inspect(model_err));
  }
}

/**
 *
 *
 * @param {*} modelsName
 * @returns {object} meta data of each of modelsName
 */
function __validateModelIsExistsInDB(modelsName) {
  var modelsModel = {};
  const ERR_MISSING_PARAMS = `Must input valid 3 model name to generate many-to-many relationship data.
                    You has passed sourceModel=<%=sourceModel%>, destinationModel=<%=destinationModel%>, joinModel=<%=joinModel%>`;
  _.forOwn(modelsName, function(model_name, model_type) {
    try {
      modelsModel[model_type] = app.loopback.getModel(model_name);
    } catch (e) {
      let compliedTemplate = _.template(ERR_MISSING_PARAMS);
      var err_messsage = compliedTemplate(modelsName);

      throw new TypeError(err_messsage);
    }
  });

  return modelsModel;
}

async function _getMaxIdOfModel(model) {
  const datasource = app.dataSources.cc_mysql;
  const mysqlConnector = datasource.connector;

  if (typeof model != 'function') {
    model = app.loopback.getModel(model);
  }

  var maxId;
  var executeFuncPromise = Promise.promisify(mysqlConnector.execute).bind(
    mysqlConnector
  );

  try {
    let resultArray = await executeFuncPromise(
      `SELECT MAX(id) as MaxId from ${model.name}`
    );
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
