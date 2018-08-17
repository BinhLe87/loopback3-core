'use strict';

module.exports = function login(req, res, next) {
  var email = _.get(req.body, 'email');
  var password = _.get(req.body, 'password');

  var Client = req.app.models.client;

  Client.login(
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
          accessToken: token.id
        })
      );
    }
  );
};
