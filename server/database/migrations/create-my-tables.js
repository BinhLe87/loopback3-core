var server = require('../../server');
var _ = require('lodash');
const { builtInModelNames } = require('../../helpers/loopbackUtil');

var ds = server.dataSources.cc_mysql;
ds.setMaxListeners(0);

var lbAllModels = _.map(server._models, 'modelName');

var lbMyModels = lbAllModels.filter(function(value, index) {
  return !builtInModelNames.includes(value);
});

ds.automigrate(lbMyModels, function(er) {
  if (er) throw er;

  ds.disconnect();
});
