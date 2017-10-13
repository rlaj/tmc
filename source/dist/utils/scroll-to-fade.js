define('utils/scroll-to-fade',['require','jquery','backbone','utils/querystring','utils/common','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      qsParse = require('utils/querystring'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub')
      ;

  var ScrollToFade = Backbone.View.extend({
    el: '.moreWrapper',

    m: [],
    h: 0,

    initialize: function(opts) {
      opts = _.extend({}, opts);
      this.no_fade = opts.no_fade;
      this.$window = $(window);

      this.initFade();

      // update "scroll" position on window resize, throttled every 250ms
      this.listenTo(PubSub, 'throttle:resize', this.resetOffset);
    },

    render: function() {
      this.resetOffset();
      this.fadeOnScroll();

      return this;
    },

    onDispose: function() {
      PubSub.off('scroll touchmove', this.fadeOnScroll, this);
    },

    resetOffset: function() {
      var _this = this;
      this.$el.each(function(i) {
        var t = $(this).offset().top;
        _this.m[i] = t + Common.header_height; // account for fixed nav bar at top
      });
      this.h = this.$window.height();
    },

    initFade: function() {
      if(this.no_fade !== false) {
        PubSub.on('scroll touchmove', this.fadeOnScroll.bind(this), this);
        this.listenTo(PubSub, 'throttle:resize', this.fadeOnScroll);
      }
    },

    fadeOnScroll: function() {
      // console.log('[scrollToFade.js] fading on scroll called for %o', this);
      var wtop = this.$window.scrollTop();

      var _this = this;
      $.each(this.m, function(i, mtop) {
        var that = _this.$el.eq(i);
        var that_btm = mtop + that.height();
        var o = 1;

        if (wtop > that_btm - _this.h) {
          // window scrolltop > container bottom - window height
          // do opacity setting
          o = (that_btm - _this.h / 2 - wtop) / (_this.h / 2);
        }

        if (o < 0) {
          o = 0;
        }
        that.css({
          opacity: o
        });
      });
    }
  });

  return ScrollToFade;
});
