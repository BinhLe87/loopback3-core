'use strict';
var app = require('../server');
const Connection = require('mysql/lib/Connection');
const crypto = require('crypto');
const Promise = require('bluebird');
const { redis } = require('@cc_server/utils');

//Ref: https://loopback.io/doc/en/lb3/Customizing-models.html
//Ref: https://loopback.io/doc/en/lb3/Defining-mixins.html

var cc_mysql_connector = app.dataSources.cc_mysql.connector;
const REDIS_EXPIRE_TIME = process.env.REDIS_EXPIRE_TIME || 1*60*60; //in seconds

const cc_mysql_connector_all_origin = cc_mysql_connector.all; //save origin call() for restore later
cc_mysql_connector.all = async function find(model, filter, options, cb) {
  var should_use_cache = _.get(options, 'should_use_cache', false);
  var model_name = model;

  const cc_mysql_connector_execute_promise = Promise.promisify(
    cc_mysql_connector.execute
  ).bind(cc_mysql_connector);

  //MARK: build sql query object
  var query_object = cc_mysql_connector.buildSelect(model, filter, options);

  //MARK: build sql string
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
  var redis_key = query_string_hash;


  if (should_use_cache) {
     Promise.any([
      readFromRedisCache(redis_key),
      cc_mysql_connector_execute_promise(
        query_object.sql,
        query_object.params,
        options
      )
    ])
      .then((data) => {
        
        var is_data_from_redis = _.get(data, 'source_data') === 'redis' ? true: false;
        var objs;
        if (!is_data_from_redis) { //data from mysql

          objs = data.map((obj) => {
            return this.fromRow(model, obj);
          });

          //MARK: save into redis cache for use later
          if(!_.isEmpty(objs)) {

            redis.set(redis_key, JSON.stringify(objs), REDIS_EXPIRE_TIME);         
          }
        } else { //data from redis
          objs = _.get(data, 'data');
          objs = objs ? JSON.parse(objs) : {};
        }

        if (filter && filter.include) {
          this.getModelDefinition(model).model.include(
            objs, filter.include, options, cb);
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
  Model.observe('access', async function(ctx) {
    try {
      _.set(ctx, 'options.should_use_cache', true);

    

      // Model.notifyObserversOf('loaded', context, function(err) {
      //   console.log(err);
      // });
    } catch (error) {
      logger.warn(error);
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
