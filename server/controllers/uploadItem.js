'use strict';
var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    path = require('path');


module.exports = function uploadItem(req, res, next) {

    //parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = path.resolve(process.cwd(), 'upload');
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {

        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write('received upload:\n\n');
        return res.end(util.inspect({ fields: fields, files: files }));

        next();
    });


    //off auto rename file, it also disables `form.uploadDir` and `form.keepExtensions` parameters
    //FIXME:
    //Currently, if the client upload a file that exists already, 
    //it will override previous file TRANSPARENTLY
    
    form.on('fileBegin', function(name, file) {

        var uploadDir = path.resolve(process.cwd(), 'upload');
        file.path = path.join(uploadDir, file.name);
    });

    
}