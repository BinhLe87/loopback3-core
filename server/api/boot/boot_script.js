'use strict';

const { apply_hot_fix } = require('../helpers/loopbackUtil');



module.exports = async function(server) {
  //apply_hot_fix();

  customize_mysql_connector_buildOrderBy(server);

  //disable mysql prints protocol details to stdout
  var cc_mysql_connector = server.dataSources.cc_mysql.connector;
  cc_mysql_connector.settings.debug = false;
};

function customize_mysql_connector_buildOrderBy(server) {
  server.dataSources.ccMysql.connector.buildOrderBy = function(model, order) {
    if (typeof order === 'string') {
      order = [order];
    }

    if (!order || order.length == 0) {
      return '';
    }

    var order_string = order.join(',');

    if (/FIELD\(.*\)/.test(order_string)) {
      //for ORDER BY FIELD(...) => process nothing
      return 'ORDER BY ' + order.join(',');
    }

    var self = this;

    var clauses = [];
    for (var i = 0, n = order.length; i < n; i++) {
      var t = order[i].split(/[\s,]+/);
      if (t.length === 1) {
        clauses.push(self.columnEscaped(model, order[i]));
      } else {
        clauses.push(self.columnEscaped(model, t[0]) + ' ' + t[1]);
      }
    }
    return 'ORDER BY ' + clauses.join(',');
  };
}
