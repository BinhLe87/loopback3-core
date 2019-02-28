'use strict';

const { apply_hot_fix } = require('../helpers/loopbackUtil');

module.exports = async function(server) {
  apply_hot_fix();

  customize_mysql_connector_buildOrderBy(server);
};

function customize_mysql_connector_buildOrderBy(server) {
  server.dataSources.ccMysql.connector.buildOrderBy = function(model, order) {
    if (!order) {
      return '';
    }

    if (/FIELD\(.*\)/.test(order)) {
      //for ORDER BY FIELD(...) => process nothing
      return 'ORDER BY ' + order;
    }

    var self = this;
    if (typeof order === 'string') {
      order = [order];
    }
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
