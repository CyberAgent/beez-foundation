/**
 * Connect - static file server!!
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2012 Cyberagent Inc. Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs');
var send = require('send');
var url = require('url');
var _ = require('underscore');
var handlebars = require('handlebars');
var ua = require('beez-ua');

var path = require('path');
var _pause = require('pause');

var beezlib = require('beezlib');
var Bucks = require('bucks');

var bootstrap = require('../bootstrap');

var config = bootstrap.config;
var store = bootstrap.store;

var walkService = require('../service/walk');

var ENCODE = beezlib.constant.DEFAULT_ENCODE;
var EXTENSION_JS = beezlib.constant.EXTENSION_JS;
var EXTENSION_CSS = beezlib.constant.EXTENSION_CSS;
var EXTENSION_HTML = beezlib.constant.EXTENSION_HTML;
var EXTENSION_STYL = beezlib.constant.EXTENSION_STYL;
var EXTENSION_HBS = beezlib.constant.EXTENSION_HBS;
var EXTENSION_HBSP = beezlib.constant.EXTENSION_HBSP;
var EXTENSION_HBSC_JS = beezlib.constant.EXTENSION_HBSC_JS;
var EXTENSION_HBSP_JS = beezlib.constant.EXTENSION_HBSP_JS;
var REG_JS = beezlib.constant.REG_JS;
var REG_CSS = beezlib.constant.REG_CSS;
var REG_HTML = beezlib.constant.REG_HTML;
var REG_STYL = beezlib.constant.REG_STYL;
var REG_HBS = beezlib.constant.REG_HBS;
var REG_HBSP = beezlib.constant.REG_HBSP;
var REG_HBSC_JS = beezlib.constant.REG_HBSC_JS;
var REG_HBSP_JS = beezlib.constant.REG_HBSP_JS;
var REG_REQUIRE_BEEZ_JS = beezlib.constant.REG_REQUIRE_BEEZ_JS;

var DEFAULT_OPTIONS = {
    BOOTSTRAP: beezlib.constant.BOOTSTRAP_DEFAULT_OPTIONS,
    SPRITE: beezlib.constant.CSS_SPRITE_DEFAULT_OPTIONS,
    STYLUS: beezlib.constant.CSS_STYLUS_DEFAULT_OPTIONS,
    IMAGE: beezlib.constant.IMAGE_RATIORESIZE_DEFAULT_OPTIONS
};

var parse = function(req){
    var parsed = req._parsedUrl;
    if (parsed && parsed.href == req.url)
        return parsed;

    return req._parsedUrl = parse(req.url);
};

/**
 * Module Static:
 *
 *   Static file server with the given `root` path.
 *    - module custom.
 *
 * Examples:
 *
 *     var oneDay = 86400000;
 *
 *     connect()
 *       .use(connect.static(__dirname + '/public'))
 *
 *     connect()
 *       .use(connect.static(__dirname + '/public', { maxAge: oneDay }))
 *
 * Options:
 *
 *    - `maxAge`     Browser cache maxAge in milliseconds. defaults to 0
 *    - `hidden`     Allow transfer of hidden files. defaults to false
 *    - `redirect`   Redirect to trailing "/" when the pathname is a dir. defaults to true
 *
 * @param {Object} roots
 * @param {Object} options
 * @return {Function}
 */
exports = module.exports = function modstatic(roots, options){
    options = options || {};

    // roots required
    if (!roots) {
        throw new Error('static() roots path required');
    }

    // default redirect
    var redirect = options.redirect !== false;

    // --------------------------
    // defines
    // --------------------------

    _.defaults(config.bootstrap || (config.bootstrap = {}), DEFAULT_OPTIONS.BOOTSTRAP);
    config.sprite = config.sprite || {};
    _.defaults(config.sprite.options || (config.sprite.options = {}), DEFAULT_OPTIONS.SPRITE);
    config.stylus = config.stylus || {};
    _.defaults(config.stylus.options || (config.stylus.options = {}), DEFAULT_OPTIONS.STYLUS);
    config.image = config.image || {};
    _.defaults(config.image.options || (config.image.options = {}), DEFAULT_OPTIONS.IMAGE);
    // index.html require.beez.[env].[mode].js の元hbsファイルの指定
    var index_html_hbs_paths = config.bootstrap.html;
    var data_main_hbs_paths = config.bootstrap.datamain;
    // Add 'index.html.hbs' and 'require.beez.js.hbs'
    index_html_hbs_paths.push(beezlib.constant.INDEX_HTML_HBS);
    data_main_hbs_paths.push(beezlib.constant.REQUIRE_BEEZ_JS_HBS);
    var index_html_hbs_reg = beezlib.regexp.array2regexp(index_html_hbs_paths);
    var data_main_hbs_reg = beezlib.regexp.array2regexp(data_main_hbs_paths);

    return function modstatic(req, res, next) {
        // --------------------------
        // functions
        // --------------------------

        var notfound = function notfound(path) {
            return next();
        };

        var resume = function resume() {
            next();
            pause.resume();
        };

        var error = function error(err) {
            if (404 == err.status) {
                return resume();
            }
            return next(err);
        };

        /**
         * By converting to *.hbsc the *.hbs in the folder and add it to the directory file list. (handlebars#precompile)
         * exclude: s/index/index.html.hbs
         */
        var fn_hbs2hbsc = function fn_hbs2hbsc(list) {
            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];

                // check hbs file
                if (!walkService.isFile(recode.type) ||
                    !REG_HBS.test(recode.path.file)) {
                    continue;
                }

                // exclude the index_html and data_main
                if (index_html_hbs_reg.test(path.join(recode.path.dir, recode.path.file)) ||
                    data_main_hbs_reg.test(path.join(recode.path.dir, recode.path.file))) {
                    continue; // exclude
                }

                var path_hbsc_js = recode.path.file.replace(REG_HBS, EXTENSION_HBSC_JS);
                var uri_hbsc_js = recode.path.uri.replace(REG_HBS, EXTENSION_HBSC_JS);

                var target = _.find(list, function(value) { // xxx.hbsc.js
                    return value.path.file === path_hbsc_js;
                });

                if (target) {
                    target.type = '<< ' + recode.path.file;
                    beezlib.logger.debug('Overwrite.', path_hbsc_js, '<<', recode.path.file);
                    continue;
                }

                ret.push({
                    module: recode.module,
                    path: {
                        root: recode.root,
                        dir: recode.dir,
                        file: path_hbsc_js,
                        real: recode.real,
                        uri: uri_hbsc_js
                    },
                    type: '<< ' + recode.path.file
                });

                beezlib.logger.debug('Overwrite. not generate.', path_hbsc_js, '<<', recode.path.file);

            }
            return ret;
        };

        /**
         * フォルダ内の*.hbspを*.hbsp.js
         * (handlebars#partial#precompile)
         * としてディレクトリファイルリストに追加
         */
        /**
         * By converting to *.hbsp.js the *.hbsp in the folder and add it to the directory file list. (handlebars#precompile)
         */
        var fn_hbsp2hbspjs = function fn_hbsp2hbspjs(list) {
            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];

                // check hbsp file
                if (!walkService.isFile(recode.type) ||
                    !REG_HBSP.test(recode.path.file)) {
                    continue;
                }

                var path_hbsp_js = recode.path.file.replace(REG_HBSP, EXTENSION_HBSP_JS);
                var uri_hbsp_js = recode.path.uri.replace(REG_HBSP, EXTENSION_HBSP_JS);

                var target = _.find(list, function(value) { // xxx.hbsp.js
                    return value.path.file === path_hbsp_js;
                });

                if (target) {
                    target.type = '<< ' + recode.path.file;
                    beezlib.logger.debug('Overwrite.', path_hbsp_js, '<<', recode.path.file);
                    continue;
                }

                ret.push({
                    module: recode.module,
                    path: {
                        root: recode.root,
                        dir: recode.dir,
                        file: path_hbsp_js,
                        real: recode.real,
                        uri: uri_hbsp_js
                    },
                    type: '<< ' + recode.path.file
                });

                beezlib.logger.debug('Overwrite. not generate.', path_hbsp_js, '<<', recode.path.file);

            }
            return ret;
        };

        /**
         * If you have a file folder require.beez.js.hbs, require.beez.XXX.js will generate automatically, I want to add to the list.
         * XXX: config.json#requirejs.config.XXX
         */
        var fn_requirebeez2js = function fn_requirebeez2js(list) {

            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];

                // check data-main file
                if (!walkService.isFile(recode.type) ||
                    !data_main_hbs_reg.test(path.join(recode.path.dir, recode.path.file))) {
                    continue;
                }

                var keys = _.keys(store.stat.mapping);
                var env = path.basename(config.app.stat.dir);
                for (var j = 0; j < keys.length; j++) {
                    var key = keys[j];
                    var outname = 'require.beez.' + env + '.' + key + '.js';
                    var exist = false;
                    for (var k = 0; k < list.length; k++) {
                        var f = list[k];
                        if (f.path.file === outname) {
                            exist = true;
                            break;
                        }
                    }
                    if (!exist) {
                        ret.push({
                            module: recode.module,
                            path: {
                                root: recode.path.root,
                                dir: recode.path.dir,
                                file: outname,
                                real: recode.path.real,
                                uri: path.normalize(path.dirname(f.path.uri) + '/' + outname)
                            },
                            type: '<< ' + recode.path.file
                        });

                        beezlib.logger.debug('New generation file << ', outname);

                    }
                }
            }
            return ret;
        };

        /**
         * The process s / index / index.html.hbs
         */
        var fn_index2html = function fn_index2html(list) {
            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];
                // check index.html file
                if (!walkService.isFile(recode.type) ||
                    !index_html_hbs_reg.test(path.join(recode.path.dir, recode.path.file))) {
                    continue;
                }

                var keys = _.keys(store.stat.mapping);
                var env = path.basename(config.app.stat.dir);
                for (var j = 0; j < keys.length; j++) {
                    var key = keys[j];

                    // set prefix
                    var prefix = recode.path.file.replace(beezlib.constant.REG_HTML_HBS, '.');

                    var outname = prefix + env + '.' + key + '.html';
                    var exist = false;
                    for (var k = 0; k < list.length; k++) {
                        var f = list[k];
                        if (f.path.file === outname) {
                            exist = true;
                            continue;
                        }
                    }
                    if (!exist) {
                        ret.push({
                            module: recode.module,
                            path: {
                                root: recode.path.root,
                                dir: recode.path.dir,
                                file: outname,
                                real: recode.path.real,
                                uri: path.normalize(path.dirname(f.path.uri) + '/' + outname)
                            },
                            type: '<< ' + recode.path.file
                        });

                        beezlib.logger.debug('New generation file << ', outname);

                    }
                }
            }
            return ret;
        };

        /**
         * I want to add to the directory file list as *.css folder of the *.styl. (stylus#compile)
         */
        var fn_styl2css = function fn_styl2css(list) {

            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];
                if (!walkService.isFile(recode.type) ||
                    !REG_STYL.test(recode.path.file)) {
                    continue;
                }

                var path_css = recode.path.file.replace(REG_STYL, EXTENSION_CSS);
                var uri_css = recode.path.uri.replace(REG_STYL, EXTENSION_CSS);

                var target = _.find(list, function(value) {
                    return value.path.file === path_css;
                });

                if (target) {
                    target.type = '<< ' + recode.path.file;
                    beezlib.logger.debug('Overwrite.', path_css, '<<', recode.path.file);
                    continue;
                }

                ret.push({
                    module: recode.module,
                    path: {
                        root: recode.root,
                        dir: recode.dir,
                        file: path_css,
                        real: recode.real,
                        uri: uri_css
                    },
                    type: '<< ' + recode.path.file
                });

                beezlib.logger.debug('Overwrite. not generate', path_css, '<<', recode.path.file);

            }
            return ret;
        };

        /**
         * I want to add to the directory file list as *-{ratio}.png folder of the *.png. (imagemagick#ratioResize)
         */
        var fn_ratioresize = function fn_ratioresize(list) {
            var ret = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];
                if (!beezlib.image.isResizeImage(path.join(recode.path.dir, recode.path.file), config.image.options) ||
                    beezlib.css.sprite.isSpriteSheet(recode.path.file, config.sprite.options) ||
                    beezlib.css.sprite.isSpriteImage(recode.path.file, config.sprite.options)) {
                    continue;
                }

                var ratios = config.image.options.ratios;
                for (var j = 0; j < ratios.length; j++) {
                    var ratio = ratios[j];
                    var filename = beezlib.image.imagemagick.makeRatioFileNameSync(recode.path.file, null, ratio);
                    var uri_ratiopng = path.join(path.dirname(recode.path.uri), filename);

                    var target = _.find(list, function(value) {
                        return value.path.file === filename;
                    });

                    if (target) {
                        target.type = '<< ' + recode.path.file;
                        target.preview = false;
                        beezlib.logger.debug('Overwrite.', filename, '<<', recode.path.file);
                        continue;
                    }

                    ret.push({
                        module: recode.module,
                        path: {
                            root: recode.path.root,
                            dir: recode.path.dir,
                            file: filename,
                            real: recode.path.real,
                            uri: uri_ratiopng
                        },
                        type: '<< ' + recode.path.file
                    });

                    beezlib.logger.debug('Overwrite. not generate', filename, '<<', recode.path.file);
                }
            }
            return ret;
        };

        /**
         * I want to add to the directory file list as sprite-*.css and sprite-*.png folder of the sprite-*-\d.png. (imagemagick#ratioResize)
         */
        var fn_csssprite = function fn_csssprite(list) {
            var ret = [];
            var checkImage = [];
            for (var i = 0; i < list.length; i++) {
                var recode = list[i];
                if (!beezlib.css.sprite.isSpriteImage(recode.path.file, config.sprite.options) ||
                    ~checkImage.indexOf(recode.path.real)) {
                    continue;
                }

                var files = beezlib.css.sprite.getCreateFile(recode.path.file, config.sprite.options);
                var group = beezlib.css.sprite.getGroup(recode.path.file, config.sprite.options);
                var images = beezlib.css.sprite.getImages(path.dirname(recode.path.real), group, config.sprite.options);
                checkImage = checkImage.concat(images);

                for (var j = 0; j < files.length; j ++) {
                    var file = files[j];
                    var target = _.find(list, function(value) {
                        return !!~file.indexOf(value.path.file);
                    });

                    if (target) {
                        target.type = '<< ';
                        target.preview = false;
                        for (var k = 0; k < images.length; k++) {
                            target.type += path.basename(images[k]) + ' ';
                            beezlib.logger.debug('Overwrite.', file, '<<', path.basename(images[k]));
                        }
                    } else {
                        var data = {
                            module: recode.module,
                            path: {
                                root: recode.path.root,
                                dir: recode.path.dir,
                                file: file,
                                real: recode.path.real,
                                uri: recode.path.uri.replace(path.basename(recode.path.uri), file)
                            },
                            type: '<< '
                        };
                        for (var k = 0; k < images.length; k++) {
                            data.type += path.basename(images[k]) + ' ';
                            beezlib.logger.debug('Overwrite.', file, '<<', path.basename(images[k]));
                        }
                        ret.push(data);
                    }
                }
            }
            return ret;
        };

        /**
         * Add to list the parent directory.
         */
        var fn_parent = function fn_parent() {
            var ret = [{
                module: info.stat.name,
                path: {
                    root: info.stat.modroot,
                    dir: info.stat.path,
                    file: '../',
                    real: null,
                    uri: path.dirname(info.originalUrl)
                }
            }];
            return ret;
        };

        /**
         * Event: Directory listing
         */
        var directory = function directory() {
            if (!redirect) {
                return resume();
            }

            walkService.get(info, req.locales, function(err, list) {
                if (err) {
                    return res.json(err, 500);
                }

                var hbs2hbsc = fn_hbs2hbsc(list);
                var hbsp2hbspjs = fn_hbsp2hbspjs(list);
                var requirebeez2js = fn_requirebeez2js(list);
                var index2html = fn_index2html(list);
                var styl2css = fn_styl2css(list);
                var png2ratiopng = fn_ratioresize(list);
                var csssprite = fn_csssprite(list);
                var parent = fn_parent();

                // I connected the display list.
                list = parent.concat(list); // add first
                list = list.concat(styl2css); // add last (stylus)
                list = list.concat(hbs2hbsc); // add last (handlebars)
                list = list.concat(hbsp2hbspjs); // add last (handlebars partials)
                list = list.concat(requirebeez2js); // add last (require.beez.*.hbsc.js Auto-generation)
                list = list.concat(index2html); // add last ({env}.html Auto-generation)
                list = list.concat(png2ratiopng); // add last (*-{ratio}.png Auto-generation)
                list = list.concat(csssprite); // add last (sprite-*-\d.png Auto-generation)

                // beez-ua
                ua.setup(req.headers['user-agent'] || '-');
                var os = ['ios', 'android'];
                var isSP = false;
                for (var i = 0; i < os.length; i++) {
                    if (ua.os[os[i]]) {
                        isSP = true;
                        break;
                    }
                }

                res.locals = {
                    list: list,
                    view: 'walk',
                    isSP: isSP,
                    module: list[0].module
                };

                return res.render('walk');
            });
        };

        // --------------------------
        // main
        // --------------------------

        if ('GET' != req.method && 'HEAD' != req.method) { // Allow viewing only.
            return next();
        }

        var info = {}; // scope var!!

        info.uri = parse(req).pathname;
        info.originalUrl = url.parse(req.originalUrl).pathname;
        var pause = _pause(req);

        // module path infomation.
        info.split = _.compact(path.normalize(info.uri).split(path.sep));

        if (info.split.length < 1) { // deny access to the "/"
            return notfound(info.uri);
        }
        if (info.split[0] != 'm') { // will be rejected if it does not begin with "/m"
            return notfound(info.uri);
        }

        beezlib.logger.debug("lang:", req.locales);

        /**
         * Data Setup!!
         */
        info.stat = {};

        if (1 == info.split.length) {
            /**
             * Case of the "/m"
             *
             * @example
             * uri: http://0.0.0.0:1109/m
             * fs : /User/taro/stat
             *
             * info.stat.name: ''
             * info.stat.root: /User/taro/stat
             * info.stat.path: ''
             * info.stat.modroot: ''
             * info.stat.abspath: /User/taro/stat
             */
            var list = [];
            var keys = _.keys(config.stats);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var statpath = path.normalize(path.dirname(config.stats[key].path));
                info.stat.name = key;
                info.stat.modroot = '';
                info.stat.root = statpath;
                info.stat.path = '';
                info.stat.abspath = statpath;
                if (!fs.existsSync(info.stat.abspath)) {
                    return notfound(info.uri);
                }
                info.stat.fsstats = fs.statSync(info.stat.abspath);
                list.push(walkService.stats(info, info.stat.name, req.locales));
            }

            // parent directory infomation
            var parent = [{
                module: info.stat.name,
                path: {
                    root: path.normalize(info.stat.root + '/' + info.stat.name),
                    dir: info.stat.path,
                    file: ' Back Home ',
                    real: null,
                    uri: path.dirname(info.originalUrl)
                }
            }];

            list = parent.concat(list); // add first

            // beez-ua
            ua.setup(req.headers['user-agent'], '-');
            var os = ['ios', 'android'];
            var isSP = false;
            for (var i = 0; i < os.length; i++) {
                if (ua.os[os[i]]) {
                    isSP = true;
                    break;
                }
            }

            res.locals = {
                list: list,
                view: 'walk',
                isSP: isSP,
                module: list[0].module
            };

            // -- response send!!
            return res.render('walk');
        }

        // -----------------
        // not "/m"
        // -----------------
        /**
         * Case of the "/m" other than
         *
         * @example
         * uri: http://0.0.0.0:1109/m/fkei/aaa/bbb/index.js
         * fs : /User/taro/stat/fkei/aaa/bbb/index.js
         *
         * info.stat.name: fkei
         * info.stat.root: /User/taro/stat
         * info.stat.path: /aaa/bbb/index.js
         * info.stat.modroot: /User/taro/stat/fkei
         * info.stat.abspath: /User/taro/stat/fkei/aaa/bbb/index.js
         */

        info.stat.name = path.normalize(info.split[1]);
        if (!roots[info.stat.name]) { // module name not found
            return notfound(info.uri);
        }

        info.stat.root = path.dirname(path.resolve(roots[info.stat.name].path));
        info.stat.path = path.normalize('/' + _.rest(info.split, 2).join('/'));
        info.stat.modroot = info.stat.root + '/' + info.stat.name;
        info.stat.abspath = info.stat.modroot + info.stat.path;
        if (fs.existsSync(info.stat.abspath)) {
            info.stat.fsstats = fs.statSync(info.stat.abspath);
        }

        var srcpath, dstpath, hbspath;

        /**
         * and requests to "*.html", if there is no target file, I do the auto-generated from the "index.html.hbs".
         */
        if (REG_HTML.test(info.stat.path)) { // Generate handlebars compile file.
            for (var i = 0; i < index_html_hbs_paths.length; i++) {


                var _s = Array.prototype.slice.call(path.basename(info.stat.path).split('.'));
                var _ext = _s.pop();
                var _key = _s.pop();
                var _env = _s.pop();
                var _prefix = _s.join('.');


                var _hbsfile = _prefix + beezlib.constant.EXTENSION_HTML_HBS;
                hbspath = path.join(path.dirname(info.stat.abspath), _hbsfile);
                //hbspath = info.stat.abspath.replace(path.basename(info.stat.path), path.basename(index_html_hbs_paths[i]));
                if (beezlib.fsys.isFileSync(hbspath)) {
                    beezlib.template.hbs2hbsc2html(info.stat.abspath, path.basename(hbspath), store, ENCODE, req.headers);
                    break;
                }
                //if (i === data_main_hbs_paths.length - 1) {
                //    beezlib.logger.warn('not found hbs.', info.stat.path);
                //}
            }
        }

        var styl2css = function () {
            var absstylpath = info.stat.abspath.replace(REG_CSS, EXTENSION_STYL);
            if (fs.existsSync(absstylpath)) {
                beezlib.css.stylus.write(absstylpath, info.stat.abspath, config.stylus, req.headers, function(err, css) {
                    if (err) {
                        if (/failed to locate @import file/.test(err.message)) {
                            var importFile = err.message.match(/failed to locate @import file (.+)/)[1];
                            importFile = path.join(path.dirname(absstylpath), importFile);
                            beezlib.logger.error('stylus import error. src:', importFile);
                            beezlib.logger.error(err);
                            if (beezlib.css.sprite.isSpriteStylus(importFile, config.sprite.options)) {
                                beezlib.logger.error('need to create a sprite ahead');
                                var dstPath = path.dirname(importFile);
                                var group = beezlib.css.sprite.getGroup(importFile, config.sprite.options);
                                var images = beezlib.css.sprite.getImages(dstPath, group, config.sprite.options);
                                beezlib.css.sprite.build(dstPath, group, images, config.sprite.options);
                            }
                            return;
                        }
                        beezlib.logger.error("stylus compile error. src:", absstylpath, 'dst:', info.stat.abspath);
                        beezlib.logger.error(err);
                        process.exit(1);
                    }
                });
            }
        };
        /**
         * a request to the "*.css", if there is a "*.styl" in the folder and overwrite is converted to "*.css" with the stylus "*.styl" in the folder.
         */
        if (REG_CSS.test(info.stat.path) && !beezlib.css.sprite.isSpriteCss(info.stat.path, config.sprite.options) && fs.existsSync(info.stat.abspath.replace(REG_CSS, EXTENSION_STYL))) {
            styl2css();
        }

        if (REG_HBSC_JS.test(info.stat.path)) {
            /**
             * If you have a hbs, I generated. hbsc.js what was handlebars.precompile.
             */
            srcpath = info.stat.abspath.replace(REG_HBSC_JS, EXTENSION_HBS);
            if (beezlib.fsys.isFileSync(srcpath)) {
                dstpath = beezlib.template.hbs2hbscjs(path.dirname(srcpath), path.basename(srcpath), ENCODE);
                beezlib.logger.debug('handlebars#precompile:', srcpath, '->', dstpath);
            } else {
                beezlib.logger.warn('not found hbs.', srcpath);
            }

        } else if (REG_HBSP_JS.test(info.stat.path)) {
            /**
             * If there is a hbsp, I generate the. hbsp.js what was handlebars.precompile.
             */
            srcpath = info.stat.abspath.replace(REG_HBSP_JS, EXTENSION_HBSP);
            if (beezlib.fsys.isFileSync(srcpath)) {
                dstpath = beezlib.template.hbsp2hbspjs(path.dirname(srcpath), path.basename(srcpath), ENCODE);
                beezlib.logger.debug('handlebars#precompile(partial):', srcpath, '->', dstpath);
            } else {
                beezlib.logger.warn('not found hbs.', srcpath);
            }

        } else if (REG_REQUIRE_BEEZ_JS.test(info.stat.path)) {
            /**
             * to automatically generate a "require.beez.XXX.js" file based on information from equirejs.config "require.beez.js.hbs".
             */
            for (var i = 0; i < data_main_hbs_paths.length; i++) {
                hbspath = info.stat.abspath.replace(path.basename(info.stat.path), path.basename(data_main_hbs_paths[i]));
                if (beezlib.fsys.isFileSync(hbspath)) {
                    beezlib.template.requirehbs2hbsc(info.stat.abspath, path.basename(hbspath), store, ENCODE, req.headers);
                    break;
                }
                if (i === data_main_hbs_paths.length - 1) {
                    beezlib.logger.warn('not found hbs.', info.stat.path);
                }
            }
        }

        new Bucks()
            .add(function (err, res, next) {
                var extname = path.extname(info.stat.path);
                var separator = config.image.options.separator || '-';
                var reg = new RegExp(separator + '(\\d+)\\' + extname + '$');
                var srcpath = info.stat.abspath.replace(reg, extname);
                if (!reg.test(info.stat.abspath) ||
                    !beezlib.image.isResizeImage(srcpath, config.image.options) ||
                    beezlib.css.sprite.isSpriteSheet(path.basename(srcpath), config.sprite.options) ||
                    beezlib.css.sprite.isSpriteImage(path.basename(srcpath), config.sprite.options)) {
                    return next();
                }

                /**
                 * If you have a png, I generated. {ratio}.png what was imagemagick.ratioResize.
                 */
                var ratio = Number(info.stat.abspath.match(reg)[1]) / 10;
                beezlib.image.imagemagick.ratioResize(
                    {
                        srcPath: srcpath,
                        dstPath: path.dirname(srcpath),
                        separator: separator
                    },
                    config.image.options.baseRatio,
                    [ratio],
                    next
                );
                beezlib.logger.debug('imagemagick#ratioResize():', info.stat.path, '->', srcpath);
            })
            .add(function (err, res, next) {
                var isSpriteCss = beezlib.css.sprite.isSpriteCss(info.stat.path, config.sprite.options);
                if (!beezlib.css.sprite.isSpriteSheet(info.stat.path, config.sprite.options) &&
                    !beezlib.css.sprite.isSpriteStylus(info.stat.path, config.sprite.options) &&
                    !isSpriteCss) {
                    return next();
                }

                var dstPath = path.dirname(info.stat.abspath);
                var group = beezlib.css.sprite.getGroup(info.stat.path, config.sprite.options);
                var images = beezlib.css.sprite.getImages(dstPath, group, config.sprite.options);

                beezlib.css.sprite.build(dstPath, group, images, config.sprite.options, function(err) {
                    if (err) {
                        return next(err);
                    }

                    if (isSpriteCss) {
                        styl2css();
                    }
                    next();
                });
            })
            .add(function (err, result, next) {
                /**
                 * Custom response code.
                 * request get parameter ?__status__=200
                 */
                if (req.query.__status__ && /^[0-9]{3}$/.test(req.query.__status__)) {
                    var status = Number(req.query.__status__);
                    res.status(status);
                    beezlib.logger.debug("Custom HTTP Response Code:", status);
                }
                var delay = Number(req.query.__delay__) || config.app.stat.delay || 0;
                if (delay) {
                    beezlib.logger.debug("Custom HTTP Response delay time:", delay);
                    setTimeout(function () {
                        next();
                    }, delay);

                } else {
                    next();
                }
            })
            .end(function (errs, ress) {
                if (errs) {
                    throw errs;
                }

                /**
                 * deliver the target file / folder.
                 */
                var stream = send(req, info.stat.path, {
                    maxAge: options.maxAge || 0,
                    root: info.stat.modroot,
                    dotfiles: options.hidden ? 'allow' : 'ignore',
                    index: false
                })
                .on('error', error)
                .on('directory', directory)
                .pipe(res)
                ;

                /**
                 * define the 'Content-Type' proprietary extension of Beez.
                 */
                if (info.stat.fsstats && info.stat.fsstats.isDirectory()) {
                    stream.type('text/html; charset="' + ENCODE + '"');

                } else if (beezlib.css.sprite.isSpriteStylus(info.stat.path, config.sprite.options)) {
                    stream.type('text/plain; charset="' + ENCODE + '"');

                } else if (REG_STYL.test(info.stat.path) && info.stat.fsstats && info.stat.fsstats.isFile()) {
                    stream.type('text/plain; charset="' + ENCODE + '"');

                } else if (REG_HBS.test(info.stat.path) && info.stat.fsstats && info.stat.fsstats.isFile()) {
                    stream.type('text/plain; charset="' + ENCODE + '"');

                } else if (REG_HBSC_JS.test(info.stat.path)) {
                    stream.type('application/javascript; charset="' + ENCODE + '"');

                } else {
                    if (0 !== path.extname(path.basename(info.stat.path)).length) { // not directory
                        var mime = send.mime.lookup(info.stat.path);
                        if ('application/octet-stream' !== mime) {
                            stream.type(mime + '; charset="' + ENCODE + '"');
                        }
                    }
                }

            });
    };
};

/**
 * Expose mime module.
 *
 * If you wish to extend the mime table use this
 * reference to the "mime" module in the npm registry.
 */

exports.mime = send.mime;
