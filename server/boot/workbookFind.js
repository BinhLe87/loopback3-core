'use strict';

module.exports = function (app) {

    if (app.models.workbook) {
        var Workbook = app.models.workbook;

        /**
         * If place this code in model definition json file, must listen event `dataSourceAttached` to ensure 
         * only execute after model attached to data source
         * See order of Loopback bootstrapper: https://loopback.io/doc/en/lb2/Defining-boot-scripts.html#overview
        */
        //Workbook.once('dataSourceAttached', function () {...}

        var oldFindMethod = Workbook.find;

        Workbook.find = function (filter, options, cb) {

            var targetCallback;

            if (typeof options === 'function' && options.name === 'callback') {

                targetCallback = options;
            } else {

                targetCallback = cb;
            }

            //var queryCond = { where: { price: { gt: 9000 } } };
            var queryCond = { include: { programs: 'libraries' } };

            oldFindMethod.call(Workbook, queryCond, function (err, results) {

                targetCallback(err, results);
            });
        }
    }
}