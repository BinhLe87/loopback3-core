"use strict";
const fs = require("fs");
const dotenv = require("dotenv");

module.exports = {
  //Ref: http://www.jstips.co/en/javascript/get-file-extension/
  getFileExtension: function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  },
  override_process_env: function override_process_env(env_file_path) {
    //Override process.env variables

    const envConfig = dotenv.parse(fs.readFileSync(env_file_path));
    for (var k in envConfig) {
      process.env[k] = envConfig[k];
    }

    return envConfig;
  }
};
