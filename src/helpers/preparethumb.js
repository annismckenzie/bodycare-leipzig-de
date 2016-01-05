var sizeOf = require('image-size');
var path = require('path');
var Handlebars = require('handlebars');
var sharp = require('sharp');
var deasync = require('deasync');
var fs = require('fs-extra');

module.exports = function(item, options) {
  if (options.hash.width === undefined && options.hash.height === undefined) {
    options.hash.width = 300;
  }
  var out = "";
  // item.src == 'assets/img/salonbilder/Pflanze_mit_Bodyshop_im_Hintergrund.jpg'
  var src = path.join(process.cwd(), 'src', item.src);
  /* parsed == {
      root: '',
      dir: 'assets/img/salonbilder',
      base: 'Pflanze_mit_Bodyshop_im_Hintergrund.jpg',
      ext: '.jpg',
      name: 'Pflanze_mit_Bodyshop_im_Hintergrund'
  } */
  var parsed = path.parse(item.src);
  var thumbSrc = path.join(parsed.dir, 'thumbs', parsed.base);
  // thumbTarget == '/path/to/assets/img/salonbilder/thumbs/Pflanze_mit_Bodyshop_im_Hintergrund.jpg'
  var thumbTarget = path.join(process.cwd(), 'src', thumbSrc);
  var data = (options.data ? Handlebars.createFrame(options.data) : {});

  var done = false;
  sharp(src)
    .resize(options.hash.width, options.hash.height)
    .withoutEnlargement()
    .toBuffer(function(err, buffer, info) {
      if (err) {
        throw err;
      }

      fs.outputFile(thumbTarget, buffer, function() {
        done = true;
      });
      data.thumbWidth  = info.width;
      data.thumbHeight = info.height;
      data.thumbSrc    = thumbSrc;
    });
  deasync.loopWhile(function() { return !done; });

  var dimensions = sizeOf(src);
  data.width     = dimensions.width;
  data.height    = dimensions.height;
  data.item      = item;

  // options.fn(this) = Handelbars content between {{#bold}} HERE {{/bold}}
  out += options.fn(this, { data: data });

  return out;
}
