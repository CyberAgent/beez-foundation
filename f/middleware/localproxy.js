/**
 * @fileOverview proxy to mock application
 * @name localproxy.js<f/middleware>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var bootstrap = require('../bootstrap');
var router = require('../mock/router');

exports = module.exports = function localproxy(options){
    options = options || {prefix: /^\/p/};

    return function localproxy(req, res, next) {
        var config = bootstrap.config;
        if (req.url.match(options.prefix)) {
            var orig_url = req.url;
            //req.url = orig_url.replace(options.prefix, '');
            req.url = req.url.replace(/^\/p/, '');
            var ret = router.transmission(req, res, next, true);
            req.url = orig_url;
            return ret;
        }
        return next();
    };
};
