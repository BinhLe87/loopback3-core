const _ = require('lodash');

module.exports = function(app) {
 
    var cc_mysql_connector = app.dataSources.cc_mysql.connector;

    forceUseRawSQLQueryString(cc_mysql_connector);
};

function forceUseRawSQLQueryString(sql_connector) {

    if (sql_connector) {

        var origin_buildSelect = sql_connector.buildSelect;

        //return instance of ParameterizedSQL has format {sql: '...', params: [...]}
        sql_connector.buildSelect =  function(model, filter, options) {

            var sql_query = _.get(options, 'req.cc_options.sql_query', {});
            if (sql_query.sql) {

                return {
                    sql: sql_query.sql,
                    params: _.get(sql_query, 'params', [])
                }
            }

            return origin_buildSelect.apply(sql_connector, arguments);
        }
    }
}
