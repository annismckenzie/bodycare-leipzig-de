module.exports = function(options) {
  // options.fn(this) = Handelbars content between {{#bold}} HERE {{/bold}}
  var content = options.fn(this);
  return content.charAt(0).toUpperCase() + content.slice(1);;
}
