'use strict';
const loginController = require('../controllers/authen/login');
const resiseImageOnFlyController = require('../controllers/item/resizeImageOnFly');

module.exports = function(server) {
  // Install a `/` route that returns server status

  var router = server.loopback.Router();
  var restApiRoot = server.get('restApiRoot');

  router.post(`${restApiRoot}/login`, loginController);

  //resize image on fly
  router.get(
    `${process.env.API_RESIZE_IMAGE_ROOT_URL}/?*`,
    resiseImageOnFlyController
  );

  server.use(router);
};
