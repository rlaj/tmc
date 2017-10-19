define('models/track/pin',['require','jquery','backbone','models/track/point','models/track/state','utils/track/constants','utils/track/gfx','utils/window-size'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Point = require('models/track/point'),
      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      GfxUtils = require('utils/track/gfx'),
      Win = require('utils/window-size')
      ;


  var Pin = Point.extend({
    draw: function() {
      var type = Constants.PIN_WIDE;
      if(!State.get('view_fairway')) {
        type = Constants.PIN_CLOSE;
      }

      var img = document.getElementById(type.ID);
      var w_off = type.W_OFFSET;
      var h_off = type.H_OFFSET;
      var w = type.WIDTH;
      var h = type.HEIGHT;

      if(Win.size() === Win.sizes.global) {
        w = type.SCALE*w;
        h = type.SCALE*h;
        w_off = type.SCALE*w_off;
        h_off = type.SCALE*h_off;
      }

      $(img).ready(function () {
        this.get('canvas').view.context.drawImage(img, this.getRel('x') - w_off, this.getRel('y') - h_off, w, h);
        this.trigger('pin:ready');
      }.bind(this));
    }
  });

  return Pin;
});
