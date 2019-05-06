'use strict';

module.exports = function(Version) {
  Version.observe('loaded', async function(ctx) {
    // check if version details
    var params = ctx.options.req.params;

    if (params.fk) {
      // do nothing
    } else {
      ctx.data.content = {};
    }

    return;
  });
};
