'use strict';

var Stream      = require('stream');
var PluginError = require('gulp-util').PluginError;
var rename      = require('gulp-rename');
var sha1        = require('node-sha1');
var PLUGIN_NAME = 'gulp-fingerprint';

function gulpFingerprint(replacedFilePaths) {
  var stream = new Stream.Transform({objectMode: true});

  stream._transform = function(file, encoding, callback) {
    if (file.isNull()) { return callback(); } // ignore empty files

    sha1(file.contents, function(err, hash) {
      if (err) {
        this.emit('error', new PluginError(PLUGIN_NAME, err));
        return callback();
      }

      var originalFilePath = file.path;
      rename({ suffix: '_' + hash })._transform(file, encoding, function(err, renamedFile) {
        replacedFilePaths[originalFilePath.replace(__dirname + '/dist/', '')] = renamedFile.path.replace(__dirname + '/dist/', '');
        callback(err, renamedFile);
      });
    });
  };

  return stream;
}

module.exports = gulpFingerprint;
