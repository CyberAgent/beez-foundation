/**
 * @fileOverview
 * @name mock.js<f/static/public/js>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

this.beez = this.beez||{};

(function(global) {
    var beez = global.beez;
    var suns = global.suns;

    var Mock = suns.extend(
        beez.B,
        {
            render: function render() {
                var self = this;

                $('#mocks button').each(function () {
                    $(this).click(function () {
                        var hash = $(this).data('hash');
                        global.location.href = '/mock/' + hash;
                    });
                });
                return;
            }
        }
    );

    beez.mock = new Mock();

})(this);
