module.exports = function(app) {
  app
    .remotes()
    .phases.addBefore('invoke', 'add-request-to-options')
    .use(function(ctx, next) {
      ctx.args.options.req = ctx.req;
      next();
    });
};
