/**
 * @fileOverview router
 * @name index.js<f/socket/router>
 * @author Masaki Sueda <sueda_masaki@cyberagent.co.jp>
 */

var fs = require('fs');
var url = require('url');
var path = require('path');

var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;
var store = bootstrap.store;

var Router = function () {
};

module.exports = new Router();

/**
 * Return the socket data.
 *
 * @param {String} req
 * @param {Function} callback
 */
Router.prototype.transmission = function transmission(req, namespace, format, callback) {

    if (!_.isString(req)) {
        beezlib.logger.debug("<< request should be string.")
        return callback(req);
    }

    if (!config.app.socket.use) {
        beezlib.logger.debug("<< Socket Server is not running. application/javascript error");
        return callback(req);
    }

    if (!store.socket) {
        beezlib.logger.debug("<< Socket Data is not set. application/javascript error");
        return callback(req);
    }

    /**
     * create regexp by format
     * @param  {String} format - formatted string
     */
    var formatRegexp = function formatRegexp(format) {
        format = format.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&')
                       .replace(/%.{1}/g, '(.+?)');
        return new RegExp('^' + format + '$');
    };

    /**
     * format string
     */
    var formatString = function formatString() {
        var args = Array.prototype.slice.call(arguments);
        var str = args.pop();

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%.{1}/, args[i]);
        }

        return str;
    };

    /**
     * get socket data
     */
    var load = function load(key, noRetry) {
        if (store.socket.mapping.hasOwnProperty(key)) {
            var file = store.socket.mapping[key];
            store.socket.reload(file);
            return store.socket.data[key];
        }
        if (!noRetry) {
            store.socket.reloadAll();
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

    format = format || '%s.%s:%s';
    var regexp = format && formatRegexp(format);
    var match = req.match(regexp);

    if (!match) {
        beezlib.logger.debug('data format is illegal');
        return callback && callback('data format is illegal');
    }

    var service = match[1];
    var method = match[2];
    var body = match[3];

    try {

        body = JSON.parse(body);
        var datas = load(namespace);
        var data = (datas[service] && datas[service][method]) || datas[method];
        var delay = config.app.socket.delay || body.__delay__ || 0;

        if (!data) {
            beezlib.logger.error('<< res.json application/javascript error');
        }

        if (body.__error__) {
            var err = new Error('Custom Response close connection');
            return callback && callback(err);
        }

        // set request id
        data._req = body._req;

        if (delay) {
            beezlib.logger.debug('Custom Response delay time:', delay);
        }

        setTimeout(function() {
            callback && callback(null, formatString(service, method, JSON.stringify(data), format));
        }, delay);

    } catch (e) {
        beezlib.logger.error(e);
    }

};

Router.prototype.setup = function setup(app) {
    var self = this;
    var io = app.get('io');
    var namespace = config.app.socket.namespace;
    var room;

    // set events for each namespace
    _.each(namespace, function (name) {

        var index = name.indexOf('/');
        if (index === 0) {
            name = name.substr(1);
        }

        io.of('/' + name).on('connection', function (socket) {
            beezlib.logger.debug('connection start');

            socket.on('disconnect', function (socket) {
                beezlib.logger.warn('<< disconnect namespace:', name);
            });

            socket.on('join', function (_room) {

                if (_room) {
                    beezlib.logger.debug('<< join the room :', _room);
                    socket.join(_room);
                    room = _room;
                    socket.emit('joined');
                }

            });

            socket.on('message', function (req, format) {
                beezlib.logger.debug('<< get message :', req);

                self.transmission(req, name, format, function (err, res) {
                    if (err) {
                        socket.emit('error', err);
                        return;
                    }

                    socket.emit('message', res);
                    if (room) {
                        beezlib.logger.debug('>> send message to room :', room, ' namespace: ', name);
                        socket.broadcast.emit('message', res);
                    } else {
                        beezlib.logger.debug('>> send message to all. namespace: ', name);
                        socket.broadcast.to(room).emit('message', res);
                    }

                });

            });

            socket.on('error', function (err) {
                beezlib.logger.error(err);
                socket.disconnect();
            });

        });

    });

};
