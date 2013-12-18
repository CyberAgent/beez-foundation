/**
 * @fileOverview command exec!
 * @name exec.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var bootstrap = require('../../bootstrap');
var config = bootstrap.config;

var execService = require('../../service/exec');

var ExecController = function ExecController() {
};

module.exports = new ExecController();

ExecController.prototype.get = function get(req, res, next) {
    if(!req.params.target && req.params.target != '_') {
        return res.json(404, {
            "error": {
                "name": "Not Found",
                "message": "URL Not Found."
            }
        });
    }
    execService.status(function(err, result) {
        if (err) {
            return res.json(500, {
                "error": {
                    "name": "Server Error.",
                    "message": JSON.stringify(err)
                }
            });
        }

        return res.json(200, result);
    });
};

ExecController.prototype.post = function post(req, res, next) {
    if(!req.params.target) {
        return res.json(404, {
            "error": {
                "name": "Not Found",
                "message": "URL Not Found."
            }
        });
    }
    execService.run(req.params.target, function(err, result) {
        if (err) {
            return res.json(500, err);
        }
        return res.json(200, result);
    });
};
