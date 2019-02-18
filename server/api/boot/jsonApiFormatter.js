'use strict';

//Inspired by: https://github.com/digitalsadhu/loopback-component-jsonapi/tree/master/lib

const path = require('path');
const Promise = require('bluebird');
const URI = require('urijs');
const jsonAPIFormatterUtil = require('./jsonApiFormatter.util');
const loopback_util = require('../helpers/loopbackUtil');
const app = require('../server');

const RESOURCE_TYPE = {
  single: 'single',
  collection: 'collection',
  object: 'object' //not model, just raw data object as error object, status object
};

module.exports = function(app) {
  var remotes = app.remotes();
  const content_types_will_ignore_format = `.*(loopback\\/json|text\\/html).*`;

  remotes.after('**', function(ctx, next) {
    transformFileNameInDBToFileURL(ctx);

    var req_accept_header = _.get(ctx, 'req.headers.accept');
    req_accept_header =
      req_accept_header == '*/*'
        ? _.get(ctx, 'res._headers.content-type', req_accept_header)
        : req_accept_header;

    if (
      new RegExp(content_types_will_ignore_format, 'gi').test(
        req_accept_header
      ) ||
      _.isNull(ctx.result)
    ) {
      ctx.resolveReponseOperation =
        jsonAPIFormatterUtil.override_resolveReponseOperation;
      return next();
    }

    __overwriteCtxWithOptions(ctx);

    ctx.req.originalUrl = URI.decode(ctx.req.originalUrl); //to avoid issues when using regx in url
    //format response follow jsonapi.org standard
    parseResouceFactory(ctx)
      .then(function(responseInJsonAPI) {
        ctx.result = responseInJsonAPI;
        next();
      })
      .catch(function(err) {
        var parse_resource_error = new Error(`Unable to response in jsonAPI format at the moment. 
            You probably try use raw format by passing the 'Accept' header parameter is 'loopback/json'.`);
        parse_resource_error.data = err;

        next(parse_resource_error);
      });

    /**
     * Apply options' properties directly into ctx object.
     * The options can be received via 1 in 3 ways:
     * - `ctx.cc_hook_options`
     * - `ctx.result.cc_hook_options`
     * - `ctx.req.query.cc_hook_options`
     * In 2 cases later, it will delete `cc_hook_options` to avoid unexpected result
     *
     * @param {*} ctx
     */
    function __overwriteCtxWithOptions(ctx) {
      var options = Object.assign(
        {},
        ctx.cc_hook_options,
        _.get(ctx, 'result.cc_hook_options'),
        _.get(ctx, 'req.query.cc_hook_options')
      );

      _.forOwn(options, (value, key) => {
        ctx[key] = value;
      });

      _.unset(ctx, 'req.query.cc_hook_options');
      _.unset(ctx, 'result.cc_hook_options');
    }
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

  var data_inspect = result.attributes || result.data; //get data in case of both single and collection resource
  data_inspect = Array.isArray(data_inspect)
    ? _.get(data_inspect[0], 'attributes')
    : data_inspect;
  json_schema = inspectSchemaObject(data_inspect, json_schema);

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
  var meta_fields = parseMetaFieldsForSingleResouce(ctx);

  //combine all object properties into one object
  var response = Object.assign(
    {},
    toplevelMembers,
    attributes_included,
    meta_fields,
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
  var count = await getTotalCountItems(ctx);
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

    let forcedSelfBaseUrl = loopback_util.buildAbsoluteURLFromReqAndRelativePath(
      ctx.req,
      path.join(restApiRoot, model_plural, _.toString(_.get(resource, 'id')))
    );

    let forcedSelfFullUrl = forcedSelfBaseUrl;

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
  var resultType = ctx.resultType;

  if (Array.isArray(resultType) && resultType.length != 1) {
    throw new Error(
      `Only support return 1 resource type, but ${
        resultType.length
      } resource types`
    );
  }

  resultType = Array.isArray(resultType) ? resultType[0] : resultType;

  var primary_resource_name;
  //resultType may is PersistedModel object
  //so it should be checked data type and parse to string type if needed
  if (resultType instanceof ctx.req.app.loopback.PersistedModel) {
    primary_resource_name = resultType.constructor.name;
  } else if (typeof resultType == 'string') {
    primary_resource_name = resultType;
  }

  if (typeof primary_resource_name != 'string') {
    var log_message =
      'parsePrimaryResourceName(): Unable to determine primary resource name';
    var parse_error = new Error(log_message);
    parse_error.data = ctx;

    throw parse_error;
  }

  return primary_resource_name;
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
  if (!_.isNull(includedData)) {
    included.included = includedData;
  }
  var attributes = parseIncludedDataAndAttributes_parseAttributes(ctx);
  return Object.assign({}, attributes, included);
}
/**
 *
 *
 * @param {*} ctx
 * @returns {null|empty array|array} null if not exists include filter in query string.
 * Otherwise returns empty array if not found data of included resources
 */
function parseIncludedDataAndAttributes_parseIncludedData(ctx) {
  var relations = parseIncludesFilter(ctx);

  var includedData = _.isEmpty(relations) ? null : [];

  for (let relation_name of relations) {
    let result_data = ctx.result.__data;

    //determine real model name of relation. Do this way sinece in case of Polymorphic relation,
    //relation name probably is different with real model name of relation
    var relation_model_name =
      typeof relation_name == 'string'
        ? relation_name
        : relation_name.constructor.name;

    if (_.isEmpty(relation_model_name)) return null;

    let relation_data = result_data[relation_model_name];

    //standardize relation_data variable always becomes array type
    var relation_data_array = Array.isArray(relation_data)
      ? relation_data
      : [relation_data];

    for (let relation_data_item of relation_data_array) {
      if (relation_data_item instanceof ctx.req.app.loopback.PersistedModel) {
        var _attributes = _.clone(relation_data_item.__data);

        //TODO: support contains 'included' property deeper
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
  }

  return includedData;
}

function parseIncludedDataAndAttributes_parseAttributes(ctx) {
  var ctx_result_data = _.clone(ctx.result.__data);

  var resource_data = {};

  //delete included resources in 'attributes' property since it will be moved to 'included' property
  var includesFilter = parseIncludesFilter(ctx);
  for (let include_filter of includesFilter) {
    //delete result[include_filter];
    delete ctx_result_data[include_filter];
  }

  //delete 'id' property from attributes since it was moved to top member properties
  //delete result.id;
  delete ctx_result_data.id;
  delete ctx_result_data.createdAt;
  delete ctx_result_data.updatedAt;

  resource_data.attributes = ctx_result_data;

  return resource_data;
}

function parseIdAndType(ctx) {
  var resource_data = {};
  var resource_type = parsePrimaryResourceName(ctx);

  resource_data.id = ctx.result.id;
  resource_data.type = resource_type;

  return resource_data;
}

/**
 * parse meta fields for single resource, such as createdAt, updatedAt
 *
 * @param {*} ctx
 * @returns {object} returns empty object {} if no meta fields
 */
function parseMetaFieldsForSingleResouce(ctx) {
  var result = ctx.result;
  var meta = {};

  var createdAt = _.get(result, 'createdAt');
  var updatedAt = _.get(result, 'updatedAt');

  meta = Object.assign(
    {},
    _.isUndefined(createdAt)
      ? {}
      : {
          createdAt: createdAt
        },
    _.isUndefined(updatedAt)
      ? {}
      : {
          updatedAt: updatedAt
        }
  );

  return _.isEmpty(meta)
    ? {}
    : {
        meta: meta
      };
}

function getSelfBaseUrl(ctx) {
  if (typeof ctx.req.forcedSelfBaseUrl != 'undefined') {
    // forcedSelfBaseUrl was passed

    return ctx.req.forcedSelfBaseUrl;
  }

  var req = ctx.req;
  var baseUrl = req.baseUrl;
  var selfBaseUrl = loopback_util.buildAbsoluteURLFromReqAndRelativePath(
    req,
    baseUrl
  );
  if (!_.isUndefined(ctx.result.id)) {
    selfBaseUrl = path.join(selfBaseUrl, _.toString(ctx.result.id));
  }

  return selfBaseUrl;
}

function getSelfFullUrl(ctx) {
  if (typeof ctx.req.forcedSelfFullUrl != 'undefined') {
    // forcedSelfFullUrl was passed

    return ctx.req.forcedSelfFullUrl;
  }

  var req = ctx.req;
  return loopback_util.buildAbsoluteURLFromReqAndRelativePath(
    req,
    req.originalUrl
  );
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
  return selfBaseUrl + '/' + relation_name;
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

    return {
      last: undefined,
      next: undefined
    };
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
 * get the total count of items. It will execute original remote method one more time after removing fiters
 * that affect total count items such as 'limit' filter and 'skip' filer
 *
 * @param {*} ctx
 * @returns {number|undefined} if success, return the total number; otherwise return undefined.
 */
async function getTotalCountItems(ctx) {
  return new Promise((resolve, reject) => {
    var limit = _.get(ctx, 'args.filter.limit');

    if (_.isUndefined(limit)) {
      var result = ctx.result;

      if (Array.isArray(result)) return resolve(result.length);

      return resolve(undefined);
    } else {
      //existing limit on query

      var shared_method_count = __convertQueryToCountSharedMethod(ctx);
      //remove `limit' filter and `skip` filter that cause incorrect total count
      var new_args = _.cloneDeep(ctx.args);
      delete new_args.filter.limit;
      delete new_args.filter.skip;
      delete new_args.filter.offset; //paired with `skip` filter

      new_args.options.is_ignore_query_item_attributes = true; //skip process in subscribing 'loaded' event in item.js

      //ctx.instance if this query type is 'included' query
      //targetSharedMethod.ctor if this query is only have primary resource
      shared_method_count.invoke(
        ctx.instance || shared_method_count.ctor,
        new_args,
        {},
        ctx,
        (err, result) => {
          resolve(result.count);
        }
      );
    }
  });

  function __convertQueryToCountSharedMethod(ctx) {
    var method_string_origin = ctx.methodString;

    var pri_resource_method_string_matcher = RegExp('(.*?)\\..*').exec(
      method_string_origin
    );
    if (_.isNull(pri_resource_method_string_matcher)) {
      return ctx.method;
    }

    var pri_resource_name = pri_resource_method_string_matcher[1];

    //replace methodString is type of either `get` or `find` to `count` if any
    var method_string_count = method_string_origin.replace(
      /(get|find|findOne|findById|findOrCreate)/gi,
      'count'
    );
    var pri_resource_model = app.models[pri_resource_name];

    var shared_method_count = _.find(pri_resource_model.sharedClass.methods(), {
      stringName: method_string_count
    });

    return shared_method_count;
  }
}

/**
 * check whether ctx.result contains any tranformed file name - in root level -
 * needs to be transformed to file url be downloadable.
 *
 * @param {*} ctx
 * @return {} The result of tranforming process will be reflected back to ctx argument
 */
function transformFileNameInDBToFileURL(ctx) {
  const _FILENAME_ATTRIBUTE_NAME_ARRAY = [
    'file_url',
    'image_url',
    'high_url',
    'medium_url',
    'low_url'
  ];
  var FILENAME_ATTRIBUTE_NAME_REGEXP = new RegExp(
    _FILENAME_ATTRIBUTE_NAME_ARRAY.join('|'),
    'i'
  );

  if (_.isEmpty(ctx.result)) return;

  ctx.result = __transformFileNameInObject(ctx.result);

  function __transformFileNameInObject(object) {
    return _.transform(
      object,
      (accumulator, value, key, object) => {
        var transformed_value = value; //initialize with original value

        if (_.isObjectLike(value)) {
          //keep recursively object

          transformed_value = __transformFileNameInObject(value);
        }

        if (_.isString(value) && FILENAME_ATTRIBUTE_NAME_REGEXP.test(key)) {
          var image_url = value;

          if (!_.isUndefined(image_url)) {
            if (!RegExp('http.*', 'gi').test(image_url)) {
              //ensure only transform once
              var transformed_file_name = image_url;
              var transformed_file_url = loopback_util.convertTransformedFileNameToFileURL(
                ctx,
                transformed_file_name
              );

              //update new image url back to ctx.result
              transformed_value = transformed_file_url;

              accumulator[key] = transformed_value;
            }
          }
        }
      },
      object
    );
  }
}

/**
 * Inspect the data type structure for schema field is kind of 'object' type or 'array of object' type. It supports recursive inspector
 *
 * @param {object} object object need to inspect its schema
 * @param {object} object_schema schema object describe data type name of each of schema fields. It is used to filter schema fields that need to be inspected
 * @returns {object} new schema object after inspecting its schema field meets condition
 */
function inspectSchemaObject(object, object_schema) {
  if (_.isUndefined(object) || typeof object_schema !== 'object')
    return object_schema;

  const dataTypesNeedInspect = ['object'];

  var object_schema_new = _.cloneDeep(object_schema);

  _.forOwn(
    object_schema_new,
    (schema_item_value, schema_item_key, schema_item_object) => {
      var data_type = _.get(schema_item_value, 'type');

      if (!_.isUndefined(data_type)) {
        let is_schema_array_of_objects = _.isEqual(data_type, ['object']);
        if (
          dataTypesNeedInspect.includes(data_type) ||
          is_schema_array_of_objects
        ) {
          //only inspect if 'object' argument contains this schema_item_key
          let object_property_data = object[schema_item_key];

          if (!_.isEmpty(object_property_data)) {
            let object_needs_inspect = Array.isArray(object_property_data)
              ? object_property_data[0]
              : object_property_data;
            let inspect_result = __inspectPropertyDataTypesInAnObject(
              object_needs_inspect
            );

            object_schema_new[schema_item_key] = Object.assign(
              {},
              schema_item_value,
              {
                type_inspector: is_schema_array_of_objects
                  ? [inspect_result]
                  : inspect_result
              }
            );
          }
        }
      }
    }
  );

  return object_schema_new;

  function __inspectPropertyDataTypesInAnObject(object_inspect) {
    var result = {};
    _.forOwn(object_inspect, (value, key) => {
      result[key] =
        typeof value === 'object'
          ? __inspectPropertyDataTypesInAnObject(value)
          : typeof value;
    });

    return result;
  }
}
