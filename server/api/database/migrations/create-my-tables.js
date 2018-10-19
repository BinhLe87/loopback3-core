var server = require('../../server');
var _ = require('lodash');
const { builtInModelNames } = require('../../helpers/loopbackUtil');
const Promise = require('bluebird');

/**
 *
 *
 * @param {object} [options]
 * @param {boolean} [options.include_builtin_models] if true, all built-in models also will be reset
 */
async function createMyTables(options = {}) {
  var will_reset_builtin_models = _.get(
    options,
    'include_builtin_models',
    false
  );

  var ds = server.dataSources.cc_mysql;
  ds.setMaxListeners(0);

  var lbAllModels = _.map(server._models, 'modelName');

  var lbMyModels = lbAllModels;

  //since 'admin' model as virtual model, so skip migrating this model
  lbMyModels = lbMyModels.filter(function(value, index) {
    return value !== 'admin';
  });

  if (!will_reset_builtin_models) {
    //not exclude built-in tables
    lbMyModels = lbMyModels.filter(function(value, index) {
      return !builtInModelNames.includes(value);
    });
  }

  //remove duplicate model name if any
  lbMyModels = _.uniqBy(lbMyModels, model => model.trim().toUpperCase());

  var automigratePromise = Promise.promisify(ds.automigrate).bind(ds);

  await automigratePromise(lbMyModels);

  // ds.disconnect();
}

module.exports = createMyTables;
