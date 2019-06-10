process.env.HOME_ROOT = __dirname;
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SERVICE_NAME = 'rabbitmq';


require('./move_position');