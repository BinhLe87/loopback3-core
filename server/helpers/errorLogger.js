'use strict';
var winston = require('../config/winston');
var errorToJSON = require('utils-error-to-json');
var path = require('path');
var _ = require('lodash');

var errorLoggerInstance; //singleton instance

class ErrorLogger {

    constructor() {}

    static getInstance() {

        if (!errorLoggerInstance) {

            errorLoggerInstance = new ErrorLogger();
        }

        return errorLoggerInstance;
    }

    log(error = {}, classNameOccurError, level = 'info') {

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

        var error_message = (_.isEmpty(classNameOccurError) ? '' : (path.basename(classNameOccurError) + ": "))
            + this.parseErrorObjectToString(error);

        return error_message;
    }

    parseErrorObjectToString(error) {

        try {
            var parsedErrString = '';

            if (error instanceof Error) {

                parsedErrString =  JSON.stringify(errorToJSON(error));
            } else if (typeof error == 'object') {

                parsedErrString = JSON.stringify(error);
            } else {

                parsedErrString = error;
            }

            return parsedErrString;
        } catch (err) {

            winston.error('errorLogger.js: Can not parse error into string: ' + err.message);
            return error;
        }

    }
}

module.exports = ErrorLogger.getInstance();