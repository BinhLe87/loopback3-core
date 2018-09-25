var server = require('../../server');
var _ = require('lodash');
const { builtInModelNames } = require('../../helpers/loopbackUtil');
const Promise = require('bluebird');

async function createMyTables() {
  var ds = server.dataSources.cc_mysql;
  ds.setMaxListeners(0);

  var lbAllModels = _.map(server._models, 'modelName');

  //since 'admin' model as virtual model, so treat it as built-in model
  builtInModelNames.push('admin');

  var lbMyModels = lbAllModels.filter(function(value, index) {
    return !builtInModelNames.includes(value);
  });

  var automigratePromise = Promise.promisify(ds.automigrate).bind(ds);

  await automigratePromise(lbMyModels);

  // ds.disconnect();
}

module.exports = createMyTables;
