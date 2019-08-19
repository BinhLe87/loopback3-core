'use strict';
var app = require('../server');
const Connection = require('mysql/lib/Connection');
const crypto = require('crypto');
const Promise = require('bluebird');
const { redis } = require('@cc_server/utils');

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

var cc_mysql_connector = app.dataSources.cc_mysql.connector;
const REDIS_EXPIRE_TIME = process.env.REDIS_EXPIRE_TIME || 1 * 60 * 60; //in seconds

const cc_mysql_connector_all_origin = cc_mysql_connector.all; //save origin call() for restore later
cc_mysql_connector.all = function find(model, filter, options, cb) {
  var should_use_cache = _.get(options, 'should_use_cache', false);
  var redis_key = _.get(options, 'redis_key');
  var model_name = model;

  const queryMySQL = Promise.promisify(cc_mysql_connector.execute).bind(
    cc_mysql_connector
  );

  var query_object = cc_mysql_connector.buildSelect(model, filter, options);

  var promise_array = [];
  const req_method = _.get(options, 'req.method');
  if (!_.isEmpty(redis_key) && should_use_cache) {
    //if it's DELETE request method, ignore reading from redis cache because it may be expired thus not found
    promise_array.push(readFromRedisCache(redis_key));
  }

  if (should_use_cache) {
    Promise.any([
      ...promise_array,
      queryMySQL(query_object.sql, query_object.params, options).then(data => {
        let objs = data.map(obj => {
          return this.fromRow(model, obj);
        });

        redis_key = generateRedisKeys(model_name, objs.map(ele => ele.id));

        //MARK: save into redis cache for use later
        if (!_.isEmpty(objs) && redis_key) {
          setRedisCacheForKeyArray(redis_key, objs);
        }

        return objs;
      })
    ])
      .then(data => {
        var is_data_from_redis =
          _.get(data, 'source_data') === 'redis' ? true : false;
        var objs = data;

        //MARK: read data from redis
        //convert data
        if (is_data_from_redis) {
          objs = _.get(data, 'data');
          objs = _.isEmpty(objs)
            ? []
            : objs.map(value => {
                return JSON.parse(value);
              });

          //mark `x-cache` flag in response header
          var ctx_res = _.get(options, 'res', {});
          ctx_res && ctx_res.set('CC-Cache', 'cached');
        }

        if (filter && filter.include) {
          this.getModelDefinition(model).model.include(
            objs,
            filter.include,
            options,
            cb
          );
        } else {
          cb(null, objs);
        }
      })
      .catch(function(err) {
        return cb(err, []);
      });
  } else {
    cc_mysql_connector_all_origin.apply(cc_mysql_connector, arguments);
  }
};

module.exports = function(Model, options) {
  Model.observe('access', function(ctx, next) {
    try {
      var model_name = ctx.Model.modelName;
      var ctx_query = ctx.query;

      //MARK: generate redis_key from sql query string
      var query_object = cc_mysql_connector.buildSelect(
        model_name,
        ctx_query,
        {}
      );

      var dummy_mysql_connection = new Connection({ config: {} });
      var sql_query = Connection.createQuery(
        query_object.sql,
        query_object.params
      );
      var query_string = dummy_mysql_connection.format(
        sql_query.sql,
        sql_query.values
      );

      //MARK: hash query string
      var query_string_hash = crypto
        .createHash('sha1')
        .update(query_string)
        .digest('base64');
      var instance_id = extractInstanceID(ctx);
      var redis_key = generateRedisKeys(model_name, instance_id);

      //for use in operation hooks
      const req_method = _.get(ctx, 'options.req.method');
      const should_use_cache = !/DELETE/i.test(req_method); //not cache if this's DELETE request

      _.set(ctx, 'hookState.should_use_cache', should_use_cache);
      _.set(ctx, 'hookState.redis_key', redis_key);
      _.set(ctx, 'hookState.query_string_hash', query_string_hash);
      //for use in model hooks
      _.set(ctx, 'options.should_use_cache', should_use_cache);
      _.set(ctx, 'options.redis_key', redis_key);
      _.set(ctx, 'options.query_string_hash', query_string_hash);

      next();
    } catch (error) {
      logger.warn(error);
    }
  });

  Model.observe('after save', async function(ctx) {
    var instance = ctx.instance;
    var instance_data = _.get(instance, '__data');
    var instance_id = extractInstanceID(ctx);
    var model_name = ctx.Model.modelName;

    var redis_key = generateRedisKeys(model_name, instance_id);

    if (redis_key && instance_data) {
      setRedisCacheForKeyArray(redis_key, instance_data);
    }
  });

  Model.observe('after delete', async function(ctx) {
    var instance_id = extractInstanceID(ctx);
    var model_name = ctx.Model.modelName;

    var redis_key = generateRedisKeys(model_name, instance_id);
    delRedisCache(redis_key);
  });

  Model.createOptionsFromRemotingContext = function(ctx) {
    return {
      req: ctx.req,
      res: ctx.res
    };
  };
};

/**
 * read one or many redis keys at once
 *
 * @param {string|array} keys
 * @returns {array} array of key values. Reject if at least one key not found
 */
async function readFromRedisCache(keys) {
  return new Promise((resolve, reject) => {
    redis
      .getMultipleKeys(keys)
      .then(function(results) {
        var not_found_values_count = results.filter(result => _.isNil(result))
          .length;

        if (not_found_values_count === 0) {
          resolve({
            source_data: 'redis',
            data: results
          });
        } else {
          reject();
        }
      })
      .catch(error => {
        logger.warn(
          `Something wrong when reading redis caches with keys ${keys}`
        );
        logger.warn(error);
        reject(error);
      });
  });
}

/**
 * Set redis value for one or many keys at once
 *
 * @param {array} key array of keys
 * @param {array} value array of corresponding values. Only set cache for key has value is found.
 * @param {*} [expire_time=REDIS_EXPIRE_TIME]
 */
async function setRedisCacheForKeyArray(
  key,
  value,
  expire_time = REDIS_EXPIRE_TIME
) {
  if (Array.isArray(key)) {
    _.forEach(key, key_ele => {
      //parse id from key string
      var parsed_id_result = /id:([^:]*)/gi.exec(key_ele);

      if (!_.isNull(parsed_id_result)) {
        var parsed_id = parsed_id_result[1];
        var found_value =
          _.find(value, value_ele => {
            if (!_.isNil(_.get(value_ele, 'id'))) {
              var converted_parsed_id = _.isNumber(value_ele.id)
                ? parseInt(parsed_id, 10)
                : parsed_id;
              return value_ele.id === converted_parsed_id;
            }
            return false;
          }) || value;

        if (found_value) {
          _setRedisCache(key_ele, found_value, expire_time);
        }
      }
    });
  } else if (_.isString(key) && !_.isEmpty(value)) {
    _setRedisCache(key, value, expire_time);
  } else {
    logger.warn(
      `Redis key ${key} has invalid type ${typeof key} or value is ${value}`
    );
  }
}

async function _setRedisCache(key, value, expire_time = REDIS_EXPIRE_TIME) {
  if (!_.isNil(value)) {
    redis.set(key, JSON.stringify(value), expire_time);
  }
}

/**
 * delete one or many keys at once
 *
 * @param {array|string} key
 */
async function delRedisCache(key) {
  if (Array.isArray(key)) {
    _.forEach(key, key_ele => {
      return delRedisCache(key_ele);
    });
  }

  redis.del(key);
}
/**
 * generate array of one or many redis keys
 *
 * @param {*} model_name
 * @param {string|array} model_id may be string or array type
 * @param {object,any} other_key_params object or series of object
 * @returns {array} array of keys. The array may has one element if model_id is string
 */
function generateRedisKeys(
  model_name,
  model_id,
  result_keys_param = [],
  ...other_key_params
) {
  if (_.isNil(model_id)) return undefined;

  if (Array.isArray(model_id)) {
    _.forEach(model_id, model_id_ele => {
      generateRedisKeys(
        model_name,
        model_id_ele,
        result_keys_param,
        ...other_key_params
      );
    });

    return result_keys_param;
  }

  if (_.isEmpty(other_key_params)) {
    result_keys_param.push(`${model_name}:id:${model_id}`);
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

    result_keys_param.push(
      `${model_name}:${model_id}${
        _.isEmpty(other_key_string) ? '' : ':' + other_key_string
      }`
    );
  }

  return result_keys_param;
}
/**
 * extract instance_id(s) from ctx instance
 *
 * @param {*} ctx
 * @returns {array} return array of instance_ids
 */
function extractInstanceID(ctx) {
  var instance_id = _.get(ctx, 'query.where.id') || _.get(ctx, 'instance.id');

  if (_.isNil(instance_id)) return undefined;

  return _.get(instance_id, 'inq')
    ? _.get(instance_id, 'inq')
    : _.castArray(instance_id);
}
