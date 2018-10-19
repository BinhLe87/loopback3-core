'use strict';
const debug = require('debug')('admin.js');
const createMyTables = require('../../migrations/create-my-tables');
const generateDummyData = require('../../migrations/generate_fake_data');
const AdminUtil = require('./admin.util');

module.exports = async function(Admin) {
  Admin.generate_dummy_data = async function(
    number_records,
    include_builtin_models = false,
    only_erase_database = false,
    options,
    cb
  ) {
    var create_table_options = {
      include_builtin_models: include_builtin_models
    };

    var action_name;

    await createMyTables(create_table_options);
    action_name = 'erasing entire database';

    if (only_erase_database) {
      //ignore following steps, such as generating dummy data
      return cb(null, `Done ${action_name}!`);
    }

    await generateDummyData(number_records);
    action_name = 'generating dummy data';

    cb(null, `Done ${action_name}!`);
  };

  Admin.create_admin_account = async function(secret_key, cb) {
    if (secret_key !== 'secret_key') {
      return cb(
        Boom.forbidden(
          'Wrong secret_key. Failed to authenticate the request!!!'
        )
      );
    }

    await AdminUtil.create_admin_account();

    cb(null, 'Create admin account successfully!!!');
  };
};
