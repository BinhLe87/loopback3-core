const _ = require('lodash');

module.exports = function(app) {
  app
    .remotes()
    .phases.addBefore('invoke', 'add-request-to-options')
    .use(function(ctx, next) {
      _.set(ctx, 'args.options.req', ctx.req);
      _.set(ctx, 'args.options.current_user_id', ctx.args.options.accessToken.userId);
      next();
    });
};
