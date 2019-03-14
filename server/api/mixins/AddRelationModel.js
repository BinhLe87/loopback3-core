'use strict';

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

module.exports = function(Model, options) {
  Model.observe('loaded', async function(ctx) {
    var data = ctx.data;
    const relation_model_regx = /(.*)_(.*)/;
    var relation_model_regx_result = relation_model_regx.exec(ctx.Model.name);

    if (data && relation_model_regx_result) {
      var destination_model = relation_model_regx_result[2];
      var destination_model_id = data[`${destination_model}Id`];

      if (!destination_model_id) {
        logger.warning(
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

        data.cc_hook_options = {};
        //FIXME: push in array rather than update on property value???
        data.cc_hook_options._relation_model = relation_model_properties;
      }
    }
  });
};
