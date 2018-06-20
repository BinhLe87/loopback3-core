module.exports = function(app) {

    app.get('/status', function(req, res) {

        return res.send({status: 'running...'});
    });
}