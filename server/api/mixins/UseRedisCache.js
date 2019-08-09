'use strict';
var app = require('../server');
const Connection = require('mysql/lib/Connection');
const crypto = require('crypto');


//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

module.exports = function(Model, options) {
  Model.observe('access', async function(ctx) {
    try {
      var model_name = ctx.Model.modelName;
      var ctx_query = ctx.query;
      var cc_mysql_connector = app.dataSources.cc_mysql.connector;

      //MARK: build sql query object
      var query_object = cc_mysql_connector.buildSelect(
        model_name,
        ctx_query,
        {}
      );

      //MARK: build sql string
      var dummy_mysql_connection = new Connection({ config: {} });
      var sql_query = Connection.createQuery(
        query_object.sql,
        query_object.params
      );
      var query_string = dummy_mysql_connection.format(
        sql_query.sql,
        sql_query.values
      );

      //MARK: hash query string
      var query_string_hash = crypto.createHash('sha1').update(query_string).digest('base64');

      console.log(query_string_hash);
    } catch (error) {
      logger.warn(error);
    }
  });
};
