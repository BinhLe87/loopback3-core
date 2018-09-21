'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  //create user
  var { user, Role, RoleMapping } = server.models;

  user.find(
    { where: { email: 'admin@coachingcloud.com' } },
    (err, found_user) => {
      if (_.isEmpty(found_user)) {
        //not exists

        user.create(
          {
            email: 'admin@coachingcloud.com',
            password: 'admin@123',
            name: 'admin'
          },
          function(err, created_user) {
            if (err) {
              return helper.inspect(err);
            }

            if (created_user && created_user.isNewRecord()) {
              Role.upsertWithWhere(
                { name: 'admin' },
                { name: 'admin' },
                function(err, role) {
                  if (err) {
                    return helper.inspect(err);
                  }

                  if (role) {
                    role.principals.create(
                      {
                        principalType: RoleMapping.USER,
                        principalId: created_user.id
                      },
                      function(err, principal) {
                        if (err) return helper.inspect(err);
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
};
