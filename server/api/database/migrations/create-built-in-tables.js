process.env.SERVICE_NAME = 'tes';
process.env.NODE_ENV = 'development';

var server = require('../../server');
var _ = require('lodash');
const { builtInModelNames } = require('../../helpers/loopbackUtil');

var ds = server.dataSources.cc_mysql;
//ds.setMaxListeners(0);

var lbAllModels = _.map(server._models, 'modelName');

var lbBuiltInModels = lbAllModels.filter(function(value, index) {
  return builtInModelNames.includes(value);
});

ds.automigrate(lbBuiltInModels, function(er) {
  if (er) throw er;

  ds.disconnect();
});
