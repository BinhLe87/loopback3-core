'use strict';
var util = require('util');
var js2xmlparser = require('js2xmlparser');

module.exports = exports = {};

//NOTE: START: Dummy code used to override the resolveReponseOperation() in 'strong-remoting' module
/**
 * Utility functions to send response body
 */
function sendBodyJson(res, data) {
    res.json(data);
}

function sendBodyJsonp(res, data) {
    res.jsonp(data);
}

function sendBodyXml(res, data, method) {
    if (data === null) {
        res.header('Content-Length', '7');
        res.send('<null/>');
    } else if (data) {
        try {
            var xmlOptions = method.returns[0].xml || {};
            var xml = toXML(data, xmlOptions);
            res.send(xml);
        } catch (e) {
            res.status(500).send(e + '\n' + data);
        }
    }
}

function sendBodyDefault(res) {
    res.status(406).send('Not Acceptable');
}


function toXML(input, options) {
    var xml;
    var xmlDefaultOptions = { declaration: true };
    var xmlOptions = util._extend(xmlDefaultOptions, options);
    if (input && typeof input.toXML === 'function') {
        xml = input.toXML();
    } else {
        if (typeof input == 'object') {
            // Trigger toJSON() conversions
            input = toJSON(input);
        }
        if (Array.isArray(input)) {
            input = { result: input };
        }
        xml = js2xmlparser.parse(xmlOptions.wrapperElement || 'response', input, {
            declaration: {
                include: xmlOptions.declaration,
                encoding: 'UTF-8',
            },
            format: {
                doubleQuotes: true,
                indent: '  ',
            },
            convertMap: {
                '[object Date]': function (date) {
                    return date.toISOString();
                },
            },
        });
    }
    return xml;
}


function toJSON(input) {
    if (!input) {
        return input;
    }
    if (typeof input.toJSON === 'function') {
        return input.toJSON();
    } else if (Array.isArray(input)) {
        return input.map(toJSON);
    } else {
        return input;
    }
}
//END: Dummy code

/**
 * Override the original resolveReponseOperation() in 'strong-remoting' module to add extra Content-Type 'loopback/json'
 */

exports.override_resolveReponseOperation = function(accepts) {
    var result = { // default
        sendBody: sendBodyJson,
        contentType: 'application/json',
    };
    switch (accepts) {
        case '*/*':
        case 'application/json':
        case 'json':
            break;
        case 'application/vnd.api+json':
            result.contentType = 'application/vnd.api+json';
            break;
        case 'application/javascript':
        case 'text/javascript':
            result.sendBody = sendBodyJsonp;
            break;
        case 'application/xml':
        case 'text/xml':
        case 'xml':
            if (accepts == 'application/xml') {
                result.contentType = 'application/xml';
            } else {
                result.contentType = 'text/xml';
            }
            result.sendBody = sendBodyXml;
            break;
        case 'loopback/json':                       //=> Add extra Content-Type
            result.contentType = 'loopback/json';
            break;
        default:
            result.sendBody = sendBodyDefault;
            result.contentType = 'text/plain';
            break;
    }
    return result;
}
