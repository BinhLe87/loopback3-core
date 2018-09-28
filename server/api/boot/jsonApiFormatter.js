'use strict';

//Inspired by: https://github.com/digitalsadhu/loopback-component-jsonapi/tree/master/lib

const path = require('path');
const Promise = require('bluebird');
const URI = require('urijs');
const jsonAPIFormatterUtil = require('./jsonApiFormatter.util');
const loopback_util = require('../helpers/loopbackUtil');

const RESOURCE_TYPE = {
  single: 'single',
  collection: 'collection',
  object: 'object' //not model, just raw data object as error object, status object
};

module.exports = function(app) {
  var remotes = app.remotes();
  remotes.after('**', function(ctx, next) {
    var req_accept_header = _.get(ctx, 'req.headers.accept');
    if (req_accept_header == 'loopback/json' || _.isNull(ctx.result)) {
      ctx.resolveReponseOperation =
        jsonAPIFormatterUtil.override_resolveReponseOperation;
      return next();
    }

    ctx.req.originalUrl = URI.decode(ctx.req.originalUrl); //to avoid issues when using regx in url
    //format response follow jsonapi.org standard
    parseResouceFactory(ctx)
      .then(function(responseInJsonAPI) {
        ctx.result = responseInJsonAPI;
        next();
      })
      .catch(function(err) {
        logger.error(
          `Error parsing response into jsonApi format for ${getSelfFullUrl(
            ctx
          )}`
        );
        logger.error(helper.inspect(err));

        next(
          new Error(`Unable to response in jsonAPI format at the moment. 
            You probably try use raw format by passing the 'Accept' header parameter is 'loopback/json'.`)
        );
      });
  });
};
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
  } else if (
    typeof result == 'object' &&
    (ctx.resultType != 'object' && !_.isUndefined(ctx.resultType))
  ) {
    return RESOURCE_TYPE.single;
  } else if (
    typeof result == 'object' &&
    (ctx.resultType == 'object' || _.isUndefined(ctx.resultType))
  ) {
    return RESOURCE_TYPE.object;
  }

  throw new TypeError(
    'Unable to specify resource type is single object or array of resource objects'
  );
}

async function parseResouceFactory(ctx) {
  var resourceType = determineSingleOrCollectionResource(ctx);
  var result = {};

  switch (resourceType) {
    case RESOURCE_TYPE.single:
      result = parseSingleResource(ctx);
      break;

    case RESOURCE_TYPE.collection:
      result = await parseArrayOfResources(ctx);
      break;

    case RESOURCE_TYPE.object: //this may be error object or status object return from loopback
      result = ctx.result; //process nothing, preserve the original value
      return result;

    default:
      throw new Error(
        'parseResouceFactory(): Unable to parse resource at the moment. Please try again later'
      );
  }

  //Notice: The reason why set 'schema' property here is to want it appear once in case both of single resource or array resources
  var primaryResource = parsePrimaryResourceName(ctx);
  var Model = ctx.req.app.loopback.getModel(primaryResource);
  //get schema definition
  var modelProps = _.get(Model, 'definition.rawProperties');
  var json_schema = {};
  if (!_.isUndefined(modelProps)) {
    json_schema = _.reduce(
      modelProps,
      function(accum, prop_definitions, prop_name) {
        accum[prop_name] = _.pick(
          prop_definitions,
          Object.getOwnPropertyNames(prop_definitions)
        );
        return accum;
      },
      {}
    );
  }

  _.set(result, 'schema', json_schema);

  return result;
}

function parseSingleResource(ctx) {
  var resourceType = determineSingleOrCollectionResource(ctx);
  if (resourceType != RESOURCE_TYPE.single) {
    throw new TypeError(
      `function parseSingleResource() requires parameter as single object, but got ${resourceType}`
    );
  }

  var toplevelMembers = parseIdAndType(ctx);
  var relationships = parseRelationships(ctx);
  var attributes_included = parseIncludedDataAndAttributes(ctx);

  //combine all object properties into one object
  var response = Object.assign(
    {},
    toplevelMembers,
    attributes_included,
    relationships
  );

  return response;
}

async function parseArrayOfResources(ctx) {
  var resources = ctx.result;
  var protocolAndHostURL = loopback_util.getBaseURL(ctx.req);

  var result = {};

  //links
  var links = parseLinks(ctx);
  result = Object.assign(result, links);

  //meta info
  var count = await getCountObjects(ctx);
  var total_pages;
  var limit = null;
  if (!_.isUndefined(count)) {
    //identify whether in pagination mode
    var origin_limit = _.get(ctx, 'args.filter.limit');
    limit = _.toNumber(origin_limit);
    if (!_.isNaN(limit)) {
      total_pages = Math.ceil(count / limit);
    } else {
      //if limit is not specified means return all items in one page
      total_pages = 1;
    }
  } else {
    count = null;
    total_pages = null;
  }
  _.set(result, 'meta.count', count);
  _.set(result, 'meta.total-pages', total_pages);
  _.set(result, 'meta.limit', limit);
  _.set(result, 'meta.skip', _.get(ctx, 'args.filter.skip', 0));

  var data = [];
  for (var resource of resources) {
    let resource_name = resource.constructor.name;
    let Model = ctx.req.app.loopback.getModel(resource_name);

    var restApiRoot = ctx.req.app.get('restApiRoot');
    var model_plural = _.get(Model, 'settings.plural', resource_name);

    let forcedSelfBaseUrl = path.join(
      protocolAndHostURL,
      restApiRoot,
      model_plural,
      _.toString(_.get(resource, 'id'))
    );
    let forcedSelfFullUrl = path.join(
      protocolAndHostURL,
      restApiRoot,
      model_plural,
      _.toString(_.get(resource, 'id'))
    );

    var _ctx = _generateSubContext(
      ctx,
      resource_name,
      resource,
      forcedSelfBaseUrl,
      forcedSelfFullUrl
    );
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
    throw new Error(
      `Only support return 1 resource type, but ${
        resultTypes.length
      } resource types`
    );
  }

  return Array.isArray(resultTypes) ? resultTypes[0] : resultTypes;
}

function _generateSubContext(
  ctx,
  resource_name,
  attributes,
  forcedSelfBaseUrl,
  forcedSelfFullUrl
) {
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
  //included property
  var included = {};
  var includedData = parseIncludedDataAndAttributes_parseIncludedData(ctx);
  if (!_.isEmpty(includedData)) {
    included.included = includedData;
  }
  var attributes = parseIncludedDataAndAttributes_parseAttributes(ctx);
  return Object.assign({}, attributes, included);
}

function parseIncludedDataAndAttributes_parseIncludedData(ctx) {
  var relations = parseIncludesFilter(ctx);

  var includedData = [];
  for (let relation_name of relations) {
    let result_data = ctx.result.__data;

    //determine real model name of relation. Do this way sinece in case of Polymorphic relation,
    //relation name probably is different with real model name of relation
    let relation_model_name = _.get(
      result_data,
      `${relation_name}.constructor.name`
    );

    if (_.isEmpty(relation_model_name)) return null;

    let relation_data = result_data[relation_name];

    if (relation_data instanceof ctx.req.app.loopback.PersistedModel) {
      var _attributes = _.clone(relation_data.__data);

      var _ctx = _generateSubContext(ctx, relation_model_name, _attributes);
      var _topMember = parseIdAndType(_ctx);

      //remove 'id' property from attributes
      delete _attributes.id;
      var _included_item = Object.assign({}, _topMember, {
        attributes: _attributes
      });

      includedData.push(_included_item);
    }
  }

  return includedData.length == 0 ? null : includedData;
}

function parseIncludedDataAndAttributes_parseAttributes(ctx) {
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

function parseIdAndType(ctx) {
  var resource_data = {};
  var resource_type = parsePrimaryResourceName(ctx);

  resource_data.id = ctx.result.id;
  resource_data.type = resource_type;

  return resource_data;
}

function getSelfBaseUrl(ctx) {
  if (typeof ctx.req.forcedSelfBaseUrl != 'undefined') {
    // forcedSelfBaseUrl was passed

    return ctx.req.forcedSelfBaseUrl;
  }

  var req = ctx.req;
  var baseUrl = req.baseUrl;
  var selfBaseUrl = path.join(loopback_util.getBaseURL(req), baseUrl);
  if (!_.isUndefined(ctx.result.id)) {
    selfBaseUrl = path.join(selfBaseUrl, _.toString(ctx.result.id));
  }

  return selfBaseUrl;
}

function getSelfFullUrl(ctx) {
  if (typeof ctx.req.forcedSelfFullUrl != 'undefined') {
    // forcedSelfFullUrl was passed

    return URI.decode(ctx.req.forcedSelfFullUrl);
  }

  var req = ctx.req;
  var protocolAndHostURL = loopback_util.getBaseURL(req);
  return URI.decode(path.join(protocolAndHostURL, req.originalUrl));
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
  var url = new URI(selfBaseUrl);
  url.addQuery(`filter[include][${relation_name}]`);

  return URI.decode(url.toString());
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
  _.forOwn(relations, function(relation_values, relation_name) {
    relationships[relation_name] = {};

    relationships[relation_name].links = {};
    relationships[relation_name].links.self = generateRelationLinkSelf(
      ctx,
      relation_name
    );
    relationships[relation_name].links.related = generateRelationLinkRelated(
      ctx,
      relation_name
    );
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
    var next_link = path.join(
      loopback_util.getBaseURL(ctx.req),
      lastAndnextLinks.next
    );
    _.set(links, 'links.next', URI.decode(next_link));
  }
  if (!_.isUndefined(lastAndnextLinks.last)) {
    var last_link = path.join(
      loopback_util.getBaseURL(ctx.req),
      lastAndnextLinks.last
    );
    _.set(links, 'links.last', URI.decode(last_link));
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
  if (typeof includes == 'object') {
    //only one include filter

    return Object.keys(includes);
  }

  if (typeof includes == 'string') {
    //only one include filter

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

  var cur_limit = _parseLimitFilter(ctx);

  if (typeof cur_limit == 'undefined') {
    //fetch all items => no need pagination

    return { last: undefined, next: undefined };
  }

  //process for 'skip' parameter
  var cur_skip = _parseSkipFilter(ctx);
  cur_skip = _.isUndefined(cur_skip) ? 0 : cur_skip;

  var skip_RestAPI_regx = '\\[skip\\]=([^&]*)';
  var skip_NodeAPI_regx = `["']?skip.*:\\s*([^,}]*)`;
  var skip_regx = skip_RestAPI_regx + '|' + skip_NodeAPI_regx; //support both syntaxs of NodeAPI or RestAPI

  if (cur_skip == 0) {
    if (!RegExp(skip_regx).test(originalUrl)) {
      //will implicitly specify skip parameter in URL by adding filter[skip]=0 to originalURL as default

      var limit_NodeAPI_regx = `(["']?limit.*:\\s*[^,}]+?)`;

      let limit_regx_exec = RegExp(limit_NodeAPI_regx, 'gi').exec(originalUrl);
      //since loopback restrict 'limit' and 'skip' filter to using the same format,
      //so if `limit` exists, 'skip' must follow the format of 'limit'
      if (!_.isNull(limit_regx_exec)) {
        originalUrl = originalUrl.replace(
          limit_regx_exec[0],
          `${limit_regx_exec[0]},"skip":0`
        );
      } else {
        //'limit' not exists or using RestAPI => 'skip' use RestAPI as well

        let url = new URI(originalUrl);

        url.addQuery(`filter[skip]`, 0);
        originalUrl = URI.decode(url);
      }
    }
  }

  var last_page = cur_skip - cur_limit;
  var next_page = cur_skip + cur_limit;

  var last_page_url;
  if (last_page >= 0) {
    last_page_url = __replaceURLWithPage(
      originalUrl,
      last_page,
      skip_regx,
      skip_RestAPI_regx
    );
  }

  var next_page_url = __replaceURLWithPage(
    originalUrl,
    next_page,
    skip_regx,
    skip_RestAPI_regx
  );

  return {
    last: _.isUndefined(last_page_url) ? undefined : last_page_url,
    next: _.isUndefined(next_page_url) ? undefined : next_page_url
  };
}
/**
 *
 *
 * @param {object} ctx
 * @return {number|undefined} limit number or undefined if it is not explicitly specified
 * @returns
 */
function _parseLimitFilter(ctx) {
  //process for 'limit' parameter
  var cur_limit = _.get(ctx, 'args.filter.limit');

  if (!_.isUndefined(cur_limit)) {
    cur_limit = _.toNumber(cur_limit);
    if (_.isNaN(cur_limit)) {
      throw new TypeError(
        `Limit filter value '${cur_limit}' can not convert to integer`
      );
    }
  }

  return cur_limit;
}

function _parseSkipFilter(ctx) {
  var cur_skip = _.get(ctx, 'args.filter.skip', 0);

  if (!_.isUndefined(cur_skip)) {
    cur_skip = _.toNumber(cur_skip);
    if (_.isNaN(cur_skip)) {
      throw new TypeError(
        `Skip filter value '${cur_skip}' can not convert to integer`
      );
    }
  }
  return cur_skip;
}

function __replaceURLWithPage(url, desired_page, skip_regx, skip_RestAPI_regx) {
  var exec_result = RegExp(skip_regx).exec(url);
  if (!_.isNull(exec_result)) {
    //matched
    var skip_matched = exec_result[0];
    var new_skip;
    if (RegExp(skip_RestAPI_regx).test(skip_matched)) {
      new_skip = `[skip]=${desired_page}`;
    } else {
      new_skip = `"skip":"${desired_page}"`;
    }
    return url.replace(RegExp(skip_regx), new_skip);
  }

  return undefined;
}

/**
 * get the total of objects
 *
 * @param {*} ctx
 * @returns {number|undefined} if success, return the real number; otherwise return undefined.
 */
async function getCountObjects(ctx) {
  /**
   * check whether it is a sort of included query and parse if possible
   *
   * @param {*} ctx
    * @returns {
    object|null
  } if this is sort of an include query, returns an object {
    primary_resource, included_resource}, otherwise return null
   */
  function __checkAndParseQueryIncluded(ctx) {
    let remote_method_get_included_model_regx = /(.*).prototype.__get__(.*)/;
    let result_match = remote_method_get_included_model_regx.exec(
      ctx.methodString
    );

    if (_.isNull(result_match)) return null;

    let primary_resource = result_match[1];
    let included_resource = result_match[2];

    return {
      primary_resource: primary_resource,
      included_resource: included_resource
    };
  }

  var parsedQueryIncluded = __checkAndParseQueryIncluded(ctx);

  if (_.isNull(parsedQueryIncluded)) {
    //it's not included query

    var primaryResource = parsePrimaryResourceName(ctx);
    var Model = ctx.req.app.loopback.getModel(primaryResource);

    var whereFilters = _.get(ctx, 'args.filter.where', {});
    var countPromise = Promise.promisify(Model.count).bind(Model);
    try {
      return await countPromise(whereFilters);
    } catch (e) {
      logger.error(
        `Can not count the total number of objects for ${getSelfFullUrl(ctx)}`
      );
      logger.error(e);
      return undefined;
    }
  } else {
    //included query

    return undefined;
  }
}
