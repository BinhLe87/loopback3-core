'use strict';

module.exports = function(Chapter) {
  Chapter.observe('loaded', async function(ctx) {
    ctx.options.vi_tri = 998;
  });

  Chapter.beforeRemote('prototype.__get__pages', async function(
    ctx,
    modelInstance
  ) {
    ctx.args.options.vi_tri_remote = Math.random();
  });
};
