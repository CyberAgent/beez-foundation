/**
 * @fileOverview
 * @name mockview.js<f/static/public/js>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

this.beez = this.beez||{};

(function(global) {
    var beez = global.beez;
    var suns = global.suns;

    var Mockview = suns.extend(
        beez.B,
        {
            render: function render() { return; }
        }
    );

    beez.mockview = new Mockview();

})(this);
