define('collections/track/green-videos',['require','backbone','collections/static-collection'],function(require) {
  var Backbone = require('backbone'),
      StaticCollection = require('collections/static-collection')
      ;

  var GreenVideo = Backbone.Model.extend({
    defaults: {
      id: 0,
      zone: []
    },

    initialize: function() {
    },

    parse: function(response) {
      response.id = parseInt(response.id,10);

      response.zone.forEach(function(zone) {
        zone.num = parseInt(zone.num,10);
      });

      return response;
    }
  });

  var GreenVideos = StaticCollection.extend({
    model: GreenVideo,

    url: '/en_US/xml/man/video/green_video.json',

    parse: function(response) {
      return response.hole;
    }
  });

  return new GreenVideos();
});
