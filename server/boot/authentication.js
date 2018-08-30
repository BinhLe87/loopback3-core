'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  //create user
  var { Client, Role, RoleMapping } = server.models;

  Client.upsertWithWhere(
    { email: 'admin@coachingcloud.com' },
    { email: 'admin@coachingcloud.com', password: 'admin@123' },
    function(err, client) {
      if (err) {
        return helper.inspect(err);
      }

      if (client) {
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
                principalId: client.id
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
