'use strict';
const request = require('request');
const URI = require('urijs');
const debug = require('debug')('resizeImageOnFly.js');
const path = require('path');

module.exports = function resizeImageOnFly(req, res, next) {
  var UNABLE_RESIZE_ERROR = new Error(
    'Can not resize image on the fly at the moment. You can temporarily use the source image instead.'
  );

  var orignal_url = req.originalUrl;

  const API_RESIZE_IMAGE_ROOT_URL = process.env.API_RESIZE_IMAGE_ROOT_URL;
  var orignal_url_regx = `(?:.*${API_RESIZE_IMAGE_ROOT_URL}\/?)(.*)`;
  var exec_result = RegExp(orignal_url_regx).exec(orignal_url);

  if (!_.isNull(exec_result)) {
    //matched

    var options_param = exec_result[1];
    const SERVICE_RESIZE_IMAGE_ONFLY_URL =
      process.env.SERVICE_RESIZE_IMAGE_ONFLY_URL;

    if (_.isUndefined(SERVICE_RESIZE_IMAGE_ONFLY_URL)) {
      UNABLE_RESIZE_ERROR.data =
        'Not yet defined SERVICE_RESIZE_IMAGE_ONFLY_URL in env variable';
      return next(UNABLE_RESIZE_ERROR);
    }

    var service_resize_full_url = URI.decode(
      new URI(
        SERVICE_RESIZE_IMAGE_ONFLY_URL +
          (_.endsWith(SERVICE_RESIZE_IMAGE_ONFLY_URL, '/') ? '' : '/') +
          options_param
      )
    );

    res.on('pipe', function(src) {});

    res.on('finish', () => {});

    //request module validate failed if 'http' appears more than 1 times in 'uri' param
    //=> split from begining to the last 'http' in url as 'baseUrl' param value
    var service_url_regx = `(.*https?:\/+)(.*)`;
    var service_url_regx_result = RegExp(service_url_regx).exec(
      service_resize_full_url
    );

    if (!_.isNull(service_url_regx_result)) {
      //matched

      var service_resize_baseURL = service_url_regx_result[1];
      var service_resize_path = service_url_regx_result[2];

      request
        .get({
          uri: `/${service_resize_path}`,
          baseUrl: service_resize_baseURL,
          method: 'GET'
        })
        .on('response', function(resize_response) {
          debug(resize_response.statusCode);
        })
        .on('error', function(err) {
          UNABLE_RESIZE_ERROR.data = err;
          return next(UNABLE_RESIZE_ERROR);
        })
        .pipe(res);
    } else {
      UNABLE_RESIZE_ERROR.data = `Invalid target url of resizing image on the fly: ${service_resize_full_url}`;
      return next(UNABLE_RESIZE_ERROR);
    }
  } else {
    UNABLE_RESIZE_ERROR.data = `Wrong format of API URL: ${orignal_url}`;
    return next(UNABLE_RESIZE_ERROR);
  }
};
