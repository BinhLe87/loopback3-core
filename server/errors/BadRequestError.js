var GenenicError = require('./GenericError');

function BadRequestError(message = 'One of the request inputs is not valid.', data = {}, code = 400) {

    if (!this) return new BadRequestError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'BadRequestError';

    return this;
}



module.exports = BadRequestError;