/**
 * @fileOverview Home Controller (Rest)
 * @name home.js<f/static/router>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var HomeController = function HomeController() {
};

module.exports = new HomeController();

HomeController.prototype.get = function get(req, res, next) {
    res.locals({
        title: 'Beez Foundation',
        view: 'home'
    });
    return res.render('home');
};
