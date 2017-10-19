(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
       // AMD (Register as an anonymous module)
    define('utils/querystring',factory);
  } else if(typeof exports === 'object') {
       // Node/CommonJS
    module.exports = factory();
  } else {
       // Browser globals
    root.Querystring = factory();
  }
}(this, function() {
  var Querystring = function(qs) {
    this.params = [];
    this.init(qs);

    return this;
  };

  Querystring.prototype.init = function(qs) {
    var query = qs;
    if(query === null || query === undefined) {
      query = location.search.substring(1, location.search.length);
    }
    if(query.length === 0) return;

    // Turn <plus> back to <space>
    // See: http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.4.1
    query = query.replace(/\+/g, ' ');
    var args = query.split('&'); // parse out name/value pairs separated via &
    // split out each name=value pair
    for(var i = 0; i < args.length; i++) {
      var value;
      var pair = args[i].split('=');
      var name = unescape(pair[0]);

      if(pair.length === 2) {
        value = unescape(pair[1]);
      } else {
        value = name;
      }

      this.params[name] = value;
    }
  };

  Querystring.prototype.refresh = function(qs) {
    this.params = [];
    this.init(qs);
  }

  Querystring.prototype.get = function(key, _default) {
    // This silly looking line changes UNDEFINED to NULL
    var default_val = _default;
    if(default_val === null) default_val = null;
    var value = this.params[key];
    if(value === null) value = default_val;
    return value;
  };

  return new Querystring();
}));

