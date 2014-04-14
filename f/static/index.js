/**
 * @fileOverview Static file server.
 * @name index.js<f/static>
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

var modstatic = require('../middleware/modstatic');
var localproxy = require('../middleware/localproxy');

var router = require('./router'); // rest-ful controller

var StatServer = function StatServer() {
    this.app = undefined;
};

module.exports = new StatServer();

StatServer.prototype.run = function run(callback) {
    var app = this.app = express();
    var compress = bootstrap.config.app.stat.compress || false;

    app.configure(function () {
        app.set('port', process.env.PORT || bootstrap.config.app.stat.port || 1109);
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
        app.use(localproxy());

        // module static file server.
        app.use(modstatic(
            config.stats,
            {
                hidden: true,
                redirect: true,
                maxAge: 0
            }
        ));

        app.use(express.static(path.join(__dirname, 'public')));
    });

    app.configure('development', function () {
        app.use(express.errorHandler());
    });

    http.createServer(app).listen(app.get('port'), function () {
        beezlib.logger.message("## \tExpress server listening on port:".info + ("" + app.get('port')).info);
        router.setup(app);
        // end
        var url = "http://0.0.0.0:" + app.get("port");
        if (callback) {
            callback(null, { port: app.get('port'), name: "mock", url: url, compress: compress });
            return;
        }
    });
};
