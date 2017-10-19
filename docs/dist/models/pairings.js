define('models/pairings',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
  ;

  var Pairings = Backbone.Model.extend({
    url: '/en_US/xml/gen/scores/pairings.json',

    parse: function(response) {
      return response;
    }




   
  });

  return Pairings;
})


;
