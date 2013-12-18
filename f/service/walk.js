/**
 * @fileOverview File walker
 * @name walk.js<f/service>
 * @author Kei Funagayama <funagayama_kei@cyberagent.co.jp>
 */

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var bytes = require('bytes');
var beezlib = require('beezlib');

var bootstrap = require('../bootstrap');

var config = bootstrap.config;
var message = require('../message.js');
var errors = message.errors;

var DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss';

var WalkService = function WalkService() {
};

module.exports = new WalkService();


WalkService.prototype.isFile = function isFile(type) {
    return type === 'file';
};

/**
 * get stat infomation.
 * @param {Object} name Directory infomation
 * @param {String} file file name
 * @param {Array} locales langs
 * @returns {Object}
 */
WalkService.prototype.stats = function stats(info, file, locales) {

    var lang = locales[0];
    file = file || '';

    var real = path.normalize(info.stat.abspath + '/' + file);
    var stats = fs.statSync(real);
    var uri = path.normalize(info.uri + '/' + file);

    var type = '';
    // file type
    if (stats.isFile()) {
        type = 'file';
    } else if (stats.isDirectory()) {
        type = 'directory';
    } else if (stats.isBlockDevice()) {
        type = 'block';
    } else if (stats.isCharacterDevice()) {
        type = 'character';
    } else if (stats.isSymbolicLink()) {
        type = 'symlink';
    } else if (stats.isFIFO()) {
        type = 'fifo';
    } else if (stats.isSocket()) {
        type = 'socket';
    } else {
        type = 'other';
    }
    var preview = false;
    // preview check
    if (file.match(/\.png$|\.gif$|\.jpeg$|\.jpg$/))
        preview = true;

    var ret = {
        module: info.stat.name,
        path: {
            root: info.stat.root,
            dir: info.stat.path,
            file: file || info.stat.name,
            real: real,
            uri: uri
        },
        type: type,
        preview: preview,
        atime: moment(stats.atime.getTime()).lang(lang).format(DATE_FORMAT),
        blksize: bytes(stats.blksize),
        blocks: stats.blocks,
        ctime: moment(stats.ctime.getTime()).lang(lang).format(DATE_FORMAT),
        dev: stats.dev,
        gid: stats.gid,
        ino: stats.ino,
        mode: stats.mode,
        mtime: moment(stats.mtime.getTime()).lang(lang).format(DATE_FORMAT),
        nlink: stats.nlink,
        rdev: stats.rdev,
        size: bytes(stats.size),
        uid: stats.uid
    };


    return ret;
};


/**
 * get files infomation
 *
 * @param {Object} name Directory infomation
 * @param {Array} locales langs
 * @param {function} callback
 */
WalkService.prototype.get = function get(info, locales, callback) {
    var ret = [];
    var contents = fs.readdirSync(info.stat.abspath);
    for (var i = 0; i < contents.length; i++) {
        ret.push(this.stats(info, contents[i], locales));
    };

    return callback(null, ret);
};
