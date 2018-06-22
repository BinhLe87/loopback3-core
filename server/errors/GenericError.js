'use strict';

var errorToJSON = require( 'utils-error-to-json' );

/**
 * Generic Error
 *
 *
 * @param {Object} err - The error object.
 * @param {number} err.code - Error Code.
 * @param {string} err.mssg - Error message.
 * @param {Object} err.data - Error detail object.
 *  
 */

function GenericError(message = 'The server encountered an internal error. Please retry the request', data = {}, code = 500) {

    if (!this) return new GenericError(...arguments);

    Error.call(this);

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this);
    } else {
        this.stack = new Error().stack;
    }


    this.message = message;
    this.name = 'GenericError';
    this.code = code;
    this.data = (data instanceof Error) ? errorToJSON(data) : data;

    return this;
}

/*!
 * Inherits from Error.
 */
GenericError.prototype = Object.create(Error.prototype);
GenericError.prototype.constructor = GenericError;

module.exports = exports = GenericError;