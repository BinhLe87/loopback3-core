module.exports = exports = {};
const {logger} = require('../errors/errorLogger');
const {inspect} = require('../utils/printHelper');

const axios = require('axios');


exports.login = async function (url, email, password, is_use_cache = true) {

    if (arguments.length < 3) {

        var message_error = `function login() requires at least 3 arguments are url, email, password, but got ${arguments.length}`;
        logger.error(message_error)
        throw new Error(message_error);
    }

    if(is_use_cache && process.env.API_ACCESS_TOKEN) {

        return process.env.API_ACCESS_TOKEN;
    }

    var { data: login_data } = await axios.request({
        url: url,
        method: "post",
        data: {
          email: email,
          password: password
        }
      }).catch(error => {

        throw Error('Unable to login API:' + inspect(error));
      });
  
      process.env.API_ACCESS_TOKEN = login_data.access_token; //cache for re-use later

      return login_data.access_token;
}


{
    
  }