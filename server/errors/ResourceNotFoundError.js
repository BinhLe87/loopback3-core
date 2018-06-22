var GenenicError = require('./GenericError');

function ResourceNotFoundError(message = 'The specified resource does not exist.', data = {}, code = 404) {

    if (!this) return new ResourceNotFoundError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'ResourceNotFoundError';

    return this;
}



module.exports = ResourceNotFoundError;