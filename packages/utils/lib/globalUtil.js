module.exports = exports = {};

exports.set = function set(key, value) {

  var format_key = generate_key(key);
  var key_symbol = Symbol.for(format_key);

  var globalSymbols = Object.getOwnPropertySymbols(global);
  var hasValue = globalSymbols.indexOf(key_symbol) > -1;
  if (!hasValue) {
    global[key_symbol] = value;
  }
};

exports.get = function(key) {

    var format_key = generate_key(key);
    var key_symbol = Symbol.for(format_key);
    return global[key_symbol];
}

function generate_key(key) {

    //temporarily, remain key as origin
    return key;
}
