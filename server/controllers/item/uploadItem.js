'use strict';
var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    path = require('path'),
    crypto = require('crypto'),
    moment = require('moment'),
    createError = require('http-errors');

// Error Messages
var ERR_UPLOAD_FAILED = "Error file uploading has failed at <%=method%> <%=url%>. Please try again"

function generateRandomFileName(originFileName) {

    if(!originFileName) return null;

    var randomString = crypto.randomBytes(8).toString('hex');
    var dateString = moment().format('DDMMYYYYHHmmss'); 

    var [fileName = '', fileExt] = originFileName.split('.');
    var newFileName = `${fileName}_${randomString}_${dateString}` +
                        (fileExt ? `.${fileExt}` : '');

    return newFileName;
}


module.exports = function uploadItem(req, res, next) {

    //parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = path.resolve(process.cwd(), 'upload');
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {

        if (err) {
            
            logger.error(err, __filename);

            let error_message = logger.assert(!err, ERR_UPLOAD_FAILED, {url: req.url, method: req.method});
            let respErr = new createError.BadRequest(error_message);
            respErr.data = err;
            
            return next(respErr);
        }

        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write('received upload:\n\n');
        return res.end(util.inspect({ fields: fields, files: files }));

    });


    //off auto rename file, it also disables `form.uploadDir` and `form.keepExtensions` parameters
    form.on('fileBegin', function(name, file) {

        var uploadDir = path.resolve(process.cwd(), 'upload');
        
        var fileNameWillSave = generateRandomFileName(file.name);
        file.path = path.join(uploadDir, fileNameWillSave);
    });

    
}





