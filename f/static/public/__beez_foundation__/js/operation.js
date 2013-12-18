/**
 * @fileOverview
 * @name operation.js<f/static/public/js>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

this.beez = this.beez||{};

(function(global) {
    var beez = global.beez;
    var suns = global.suns;

    var Operation = suns.extend(
        beez.B,
        {
            run: function run(bin) {
                var self = this;
                var uri = '/e/'+bin;
                //console.log("request:", uri);

                $.post(uri, {type:"run"}, function(res){
                    self.intervalId = setInterval(function() {
                        self.status();
                    }, 500);
                });
            },
            status: function status() {
                var self = this;
                $.getJSON('/e/_', function(res){
                    self.result(res);
                });
            },
            result: function(data) {
                var output = "";
                output += "cmd:" + data.cmd + "\n\n\n";
                for (var i = 0; i < data.out.length; i++) {
                    output += data.out[i];
                }

                output += "\n\n\n";

                if (data.running) {
                    $("#result #status")
                        .removeClass('label-important')
                        .removeClass('label-success')
                        .addClass("label-info")
                        .html("Running!!");
                    output += "Status: running";
                } else {
                    if (data.exit == 0) {
                        $("#result #status")
                            .removeClass('label-info')
                            .addClass("label-success")
                            .html("Success!!");
                        output += "Exit: " + data.exit;
                    } else {
                        $("#result #status")
                            .removeClass('label-info')
                            .addClass("label-important")
                            .html("Error!!");
                        output += "Exit: " + data.exit + "\n\n";
                    }
                    clearInterval(this.intervalId);
                    output += "Status: stopd";
                }


                $("#result #output").text(output);
                // TODO: end scroll!!
            },
            render: function render() {
                var self = this;
                $('#select button').each(function() {
                    $(this).on('click', function(evt){

                        $(this).parent().children().each(function() {
                            $(this).removeClass("disabled");
                        });
                        $(this).addClass("disabled");

                        $("#description").children().each(function() {
                            $(this).hide();
                        });
                        $("#desc-"+$(this).attr('id')).show();
                        $("#action").removeClass("disabled");
                    });
                });

                $("#action")
                    .on('click', function() {
                        if(!$(this).hasClass("disabled")) {
                            $(this).addClass("disabled");
                            var bin = $("#select button.disabled").attr("id");
                            $("#result #status").html("");
                            $("#result #output").html("");
                            self.run(bin);
                        }
                    })
                    .addClass("disabled")
                ;
            }
        }
    );

    beez.operation = new Operation();

})(this);