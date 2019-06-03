const shell = require("shelljs");
const crypto = require("crypto");
const program = require("commander");
const path = require("path");

module.exports = exports = build_run_docker();

function build_run_docker() {
  program
    .version("0.1.0")
    .option("-i, --imagename [imagename]", "IMAGE_NAME")
    .option("-t, --target", "DOCKER_STAGE")
    .option("-f, --dockerfile <dockerfile>", "DOCKER_FILE")
    .option("-r, --home_root <home_root>", "HOME_ROOT")

    .parse(process.argv);
  const DOCKER_PARAMS_NAME = ["target"]; //Declare docker params will be used

  program.parse(process.argv);

  if (typeof program.home_root === "undefined") {
    console.error("Must identify --home_root!!!");
    process.exit(1);
  }

  if (typeof program.imagename === "undefined") {
    console.error("Must identify --imagename!!!");
    process.exit(1);
  }

  function exec() {
    console.log(arguments[0]);

    shell.exec(...arguments);
  }

  const image_name = program.imagename;
  const buf = Buffer.alloc(3); //create random 6 characters
  const image_tag = crypto.randomFillSync(buf).toString("hex");

  shell.pushd(`${program.home_root}`);

  console.log(`Creating image ${image_name}:${image_tag}`);

  //Docker build params
  var docker_params = [];
  for (let docker_param_name of DOCKER_PARAMS_NAME) {
    if (program[docker_param_name]) {
      docker_params.push(
        `--${docker_param_name} ${program[docker_param_name]}`
      );
    }
  }

  var dockerfile_name = program.dockerfile || 'Dockerfile';
  var dockerfile_path = path.resolve(program.home_root, dockerfile_name);
  exec_wrapper(
    `docker build ${docker_params.join(
      " "
    )} -t ${image_name}:${image_tag} -f ${dockerfile_path} .`
  );

  exec_wrapper(
    `docker images | grep ${image_tag} | awk '{print $3}' | xargs -I {} docker run -it -d --name ${image_name}-${image_tag} -v /Users:/Users -p 49173:8080 -p 15672:15672 -p 5672:5672 -p 6379:6379 -p 5044:5044 -p 3001:3000 {} tail -f /dev/null`
  );

  function exec_wrapper(command) {
    console.log(`Will run: ${command}`);
    exec(command);
  }
};


