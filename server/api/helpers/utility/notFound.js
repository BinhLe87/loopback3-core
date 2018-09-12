/**
 * 404 (Not Found) Handler
 *
 * Usage:
 * return res.notFound();
 * return res.notFound(err);
 * return res.notFound(err, 'some/specific/notfound/view');
 *
 * e.g.:
 * ```
 * return res.notFound();
 * ```
 *
 * NOTE:
 * If a request doesn't match any explicit routes (i.e. `config/routes.js`)
 * or route blueprints (i.e. "shadow routes",  will call `res.notFound()`
 * automatically.
 */

module.exports = function notFound(data, options) {
  // Get access to `req`, `res`
  var req = this.req;
  var res = this.res;

  // Set status code
  res.status(404);

  // Log error to console
  if (data == undefined) {
    data = 'Not Found';
  }

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.

  var detailData = {};
  if (options != undefined) {
    Object.assign(detailData, options);
  }
  return res.json({ error: 404, detail: data, data: detailData });
};
