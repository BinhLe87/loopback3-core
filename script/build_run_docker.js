const shell = require('shelljs');
const crypto = require('crypto');
const program = require('commander');

program
  .version('0.1.0')
  .option('-e, --env <node_env>', 'NODE_ENVIRONMENT')
  .parse(process.argv);

program.parse(process.argv);

if (typeof program.env === 'undefined') {
    console.error('Must identify NODE_ENV!!!');
    process.exit(1);
 }


function exec(){

    console.log(arguments[0]);

    shell.exec(...arguments);
}

const image_name = 'apc-api';
const buf = Buffer.alloc(3); //create random 6 characters
const image_tag = crypto.randomFillSync(buf).toString('hex');

shell.pushd(`${__dirname}/./..`);

console.log(`Creating image ${image_name}:${program.env}-${image_tag}`);
exec(`docker build -t ${image_name}:${image_tag} -f Dockerfile.apc-master.${program.env} .`);

exec(`docker images | grep ${image_tag} | awk '{print $3}' | xargs -I {} docker run -it -d --name ${image_name}-${image_tag} -v /Users:/Users -p 49173:8080 -p 15672:15672 -p 5672:5672 -p 6379:6379 {} tail -f /dev/null`);