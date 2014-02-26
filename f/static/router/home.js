/**
 * @fileOverview Home Controller (Rest)
 * @name home.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var bootstrap = require('../../bootstrap');

var HomeController = function HomeController() {
};

module.exports = new HomeController();

HomeController.prototype.get = function get(req, res, next) {
    var config = bootstrap.config;
    debugger;
    res.locals({
        title: 'Beez Foundation',
        view: 'home',
        isMock: !!config.app.mock.dir,
        isOperation: !!config.operation.length
    });
    return res.render('home');
};
