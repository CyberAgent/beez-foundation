/**
 * @fileOverview Mockviewdata Controller
 * @name mockview.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var _ = require('underscore');

var beezlib = require('beezlib');

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;

var MockviewController = function MockviewController() {
};

module.exports = new MockviewController();

/**
 *
 * @param {HTTPRequest} req
 * @param {HTTPRequest} res
 * @param {function} next
 * @returns {}
 */
MockviewController.prototype.get = function get(req, res, next) {
    if (!req.params.hash) {
        return res.json(404, {
            "error": {
                "name": "Not Found",
                "message": "URL Not Found."
            }
        });
    }
    var hash = req.params.hash;
    var path = '';
    _.some(bootstrap.store.mock.hash, function (v, k) {
        if (v === hash) {
            path = k;
            return true;
        }
    }, this);

    var json = {};

    if (/.json$/.test(path)) {
        json = beezlib.fsys.readJsonSync(path, true, this.encode);
    } else if (/.js$/.test(path)) {
        json = beezlib.fsys.readFileFnJSONSync(path, this.encode);
    } else {
        var msg = 'there is no data mapping of hash. ' + path;
        beezlib.logger.warn(msg);
        return res.json(404, {
            "error": {
                "name": "Not Found",
                "message": msg
            }
        });
    }


    res.locals = {
        title: 'Mockview Data Viewer',
        view: 'mockview',
        hash: hash,
        path: path,
        text: JSON.stringify(json, null, '    ')
    };

    return res.render('mockview');
};
