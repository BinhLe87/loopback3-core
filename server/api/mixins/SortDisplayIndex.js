'use strict';

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

module.exports = function(Model, options) {
  Model.observe('access', async function(ctx) {
    var orders_array = _.get(ctx, 'query.order', []);
    if (!Array.isArray(orders_array)) {
      orders_array = [orders_array];
    }

    //maintain order in MySQL as 'IN' query
    var array_in_query = _find_inq_operator(_.get(ctx, 'query.where', {}));
    if (!_.isEmpty(array_in_query)) {
      orders_array = [...orders_array, ...array_in_query];
    }

    //set default order as `display_index ASC` if this model has 'display_index' property
    if (ctx.Model.getPropertyType('display_index')) {
      //exists display_index property

      orders_array.push('display_index ASC');
      orders_array.push('updatedAt DESC'); //in case many elements has equal position, it further sorts by updatedAt desc
    }

    _.set(ctx, 'query.order', orders_array);
  });

  /////////////
  function _find_inq_operator(query, parent_key, order_by_field_query = []) {
    if (_.isPlainObject(query)) {
      _.forOwn(query, (value, key) => {
        if (key == 'inq') {
          order_by_field_query.push(`FIELD(\`${parent_key}\`,${value.join()})`);
        } else {
          _find_inq_operator(value, key, order_by_field_query);
        }
      });
    }

    return order_by_field_query;
  }
};
