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
 * @param {Object} err.data - Error detail object.
 *
 */
module.exports = function() {
  return function responseErrorHandler(err, req, res, next) {
    Boom.boomify(err);

    var error_response = _.get(err, 'output.payload', {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal Server Error. Please try again later'
    });

    if (process.env.NODE_ENV === 'production') {
      error_response.data = {};
    } else {
      //in development environment, for debug purpose, it will print out details if any
      error_response.data = err.data || err.stack || {};
    }

    //log
    logger.info(error_response);

    // Respond using the appropriate custom response
    res.status(error_response.statusCode);
    return res.json(error_response);
  };
};