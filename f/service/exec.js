/**
 * @fileOverview command exec
 * @name exec.js<f/service>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var _ = require('underscore');

var bootstrap = require('../bootstrap');
var config = bootstrap.config;
var beezlib = require('beezlib');

var timeout = 30 * 60 * 1000; // 30min

var ExecStore = function ExecStore() {
};

ExecStore.prototype.setup = function(target) {
    var data = _.find(config.operation, function(d) {
        return d.target === target;
    });

    if (!data) {
        return false;
    }
    this.target = data.target;
    this.comment = data.comment;
    this.stdout = [];
    this.stderr = [];
    this.out = [];
    this.exit = null;
    this.running = false;
    this.cmd = 'grunt'; // Grunt

    return true;
};

ExecStore.prototype.status = function status() {
    return {
        cmd: this.cmd,
        stdout: this.stdout,
        stderr: this.stderr,
        out: this.out,
        exit: this.exit,
        running: this.running
    };
};

ExecStore.prototype.start = function() {

    beezlib.logger.info('exec:', this.cmd);

    this.child = spawn(this.cmd, [this.target]);
    this.running = true;

    var self = this;

    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', function(data) {
        console.log('stdout:', data);
        self.stdout.push(data);
        self.out.push(data);
    });

    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', function(data) {
        console.log('stderr:', data);
        self.stderr.push(data);
        self.out.push(data);
    });

    this.child.on('exit', function(data) {
        console.log('exit:', data);
        self.exit = data;
        self.running = false;
    });
};

var ExecService = function ExecService() {
};

module.exports = new ExecService();


ExecService.prototype.status = function stauts(callback) {
    if (this.store) {
        return callback(null, this.store.status());
    }
    callback();
};

ExecService.prototype.run = function run(target, callback) {
    // 実行中の場合は受け付けない
    if (this.store && this.store.running) {
        return callback({
            "error": {
                "name": "Server Error.",
                "message": "There is a process running. " + this.store.target
            }
        }); // 実行中のコマンドがある
    }
    delete this.store;
    this.store = new ExecStore();
    if (!this.store.setup(target)) {
        return callback({
            "error": {
                "name": "Server Error.",
                "message": "Error is not assumed occurred."
            }
        }); // 想定していないコマンド
    }
    this.store.start();
    return callback(null, {
        "message": "Is being processed."
    });
};

ExecService.prototype.kill = function kill() {
    //this.child.kill();
};
