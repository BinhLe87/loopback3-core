const shell = require('shelljs');

var command = '';

//For API
shell.pushd('server/api');
command = 'npm ci';
console.log(command);
shell.exec(command);

command = 'npm list loopback-datasource-juggler';
console.log(command);
shell.exec(command, { async: true });

