'use strict';

const { apply_hot_fix } = require('../helpers/loopbackUtil');

module.exports = async function(server) {
  apply_hot_fix();
};
