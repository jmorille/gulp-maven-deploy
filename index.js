'use strict';

var path = require('path');
var gmd = require('maven-deploy');
var through = require('through2');

function hasValidConfig(options) {
    options = options || {};
    if (!options.hasOwnProperty('config') || typeof options.config !== 'object') {
        throw new Error('Missing required property "config" object.');
    }
    return true;
}

/**
 * Method to insure the node before version 12 of path.parse
 * @param filePath
 * @returns {{dir: *, base: *, ext: *, name: *}}
 */
function parsePathFile(filePath) {
    var ext = path.extname(filePath);
    var base = path.basename(filePath);
    var basename = path.basename(filePath, ext);
    var dirname = path.dirname(filePath);
    return {
        dir: dirname,
        base: base,
        ext: ext,
        name: basename
    };
}

function evalOptions(options, file, callback) {
    var evalOptions = options;
    if (typeof evalOptions === 'function') {
        var parsed = parsePathFile(file.relative);
        var extname = parsed.ext.slice(1);
        var dirs = parsed.dir.split(path.sep);
        // Complete current parsed
        parsed.extname = extname;
        parsed.file = file;
        parsed.dirs = dirs;
        evalOptions = evalOptions(parsed, callback);
    }
    return evalOptions;
}

var deploy = function (options, callback) {
    return through.obj(function (file, enc, cb) {
        options = evalOptions(options, file, callback);
        if (hasValidConfig(options)) {
            gmd.config(options.config);
            if (!options.config.hasOwnProperty('repositories')) {
                throw new Error('Missing repositories configuration');
            }
            options.config.repositories.forEach(function (repo) {
                if (!repo.hasOwnProperty('id') || !repo.hasOwnProperty('url')) {
                    throw new Error('Deploy required "id" and "url".')
                }
                gmd.deploy(repo.id, options.config.snapshot, function (err) {
                    if (cb) cb(err);
                });
            });
        }
        if (callback)callback(null);
    });
};

var install = function (options, callback) {
    return through.obj(function (file, enc, cb) {
        options = evalOptions(options, file);
        if (hasValidConfig(options)) {
            gmd.config(options.config);
            gmd.install(function (err) {
                if (cb)cb(err);
            });
        }
        if (callback)callback(null);
    });
    throw new Error('Invalid configuration');
}

module.exports.deploy = deploy.bind(this);
module.exports.install = install.bind(this);

