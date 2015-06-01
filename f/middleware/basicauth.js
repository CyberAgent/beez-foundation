/**
 * @fileOverview basic authentification
 * @name basicauth.js<f/middleware>
 * @author Masaki Sueda <sueda_masaki@cyberagnet.co.jp>
 */

var beezlib = require('beezlib');
var basicAuth = require('basic-auth-connect')

module.exports = function basicauth(id, pass) {
    return function (req, res, next) {
        // skip options method
        if (req.method.toLowerCase() == "options") {
            beezlib.logger.debug('respond to OPTIONS request without requiring authentication');
            return next();
        }
        return basicAuth(id, pass)(req, res, next);
    };
};
