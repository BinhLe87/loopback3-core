'use strict';
const debug = require('debug')('admin.js');
const createMyTables = require('../../migrations/create-my-tables');
const generateDummyData = require('../../migrations/generate_fake_data');
const AdminUtil = require('./admin.util');

module.exports = async function(Admin) {
  Admin.generate_dummy_data = async function(reset_all = false, options, cb) {
    var create_table_options = {
      reset_all: reset_all
    };

    await createMyTables(create_table_options);

    //start generating dummy data
    await generateDummyData();

    cb(null, 'Done generating dummy data!');
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
