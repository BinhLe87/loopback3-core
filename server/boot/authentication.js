'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  //create user
  var { user, Role, RoleMapping } = server.models;

  user.find({ where: { email: 'admin@coachingcloud.com' } }, (err, user) => {
    if (user == null) {
      //not exists

      user.create(
        { email: 'admin@coachingcloud.com', password: 'admin@123' },
        function(err, user) {
          if (err) {
            return helper.inspect(err);
          }

          if (user && user.isNewRecord()) {
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
    }
  });
};
