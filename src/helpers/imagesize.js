var sizeOf = require('image-size');
var path = require('path');

module.exports = function(dimension, options) {
  // options.fn(this) = Handelbars content between {{#bold}} HERE {{/bold}}
  var src = path.join(process.cwd(), 'src', options.fn(this));
  var dimensions = sizeOf(src);

  switch (dimension) {
    case 'height':
      return dimensions.height;
    case 'width':
      return dimensions.width;
    default:
      return JSON.stringify(dimensions);
  }
}
