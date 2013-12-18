this.beez = this.beez||{};

(function(global) {
    var beez = global.beez;
    var suns = global.suns;

    var Walk = suns.extend(
        beez.B,
        {
            render: function render() {
                $('.data').click(function() {
                    window.location = $(this).find('a').attr('href');
                    return false;
                });
            }
        }
    );

    beez.walk = new Walk();

})(this);