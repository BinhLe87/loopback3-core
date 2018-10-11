const shell = require('shelljs');
const replace_in_file = require('replace-in-file');
const path = require('path');

var command = '';

//----------------For API service
shell.pushd('server/api');
command = 'npm ci';
console.log(command);
shell.exec(command);

command = 'npm list loopback-datasource-juggler';
console.log(command);
shell.exec(command, { async: true });


var code_block_would_fix_regx = `if\\s*\\(polymorphic\\)\\s+\\{[\\s\\S]*(.*?throughFilter\\.where\\[polymorphic\\.discriminator\\][\\s\\S]*?)\\}`;
var code_hot_fix = `//Notice: Binh hot fix 10-Octorber-2018 \n
var throughModel = polymorphic.invert ? relation.modelTo : relation.modelFrom; \n
throughFilter.where[polymorphic.discriminator] = throughModel.definition.name; \n`;

var file_path_would_fix = path.join(__dirname, '../server/api/node_modules/loopback/node_modules/loopback-datasource-juggler/lib/include.js');
//HACK: just for local
//var file_path_would_fix ='/Users/steven_lee/Documents/MYDATA/Miscellaneous/Screen shot/test_replace/include.js';

const options = {
    files: file_path_would_fix,
    from: (file) => RegExp(code_block_would_fix_regx, 'gi'),
    to: (input_match) => {
        
        var input_match_results = RegExp(code_block_would_fix_regx, 'gi').exec(input_match);
        if (Array.isArray(input_match_results) && input_match_results.length > 1) {

            return input_match.replace(input_match_results[1], code_hot_fix);
            
        }
    }
};

replace_in_file(options).then(changes => {

        console.log('Modified files:', changes.join(', '));
    }).catch(error => {

        console.error('Error occurred:', error);
    })


command = `sed -n '410 ,430p' node_modules/loopback/node_modules/loopback-datasource-juggler/lib/include.js`;
console.log(command);
shell.exec(command, { async: true });