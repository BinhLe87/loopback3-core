
var errorToJSON = require('utils-error-to-json');

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
module.exports = function () {

    return function responseErrorHandler(err, req, res, next) {

        var statusCode = err.status ? err.status : 500

        var body = err;
        if (process.env.NODE_ENV === 'production') {
            err.data = {}
        }

        res.status(statusCode);

        // Respond using the appropriate custom response
        return res.json(
            {
                status: "error",
                code: statusCode,
                message: err.message || "",
                data: errorToJSON(err.data || err.stack || {})
            }
        )
    }
}