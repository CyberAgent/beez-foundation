(function(global) {
    var beez = global.beez;
    var suns = global.suns;

    var Home = suns.extend(
        beez.B,
        {
            render: function render() { return; }
        }
    );

    beez.home = new Home();

})(this);
