'use strict';
const path = require('path');
const debug = require('debug')(path.basename(__filename));
const util = require('util');
const functionContract = require('../helpers/functionContract');

const RESOURCE_TYPE = {
    'object': 'object',
    'collection': 'collection'
}
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

/**
 * Deciding on the operation of response, function is called inside this.done()
 */

function override_resolveReponseOperation(accepts) {
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
        case 'loopback/json':
            result.contentType = 'loopback/json';
            break;
        default:
            result.sendBody = sendBodyDefault;
            result.contentType = 'text/plain';
            break;
    }
    return result;
};

module.exports = function (app) {

    var remotes = app.remotes();
    remotes.after('**', function (ctx, next) {

        var req_accept_header = _.get(ctx, 'req.headers.accept');
        if(req_accept_header == 'loopback/json') {

            ctx.resolveReponseOperation = override_resolveReponseOperation;
            return next();
        }

        //format response follow jsonapi.org standard
        try {
            var responseInJsonAPI = parseResouceFactory(ctx);      
            
            ctx.result = responseInJsonAPI;
        } catch (ex) {

            logger.error(`Error parsing response into jsonApi format for ${getSelfFullUrl(ctx)}`);
            logger.error(helper.inspect(ex));
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

function parseResouceFactory(ctx) {

    var resourceType = determineSingleOrCollectionResource(ctx);

    switch (resourceType) {

        case RESOURCE_TYPE.object:
            return parseSingleResource(ctx);
        break;

        case RESOURCE_TYPE.collection:
            return parseArrayOfResources(ctx);
        break;
    }

    throw new Error('parseResouceFactory(): Unable to parse resource at the moment. Please try again later');
}

function parseSingleResource(ctx) {

    var resourceType = determineSingleOrCollectionResource(ctx);
    if (resourceType != RESOURCE_TYPE.object) {

        throw new TypeError(`function parseSingleResource() requires parameter as single object, but got ${resourceType}`);
    }

    var toplevelMembers = parseIdAndType(ctx);
    var relationships = parseRelationships(ctx);
    var attributes_included = parseIncludedDataAndAttributes(ctx);
    
    //combine all object properties into one object
    var response = Object.assign({}, toplevelMembers, attributes_included, relationships);

    return response;
}

function parseArrayOfResources(ctx) {

    var resources = ctx.result;
    var protocolAndHostURL = getProtocolAndHostUrl(ctx.req);
    
    var result = {};

    //links
    var links = parseLinks(ctx);
    result = Object.assign(result, links);

    //result.type = parsePrimaryResourceName(ctx);

    var data = [];
    for (var resource of resources) {

        let resource_name = resource.constructor.name;
        let Model = ctx.req.app.loopback.getModel(resource_name);

        var restApiRoot = ctx.req.app.get('restApiRoot');
        var model_plural = _.get(Model, 'settings.plural', resource_name);

        let forcedSelfBaseUrl = path.join(protocolAndHostURL, restApiRoot, model_plural, _.toString(_.get(resource, 'id')));
        let forcedSelfFullUrl = path.join(protocolAndHostURL, restApiRoot, model_plural, _.toString(_.get(resource, 'id')));

        var _ctx = _generateSubContext(ctx, resource_name, resource, forcedSelfBaseUrl, forcedSelfFullUrl);
        let data_item = parseSingleResource(_ctx);

        data.push(data_item);
    }

        result.data = data;

    

    return result;
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

function _generateSubContext(ctx, resource_name, attributes, forcedSelfBaseUrl, forcedSelfFullUrl) {
    
    var _ctx = {};

    _ctx.resultType = resource_name;
    _ctx.result = attributes;
    _.set(_ctx, 'req.app.loopback', ctx.req.app.loopback);
    _.set(_ctx, 'req.forcedSelfBaseUrl', forcedSelfBaseUrl);
    _.set(_ctx, 'req.forcedSelfFullUrl', forcedSelfFullUrl);
    _.set(_ctx, 'args.filter', _.cloneDeep(ctx.args.filter));

    return _ctx;
}

/**
 *
 * @description The reason why this is combination of _parseAttributes() and _parseIncludedData() is the order of invoking them matters.
 * Call _parseIncludedData() first since the included property will be deleted in _parseAttributes() afterwards.
 * @param {*} ctx
 */
function parseIncludedDataAndAttributes(ctx) {

    function _parseIncludedData(ctx) {

        var relations = parseIncludesFilter(ctx);

        var includedData = [];
        for (let relation_name of relations) {

            let result_data = ctx.result.__data;

            let relation_data = result_data[relation_name];

            for (let data_item of relation_data) {

                if (data_item instanceof ctx.req.app.loopback.PersistedModel) {

                    var _attributes = _.clone(data_item.__data);

                    var resource_name = relation_data.itemType.modelName;
                    var _ctx = _generateSubContext(ctx, resource_name, _attributes);
                    var _topMember =parseIdAndType(_ctx);
                    
                    //remove 'id' property from attributes
                    delete _attributes.id;
                    var _included_item = Object.assign({}, _topMember, {attributes: _attributes});
                    
                    includedData.push(_included_item);
                }
            }
        }

        return includedData.length == 0 ? null : includedData;
    }

    function _parseAttributes(ctx) {

        var result = _.clone(ctx.result);
        var resource_data = {};

        //delete included resources in 'attributes' property since it will be moved to 'included' property
        var includesFilter = parseIncludesFilter(ctx);
        for (let include_filter of includesFilter) {

            delete result[include_filter];
            delete result.__data[include_filter];
        }

        //delete 'id' property from attributes since it was moved to top member properties
        delete result.id;
        delete result.__data.id;

        resource_data.attributes = result;

        return resource_data;
    }
    
    //included property
    var included = {};
    var includedData = _parseIncludedData(ctx);
    if (!_.isEmpty(includedData)) {
        included.included = includedData;
    }
    var attributes = _parseAttributes(ctx);
    return Object.assign({}, attributes, included);

}

function parseIdAndType(ctx) {

    var resource_data = {};
    var resource_type = parsePrimaryResourceName(ctx);

    resource_data.id = ctx.result.id;
    resource_data.type = resource_type;

    return resource_data;
}

function getSelfBaseUrl(ctx) {
    
    if (typeof ctx.req.forcedSelfBaseUrl != 'undefined') { // forcedSelfBaseUrl was passed

        return ctx.req.forcedSelfBaseUrl;
    }

    var req = ctx.req;
    var baseUrl = req.baseUrl;
    var selfBaseUrl = path.join(getProtocolAndHostUrl(req), baseUrl);
    var params = req.params;
    if (!_.isUndefined(ctx.result.id)) {

        selfBaseUrl = path.join(selfBaseUrl, _.toString(ctx.result.id));
    }

    return selfBaseUrl;
}

function getSelfFullUrl(ctx) {

    if (typeof ctx.req.forcedSelfFullUrl != 'undefined') { // forcedSelfFullUrl was passed

        return ctx.req.forcedSelfFullUrl;
    }

    var req = ctx.req;
    var protocolAndHostURL = getProtocolAndHostUrl(req);
    return path.join(protocolAndHostURL, req.originalUrl);
}



function getProtocolAndHostUrl(req) {
    return req.protocol + ':////' + req.get('host');
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

    return resource_data;
}

function parseLinks(ctx) {

    var links = {};
    _.set(links, 'links.self', getSelfFullUrl(ctx));

    //generate links for last page and next page
    var lastAndnextLinks = generateLastAndNextPageReqOriginalURL(ctx);
    if (!_.isUndefined(lastAndnextLinks.next)) {
        _.set(links, 'links.next', path.join(getProtocolAndHostUrl(ctx.req), lastAndnextLinks.next));
    }
    if (!_.isUndefined(lastAndnextLinks.last)) {
        _.set(links, 'links.last', path.join(getProtocolAndHostUrl(ctx.req), lastAndnextLinks.last));
    }

    return links;
}

/**
 * Get includes filter specified in URL query string
 *
 * @param {*} ctx
 * @returns {array|null} array of includes filter or empty array if not specified
 */
function parseIncludesFilter(ctx) {

    //get list of include filters
    var includes = _.get(ctx, 'args.filter.include', []);
    if (typeof includes == 'object') { //only one include filter

        return Object.keys(includes);
    }

    if (typeof includes == 'string') { //only one include filter

        return [includes];
    }

    return includes;
}
/**
 * Generate req.originalUrl for last page and next page
 *
 * @param {*} ctx 
 * @return {object} object with 2 properties are 'last' and 'next'. Return {last|next: undefined} if something wrongs
 */
function generateLastAndNextPageReqOriginalURL(ctx) {

    var originalUrl = ctx.req.originalUrl;
    //identify current page
    var cur_skip = _.get(ctx, 'args.filter.skip', 0);
    var cur_limit = _.get(ctx, 'args.filter.limit');

    if (typeof cur_limit == 'undefined') { //fetch all items => no need pagination

        return {last: undefined, next: undefined};
    }

    //attemp to cast to number
    cur_skip = _.toNumber(cur_skip);
    if (_.isNaN(cur_skip)) {

        throw new TypeError(`Skip filter value '${cur_skip}' can not convert to integer`)
    }
    cur_limit = _.toNumber(cur_limit);
    if (_.isNaN(cur_limit)) {

        throw new TypeError(`Limit filter value '${cur_limit}' can not convert to integer`)
    }

    var last_page = cur_skip - cur_limit;
    var next_page = cur_skip + cur_limit;

    var skip_RestAPI_regx = '\\[skip\\]=([^&]*)';
    var skip_NodeAPI_regx = `["']?skip.*:\\s*([^,}]*)`;
    var skip_regx = skip_RestAPI_regx + "|" + skip_NodeAPI_regx; //support both syntaxs of NodeAPI or RestAPI

    var last_page_url;
    if (last_page >= 0) {

        last_page_url = __replaceURLWithPage(originalUrl, last_page);
    }

    var next_page_url = __replaceURLWithPage(originalUrl, next_page);

    function __replaceURLWithPage(url, desired_page) {
        var exec_result = RegExp(skip_regx).exec(url);
        if (!_.isNull(exec_result)) { //matched
            var skip_matched = exec_result[0];
            var new_skip;
            if (RegExp(skip_RestAPI_regx).test(skip_matched)) {
                new_skip = `[skip]=${desired_page}`;
            }
            else {
                new_skip = `"skip":${desired_page}`;
            }
            return url.replace(RegExp(skip_regx), new_skip);
        }

        return undefined;
    }

    return {
        last: last_page_url,
        next: next_page_url
    };
}



