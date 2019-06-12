'use strict';

const debug = require('debug')('util.js');
const app = require('../../../server');
const mysql_db = app.dataSources.cc_mysql;
const Promise = require('bluebird');

module.exports = async function(WorkbookDelivery) {
  WorkbookDelivery.observe('before save', async function(ctx, next) {
    var instance = ctx.instance || ctx.currentInstance;
    instance.user_id = _.get(ctx, 'options.current_user_id');
  });
};
