'use strict';
const debug = require('debug')('admin.js');
const createMyTables = require('../../migrations/create-my-tables');
const generateDummyData = require('../../migrations/generate_fake_data');

module.exports = async function(Admin) {
  Admin.generate_dummy_data = async function(options, cb) {
    await createMyTables();

    //start generating dummy data
    await generateDummyData();

    cb(null, 'Done generating dummy data!');
  };
};
