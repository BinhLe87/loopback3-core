var server = require('../server');
var _ = require('lodash');

var ds = server.dataSources.cc_mysql;
var lbBuildInTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];

var lbAllTables = _.map(server._models, 'modelName');
var lbMyTables = _.xor(lbAllTables, lbBuildInTables);

ds.automigrate(lbMyTables, function (er) {
    if (er) throw er;
    console.log('Loopback tables [' - lbMyTables - '] created in ', ds.adapter.name);
    ds.disconnect();
});