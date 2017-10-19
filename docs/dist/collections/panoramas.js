define('collections/panoramas',['require','backbone','jquery','models/panorama'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Panorama = require('models/panorama')
  ;

  var Panoramas = Backbone.Collection.extend({
    model: Panorama,

    initialize: function(models, options) {

    }
  });



  return Panoramas;
});
