define('models/track/tee',['require','backbone','models/track/point'],function(require) {
  var Backbone = require('backbone'),
      Point = require('models/track/point')
      ;

  var Tee = Point.extend({});

  return Tee;
});
