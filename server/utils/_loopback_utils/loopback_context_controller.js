
var crypto = require('crypto');

var controller = {};

controller.BaseController = function () {

};

controller.BaseController.prototype = new (function () {
    var _addFilter
        , _execFilters
        , _generateSameOriginToken
        , _isActionCacheable
        , _isActionCached;

    /*
     *
     * Private utility methods
     *
    */
    _addFilter = function (phase, filter, opts) {
        var obj = { def: filter };

        obj.except = opts.except;
        obj.only = opts.only;
        obj.async = opts.async;

        this['_' + phase + 'Filters'].push(obj);
    };

    _execFilters = function (action, phase, callback) {
        var self = this
            , filters = this['_' + phase + 'Filters']
            , list = []
            , applyFilter = true 
            , filter
            , func
            , asyncArgs
        createAsyncWrappedFilter = function (def) {
            return function () {
                var args = Array.prototype.slice.call(arguments)
                    , next = args.pop();
                def.apply(self, args);
                next();
            };
        };

        if (!filters) {
            callback();
        }

        
        for (var i = 0, ii = filters.length; i < ii; i++) {
            filter = filters[i];

            applyFilter = true;
            if (filter.only) {
                if (typeof filter.only === 'string' && action !== filter.only) {
                    applyFilter = false;
                }
                if (filter.only instanceof Array && filter.only.indexOf(action) === -1) {
                    applyFilter = false;
                }
            }
            if (filter.except) {
                if (typeof filter.except === 'string' && action === filter.except) {
                    applyFilter = false;
                }
                if (filter.except instanceof Array && filter.except.indexOf(action) > -1) {
                    applyFilter = false;
                }
            }

            if (applyFilter) {
                
                
                

                
                
                asyncArgs = connectCompat ?
                    [this.request, this.response] : [];
                if (!filter.async) {
                    func = createAsyncWrappedFilter(filter.def);
                }
                else {
                    func = filter.def;
                }

                list.push({
                    func: func
                    , args: asyncArgs
                    , callback: null
                    , context: this
                });
            }
        }
        var chain = new utils.async.AsyncChain(list);

        chain.last = callback;
        chain.run();
    };

    _generateSameOriginToken = function () {
        var sha = crypto.createHash('sha1');

        sha.update(this.session.id);

        return sha.digest('hex');
    };


    _isActionCacheable = function (method, action) {
        return (this._cacheableActions.some(function (act) {
            return act == action;
        })) && method.toLowerCase() == 'get';
    };

    _getResponseCacheKey = function () {
        var params = this.params
            , cacheKey = params.controller + '/' + params.action + '/' + params.method;
        return cacheKey;
    };

    _setCachedResponse = function (statusCode, headers, content) {
        var cacheKey = _getResponseCacheKey.call(this);
        _contentCache[cacheKey] = {
            statusCode: statusCode
            , headers: headers
            , content: content
        };
    };

    _getCachedResponse = function () {
        var cacheKey = _getResponseCacheKey.call(this);
        return _contentCache[cacheKey];
    };

  
    /*
     *
     * Public methods
     *
    */

    this.canRespondTo = function (formats) {
        this.formats = [].concat(formats); 
    };

    this.cacheResponse = function (actions) {
        
        this._cacheableActions = this._cacheableActions.concat(actions);
    };

   

})();

exports.BaseController = controller.BaseController;