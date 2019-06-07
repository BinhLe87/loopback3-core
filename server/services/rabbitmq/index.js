process.env.HOME_ROOT = __dirname;

const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
  });

require('./move_position');