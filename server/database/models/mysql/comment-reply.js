'use strict';

module.exports = function(Commentreply) {
  Commentreply.on('attached', function(attached) {
    delete Commentreply.relations.replies;
  });
};
