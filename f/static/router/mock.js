/**
 * @fileOverview Mockdata Controller
 * @name mock.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var _ = require('underscore');

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;

var MockController = function MockController() {
};

module.exports = new MockController();

/**
 *
 * @param {HTTPRequest} req
 * @param {HTTPRequest} res
 * @param {function} next
 * @returns {}
 */
MockController.prototype.get = function get(req, res, next) {
    var list = [];

    _.each(bootstrap.store.mock.mapping, function (v, k) {
        list.push({
            uri: k,
            path: v,
            hash: bootstrap.store.mock.hash[v]
        });
    }, this);

    res.locals({
        title: 'Mock Data Viewer',
        view: 'mock',
        list: list
    });
    return res.render('mock');
};
