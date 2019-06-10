/**
 * Generic Error Handler / Classifier
 *
 * Return error response based on JSend format
 * https://labs.omniti.com/labs/jsend
 *
 * Defaults to `res.serverError`
 *
 * Usage:
 * ```javascript
 * if (err) return res.error({code:errorCode, message:"fail", data:err});
 * ```
 *
 * @param {Object} err - The error object.
 * @param {number} err.code - Error Code.
 * @param {string} err.mssg - Error message.
 * @param {Object} err.details - Error detail object.
 *
 */
module.exports = function() {
  //Notice that: if error_code >= 500, boom always hide real messsage by replaced with common message is 'An internal server error occurred'
  return function responseErrorHandler(err, req, res, next) {
    Boom.boomify(err, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error. Please try again later',
      override: false
    });

    var error_response = _.get(err, 'output.payload', {});

    if (process.env.NODE_ENV === 'production') {
      error_response.details = {};
    } else {
      //in development environment, for debug purpose, it will print out details if any
      error_response.details =
        err.details ||
        _.get(err, 'data.details') ||
        _.get(err, 'data') ||
        err.stack ||
        {};
    }

    //log
    logger.error(error_response);

    // Respond using the appropriate custom response
    res.status(error_response.statusCode);
    return res.json(error_response);
  };
};
