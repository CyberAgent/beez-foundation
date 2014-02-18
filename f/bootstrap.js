/**
 * @fileOverview start process
 * @name bootstrap.js<f>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var commander = require('commander');
var _ = require('underscore');
var jsonminify = require('jsonminify');

var beezlib = require('beezlib');

var Bootstrap = function Bootstrap() {
    beezlib.setupColorTheme();

    this.config = null;
    this.store = {};
    this.encode = 'utf-8';
};

module.exports = new Bootstrap();

Bootstrap.prototype.checklib = function checklib(callback) {
    var message = [];
    // Check imagemagick/optipng/jpegoptim/pngquant
    beezlib.cmd.which(beezlib.constant.PROG_CONVERT, null, function (err, path) { // imagemagick
        if (err) { message.push("Please install imagemagick. check: $ which convert"); }

        beezlib.cmd.which(beezlib.constant.PROG_OPTIPNG, null, function (err, path) { // optipng
            if (err) { message.push("Please install optipng. check: $ which optipng"); }

            beezlib.cmd.which(beezlib.constant.PROG_JPEGOPTIM, null, function (err, path) { // jpegoptim
                if (err) { message.push("Please install jpegoptim. check: $ which jpegoptim"); }

                beezlib.cmd.which(beezlib.constant.PROG_PNGQUANT, null, function (err, path) { // pngquant
                    if (err) { message.push("Please install pngquant. check: $ which pngquant"); }

                    if (0 < message.length) {
                        return callback && callback(new Error('Dependent library is missing.'), message);
                    } else {
                        return callback && callback(null);
                    }
                });
            });
        });
    });
};

Bootstrap.prototype.run = function run(callback) {
    var self = this;
    this.checklib(function (err, message) {

        if (err) {
            console.log();
            console.error(err.message.red);
            console.log();
            _.each(message, function (m) {
                beezlib.logger.error('\t\t' + m);
            });
            console.log();

            process.exit(1);
        }

        self.package = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json'), self.encode));

        commander
            .version(self.package)
            .description('Beez server development platform.')
            .option('-c --config <path>', 'server config path(format: json)')
            .option('-d --debug', 'debug mode.')
            .option('-a --addmods <value>', 'I want to add a "/ m" module. It is more than one can be specified, separated by commas. format) -a dirname:absdirpath:from,... example) -a hoge:/tmp/hoge:')
            .parse(process.argv)
        ;

        // check option
        if (!commander.config) {
            beezlib.logger.error('Please specify the path to the configuration file path. -c --config <path>');
            process.exit(2);
        }

        // option: debug
        beezlib.logger.level = beezlib.logger.LEVELS.WARN;
        if (commander.debug) {
            beezlib.logger.level = beezlib.logger.LEVELS.DEBUG;
        }

        // load config
        try {
            commander.config = path.normalize(commander.config);
            //self.config = JSON.parse(jsonminify(fs.readFileSync(commander.config, self.encode)));
            if (!beezlib.fsys.isFileSync(commander.config)) {
                beezlib.logger.error('file not found.', commander.config);
                process.exit(2);
            }
            self.config = beezlib.fsys.readFileMultiConfigureSync(commander.config, self.encode);
        } catch (e) {
            beezlib.logger.error(e, 'path:', commander.config);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }


        // config check
        if (self.config.bootstrap && self.config.bootstrap.html) {
            _.each(self.config.bootstrap.html, function (val, key) {
                if (!new RegExp(beezlib.constant.EXTENSION_HTML_HBS + '$').test(val)) {
                    beezlib.logger.error('The end of the file name is ".html.hbs". config.bootstrap.html[' + key + ']:', val);
                    process.exit(1);
                }
            });
        }

        self.config.HOME = __dirname;
        var cwd = self.config.cwd = process.cwd();
        var stat = self.config.app.stat;


        if (stat.include) {
            // include directory.
            var _stat_from = stat.include.from || '.';
            var _stat_path = stat.include.path || '';

            stat.dir = path.resolve(path.dirname(commander.config), _stat_from, _stat_path);

            if (!beezlib.fsys.isDirectorySync(stat.dir)) {
                beezlib.logger.error('Directory(stat) does not exist. dir:', stat.dir);
                process.exit(2);
            }

        } else {
            // not include directory.
            stat.dir = path.resolve(path.dirname(commander.config));
        }


        try {
            self.store.stat = new beezlib.fsys.store.JSONStore(stat.dir);
        } catch (e) {
            beezlib.logger.error(e, 'stat directory path:', stat.dir);
            beezlib.logger.debug(e.stack);
            process.exit(2);
        }

        var mock = self.config.app.mock;
        if (mock && mock.use) { // mock server on!!
            if (mock.include) {
                // mock directory.
                var _mock_from = mock.include.from || '.';
                var _mock_path = mock.include.path || '';

                mock.dir = path.resolve(path.dirname(commander.config), _mock_from, _mock_path);

                if (!beezlib.fsys.isDirectorySync(stat.dir)) {
                    beezlib.logger.error('Directory(mock) does not exist. dir:', mock.dir);
                    process.exit(2);
                }

            } else {
                // not mock directory.
                mock.dir = path.resolve(path.dirname(commander.config));
            }

            try {
                self.store.mock = new beezlib.fsys.store.JSONStore(mock.dir);
            } catch (e) {
                beezlib.logger.error(e, 'mock directory path:', mock.dir);
                beezlib.logger.debug(e.stack);
                process.exit(2);
            }
        }

        // operation command search.
        self.config.operation = self.config.app.operation || [];

        // static dir path
        self.config.stats = self.config.stats || {};

        // stats set absolute
        for (var key in self.config.stats) {
            if (!self.config.stats[key].path) {
                beezlib.logger.debug('skip:', key);
                continue;
            }

            self.config.stats[key].from = beezlib.fsys.pathTilde(self.config.stats[key].from);
            self.config.stats[key].path = beezlib.fsys.pathTilde(self.config.stats[key].path);
	        var dir = path.resolve(self.config.HOME,
                                   self.config.stats[key].from || '.',
                                   self.config.stats[key].path);

            if (!beezlib.fsys.isDirectorySync(dir)) {
                beezlib.logger.error('config.stats directory not found. path:',
                                     self.config.stats[key].path,
                                     'from:', self.config.stats[key].from,
                                     'file:', commander.config);
            }
            self.config.stats[key].path = dir;
        }

        // Add mods
        if (commander.addmods) {
            var __add_mods = commander.addmods.replace(/\ /, '').split(',');
            _.each(__add_mods, function(data) {
                var _d = data.split(':');
                if (_d.length < 2) {
                    beezlib.logger.debug('[SKIP] Add Mod:', JSON.stringify(_d[0]));
                    return;
                }

                self.config.stats[_d[0]] = {};
                self.config.stats[_d[0]].path = beezlib.fsys.pathTilde(_d[1]);
                self.config.stats[_d[0]].from = beezlib.fsys.pathTilde(_d[2]) || '.';

	            var dir = path.resolve(self.config.stats[_d[0]].from, self.config.stats[_d[0]].path);

                if (!beezlib.fsys.isDirectorySync(dir)) {
                    beezlib.logger.error('add mods directory not found. path:', self.config.stats[_d[0]].path, 'from:', self.config.stats[_d[0]].from);
                } else {
                    beezlib.logger.debug('Add Mod: name:', _d[0], 'path:', self.config.stats[_d[0]].path, 'from', self.config.stats[_d[0]].from);
                }
                self.config.stats[_d[0]].path = dir;

            });
        }

        /**
         * OS Process cache!!
         */
        process.on('uncaughtException', function _uncaughtException(err) {
            beezlib.logger.error(err);
            beezlib.logger.error(err.stack);
            process.exit(1);
        });
        process.on('SIGTERM', function _sigterm() {
            beezlib.logger.info('SIGINT has occurrend.');
            process.exit(1);
        });
        process.on("SIGINT", function _sigint() {
            beezlib.logger.info('SIGINT has occurred.');
            process.exit(1);
        });

        callback &&  callback(null);

    });
};
