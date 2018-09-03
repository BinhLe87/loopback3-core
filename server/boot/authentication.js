'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  //create user
  var { user, Role, RoleMapping } = server.models;

  user.upsertWithWhere(
    { email: 'admin@coachingcloud.com' },
    { email: 'admin@coachingcloud.com', password: 'admin@123' },
    function(err, user) {
      if (err) {
        return helper.inspect(err);
      }

      if (user) {
        Role.upsertWithWhere({ name: 'admin' }, { name: 'admin' }, function(
          err,
          role
        ) {
          if (err) {
            return helper.inspect(err);
          }

          if (role) {
            role.principals.create(
              {
                principalType: RoleMapping.USER,
                principalId: user.id
              },
              function(err, principal) {
                if (err) return helper.inspect(err);
              }
            );
          }
        });
      }
    }
  );
};
