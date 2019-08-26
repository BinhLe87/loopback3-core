const {parseRedisKey} = require('../packages/utils/lib/redisUtil');
const _ = require('lodash');

var result = _.find([{id: 3, name: 'name'}], {id: 3});

console.log(_.isEmpty({id: 3}));
