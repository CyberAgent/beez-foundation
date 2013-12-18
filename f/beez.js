#!/usr/bin/env node

/**
 * Beez Foundation Server!!
 */
var bootstrap = require('./bootstrap');
bootstrap.run(function () { // start process

    console.info("\n##".info);
    console.info("## Start".info);
    console.info("## \t\tBeez Foundation Servers!!".info);
    console.info("##".info);
    console.info("##".info);

    var statapp = require('./static');
    statapp.run(function(err, result) {
        if (err) {
            console.info("## \t\tStatic Server start".info, "[ error ]".red);
            console.info("##\n".info);
            console.log("error message: ".error, 'Server start error.', err);
            process.exit(1);
        }

        console.info("## \t\tStatic Server start".info, "[ success ]".blue);
        if (result.compress) {
            console.info("## \t\tcompress: [on]".info);
        } else {
            console.info("## \t\tcompress: [off]".info);
        }
        console.info("## \t\tPlease try to access. ".info);
        console.info("## \t\t\t".info + result.url.yellow);
        console.info("##".info);
    });

    var mockapp = require('./mock');
    mockapp.run(function(err, result) {
        if (err && err.hasOwnProperty('name') && err.name === 'NotRunning') {
            console.info("## \tMock Server".info, "[ off ]".blue);
            console.info("##".info);
            return;
        }
        if (err) {
            console.info("## \t\tMock Server start".info, "[ error ]".error);
            console.info("##\n".info);
            console.log("error message: ".error, 'Server start error.', err);
            process.exit(1);
        }

        console.info("## \t\tMock Server start".info, "[ success ]".blue);
        if (result.compress) {
            console.info("## \t\tcompress: [on]".info);
        } else {
            console.info("## \t\tcompress: [off]".info);
        }
        console.info("## \t\tPlease try to access. ".info);
        console.info("## \t\t\t".info + result.url.yellow);
        console.info("##\n".info);
    });

});
