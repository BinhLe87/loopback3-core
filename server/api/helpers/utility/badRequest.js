/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 * return res.badRequest(data, 'some/specific/badRequest/view');
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)',
 *   'trial/signup'
 * );
 * ```
 */

module.exports = function badRequest(data, options) {
  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;

  // Set status code
  res.status(400);

  // Log error to console
  if (data == undefined) {
    data = 'Not Valid';
  }

  var detailData = {};
  if (options != undefined) {
    Object.assign(detailData, options);
  }

  return res.json({ error: 400, detail: data, data: detailData });
};
