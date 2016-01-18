'use strict';

var Stream      = require('stream');
var PluginError = require('gulp-util').PluginError;
var PLUGIN_NAME = 'gulp-replace-fingerprinted-css';

function gulpReplaceFingerprintedCSS(assetFilePaths) {
  var stream = new Stream.Transform({ objectMode: true });

  stream._transform = function(file, encoding, callback) {
    if (file.isNull()) { return callback(); } // ignore empty files
    if (file.isStream()) { // we don't do streams (yet)
      this.emit('error', new PluginError(PLUGIN_NAME,  'Streaming not supported'));

      return callback();
    }

    var contents = file.contents.toString();
    var stylesheetsRegexp = /(<link(?:.+?)href="([^"]+)[^\>]*>)+/g;
    var stylesheetsReplaceRegexp = /<!-- CSS_START -->(.+?)<!-- CSS_END -->/g;

    var stylesheets = "";
    var matches = contents.match(stylesheetsRegexp);
    var hrefRegexp = /href="([^"]+)"/;
    for (var i = 0, l = matches.length; i < l; i++) {
      var href = matches[i].match(hrefRegexp);
      if (assetFilePaths[href[1]] !== undefined) {
        stylesheets += matches[i].replace(hrefRegexp, 'href="' + assetFilePaths[href[1]] + '"');
      }
    }

    file.contents = new Buffer(contents.replace(stylesheetsReplaceRegexp, stylesheets));

    callback(null, file);
  };

  return stream;
}

module.exports = gulpReplaceFingerprintedCSS;
