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

///HACK: Print content file for debug
command = `sed -n '410 ,430p' node_modules/loopback/node_modules/loopback-datasource-juggler/lib/include.js`;
console.log(command);
shell.exec(command, { async: true });
