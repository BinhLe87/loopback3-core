module.exports = function(app) {
  const db_name = process.env.DATABASE_NAME;

  if (!db_name) return;

  const mysql_db = app.dataSources.cc_mysql;
  const tb_name = `item`;
  const col_name = `item_attributes`;

  const db_stmt = `ALTER DATABASE ${db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
  const tb_stmt = `ALTER TABLE ${tb_name} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
  const col_stmt = `ALTER TABLE ${tb_name} MODIFY ${col_name} TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

  mysql_db.connector.execute(db_stmt, _exec_cb);
  mysql_db.connector.execute(tb_stmt, _exec_cb);
  mysql_db.connector.execute(col_stmt, _exec_cb);

  function _exec_cb(err, result) {
    if (err) {
      logger.error(err);
    }
  }
};
