process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SERVICE_NAME = 'scheduled_executor';

var express = require('express')
var app = express()
var {logger} = require('@cc_server/logger');
const dotenv = require('dotenv').config({
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
  });

// respond with "hello world" when a GET request is made to the homepage
app.post('/job', function (req, res) {
  res.send('hello world')
})

process.env.HOME_ROOT = __dirname;

var port = 3001;
app.listen(3000, () => {
    logger.info(`Scheduled executor service running on port ${port}`);
  });