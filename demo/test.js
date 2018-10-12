'use strict';

const assert = require('assert');
const _ = require('lodash');
const faker = require('faker');

process.env.SERVICE_NAME= 'apc';
process.env.NODE_ENV = 'development';

var input_string = ` throughFilter.where[polymorphic.discriminator] = throughModel.definition.name; //fixed-flag  } `;

console.log(input_string.includes(`//fixed-flag`));

