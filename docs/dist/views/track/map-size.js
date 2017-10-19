define('views/track/map-size',['require','backbone','utils/ratio-resize','utils/window-size','utils/browser','utils/common','utils/pubsub','models/track/state'],function(require) {
  var Backbone = require('backbone'),
      RatioResize = require('utils/ratio-resize'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),

      State = require('models/track/state')
      ;


  var TrackMapSize = Backbone.View.extend({
    el: '.trackerWrapper',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/MapSize');

      this.primary = this.$('.player-box .primary');
      this.contain;

      this.listenTo(PubSub, 'windowsize:global:enter', this.enterMobile);
      this.listenTo(PubSub, 'windowsize:global:exit', this.exitMobile);

      this.listenTo(PubSub, 'windowsize:orientation:portrait', this.enterPortrait);
      this.listenTo(PubSub, 'windowsize:orientation:landscape', this.enterLandscape);
    },

    render: function() {
      if(Win.size() === Win.sizes.global) {
        this.containMobile();
      } else {
        this.containDesktop();
      }

      return this;
    },

    onDispose: function() {
      this.disposeRatioResize();
    },

    disposeRatioResize: function() {
      if(this.contain) {
        this.contain.dispose();
      }
    },

    enterMobile: function() {
      this.undoContainDesktop();
      this.containMobile();

      // close the player details dropdown if open
      State.trigger('playerlist:close');
    },

    exitMobile: function() {
      this.undoContainMobile();
      this.containDesktop();

      // reinitiate playerList jscroll pane if exists
      State.trigger('playerlist:resize');
    },

    enterPortrait: function() {
      if(Win.size() === Win.sizes.global) {
        PubSub.trigger('forcereset.unveil');
        this.$el.css('margin-left', '');
        this.containMobile();
      }
    },

    enterLandscape: function() {
      if(Win.size() === Win.sizes.global) {
        PubSub.trigger('forcereset.unveil');
        this.containMobile();
      }
    },

    containMobile: function() {
      var offset = 0;
      // set value to offset mobile header bar height if inside android app
      if(Browser.apptype.android) {
        offset = -1 * Common.small_header_height;
      }

      this.$el.css('width', '');
      this.disposeRatioResize();

      if(Win.orientation() === Win.orientations.portrait) {
        this.contain = new RatioResize({
          ratio: 320 / 420,
          view: this,
          hcallback: function(w, h) {
            // height constraint
            // figure out width at this ratio
            var neww = Math.ceil(h * (320 / 420));

            this.$el.css('width', neww);

            // clear out the gradients
            this.undoGradient();

            // apply side gradient if applicable
            if(w > neww) {
              this.$el.addClass('gradient');
            }
          },
          wcallback: function(w, h) {
            var oldw = this.$el.prop('style').width;
            // screen is wider than 16/9
            this.$el.css('width', '');
            this.primary.css('width','');
            this.undoGradient();
            this.$el.find('.renders').addClass('gradient');
          },
          height: offset
        });
      }
    },

    undoContainMobile: function() {
      this.disposeRatioResize();

      this.$el.css('margin-left','');
      this.primary.css('width','');
      this.$el.css('width', '');
      this.undoGradient();
    },

    undoGradient: function() {
      this.$el.removeClass('gradient');
      this.$('.renders').removeClass('gradient');
    },

    containDesktop: function() {
      var offset = 0;
      if(Browser.apptype.android) {
        offset = -1 * Common.header_height;
      }

      this.disposeRatioResize();

      this.contain = new RatioResize({
        ratio: 4/3,
        view: this,
        hcallback: function(w,h) {
          // height constraint
          // figure out width at 4:3 ratio
          var neww = Math.ceil(h * (4/3));

          // set minimum width, equal to minimum width needed for compare bar to fit
          if (neww < 681) { neww = 681; }

          var oldw = this.$el.width();
          this.$el.css('width', neww);
          this.undoGradient();
        },
        wcallback: function(w,h) {
          var oldw = this.$el.prop('style').width;
          // screen is wider than 16/9
          this.undoGradient();
          this.$el.css('width', '');
          this.$('.renders').addClass('gradient');
        },
        height: offset
      });
    },

    undoContainDesktop: function() {
      this.disposeRatioResize();
      this.$el.css('width', '');
    }
  });

  return TrackMapSize;
});
