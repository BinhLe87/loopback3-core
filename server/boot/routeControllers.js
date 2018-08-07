'use strict';
var uploadItemController = require('../controllers/item/uploadItem');

module.exports = function(server) {
  // Install a `/` route that returns server status

  var router = server.loopback.Router();
  var restApiRoot = server.get('restApiRoot');

  router.post(`${restApiRoot}/item/upload`, uploadItemController);

  server.use(router);
};
