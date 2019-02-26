const path = require("path");

const program = require("commander");
const Joi = require("joi");
const debug = require("debug")(__filename);
const axios = require("axios");
const {logger} = require('../errors/errorLogger');

program
  .version("0.1.0")
  .option("-s, --service <service_name>", "SERVICE NAME")
  .parse(process.argv);

debug(process.argv);
program.parse(process.argv);

var args_joi = Joi.object().keys({
  service: Joi.string()
    .empty("")
    .required()
});

const base_joi_options = {
  abortEarly: false,
  convert: true,
  allowUnknown: true
};

var joi_result = Joi.validate(program, args_joi, base_joi_options);

if (joi_result.error) {
  console.error(joi_result.error);
  process.exit(1);
}

const dotenv = require("dotenv").config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

logger.info(`Running at NODE_ENV is ${process.env.NODE_ENV}`);

async function main() {
  await init_env_variables();
  require(`./${joi_result.value.service}`);

  async function init_env_variables() {
    var { data: login_data } = await axios.request({
      url: `/login`,
      method: "post",
      baseURL: process.env.API_URL,
      data: {
        email: process.env.API_LOGIN_EMAIL,
        password: process.env.API_LOGIN_PASSWORD
      }
    });

    process.env.API_ACCESS_TOKEN = login_data.access_token;
  }
}

main();
