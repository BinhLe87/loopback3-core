module.exports = function() {

    return function logError(err, req, res, next) {

        //process error at here
        
        next(err);
    }
}