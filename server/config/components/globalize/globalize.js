// Include the Globalize library
var Globalize = require('globalize');

// Include the CLDR data
var cldrData = require('cldr-data');

// Loads the supplemental data
Globalize.load(cldrData.entireSupplemental());

//Loads the data of the specified locales
Globalize.load(cldrData.entireMainFor('en', 'en-GB'));

//Set default locale
Globalize.locale('en');

//Load locale messages from resource file `globalize.messages.js`
Globalize.loadMessages(require('./globalize.json'));

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

    var locale_message;
    try {
        switch (type) {

            default: { 

                locale_message = args ? Globalize(locale).formatMessage(key, args) : Globalize(locale).formatMessage(key);
            }
        }

    } catch (ex) { //return key as default message

        locale_message = (typeof key == 'string' ? key : '');        
    }

    return locale_message;
}

module.exports.formatMessage = formatMessage;


