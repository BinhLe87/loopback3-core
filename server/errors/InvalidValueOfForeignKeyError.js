var GenenicError = require('./GenericError');

function InvalidValueOfForeignKeyError(message = 'Invalid value of foreign-key field. You must pass existing value or skip this field', data = {}, code = 400) {

    if (!this) return new InvalidValueOfForeignKeyError(...arguments);

    GenenicError.call(this, message, data, code);

    this.name = 'InvalidValueOfForeignKeyError';

    return this;
}

module.exports = InvalidValueOfForeignKeyError;