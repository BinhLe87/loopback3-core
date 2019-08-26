var util = require('util');
var exec = require('child_process').exec;
const debug = require('debug')('debug_exec');

var commands = {};
commands.l1 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1'`;
commands.l2 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1/attributes'`;
commands.l3 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1?filter[include][attributes]'`;
commands.l4 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1?filter={"include":"attributes"}'`;

var command = commands[process.env.npm_package_config_debug_api];

if (typeof command == 'undefined') {
  debug(
    `Can not specify URL to run curl command ${
      process.env.npm_package_config_debug_api
    }`
  );
} else {
  debug(`will run curl command: ${command}`);

  //delay send request until the api completed loading
  setTimeout(execCommand, 4000);
}

function execCommand() {
  exec(command, function(error, stdout, stderr) {
    debug('stdout: ' + stdout);
    debug('stderr: ' + stderr);

    if (error !== null) {
      debug('exec error: ' + error);
    }
  });
}
