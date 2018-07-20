var util = require('util');
var exec = require('child_process').exec;

var commands = {};
commands.l1 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1'`;
commands.l2 = `curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types/1/attributes'`;

var command = commands[process.env.npm_package_config_debug_api];

if(typeof command == 'undefined') {

    console.error(`Can not specify URL to run curl command ${process.env.npm_package_config_debug_api}`);
    return;
}

console.log(`will run curl command: ${command}`);

function execCommand() {

    exec(command, function (error, stdout, stderr) {

        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
};

//delay send request until the api completed loading
setTimeout(execCommand, 4000);


