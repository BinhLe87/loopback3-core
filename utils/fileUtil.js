'use strict';

module.exports = {
  //Ref: http://www.jstips.co/en/javascript/get-file-extension/
  getFileExtension: function(filename) {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  }
};
