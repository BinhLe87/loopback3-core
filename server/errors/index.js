var models = require('include-all')({

    dirname     : __dirname,
    filter      : /^(?!index)(.+)\.js$/i,
    excludeDirs : /^\.(git|svn)$/,
});


module.exports = models;