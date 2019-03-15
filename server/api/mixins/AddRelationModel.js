'use strict';

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html
var { logger } = require('../../errors/errorLogger');

module.exports = function(Model, options) {
  Model.observe('loaded', async function(ctx) {
    var data = ctx.data;

    if (!data) return;

    const relation_model_regx = /(.*)_(.*)/;
    var relation_model_regx_result = relation_model_regx.exec(ctx.Model.name);

    var is_relation_model = data && relation_model_regx_result;

    if (is_relation_model) {
      var destination_model = relation_model_regx_result[2];
      var destination_model_id = data[`${destination_model}Id`];

      if (!destination_model_id) {
        logger.warn(
          `Not found any value for destination_model_id with name is ${destination_model}Id}`
        );
        return;
      }

      var relation_model_properties = {};
      ctx.Model.forEachProperty((key, value) => {
        relation_model_properties[key] = data[key];
      });

      if (data[destination_model]) {
        //Ex: query via `/api/chapters/1/pages`

        data[destination_model]._relation_model = relation_model_properties;
      } else {
        //Ex: query via `/api/chapters/1?filter={"include": "pages"}`

        ctx.options.cc_hook_options = ctx.options.cc_hook_options || {};
        ctx.options.cc_hook_options._relation_model =
          ctx.options.cc_hook_options._relation_model || {};
        ctx.options.cc_hook_options._relation_model[
          destination_model_id
        ] = relation_model_properties;
      }
    } else {
      //if this is not relation model, but probably still be in relationship like A-B-C, it may be A or C model
      //check and receive relation model data if exists
      var options = ctx.options;
      var cc_hook_options = options && options.cc_hook_options;
      var _relation_model = cc_hook_options && cc_hook_options._relation_model;

      if (_relation_model) {
        //receive value via `key` is model id
        if (data.id && _relation_model[data.id]) {
          data._relation_model = _relation_model[data.id];
        }
      }
    }
  });
};
