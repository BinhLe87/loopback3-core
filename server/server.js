'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
const util = require('util');

var app = module.exports = loopback();
const dotenv = require('dotenv').config(); 
var { logger } = require('../server/errors/errorLogger');
const { exec } = require('child_process');
const { formatMessage } = require('../server/config/components/globalize/globalize');
const debug = require('debug')('server.js');
const semver = require('semver');

//Set global instance variables
global.logger = logger;
global.__i18n = global.__locale = formatMessage;
global._ = require('lodash');



//Print current Node version running on server
exec('node -v', function (err, stdout, stderr) {

  var cur_node_version = stdout;

  logger.info('Node version running on server: ' + cur_node_version);

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
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
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
  if (require.main === module)
    app.start();
});


// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
// process.on('uncaughtException', function (err) {
//   // handle the error safely
//   throw err;
// })

