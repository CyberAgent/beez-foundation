/**
 * @fileOverview socket server.
 * @name index.js<f/socket>
 * @author sueda_masaki <sueda_masaki@cyberagent.co.jp>
 */

var path = require('path');
var http = require('http');

var express = require('express');
var static_favicon = require('static-favicon');
var morgan = require('morgan');
var body_parser = require('body-parser');
var method_override = require('method-override');
var compression = require('compression');
var errorhandler = require('errorhandler');

var beezlib = require('beezlib');

var bootstrap = require('../bootstrap');
var config = bootstrap.config;
var lang = require('../middleware/lang');
var addheader = require('../middleware/addheader');

var router = require('./router'); // rest-ful controller

var SocketServer = function SocketServer() {
    this.app = undefined;
};

module.exports = new SocketServer();

SocketServer.prototype.run = function run(callback) {
    if (!bootstrap.store.socket) {
        return callback({name: 'NotRunning', message: 'socket Server not running.'});
    }

    var compress = config.app.socket.compress || false;
    var app = this.app = express();

    config.socketapp = app;

    app.set('port', process.env.PORT || bootstrap.config.app.socket.port || 1115);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'hbs'); // handlebars
    app.use(static_favicon());
    app.use(morgan('dev'));
    app.use(body_parser.urlencoded());
    app.use(body_parser.json());
    app.use(method_override());
    app.use(lang());
    app.use(addheader());

    if (compress) {
        app.use(compression());
    }

    //app.use(app.router);

    app.use(express.static(path.join(__dirname, 'public')));

    var env = process.env.NODE_ENV || 'development';
    if ('develop' === env) {
        app.use(errorHandler());
    }

    var server = http.createServer(app).listen(app.get('port'), function(){
        beezlib.logger.message("## \tExpress server listening on port:".info + (""+app.get('port')).info);

        var io = require('socket.io').listen(server);

        app.set('io', io);
        router.setup(app);

        // end
        var url = "http://0.0.0.0:" + app.get("port");
        return callback && callback(null, {port:app.get('port'), name: "socket", url: url, compress: compress});
    });
};
