'use strict';
var winston = require('../config/winston');
var path = require('path');
var _ = require('lodash');
var util = require('util');

var errorLoggerInstance; //singleton instance

class ErrorLogger {
  constructor() {}

  static getInstance() {
    if (!errorLoggerInstance) {
      errorLoggerInstance = new ErrorLogger();
    }

    return errorLoggerInstance;
  }
  /**
   * Generate error message if not match condition
   * Use _.template() to generate message
   *
   * @param {boolean} condition
   * @param {string} message Lodash message template. Example '"<%=name%>" should be an object'
   * @param {string} strings the data object variable name
   * @memberof ErrorLogger
   */
  assert(condition, message, strings) {
    if (!condition) {
      var err_message = _.template(message);
      return err_message(strings);
    }
  }

  log(level = 'info', error = {}, req, options = {}) {
    //omit 'level' argument
    if (arguments[0] && typeof arguments[0] == 'object') {
      error = arguments[0];
      level = 'info';
    }

    this[level](error, req, options);
  }

  silly(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('silly', error, req, {
      omit_tracing_from_func: this.error
    });

    winston.silly(error_obj.message, error_obj.meta);
  }

  debug(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('debug', error, req, {
      omit_tracing_from_func: this.error,
      ...options
    });

    winston.debug(error_obj.message, error_obj.meta);
  }

  verbose(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('verbose', error, req, {
      omit_tracing_from_func: this.error,
      ...options
    });

    winston.verbose(error_obj.message, error_obj.meta);
  }

  info(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('info', error, req, {
      omit_tracing_from_func: this.error,
      ...options
    });

    winston.info(error_obj.message, error_obj.meta);
  }

  warn(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('warn', error, req, {
      omit_tracing_from_func: this.warn,
      ...options
    });

    winston.warn(error_obj.message, error_obj.meta);
  }

  error(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('error', error, req, {
      omit_tracing_from_func: this.error,
      ...options
    });

    winston.error(error_obj.message, error_obj.meta);
  }

  //alias of 'error' function.
  err(error = {}, req, options = {}) {
    var error_obj = this.generateErrorMessage('error', error, req, {
      omit_tracing_from_func: this.error,
      ...options
    });

    winston.error(error_obj.message, error_obj.meta);
  }

/**
 * Return an object contain message and meta object (extra fields will be inserted into `info' object in winston)
 *
 * @param {string} [error_level='info']
 * @param {*} [error={}]
 * @param {*} req
 * @param {*} [options]
 * @param {*} [options.is_tracing_methods] enable Error.captureStackTrace() for tracing series of methods were called
 * @param {*} [options.omit_tracing_from_func] function which will ignore start from
 * @returns {} {message, meta: {...}}
 * @memberof ErrorLogger
 */
generateErrorMessage(error_level = 'info', error = {}, req, options = {}) {

    var error_message = this.parseErrorObjectToString(error);
    var meta = {};
    const critical_errors = /(error|fatal)/gi;

    if(critical_errors.test(error_level)) { //enable tracing series of methods invoked

      options.is_tracing_methods = true;    
      
      if(_.isNil(req)) {

        this.warn('Can not determine request_id for error tracing', req, {is_tracing_methods: true});
      }
    }

    if (options.is_tracing_methods == true) {

      error_message = tracingMethodsCalled.bind(this, error_message, options.omit_tracing_from_func)();
    }

    if(req) {

      //extract X-Request-ID from req
      var request_id = req.headers['X-Request-ID'];
      meta.request_id = request_id;
    }

    return {
      message: error_message,
      meta: meta
    };

    function tracingMethodsCalled(message, omit_tracing_from_func) {

      Error.captureStackTrace(this, omit_tracing_from_func || tracingMethodsCalled);
      this.message = message;

      var stack_message = this.stack;
      
      delete this.message; //reset message

      return stack_message;
    }
  }

  parseErrorObjectToString(error) {
    if (typeof error != 'object') return error;

    try {
      var parsedErrString = util.inspect(error, {
        showHidden: true,
        depth: 5,
        compact: false,
        breakLength: 80
      });

      return parsedErrString;
    } catch (err) {
      winston.error(
        'errorLogger.js: Can not parse error into string: ' + err.message
      );
      return error;
    }
  }
}

module.exports = {
  logger: ErrorLogger.getInstance()
};
