define('views/sponsors',['require','backbone'],function(require) {
  var Backbone = require('backbone')
      ;

  var Sponsors = Backbone.View.extend({
    el: '#sponsors',
    counter: 1,

    interval: 30 * 1000,

    initialize: function() {
      this.counter = this.getRandomStart();
    },

    render: function() {
      if(this.timerID !== undefined) {
        clearInterval(this.timerID);
      }
      this.rotate();
      this.timerID = setInterval(this.rotate.bind(this), this.interval);
    },

    rotate: function() {
      // console.log('[sponsors.js] running rotation ' + this.counter);
      switch(this.counter % 4) {
        case 3:
          this.$el.children().hide().eq(2).show();
          break;
        case 2:
          this.$el.children().hide().eq(1).show();
          break;
        case 1:
        case 0:
        default:
          this.$el.children().hide().eq(0).show();
          break;
      }
      this.counter += 1;
      if(this.counter >= 4) {
        this.counter -= 4;
      }
    },

    /**
     * Get a random integer between 0 and 3 to start our sponsor
     * logo rotation
     * @return {Integer} Integer between 0 and 3 inclusive
     */
    getRandomStart: function() {
      var min = 0,
          max = 4;
      return Math.floor(Math.random() * (max - min)) + min;
    }
  });

  return Sponsors;
});

