'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
const util = require('util');

var app = module.exports = loopback();
const dotenv = require('dotenv').config(); 
var { logger } = require('../server/errors/errorLogger');


app.logger = logger;
//An instance of logger class can be accessed via the global `logger` variable.
global.logger = logger;

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
process.on('uncaughtException', function (err) {
  // handle the error safely
  logger.error("Application was crashed: " + util.inspect(err, { compact: true, depth: 5, breakLength: 80 }), __filename);

  throw err;
})
