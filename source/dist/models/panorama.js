define('models/panorama',['require','backbone'],function(require) {
  var Backbone = require('backbone')
      ;

  var Panorama = Backbone.Model.extend({
    defaults: {
      id: "",
      device: "",
      mapDiff: "",
      mapCoord: "",
      description: "",
      yawOffset: "",
      thumb: "",
      path: "",
      galleryname: ""
    },

    initialize: function() {

    }
  });

  return Panorama;
});
