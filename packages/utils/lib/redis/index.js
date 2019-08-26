var redis = require("redis");
var { logger } = require("@cc_server/logger");
var { inspect } = require("../printHelper");
var { promisify } = require("util");
const uuidv4 = require("uuid/v4");
const _ = require("lodash");
const Promise = require("bluebird");

var client = client ? client : create_redis_client();
var client_duplicate;

var selected_database_id = 0; //default selected db is 0
const KEY_FORMAT_REGX = /.*:.*:?.*/i;
const getAsync = (target_client = client) =>
  promisify(target_client.get).bind(target_client);
const delAsync = (target_client = client) =>
  promisify(target_client.del).bind(target_client);

const EXPIRED_EVENT_NAME = "__keyevent@0__:expired";
//define mappping between key_event_name and key_event_shorthand
const EVENT_NOTIFICATION_MAPPING = {
  [EXPIRED_EVENT_NAME]: "Ex"
};
var callback_key_mapping = {};

module.exports = exports = {};
exports.redis_client = client;
exports.set = set;
exports.get = get;
exports.getMultipleKeys = getMultipleKeys;
exports.del = del;
exports.subcribe_notify_keyspace_event = subcribe_notify_keyspace_event;
exports.EXPIRED_EVENT_NAME = EXPIRED_EVENT_NAME;
exports.generate_key = generate_key;
exports.generate_unique_key = generate_unique_key;
exports.register_callback_for_key = register_callback_for_key;
exports.unregister_callback_for_key = unregister_callback_for_key;
exports.generate_client_duplicate = generate_client_duplicate;

/**
 *
 *
 * @param {number} [default_database_id=0]
 * @param {boolean} [should_use_client_cache=true]
 * @param {object} [connection_options.redis_host] redis host
 * @param {object} [connection_options.redis_port] redis port
 * @returns
 */
function create_redis_client(
  default_database_id = 0,
  should_use_client_cache = true,
  connection_options = {}
) {
  if (should_use_client_cache && client) return client;

  var redis_options = {
    host: connection_options.redis_host || process.env.REDIS_HOST,
    port: connection_options.redis_port || process.env.REDIS_PORT
  };
  if (process.env.REDIS_PASSWORD) {
    redis_options.password = process.env.REDIS_PASSWORD;
  }

  client = redis.createClient(redis_options);

  client.select(default_database_id, (err, res) => {
    if (err) {
      logger.error(
        `Unable to select database id ${default_database_id} in Redis server at ${_get_redis_identity()}`
      );
      logger.error(err);
    } else {
      logger.info(
        `Successfully select database id ${default_database_id} in Redis server at ${_get_redis_identity()}`
      );
      logger.info(res);
      selected_database_id = default_database_id;
    }
  });

  return client;
}

function generate_client_duplicate(should_use_client_duplicate_cache = true) {
  if (!client) return null;

  if (should_use_client_duplicate_cache && client_duplicate) {
    return client_duplicate;
  }

  client_duplicate = client.duplicate();

  return client_duplicate;
}

function set(key_name, key_value, expire_in_seconds) {
  var key_value_string = key_value;
  if (typeof key_value == "object") {
    key_value_string = JSON.stringify(key_value);
  }

  validate_key_format(key_value_string);

  client.set(key_name, key_value_string);

  if (expire_in_seconds && typeof expire_in_seconds == "number") {
    client.expire(key_name, expire_in_seconds);
  }
}

async function get(key_name) {
  //client is being in subcribe, so you must create another client instance in order to be able to fetch key
  var target_client =
    client.pub_sub_mode > 0 ? generate_client_duplicate() : client;

  return getAsync(target_client)(key_name);
}

/**
 * get multiple redis keys at once
 *
 * @param {array|string} keys array of keys
 * @returns {array} array of corresponding values
 */
async function getMultipleKeys(keys) {
  //client is being in subcribe, so you must create another client instance in order to be able to fetch key
  var target_client =
    client.pub_sub_mode > 0 ? generate_client_duplicate() : client;

  if (Array.isArray(keys)) {
    var keys_promise_array = keys.map(key => {
      return getAsync(target_client)(key);
    });

    return Promise.all(keys_promise_array);
  } else if (_.isString(keys)) {
    var result = await get(keys);
    return _.castArray(result);
  } else {
    return null;
  }
}

function del(key_name) {
  //client is being in subcribe, so you must create another client instance in order to be able to fetch key
  var target_client =
    client.pub_sub_mode > 0 ? generate_client_duplicate() : client;

  delAsync(target_client)(key_name);
}

function subcribe_notify_keyspace_event(event_name) {
  if (!EVENT_NOTIFICATION_MAPPING[event_name]) {
    reject(
      `Must pre-defined event_name ${event_name} in variable 'EVENT_NOTIFICATION_MAPPING'`
    );
  }

  client.config(
    "SET",
    "notify-keyspace-events",
    EVENT_NOTIFICATION_MAPPING[event_name]
  );

  client.subscribe(event_name);
}

client.on("error", function(err) {
  if (err) {
    logger.error(
      `Redis server has something wrong at ${_get_redis_identity()}`
    );
    logger.error(err);
  }
});

client.on("subscribe", function(channel, count) {
  logger.info(
    `Redis client start subscribing database ${selected_database_id} on channel ${inspect(
      channel
    )}`
  );
});

client.on("message", async function(channel, key) {
  logger.info(
    `received message via subscribing channel ${inspect(channel)}:${key}`
  );

  const [type, ...key_origin_without_prefix_reminder_arr] = key.split(":");
  var key_origin_without_prefix_reminder = key_origin_without_prefix_reminder_arr.join(
    ":"
  );

  var callback = callback_key_mapping[key_origin_without_prefix_reminder];

  if (callback && typeof callback == "function") {
    var value = await get(key_origin_without_prefix_reminder);
    logger.info(
      `Received 'reminder' type with key '${key_origin_without_prefix_reminder}' and value '${value}'`
    );
    callback_key_mapping[key_origin_without_prefix_reminder](
      key_origin_without_prefix_reminder,
      value
    );
  }
});

function _get_redis_identity() {
  return `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
}
/**
 * validate and throw error if key is invalid format
 *
 * @param {string} key
 * @returns {true|error} throw error if key is invalid format, otherwise return true.
 */
function validate_key_format(key) {
  var is_valid = KEY_FORMAT_REGX.test(key);
  if (is_valid) return true;

  throw new Error(
    `Redis key has invalid format. Must require format ${
      KEY_FORMAT_REGX.source
    }. You can call function generate_key() to generate correct key format`
  );
}

/**
 *
 *
 * @param {string} type in order to determine appropriate processing behaviour. It maybe 'data', 'schedule', etc.
 * @param {string} from_source origin service that redis key created from.
 * @param {*} other_namespaces other namespaces will append and be seperated by a colon (:)
 */
function generate_key(type, from_source, ...other_namespaces) {
  if (!type || !from_source) {
    throw new Error(
      `The function generate_key() requires at least first 2 arguments are 'type' and 'from_source'`
    );
  }

  var arguments_array = Array.prototype.slice.call(arguments);

  return arguments_array.join(":");
}
/**
 * run like the function `generate_key()` but append `uuid` to make sure key is unique
 *
 * @param {*} type
 * @param {*} from_source
 * @param {*} other_namespaces
 */
function generate_unique_key(type, from_source, ...other_namespaces) {
  var generated_key = generate_key(...arguments);
  return generated_key + "#" + uuidv4();
}

function register_callback_for_key(key, callback = () => {}) {
  validate_key_format(key);

  return (callback_key_mapping[key] = callback);
}

function unregister_callback_for_key(key) {
  delete callback_key_mapping[key];
}

// set('schedule:automation', "abcdeffff", 5);
// subcribe_notify_keyspace_event(EXPIRED_EVENT_NAME);
