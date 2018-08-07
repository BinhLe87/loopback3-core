'use strict';

const joi = require('joi');
const path = require('path');
const util = require('util');

var envVarsSchema = joi
  .object({
    SERVICE_NAME: joi
      .string()
      .length(3)
      .required()
  })
  .unknown()
  .required();

const { error, value: envVars } = joi.validate(process.env, envVarsSchema);

if (error) {
  throw new Error(
    `Config validation error in ${path.basename(__filename)}: ${util.inspect(
      error.details
    )}`
  );
}
