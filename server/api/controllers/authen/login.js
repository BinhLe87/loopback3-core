'use strict';

module.exports = function login(req, res, next) {
  var email = _.get(req.body, 'email');
  var password = _.get(req.body, 'password');

  var User = req.app.models.user;

  User.login(
    {
      email: email,
      password: password
    },
    'user',
    function(err, token) {
      if (err) {
        return next(err);
      }

      return res.send(
        JSON.stringify({
          email: email,
          access_token: token.id,
          expires_in: token.ttl
        })
      );
    }
  );
};
