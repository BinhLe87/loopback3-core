const cuid = require('cuid');

//Add X-Request-ID in HTTP header
module.exports = function() {
  return function addRequestID(req, res, next) {
    //check whether exists X-Request-ID in HTTP header
    var request_id = req.headers['X-Request-ID'];
    request_id = request_id ? request_id : cuid();

    req.headers['X-Request-ID'] = request_id;
    res.setHeader('X-Request-ID', request_id);

    next();
  };
};
