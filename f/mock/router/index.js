/**
 * @fileOverview router
 * @name index.js<f/mock/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var fs = require('fs');
var url = require('url');
var path = require('path');
var querystring = require("querystring");

var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;
var store = bootstrap.store;

var parseUri = function parseUri(string) {
    var split = string.split('?'),
        uri = split[0],
        query = split[1] && querystring.parse(split[1]) || null;

    return {
        query: query,
        uri: uri
    };
};

var findResponse = function findResponse(data, target) {
    var targetData = parseUri(target);
    var result;

    _.some(data, function (value, key) {
        var uriData = parseUri(key);
        if (
            targetData.uri === uriData.uri &&
            _.isEqual(targetData.query, uriData.query)
        ) {
            result = {
                key: key,
                value: value
            };
            return true;
        } else {
            return false;
        }
    });

    return result;
};

var Router = function () {
};

module.exports = new Router();

/**
 * Return the mock data.
 *
 * @param {HTTPRequest} req
 * @param {HTTPResponse} res
 * @param {function} next
 */
Router.prototype.transmission = function transmission(req, res, next) {

    if (!config.app.mock.use) {
        beezlib.logger.debug("<< Mock Server is not running. application/javascript error");
        return res.json(500, {
            "error": {
                "name": "Not Runnging",
                "message": "Mock Server is not running."
            }
        });
    }

    if (!store.mock) {
        beezlib.logger.debug("<< Mock Data is not set. application/javascript error");
        return res.json(500, {
            "error": {
                "name": "Not Set",
                "message": "Mock Data is not set."
            }
        });
    }

    var proxy = false;
    if (3 <= arguments.length) {
        proxy = arguments[3];
    }

    /**
     * I read the mock data.
     */
    var load = function load(key, noRetry) {
        var res = findResponse(store.mock.data, key);
        if (res) {
            var file = store.mock.mapping[res.key];
            store.mock.reload(file);
            return res.value;
        }
        if (!noRetry) {
            store.mock.reloadAll();
            return load(key, true);
        }
        return null;
    };
    var walkAry = function walkAry(d) {
        for (var g = 0; g < d.length; g++) {
            if (_.isString(d[g])) {
                d[g] = _.template(d[g])();
            } else if (_.isArray(d[g])) {
                walkAry(d[g]);
            } else if (_.isObject(d[g])) {
                    walkObj(d[g]);
            }
        }

    };

    var walkObj = function walkObj(d) {
        var v = _.keys(d);
        for (var k = 0; k < v.length; k++) {
            if (_.isString(d[v[k]])) {
                d[v[k]] = _.template(d[v[k]])();
            } else if (_.isArray(d[v[k]])) {
                walkAry(d[v[k]]);
            } else if (_.isObject(d[v[k]])) {
                walkObj(d[v[k]]);
            }
        }
    };

    var method = req.method.toLowerCase();
    if (proxy) {
        beezlib.logger.debug('local proxy access.');
    } else {
        beezlib.logger.debug('direct access.');
    }

    var uri = querystring.unescape(req.url);
    var datas = load(uri);
    if (!datas) {
        beezlib.logger.debug("<< res.json application/javascript error");
        return res.json(500, {
            "error": {
                "name": "no match uri",
                "message": "No match uri: " + uri
            }
        });
    }
    var data = datas[method];
    if (_.isUndefined(data)) {
        if (method === 'options') {
            return res.end(); // HTTP Method: OPTIONS
        }
        beezlib.logger.debug("<< res.json application/javascript error");
        return res.json(500, {
            "error": {
                "name": "no match method",
                "message": "No match method: " + method
            }
        });
    }

    var status = 200; // default!!
    var delay = Number(req.query.__delay__) || config.app.mock.delay || 0;
    if (delay) {
        beezlib.logger.debug("Custom HTTP Response delay time:", delay);
    }

    setTimeout(function() {
        /**
         * HTTP Request data log. exclude: GET
         */
        if (req.method !== 'GET') {
            // POST PUT DELETE ...
            beezlib.logger.message(req.method, req.url);
            if (req.headers) {
                _.each(req.headers, function (val, key) {
                    beezlib.logger.message('>> header:', key, val);
                });
            }
            if (req.body) {
                beezlib.logger.message('>>');
                try {
                    beezlib.logger.message('>> body:  ', JSON.stringify(req.body));
                } catch (e) {
                    beezlib.logger.message('>> body:  ', req.body);
                }
            }
            beezlib.logger.message('');
        }

        /**
         * Custom response code.
         * request get parameter ?__status__=200
         */
        if (req.query.__status__ && /^[0-9]{3}$/.test(req.query.__status__)) {
            status = Number(req.query.__status__);
            beezlib.logger.debug("Custom HTTP Response Code:", status);
        }

        if (_.isString(data)) {
            beezlib.logger.debug("<< res.send text/plain");
            return res.send(status, data);
        }

        if (_.isNull(data) || _.isEmpty(data)) {
            beezlib.logger.debug("<< res.status")
            return res.status(status).end()
        }

        // mock data search
        walkObj(data);

        beezlib.logger.debug("<< res.json application/json");
        return res.json(status, data);

    }, delay); // Custom response time. request get parameter ?__delay__=1000 (1s) or config.app.mock.delay(ms)
};


Router.prototype.setup = function setup(express) {
    var self = this;
    // Load mock file
    _.each(['get', 'post', 'put', 'delete', 'options'], function (method) {
        express[method]('*', self.transmission);
    });
};
