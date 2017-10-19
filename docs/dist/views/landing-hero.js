// Should only be needed by Home and LB stub, based on last year's usage

define('views/landing-hero',['require','jquery','views/base-hero','utils/pubsub','utils/window-size','utils/common','utils/browser','utils/scroll-to-fade'],function(require) {
  var $ = require('jquery'),
      BaseHero = require('views/base-hero'),
      PubSub = require('utils/pubsub'),
      Win = require('utils/window-size'),
      Common = require('utils/common'),
      Browser = require('utils/browser'),
      ScrollFade = require('utils/scroll-to-fade')
      ;

  var LandingHero = BaseHero.extend({
    onInitialization: function() {
      this.$body = $('body');
      this.listenTo(PubSub, 'throttle:resize', function() {
        this.trigger('hero:resize');
      });

      this.listenTo(PubSub, 'hero:resize', function() {
        this.trigger('hero:resize');
      });

      this.on('hero:resize', this.resize, this);
    },

    onRender: function() {
      this.scrollFade = new ScrollFade().render();

      this.resize();
    },

    onDispose: function() {
      this.scrollFade.dispose();
    },

    /**
     * Resize landing page hero space based on body height to maintain
     * full height hero
     */
    resize: function() {
      var str = '';

      // only perform manual resizing if
      // - Alert is on, causing potential dynamic bar height due to text wrapping
      // - windowSize is of mobile size (using off-canvas menu)
      // - using IE8
      if ((Common.alert && Common.alert.on) || Win.size() === Win.sizes.global || !Modernizr.csscalc) {
        // if(Global.Browser.ie8 && windowSize !== Win.sizes.global) {
        //   _this.header_height = _this.large_header_height;
        // }
        str = this.$body.height() - Common.header_height;

        if (Common.alert && Common.alert.on) {
          str -= Common.alert.height;
        }

        this.$el.css('height', str);
      } else if (this.el.style.height !== '') {
        this.$el.css('height', '');
      }
    }
  });

  return LandingHero;
});
