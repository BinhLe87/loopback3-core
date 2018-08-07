'use strict';
var winston = require('../config/components/winston');
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
   * Generate error message if not match condition.
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

  log(level = 'info', error = {}, classNameOccurError) {
    //omit 'level' argument
    if (arguments[0] && typeof arguments[0] == 'object') {
      error = arguments[0];
      level = 'info';
    }

    this[level](error, classNameOccurError);
  }

  silly(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.silly(error_message);
  }

  debug(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.debug(error_message);
  }

  verbose(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.verbose(error_message);
  }

  info(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.info(error_message);
  }

  warn(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.warn(error_message);
  }

  error(error = {}, classNameOccurError) {
    var error_message = this.generateErrorMessage(error, classNameOccurError);

    winston.error(error_message);
  }

  generateErrorMessage(error = {}, classNameOccurError) {
    var error_message =
      (_.isEmpty(classNameOccurError)
        ? ''
        : path.basename(classNameOccurError) + ': ') +
      this.parseErrorObjectToString(error);

    return error_message;
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
