'use strict';
const adminUtil = require('../database/models/mysql/admin.util');

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  adminUtil
    .create_admin_account()
    .then()
    .catch(create_admin_error => {
      logger.error('Failed to create admin account');
      logger.error(create_admin_error);
    });
};
