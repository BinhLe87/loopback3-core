'use strict';

const path = require('path');
const dotenv = require('dotenv').config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

//ensure mandatory parameters must be defined before lauching app
require('./helpers/validators/preStartServiceValidator');

var loopback = require('loopback');
var boot = require('loopback-boot');
const util = require('util');
const _ = require('lodash');

var app = (module.exports = loopback());
var { logger } = require('../errors/errorLogger');
//Set global instance variables
global.logger = logger;

const { exec } = require('child_process');
const { formatMessage } = require('../config/components/globalize/globalize');
global.__i18n = global.__locale = formatMessage;
global._ = _;
global.Boom = require('boom');
_.set(global, 'helper.inspect', require('./helpers/printHelper').inspect);

const debug = require('debug')('server.js');
const semver = require('semver');

//Print current Node version running on server
exec('node -v', function(err, stdout, stderr) {
  var cur_node_version = stdout;

  logger.info('Node version running on server: ' + cur_node_version);
  logger.info(`Running in environment is ${process.env.NODE_ENV}`);

  var is_valid_node_version = false;
  var required_node_version = '7.6.0';

  if (semver.gt(cur_node_version, required_node_version)) {
    is_valid_node_version = true;
  }

  if (!is_valid_node_version) {
    let err_msg = `Application require NodeJS version must greater than v${required_node_version}, but got ${cur_node_version}`;
    logger.error(err_msg, __filename);

    return;
  }
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    debug('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      debug('Browse your REST API at %s%s', baseUrl, explorerPath);
    }

    //set unlimited event listeners
    app.setMaxListeners(0);
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) app.start();
});

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
// process.on('uncaughtException', function (err) {
//   // handle the error safely
//   throw err;
// })
