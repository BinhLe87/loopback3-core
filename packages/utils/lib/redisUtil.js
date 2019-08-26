const _ = require('lodash');

module.exports = exports = {};

exports.parseRedisKeyStringToObject = function parseRedisKey(redis_key_string) {
  var matches = [];

  var redis_key_regx = /([^:]+):?([^:]*)/gi;

  var match = redis_key_regx.exec(redis_key_string);
  while (match != null) {
    matches.push(match);
    match = redis_key_regx.exec(redis_key_string);
  }

  return _.reduce(matches, (result, match) => {

    let key = match[1];
    let value = match[2];
    result[key] = value;

    return result;
  }, {});
};
