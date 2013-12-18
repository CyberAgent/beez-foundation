/**
 * @fileOverview add response header
 * @name addheader.js<f/middleware>
 * @author Kei Funagayama <funagayama_kei@cyberagnet.co.jp>
 */

var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('../bootstrap');
var config = bootstrap.config;

module.exports = function addheader() {
    var headers = {};
    var app = config.app || {};
    for (var key in app) {
        if (app[key].header) {
            headers[key] = {
                port: app[key].port,
                header: app[key].header
            };
            // envroment symbol.
            headers[key].header['X-Powered-By'] = bootstrap.package.name + '@' + bootstrap.package.version;
        }
    }

    return function(req, res, next) {
        var ret = req.headers.host.match(/:(\d{4})$/);
        var port = ret ? +ret[1] : 8000;
        _.each(headers, function (data, idx) {
            if (data.port === port) {
                _.each(data.header, function (_data, _idx) {
                    res.header(_idx, _data);
                });
            }
        });
        next();
    };
};
