const shell = require('shelljs');

var command = '';

//For API
command = 'cd server/api && npm install';
console.log(command);
shell.exec(command, {async: true});