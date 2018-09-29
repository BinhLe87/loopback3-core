const app = require('../../../server');

exports = module.exports = {};

exports.create_admin_account = function() {
  return new Promise((resolve, reject) => {
    const { User, Role, RoleMapping } = app.models;

    User.upsertWithWhere(
      { where: { email: 'admin@coachingcloud.com' } },
      {
        email: 'admin@coachingcloud.com',
        password: 'admin@123',
        name: 'admin'
      },
      (create_user_error, created_user) => {
        if (create_user_error) {
          return reject(create_user_error);
        }

        if (created_user) {
          Role.upsertWithWhere({ name: 'admin' }, { name: 'admin' }, function(
            create_role_error,
            created_role
          ) {
            if (create_role_error) {
              return reject(create_role_error);
            }

            if (created_role) {
              created_role.principals.create(
                {
                  principalType: RoleMapping.USER,
                  principalId: created_user.id
                },
                function(assign_role_error, principal) {
                  if (assign_role_error) return reject(assign_role_error);

                  resolve(true);
                }
              );
            }
          });
        }
      }
    );
  });
};
