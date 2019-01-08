'use strict';
const loginController = require('../controllers/authen/login');
const resiseImageOnFlyController = require('../controllers/item/resizeImageOnFly');
const {
  moveItemPositionController
} = require('../controllers/moveItemPositionController');

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

  //-----------workbook
  //move position of a chapter/page/item within a corresponding workbook/chapter/page
  router.patch(
    `${restApiRoot}/:scope_model/:scope_model_id/:from_model/:from_model_id/:action/:to_model_id?`,
    moveItemPositionController
  );

  server.use(router);
};
