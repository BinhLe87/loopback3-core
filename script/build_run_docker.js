const shell = require('shelljs');
const crypto = require('crypto');

function exec(){

    console.log(arguments[0]);

    shell.exec(...arguments);
}

const image_name = 'apc';
const buf = Buffer.alloc(3); //create random 6 characters
const image_tag = crypto.randomFillSync(buf).toString('hex');

exec(`cd ../${__dirname}`);

console.log(`Creating image ${image_name}:${image_tag}`);
exec(`docker build -t ${image_name}:${image_tag} -f Dockerfile.apc-master.local .`);

exec(`docker images | grep ${image_tag} | awk '{print $3}' | xargs -I {} docker run -it -d --network host --name ${image_name}-${image_tag} -p 49173:8080 {} tail -f /dev/null`);