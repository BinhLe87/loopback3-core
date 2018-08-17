'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();

  //create user
  var Client = server.models.client;
  Client.create(
    { email: 'admin@coachingcloud.com', password: 'admin@123' },
    function(err, clientInstance) {
      console.log(clientInstance);
    }
  );
};
