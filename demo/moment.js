'use strict';

const moment = require('moment');

var now = moment.utc('2018-07-04 17:15:02');

//switch to local time
now.local();

console.log(now.format('YYYYMMDD'));