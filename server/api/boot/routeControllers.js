'use strict';
const loginController = require('../controllers/authen/login');
const resiseImageOnFlyController = require('../controllers/item/resizeImageOnFly');
const {
  moveChapterPositionController,
  swapTwoChapterPositionsController
} = require('../database/models/mysql/workbook-chapter.util');

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
  //move chapter position within a workbook
  router.patch(
    `${restApiRoot}/workbooks/:workbookId/chapters/:chapterId/move/:destChapterId?`,
    moveChapterPositionController
  );
  //swap two chapter positions within a workbook
  router.patch(
    `${restApiRoot}/workbooks/:workbookId/chapters/:chapterId/swap/:destChapterId?`,
    swapTwoChapterPositionsController
  );

  server.use(router);
};
