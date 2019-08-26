var Globalize;
var cldrData;

try {
  // Include the Globalize library
  Globalize = require('globalize');

  // Include the CLDR data
  cldrData = require('cldr-data');

  // Loads the supplemental data
  Globalize.load(cldrData.entireSupplemental());

  //Loads the data of the specified locales
  Globalize.load(cldrData.entireMainFor('en', 'en-GB'));

  //Set default locale
  Globalize.locale('en');

  //Load locale messages from resource file `globalize.messages.js`
  Globalize.loadMessages(require('./globalize.json'));
} catch (error) {
  if (process.env.NODE_ENV != 'development') {
    logger.error('Unable to load globalize modules at the moment');
    logger.error(error);
  }
}

/**
 * Localize message types
 *
 * @param {*} message
 * @param {string} [key=''] the path of message key
 * @param {string} [locale='en']
 * @param {string} [type='message'] formatting types: message, datetime, number, unit...
 * @param {object|array|any} [args] optional arguments passed to globalize method invoked correspondingly
 */
function formatMessage(key = '', locale = 'en', type = 'message', ...args) {
  if (_.isUndefined(Globalize) || _.isUndefined(cldrData)) {
    //unable to load globalize modules

    return key; //return origin key as default in this situation
  }

  var locale_message;
  try {
    switch (type) {
      default: {
        locale_message = args
          ? Globalize(locale).formatMessage(key, args)
          : Globalize(locale).formatMessage(key);
      }
    }
  } catch (ex) {
    //return key as default message

    locale_message = typeof key == 'string' ? key : '';
  }

  return locale_message;
}

module.exports.formatMessage = formatMessage;
