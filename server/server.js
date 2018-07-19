'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();
const dotenv = require('dotenv').config(); 
var { logger } = require('../server/errors/errorLogger');
<<<<<<< HEAD

=======
const { exec } = require('child_process');
const { formatMessage } = require('../server/config/components/globalize/globalize');
const debug = require('debug')('server.js');
>>>>>>> 41807ff... Added: wrapper function to handle internationalization via 'globalize' module

//Set global instance variables
global.logger = logger;
global.__i18n = global.__locale = formatMessage;





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
