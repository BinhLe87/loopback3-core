'use strict';

// Define constants for authenticate strategy
const AUTHEN_BY_CREDENTIAL = 'CREDENTIAL';
const AUTHEN_BY_TOKEN = 'TOKEN';

module.exports = function() {
  return function authenticateUser(req, res, next) {
    var authenticate_strategy;
    //If there're both of access_token and credentials appeared in http request, access_token always take precedence
    var email = _.get(req, 'body.email');
    var password = _.get(req, 'body.password');
    if (!_.isUndefined(email) && !_.isUndefined(password)) {
      authenticate_strategy = AUTHEN_BY_CREDENTIAL;
    }

    //extract access_token from http request/headers or cookie
    var access_token = extractAccessToken(req);
    if (!_.isNull(access_token)) {
      authenticate_strategy = AUTHEN_BY_TOKEN;
    }

    switch (authenticate_strategy) {
      //HACK: process the same workflow for 2 cases
      case AUTHEN_BY_CREDENTIAL:
      case AUTHEN_BY_TOKEN:
        authenBySSOWithToken()
          .then(function(result) {
            var { access_token, user_id } = result;
            if (_.isUndefined(access_token) || _.isUndefined(user_id)) {
              var error = new Error(
                'Server failed to authenticate the request.'
              );
              error.status = 403;
              error.data =
                'Not received acccess_token and user_id from SSO service';

              logger.error(error, __filename);
              return next(error);
            }

            //Insert this token into AccessToken in order to attempt to maintain the authorization steps in loopback
            var AccessToken = req.app.models.AccessToken;

            AccessToken.upsertWithWhere(
              { id: access_token, userId: user_id }, //where conditions
              { id: access_token, userId: user_id },
              (error, result) => {
                if (error) {
                  var myError = new Error(
                    'Server failed to authenticate the request.'
                  );
                  myError.status = 403;
                  myError.data =
                    'Unable to insert SSO access_token into table AccessToken in APC /n' +
                    helper.inspect(error);
                  return next(myError);
                }

                //NOTE: pass 'access_token' back to http request to simulate that user sent this access_token
                req.body['access_token'] = access_token;
                return next();
              }
            );
          })
          .catch(error => {
            var myError = new Error(
              'Server failed to authenticate the request.'
            );
            myError.status = 403;
            myError.data =
              'Failed to authenticate user from SSO service' +
              helper.inspect(error);
            return next(myError);
          });
        break;

      default:
        var error = new Error(`Server failed to authenticate the request. 
                Make sure input either credential info or access_token in request.`);
        error.status = 403;
        error.data = 'Not found credential info and/or access_token in request';

        return next(error);
    }
  };
};

function authenBySSOWithToken(access_token) {
  return new Promise((resolve, reject) => {
    //HACK: return jwt token and role ID
    return resolve({
      access_token: 'xcofq47iu4jas4ruggu1',
      user_id: 1,
      role: 'admin'
    });
  });
}

/**
 * Copies from method `getIdForRequest()` in /loopback/common/models/access-token.js
 * Extract the access token id from the HTTP request
 * @param {Request} req HTTP request object
 * @options {Object} [options] Each option array is used to add additional keys to find an `accessToken` for a `request`.
 * @property {Array} [cookies] Array of cookie names.
 * @property {Array} [headers] Array of header names.
 * @property {Array} [params] Array of param names.
 * @property {Boolean} [searchDefaultTokenKeys] Use the default search locations for Token in request
 * @property {Boolean} [bearerTokenBase64Encoded] Defaults to `true`. For `Bearer` token based `Authorization` headers,
 * decode the value from `Base64`. If set to `false`, the decoding will be skipped and the token id will be the raw value
 * parsed from the header.
 * @return {String} The access token
 */
function extractAccessToken(req, options) {
  options = options || {};
  var params = options.params || [];
  var headers = options.headers || [];
  var cookies = options.cookies || [];
  var i = 0;
  var length, id;

  // https://github.com/strongloop/loopback/issues/1326
  if (options.searchDefaultTokenKeys !== false) {
    params = params.concat(['access_token']);
    headers = headers.concat(['X-Access-Token', 'authorization']);
    cookies = cookies.concat(['access_token', 'authorization']);
  }

  for (length = params.length; i < length; i++) {
    var param = params[i];
    // replacement for deprecated req.param()
    id =
      req.params && req.params[param] !== undefined
        ? req.params[param]
        : req.body && req.body[param] !== undefined
          ? req.body[param]
          : req.query && req.query[param] !== undefined
            ? req.query[param]
            : undefined;

    if (typeof id === 'string') {
      return id;
    }
  }

  for (i = 0, length = headers.length; i < length; i++) {
    id = req.header(headers[i]);

    if (typeof id === 'string') {
      // Add support for oAuth 2.0 bearer token
      // http://tools.ietf.org/html/rfc6750
      if (id.indexOf('Bearer ') === 0) {
        id = id.substring(7);
        if (options.bearerTokenBase64Encoded) {
          // Decode from base64
          var buf = new Buffer(id, 'base64');
          id = buf.toString('utf8');
        }
      } else if (/^Basic /i.test(id)) {
        id = id.substring(6);
        id = new Buffer(id, 'base64').toString('utf8');
        // The spec says the string is user:pass, so if we see both parts
        // we will assume the longer of the two is the token, so we will
        // extract "a2b2c3" from:
        //   "a2b2c3"
        //   "a2b2c3:"   (curl http://a2b2c3@localhost:3000/)
        //   "token:a2b2c3" (curl http://token:a2b2c3@localhost:3000/)
        //   ":a2b2c3"
        var parts = /^([^:]*):(.*)$/.exec(id);
        if (parts) {
          id = parts[2].length > parts[1].length ? parts[2] : parts[1];
        }
      }
      return id;
    }
  }

  if (req.signedCookies) {
    for (i = 0, length = cookies.length; i < length; i++) {
      id = req.signedCookies[cookies[i]];

      if (typeof id === 'string') {
        return id;
      }
    }
  }
  return null;
}
