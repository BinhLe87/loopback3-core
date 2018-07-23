'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');

const RESOURCE_TYPE = {
    'object': 'object',
    'collection': 'collection'
}

module.exports = function (app) {

    var remotes = app.remotes();
    remotes.after('**', function (ctx, next) {

        //format response follow jsonapi.org standard
        try {
            var responseInJsonAPI = parseSingleResource(ctx);
            debug(util.inspect(responseInJsonAPI, { compact: true, depth: 5, breakLength: 80 }));
            
            ctx.result = responseInJsonAPI;
        } catch (ex) {

        }
        
        
        next();
    });
}
/**
 *  Determine if the response is single resource object or array of resource objects
 *
 * @param {object} ctx context
 * @returns {string} return RESOURCE_TYPE or undefined
 */
function determineSingleOrCollectionResource(ctx) {

    var result = ctx.result;
    if (Array.isArray(result)) {

        return RESOURCE_TYPE.collection;
    } else if (typeof result == 'object') {

        return RESOURCE_TYPE.object;
    }
    
    throw new TypeError('Unable to specify resource type is single object or array of resource objects');
}

function parseSingleResource(ctx) {

    var toplevelMembers = parseTopLevelMembers(ctx);
    var attributes = parseAttributes(ctx);
    var relationships = parseRelationships(ctx);

    var response = Object.assign({}, toplevelMembers, attributes, relationships);

    return response;
}

/**
 * Get primary resource name
 *
 * @param {object} ctx
 * @returns {string} primary resource name
 */
function parsePrimaryResourceName(ctx) {

    var resultTypes = ctx.resultType;

    if (Array.isArray(resultTypes) && resultTypes.length != 1) {

        throw new Error(`Only support return 1 resource type, but ${resultTypes.length} resource types`)
    }

    return Array.isArray(resultTypes) ? resultTypes[0] : resultTypes;
}


function parseAttributes(ctx) {

    var result = ctx.result;
    var resource_data = {};

    resource_data.attributes = result;
            
    return resource_data;
}

function parseTopLevelMembers(ctx) {

    var resource_data = {};
    var resource_type = parsePrimaryResourceName(ctx);

    resource_data.id = ctx.result.id;
    resource_data.type = resource_type;

    return resource_data;
}

function getSelfBaseUrl(ctx) {

    var req = ctx.req;
    var baseUrl = req.baseUrl;
    var selfBaseUrl = req.protocol + '://' + req.get('host') + baseUrl;
    var params = req.params;
    if (!_.isUndefined(params.id)) {

        selfBaseUrl = path.join(selfBaseUrl, params.id);
    }

    return selfBaseUrl;
}

function getSelfFullUrl(ctx) {

    var req = ctx.req;
    var selfFullUrl = req.protocol + '://' + req.get('host');
    return path.join(selfFullUrl, req.originalUrl);
}

/**
 * When fetch this link, the related resource object(s) are returned as the embedded data in the primary resource
 *
 * @param {*} ctx
 * @param {string} relation_name relation name that the link related to
 * @returns {string} 
 */
function generateRelationLinkSelf(ctx, relation_name) {

    var selfBaseUrl = getSelfBaseUrl(ctx);

    if (!selfBaseUrl.includes('?filter')) { //this is first filter
        selfBaseUrl += `?filter[include][${relation_name}]`;
    } else {
        selfBaseUrl += `&filter[include][${relation_name}]`;
    }

    return selfBaseUrl;
}

/**
 * When fetch this link, the related resource object(s) are returned as the response's primary data
 *
 * @param {*} ctx
 * @param {string} relation_name relation name that the link related to
 * @returns {string}
 */
function generateRelationLinkRelated(ctx, relation_name) {

    var selfBaseUrl = getSelfBaseUrl(ctx);
    return path.join(selfBaseUrl, relation_name);
}

function parseRelationships(ctx) {

    var resource_data = {};
    var resource_name = parsePrimaryResourceName(ctx);

    var Model = ctx.req.app.loopback.getModel(resource_name);
    var relations = _.get(Model, 'settings.relations');

    var relationships = {};
    _.forOwn(relations, function(relation_values, relation_name, o) {

        relationships[relation_name] = {};

        relationships[relation_name].links = {};
        relationships[relation_name].links.self = generateRelationLinkSelf(ctx, relation_name);
        relationships[relation_name].links.related = generateRelationLinkRelated(ctx, relation_name);
    });

    _.set(resource_data, 'relationships', relationships);
    _.set(resource_data, 'links.self', getSelfFullUrl(ctx));

    return resource_data;
}






