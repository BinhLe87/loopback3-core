const _ = require('lodash');

module.exports = function(app) {
  //   const db_name = process.env.DATABASE_NAME;
  //   const mysql_db = app.dataSources.cc_mysql;
  //   if (!db_name || !mysql_db) return;
  //   _.forOwn(indexes, (table_indexes, table_name) => {
  //     for(let index_obj of table_indexes) {
  //         //check whether the index exists or not
  //         const check_index_exists_sql = `SELECT COUNT(1) IndexIsThere FROM INFORMATION_SCHEMA.STATISTICS
  //             WHERE table_schema='${db_name}' AND table_name='${table_name}' AND index_name='${index_obj.index_name}'`;
  //         mysql_db.connector.execute(check_index_exists_sql, (err, result) => {
  //             if (err) {
  //                 logger.error(err);
  //                 return;
  //               }
  //             if (result && result[0] && result[0].IndexIsThere === 0) { //the index doesn't exists => create index
  //               let create_index_sql = `CREATE FULLTEXT INDEX ${index_obj.index_name} ON ${table_name}(${index_obj.index_column})`;
  //              //mysql_db.connector.execute(create_index_sql, __exec_cb_only_log);
  //             }
  //         });
  //     }
  //   })
};

//object key is table name, object value is array of column indexes
const indexes = {
  workbook: [
    {
      index_name: 'workbook_title_idx',
      index_column: 'title'
    },
    {
      index_name: 'workbook_description_idx',
      index_column: 'description'
    }
  ]
};

function __exec_cb_only_log(err, result) {
  if (err) {
    logger.error(err);
    return;
  }

  logger.info(result);
}
