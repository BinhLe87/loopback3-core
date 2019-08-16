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

  const cc_mysql_connector_execute_promise = Promise.promisify(
    cc_mysql_connector.execute
  ).bind(cc_mysql_connector);

  var query_object = cc_mysql_connector.buildSelect(model, filter, options);


  if (should_use_cache && redis_key) {
    Promise.any([
      readFromRedisCache(redis_key),
      cc_mysql_connector_execute_promise(
        query_object.sql,
        query_object.params,
        options
      )
    ])
      .then(data => {
        var is_data_from_redis =
          _.get(data, 'source_data') === 'redis' ? true : false;
        var objs;
        if (!is_data_from_redis) {
          //data from mysql

          objs = data.map(obj => {
            return this.fromRow(model, obj);
          });

          //MARK: save into redis cache for use later
          if (!_.isEmpty(objs) && redis_key) {
            redis.set(redis_key, JSON.stringify(objs), REDIS_EXPIRE_TIME);
          }
        } else {
          //data from redis
          objs = _.get(data, 'data');
          objs = objs ? JSON.parse(objs) : {};
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

      if(!shouldCache(ctx)) return;

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
      var query_string_hash = crypto.createHash('sha1').update(query_string).digest('base64');
      var instance_id = _.get(ctx, 'query.where.id');
      var redis_key = generateRedisCache(model_name, instance_id);


      //for use in operation hooks
      _.set(ctx, 'hookState.should_use_cache', true);
      _.set(ctx, 'hookState.redis_key', redis_key); 
      _.set(ctx, 'hookState.query_string_hash', query_string_hash); 
      //for use in model hooks
      _.set(ctx, 'options.should_use_cache', true);
      _.set(ctx, 'options.redis_key', redis_key); 
      _.set(ctx, 'options.query_string_hash', query_string_hash); 

      next();
    } catch (error) {
      logger.warn(error);
    }
  });

  Model.observe('after save', async function(ctx) {
    var instance = ctx.instance;
    var instance_data = _.get(instance, 'data');
    var instance_id = _.get(instance, 'id');
    var model_name = ctx.Model.modelName;

    if(shouldCache(ctx)) {

      var redis_key = generateRedisCache(model_name, instance_id);
      var should_use_cache = _.get(ctx, 'hookState.should_use_cache', false);
    
      if (should_use_cache && redis_key && instance_data) {
    
        setRedisCache(redis_key, instance_data);
      }
    }


   
  });

  Model.observe('after delete', async function(ctx) {
    var instance = ctx.instance;
    var instance_data = _.get(instance, 'data');
    var redis_key = _.get(ctx, 'hookState.redis_key');
    var should_use_cache = _.get(ctx, 'hookState.should_use_cache', false);
  
    if (should_use_cache && redis_key && instance_data) {
  
      setRedisCache(redis_key, instance_data);
    }
  });
};



async function readFromRedisCache(key) {
  var value = await redis.get(key);

  if (!value) throw new Error(`Not found value with redis key '${key}'`);

  return {
    source_data: 'redis',
    data: value
  };
}

async function setRedisCache(key, value, expire_time=REDIS_EXPIRE_TIME) {

  redis.set(key, value, expire_time);
}
/**
 *
 *
 * @param {*} model_name
 * @param {*} model_id
 * @param {object,any} other_key_params object or series of object
 * @returns
 */
function generateRedisCache(model_name, model_id, ...other_key_params) {

  if (_.isEmpty(other_key_params)) {

    return `${model_name}:${model_id}`;
  } else {

    var other_key_string = _.reduce(other_key_params, (accu, value) => {
        if (_.isPlainObject(value)) {
          _.forOwn(value, (obj_value, obj_key) => {

            accu += (_.isEmpty(accu) ? '' : ':') + `${obj_key}:${obj_value}`;
          });
        }

        return accu;
    }, '');

    return `${model_name}:${model_id}${_.isEmpty(other_key_string) ? '' : (':' + other_key_string)}`;
  }
}

function shouldCache(ctx) {

  var instance_id = _.get(ctx, 'query.where.id') || _.get(ctx, 'instance.id');
  var should_cache = !!instance_id;

  return should_cache;
}
