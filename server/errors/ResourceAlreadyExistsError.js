var GenenicError = require('./GenericError');

function ResourceAlreadyExistsError(message = 'The specified resource already exists.', data = {}, code = 409) {

    if (!this) return new ResourceAlreadyExistsError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'ResourceAlreadyExistsError';

    return this;
}



module.exports = ResourceAlreadyExistsError;