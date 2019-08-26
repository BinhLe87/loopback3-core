"use strict";

var winston = require("winston");
const joi = require("joi");
const path = require("path");
const DailyRotateFile = require("winston-daily-rotate-file");
var fs = require("fs-extra");
const util = require("util");
const { EOL } = require("os");
var { Loggly } = require("./winston-loggly");

var envVarsSchema = joi
  .object({
    LOGGER_LEVEL: joi
      .string()
      .allow(["error", "warn", "info", "verbose", "debug", "silly"])
      .default("debug"),
    CONSOLE_LEVEL: joi
      .string()
      .allow(["error", "warn", "info", "verbose", "debug", "silly"])
      .default("debug"),
    LOGGER_ENABLED: joi
      .boolean()
      .truthy("TRUE")
      .truthy("true")
      .falsy("FALSE")
      .falsy("false")
      .default(true),
    LOGS_DIR: joi
      .string()
      .default(
        path.resolve(
          process.env.HOME_ROOT || process.cwd(),
          `logs/${process.env.SERVICE_NAME}`
        )
      )
  })
  .unknown();

const { error, value: envVars } = joi.validate(process.env, envVarsSchema);

if (error) {
  throw new Error(
    `Config validation error in ${path.basename(__filename)}: ${util.inspect(
      error.details
    )}`
  );
}

//------------LOG OPTIONS
if (!fs.existsSync(envVars.LOGS_DIR)) {
  // Create the directory if it does not exist
  fs.mkdirsSync(envVars.LOGS_DIR);
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.splat(),
  winston.format.printf(add_message_json_and_format_message)
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.splat(),
  winston.format.printf(add_message_json_and_format_message)
);

var logger = winston.createLogger({
  level: envVars.LOGGER_LEVEL,
  format: fileFormat,
  transports: [
    new DailyRotateFile({
      dirname: envVars.LOGS_DIR,
      filename: "error.%DATE%.log",
      level: "error",
      handleExceptions: true
    }),
    new DailyRotateFile({
      dirname: envVars.LOGS_DIR,
      filename: "silly.%DATE%.log",
      level: "silly"
    }),
    new DailyRotateFile({
      dirname: envVars.LOGS_DIR,
      filename: "combined.%DATE%.log",
      level: envVars.LOGGER_LEVEL,
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: path.join(envVars.LOGS_DIR, "combined.log"),
      level: envVars.LOGGER_LEVEL,
      handleExceptions: true
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: envVars.LOGS_DIR,
      filename: "uncaughtException.log"
    })
  ],
  exitOnError: false
});

if (process.env.LOGGLY_TOKEN && process.env.LOGGLY_SUBDOMAIN) {
  logger.add(
    new Loggly({
      token: process.env.LOGGLY_TOKEN,
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      tags: ["Winston-NodeJS"],
      json: true,
      handleExceptions: true
    })
  );
}

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  debug: "green"
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      colorize: true,
      level: envVars.CONSOLE_LEVEL,
      handleExceptions: true
    })
  );
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  }
};

function add_message_json_and_format_message(info) {
  const ts = info.timestamp.slice(0, 19).replace("T", " ");
  const request_id = info.request_id || "<unknown_request_id>";
  const env = process.env.NODE_ENV || "development";
  const service_name = process.env.SERVICE_NAME || "<unknown_service>";

  var message_json = {
    env,
    service_name,
    ts,
    process_id: process.pid,
    request_id,
    level: info.level,
    message: info.message
  };

  //add more properties into `info` object at root level
  info.env = env;
  info.service_name = service_name;
  info.request_id = request_id;
  info.level = info.level;
  info.message_json = message_json;

  var message_string = "";
  Object.getOwnPropertyNames(message_json).forEach(function(key, idx, array) {
    message_string += " " + message_json[key];
  });

  return `${message_string}${EOL}`;
}

module.exports = logger;
