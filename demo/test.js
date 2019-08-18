const {parseRedisKey} = require('../packages/utils/lib/redisUtil');
const _ = require('lodash');

function generateRedisCache(model_name, model_id, result_keys_param = [], ...other_key_params) {

  if (Array.isArray(model_id)) {
    _.forEach(model_id, model_id_ele => {

      generateRedisCache(model_name, model_id_ele, result_keys_param, ...other_key_params);
    });

    return result_keys_param;
  }


  if (_.isEmpty(other_key_params)) {
    result_keys_param.push(`${model_name}:${model_id}`);
  } else {
    var other_key_string = _.reduce(
      other_key_params,
      (accu, value) => {
        if (_.isPlainObject(value)) {
          _.forOwn(value, (obj_value, obj_key) => {
            accu += (_.isEmpty(accu) ? '' : ':') + `${obj_key}:${obj_value}`;
          });
        }

        return accu;
      },
      ''
    );

    result_keys_param.push(`${model_name}:${model_id}${
      _.isEmpty(other_key_string) ? '' : ':' + other_key_string
    }`);
  }

  return result_keys_param;
}


var key_cache = generateRedisCache('model_name', 1, [], {key: "value"});

console.log(key_cache);
