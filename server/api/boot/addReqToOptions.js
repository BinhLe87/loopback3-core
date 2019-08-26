const _ = require('lodash');

module.exports = function(app) {
  app
    .remotes()
    .phases.addBefore('invoke', 'add-request-to-options')
    .use(function(ctx, next) {
      var current_user_id = _.get(ctx, 'args.options.accessToken.userId');

      _.set(ctx, 'args.options.req', ctx.req);
      _.set(ctx, 'args.options.res', ctx.res);
      if (current_user_id) {
        _.set(ctx, 'args.options.current_user_id', current_user_id);
      }

      //set user_id back to req
      // var req = ctx.req;
      // req.cc_options = {};
      // req.cc_options.user_id = current_user_id;

      next();
    });
};
