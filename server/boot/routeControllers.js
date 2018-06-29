'use strict';
var uploadItemController = require('../controllers/uploadItem');

module.exports = function(server) {
  // Install a `/` route that returns server status
  
  var router = server.loopback.Router();
  var restApiRoot = server.get('restApiRoot');

  router.post(`${restApiRoot}/uploadItem`, uploadItemController);

  server.use(router);
};
