var express = require("express");
var bodyParser = require("body-parser");
var default_port = 3000;
var globalUtil = require("../globalUtil");
const {logger} = require('@cc_server/logger');

module.exports = exports = {};
exports.server = function server(port) {
  var target_port = port || default_port;

  //reuse express in
  const expressjs_global_key = `expressjs_port-${target_port}`;
  var cached_app = globalUtil.get(expressjs_global_key);
  if (cached_app) return cached_app;

  var app = express();

  app.use(bodyParser.json()); // for parsing application/json

  // for parsing application/x-www-form-urlencoded
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );
  //default error handling
  app.use(function(err, req, res, next) {
    logger.error(err);
    res.status(200).send({
      message: err.message,
      stack: err.stack
    });
  });

  app.listen(target_port, () => {
    logger.info(`expressjs start listening requests on port ${target_port}...`);
  });

  app.express = express;

  //set cache in `global` variable
  globalUtil.set(expressjs_global_key, app);

  return app;
};
