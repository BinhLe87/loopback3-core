process.env.HOME_ROOT = __dirname;
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SERVICE_NAME = 'rabbitmq';

const {logger} = require('@cc_server/logger');

require('./move_position');

logger.info(`Started '${process.env.SERVICE_NAME}' service!`);
