/**
 * @fileOverview router
 * @name index.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var _ = require('underscore');
var beezlib = require('beezlib');

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;


var Router = function () {
    this.handlers = {
        'home': {
            'uri': '/'
        },
        'operation': {
            'uri': '/o'
        },
        'exec': {
            'uri': '/e/:target'
        }
    };
};

module.exports = new Router();


/**
 * handlers URLルーティング
 */
Router.prototype.setup = function setup(express) {
    beezlib.logger.debug('To register the controller for the URL routing.');

    for (var name in this.handlers) {
        var jspath = config.HOME + '/static/router/' + name;
        beezlib.logger.debug('require js file. ' + jspath);

        var route = require(jspath);
        var methods = _.keys(route.__proto__);

        for (var i = 0; i < methods.length; i++ ) {
            var method = methods[i];
            var uri = this.handlers[name].uri;

            express[method](uri, route[method]);
            beezlib.logger.debug('Add URL-base Routing [', method.toUpperCase(), name, '#', uri,']');

        }
    }
};
