/**
 * @fileOverview langage
 * @name lang.js<f/middleware>
 * @author Kei Funagayama <funagayama_kei@cyberagnet.co.jp>
 */

var queryString = require('querystring');

module.exports = function (options) {
    options = options || {};

    if (!options.standard) {
        options.standard = 'en';
    }

    return function(req, res, next) {
        var accept_language = req.headers['accept-language'];
        var tokens = [];
        var locales = [];

        if (accept_language) {
            accept_language.split(',').forEach(function (lang) {
                locales.push(lang.split(';', 1)[0].toLowerCase().split("-")[0]);
            });
            req.locales = locales;
        } else {
            req.locales = [options.standard];
        }
        next();
    };
};
