'use strict';
const loginController = require('../controllers/authen/login');

module.exports = function(server) {
  // Install a `/` route that returns server status

  var router = server.loopback.Router();
  var restApiRoot = server.get('restApiRoot');

  router.post(`${restApiRoot}/login`, loginController);

  server.use(router);
};
