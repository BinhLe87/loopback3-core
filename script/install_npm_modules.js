const shell = require('shelljs');

var command = '';

require('../server/api/helpers/loopbackUtil').apply_hot_fix().then(changes => {

    if (changes) {

        console.log('Successfully apply hot fix for files:', changes.join(', '));
        //re-check result after replace file content
        var command = `sed -n '410 ,430p' node_modules/loopback/node_modules/loopback-datasource-juggler/lib/include.js`;
        console.log(command);
        shell.exec(command, { async: true });
    }
}).catch(error => {

    console.error('Occured error apply hot fix for files:', error);
});





