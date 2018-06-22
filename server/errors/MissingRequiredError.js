var GenenicError = require('./GenericError');

function MissingRequiredError(message = 'Missing argument', data = {}, code = 400) {

    if (!this) return new MissingRequiredError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'MissingRequiredError';

    return this;
}



module.exports = MissingRequiredError;