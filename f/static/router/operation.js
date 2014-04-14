/**
 * @fileOverview Operation Controller
 * @name operation.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;

var OperationController = function OperationController() {
};

module.exports = new OperationController();

/**
 *
 * @param {HTTPRequest} req
 * @param {HTTPRequest} res
 * @param {function} next
 * @returns {}
 */
OperationController.prototype.get = function get(req, res, next) {

    res.locals = {
        title: 'Operation',
        view: 'operation',
        list: config.operation
    };

    return res.render('operation');
};
