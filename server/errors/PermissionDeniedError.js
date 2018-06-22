var GenenicError = require('./GenericError');

function PermissionDeniedError(message = 'Permission denied', data = {}, code = 403) {

    if (!this) return new PermissionDeniedError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'PermissionDeniedError';

    return this;
}



module.exports = PermissionDeniedError;