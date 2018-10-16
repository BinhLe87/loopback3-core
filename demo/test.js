'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');
const moment = require('moment');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';

console.log(moment().unix());
