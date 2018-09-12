/**
 * 500 (Server Error) Response
 *
 * Usage:
 * return res.serverError();
 * return res.serverError(err);
 * return res.serverError(err, 'some/specific/error/view');
 *
 * NOTE:
 * If something throws in a policy or controller, or an internal
 * error is encountered,  will call `res.serverError()`
 * automatically.
 */

module.exports = function serverError(data, options) {
  // Get access to `req`, `res`
  var req = this.req;
  var res = this.res;
  var detailData = options.mssg ? options.mssg : {};

  // Set status code
  res.status(500);

  // Log error to console
  if (data == undefined) {
    data = 'Internal Error. Please try again later';
  }
  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.

  if (options != undefined) {
    var detailData = {};
    Object.assign(detailData, options);
  }

  return res.json({ error: 500, detail: data, data: detailData });
};
