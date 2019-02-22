const dotenv = require("dotenv").config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

const program = require("commander");
const Joi = require("joi");

program
  .version("0.1.0")
  .option("-e, --env <node_env>", "NODE_ENVIRONMENT")
  .option("-s, --service <service_name>", "SERVICE NAME")
  .parse(process.argv);

program.parse(process.argv);

var args_joi = Joi.object().keys({
  env: Joi.string()
    .valid("development", "staging", "aws", "local")
    .default("development")
    .required(),
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

if (joi_result.err) {
  console.error(joi_result.err);
  process.exit(1);
}

require(`./${joi_result.value.service}`);