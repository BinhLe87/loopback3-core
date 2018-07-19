'use strict';

var winston = require('winston');
const joi = require('joi');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
var fs = require('fs');


var envVarsSchema = joi.object({

    LOGGER_LEVEL: joi.string()
        .allow(['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
        .default('info'),
    CONSOLE_LEVEL: joi.string()
        .allow(['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
        .default('silly'),
    LOGGER_ENABLED: joi.boolean()
        .truthy('TRUE')
        .truthy('true')
        .falsy('FALSE')
        .falsy('false')
        .default(true),
    LOGS_DIR: joi.string()
        .default('./logs')
}).unknown();

const { error, value: envVars } = joi.validate(process.env, envVarsSchema);

if (error) {
    throw new Error(`Config validation error in ${path.basename(__filename)}: ${util.inspect(error.details)}`);
}

//------------LOG OPTIONS
if (!fs.existsSync(envVars.LOGS_DIR)) {
    // Create the directory if it does not exist
    fs.mkdirSync(envVars.LOGS_DIR);
}

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.splat(),
    winston.format.printf((info) => {
        const ts = info.timestamp.slice(0, 19).replace('T', ' ');
        if (info.args) {
            return `${ts} [${info.level}]: ${info.message} ${(info.level > 3 && (Object.keys(info.args).length || Object.getOwnPropertyNames(info.args).length)) ? JSON.stringify(info.args, null, 2) : ''}`;
        } else {
            return `${ts} [${process.pid}] [${info.level}]: ${info.message}`;
        }
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.splat(),
    winston.format.printf((info) => {
        const ts = info.timestamp.slice(0, 19).replace('T', ' ');
        if (info.args) {
            return `${ts} [${process.pid}] [${info.level}]: ${info.message} ${(Object.keys(info.args).length || Object.getOwnPropertyNames(info.args).length) ? JSON.stringify(info.args, null, 2) : ''}`;
        } else {
            return `${ts} [${process.pid}] [${info.level}]: ${info.message}`;
        }
    })
);


var logger = winston.createLogger({

    level: envVars.LOGGER_LEVEL,
    format: fileFormat,
    transports: [
        new DailyRotateFile({ 
            dirname: envVars.LOGS_DIR,
            filename: 'error.log',
            level: 'error',
        }),
        new DailyRotateFile({
            dirname: envVars.LOGS_DIR,
            filename: 'silly.log',
            level: 'silly'
        }),
        new DailyRotateFile({
            dirname: envVars.LOGS_DIR,
            filename: 'combined.log', 
            level: envVars.LOGGER_LEVEL
        })
    ],
    exceptionHandlers: [
        
        new DailyRotateFile({
            dirname: envVars.LOGS_DIR,
            filename: 'uncaughtException.log'
        })
    ],
    exitOnError: false
});

winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green'
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        colorize: true,
        level: envVars.CONSOLE_LEVEL,
        handleExceptions: true
    }));
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function (message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;