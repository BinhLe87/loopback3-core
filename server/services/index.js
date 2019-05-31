const path = require("path");

const program = require("commander");
const Joi = require("joi");
const debug = require("debug")(__filename);
const axios = require("axios");
const {baseJoiOptions} = require('../utils/validators');


program
  .version("0.1.0")
  .option("-s, --service <service_name>", "SERVICE NAME")
  .option("-e, --env <NODE_ENV>", "SERVICE NAME")
  .parse(process.argv);

debug(process.argv);
program.parse(process.argv);

const app_args_joi = Joi.object().keys({
  service: Joi.string()
    .empty("")
    .required()
});

var app_args_joi_result = Joi.validate(program, app_args_joi, baseJoiOptions);

if (app_args_joi_result.error) {
  console.error(app_args_joi_result.error);
  process.exit(1);
}

const env_variables_joi = Joi.object().keys({
  NODE_ENV: Joi.string().default('development')
})

var env_variables_joi_result = Joi.validate(process.env, env_variables_joi, baseJoiOptions);

if (env_variables_joi_result.error) {
  console.error(env_variables_joi_result.error);
  process.exit(1);
}

process.env.NODE_ENV = env_variables_joi_result.value.NODE_ENV;
process.env.HOME_ROOT = __dirname;

const dotenv = require("dotenv").config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

const {logger} = require('@cc_server/logger');

logger.info(`Running at NODE_ENV is ${process.env.NODE_ENV}`);

require(`./${app_args_joi_result.value.service}`);
