var util = require('util');
var exec = require('child_process').exec;

var commands = {

    get_programs: `curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ \ 
 "name": "program_1", \ 
 "libraryId": "200" \ 
 }' 'http://localhost:8080/api/programs'`,
}


var command = commands[process.env.npm_package_config_debug_api];

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
setTimeout(execCommand, 3000);


