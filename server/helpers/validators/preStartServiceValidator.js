'use strict';

const joi = require('joi');
const path = require('path');
const util = require('util');
var _ = require('lodash');

var envVarsSchema = joi
  .object({
    SERVICE_NAME: joi
      .string()
      .length(3)
      .required(),
    NODE_ENV: joi
      .string()
      .required()
      .allow('development, staging, production'),
    API_RESIZE_IMAGE_ROOT_URL: joi.string().default('/api/image/resize')
  })
  .unknown()
  .required();

const { error, value: envVars } = joi.validate(process.env, envVarsSchema, {
  abortEarly: false
});

if (error) {
  throw new Error(
    `Config validation error in ${path.basename(__filename)}: ${util.inspect(
      error.details
    )}`
  );
}

//if possible, assign default value to any properties undefined in .env file
_.forOwn(envVars, (value, key) => {
  if (!_.isUndefined(envVars[key]) && _.isUndefined(process.env[key])) {
    process.env[key] = envVars[key];
  }
});
