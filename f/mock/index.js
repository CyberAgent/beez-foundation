/**
 * @fileOverview Mock server.
 * @name index.js<f/mock>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var path = require('path');
var http = require('http');

var express = require('express');

var beezlib = require('beezlib');

var bootstrap = require('../bootstrap');
var config = bootstrap.config;
var lang = require('../middleware/lang');
var addheader = require('../middleware/addheader');

var router = require('./router'); // rest-ful controller

var MockServer = function MockServer() {
    this.app = undefined;
};

module.exports = new MockServer();

MockServer.prototype.run = function run(callback) {
    var compress = config.app.mock.compress || false;
    var app = this.app = express();

    config.mockapp = app;

    if (!bootstrap.store.mock) {
        return callback({name: 'NotRunning', message: 'Mock Server not running.'});
    }

    app.configure(function(){
        app.set('port', process.env.PORT || bootstrap.config.app.mock.port || 1121);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'hbs'); // handlebars
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.urlencoded());
        app.use(express.json());
        app.use(express.methodOverride());
        app.use(lang());
        app.use(addheader());

        if (compress) {
            app.use(express.compress());
        }
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });

    app.configure('development', function(){
        app.use(express.errorHandler());
    });

    http.createServer(app).listen(app.get('port'), function(){
        beezlib.logger.message("## \tExpress server listening on port:".info + (""+app.get('port')).info);
        router.setup(app);

        // end
        var url = "http://0.0.0.0:" + app.get("port");
        if (callback)
            return callback(null, {port:app.get('port'), name: "mock", url: url, compress: compress});
    });
};
