'use strict';
const loginController = require('../controllers/authen/login');
const resiseImageOnFlyController = require('../controllers/item/resizeImageOnFly');
const {
  moveItemPositionController
} = require('../controllers/workbook/moveItemPositionController');
const {workbook_published} = require('../controllers/workbook/workbook_publish_status');

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

  //move position of a workbook/chapter/page from this parent to another parent.
  router.patch(
    `${restApiRoot}/:scope_model/:scope_model_id/move_from/:from_parent_model_id/move_to/:to_parent_model_id/at_position/:to_model_id?`,
    moveItemPositionController
  );

  //workbook was published
  router.get(
    `${restApiRoot}/workbooks`,
    workbook_published
  );


  server.use(router);
};
