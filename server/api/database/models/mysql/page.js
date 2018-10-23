'use strict';

module.exports = function(Page) {
  Page.beforeRemote('prototype.__create__items', function(
    ctx,
    modelInstance,
    next
  ) {
    console.log(modelInstance);
    next();
  });
};
