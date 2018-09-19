'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';

require('../server/api/database/fixtures/model.fixtures')(1, 'user_setting', {
    code: {
        func: faker.random.arrayElement,
        args: [1,2,3,5]
    },
    userId: '${abcd}',
    value: 10
});


