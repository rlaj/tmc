define('views/track/size',['require','backbone','utils/ratio-resize','utils/window-size','utils/browser','utils/common','utils/pubsub','utils/track/gfx','models/track/state','collections/track/players','utils/track/constants'],function(require) {
  var Backbone = require('backbone'),
      RatioResize = require('utils/ratio-resize'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),

      GfxUtils = require('utils/track/gfx'),
      State = require('models/track/state'),
      Players = require('collections/track/players'),
      Constants = require('utils/track/constants')
      ;


  var TrackSize = Backbone.View.extend({
    el: '.trackerWrapper',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/Size');

      // 50 accounts for title bar, 75 accounts for control bar below images
      this.offset = 0;

      this.primary = this.$('.player-box .primary');
      this.player_list = this.$('.player-list');
      this.player_list_list = this.player_list.find('.list');
      this.list_pane = this.player_list_list.find('.scroll-pane');

      this.controlbar = this.$('.control-bar');
      this.mobileShotWrapper = this.$('.mobile-shot-list-wrapper');

      this.contain;

      this.listenTo(PubSub, 'windowsize:global:enter', this.enterMobile);
      this.listenTo(PubSub, 'windowsize:global:exit', this.exitMobile);

      this.listenTo(State, 'view_fairway:enter', this.checkForMobile);
      this.listenTo(State, 'view_fairway:exit', this.checkForMobile);

      this.listenTo(PubSub, 'windowsize:orientation:portrait', this.enterPortrait);
      this.listenTo(PubSub, 'windowsize:orientation:landscape', this.enterLandscape);

      this.listenTo(State, 'size:contain', this.calculateContain);

      // auto-render based on loaded State
      if(State.get('loaded')) {
        this.render();
      } else {
        this.listenToOnce(State, 'change:loaded', this.render);
      }
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

    calculateContain: function() {
      if(this.contain) {
        this.contain.calculateRatio();
      }
    },

    enterMobile: function() {
      this.undoContainDesktop();
      this.containMobile();

      // close the player details dropdown if open
      State.trigger('playerlist:close');
    },

    exitMobile: function() {
      this.undoContainMoblile();

      // update player information if compare players were added
      // in desktop mode because they haven't been updating in mobile view
      if(State.player_position.compare.length > 0) {
        Players.refresh();
      }

      this.containDesktop();

      // reinitiate playerList jscroll pane if exists
      State.trigger('playerlist:resize');
    },

    checkForMobile: function() {
      this.logger.info('view_fairway:enter/exit triggered');
      if(Win.size() === Win.sizes.global) {
        this.containMobile();
      }
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
      this.primary.css('width', '');
      this.controlbar.css('width', '');

      this.list_pane.css('height', '');

      this.disposeRatioResize();

      if(Win.orientation() === Win.orientations.portrait && State.get('view_fairway')) {
        this.contain = new RatioResize({
          ratio: 3/5,
          view: this,
          hcallback: function(w,h) {
            // height constraint
            // figure out width at 3:5 ratio
            var neww = Math.ceil(h * (720/1290));

            var oldw = this.$el.width();
            this.$el.css('width', neww);

            if(oldw !== neww) {
              GfxUtils.resize();
            }
            // clear out the gradients
            this.undoGradient();

            // apply side gradient if applicable
            if(w > neww) {
              this.$el.addClass('gradient');
            }
          },
          wcallback: function(w,h) {
            var oldw = this.$el.prop('style').width;
            // screen is wider than 16/9
            this.$el.css('width', '');
            this.mobileShotWrapper.css('width','');
            this.primary.css('width','');
            this.controlbar.css('width', '');
            this.undoGradient();
            this.$el.find('.renders').addClass('gradient');

            var newh = Math.ceil(w * (1290/720));
            // Only check for primary player's canvas
            if(oldw !== '' || this.$('canvas.type' + Constants.STATE.PRIMARY).height() !== newh) {
              GfxUtils.resize();
            }
          },
          height: offset
        });
      } else {
        // landscape view
        this.contain = new RatioResize({
          ratio: 4/3,
          view: this,
          hcallback: function(w,h) {
            // height constraint
            // figure out width at 4:3 ratio
            var neww = Math.ceil(h * (4/3));
            var marginw = 0;
            var renderw = 0;

            this.undoGradient();

            if (Win.orientation() === Win.orientations.landscape) {
              // set .tracker width the reminder of side shot list 194px
              if(w-neww < 194) {
                neww = w-194;
                // add top bottom gradient
                this.$el.find('.renders').addClass('gradient');
              }
              // if the screen width is smaller than iPhone 5,
              // calculate the side shot list subtracted from the course image
              // if(w < 568) {
              //   var sidew = w - neww;
              //   Track.Gfx.mobileShotWrapper.css('width',sidew);
              // } else {
              //   // shot list width is fixed width set in css
              //   Track.Gfx.mobileShotWrapper.css('width','');
              // }
              marginw = (w - neww - 194) / 2; // (window width - .tracker width - side shot list width)/2
              renderw = (w - 194); // get the left column width minus 194px (side shot-list width)

              // expand the player banner and control-bar to (w - 194px)-2px margin over the course image
              this.primary.css('width', '').filter('.togglePrimary').css('width', renderw - 2);
              this.controlbar.css('width', renderw - 2);

              // size the player lists to max available height
              var list_height = 210;

              // force the player list items to show, hidden, briefly to get its layout positioning
              this.player_list.add(this.player_list_list).css('visibility', 'hidden').show();
              var list_offset = this.list_pane.offset().top - (Common.small_header_height + offset);

              // then immediately hide
              this.player_list.add(this.player_list_list).css('visibility', '').css('display', '');
              var new_list_height = h - list_offset;
              if(new_list_height < list_height) {
                this.list_pane.css('height', new_list_height);
              } else {
                this.list_pane.css('height', '');
              }
            }

            // set margin if applicable, otherwise clear setting
            if(marginw > 0){
              this.$el.css('margin-left', marginw);
              this.$el.addClass('gradient'); // side gradient
            } else {
              this.$el.css('margin-left', '');
              this.$el.removeClass('gradient');
            }

            var oldw = this.$el.width();
            this.$el.css('width', neww);
            if(oldw !== neww) {
              GfxUtils.resize();
            }
          },
          wcallback: function(w,h) {
            // width constraint
            var oldw = this.$el.prop('style').width;
            var neww = Math.ceil(h * (4/3));
            var renderw = (w - 194); // get the left column width minus 194px (side shot-list width)

              // set the width manually to force applying renders in the available space
              if(w-neww < 194 && Win.orientation() == Win.orientations.landscape) {
                this.$el.css('width', renderw);
                this.undoGradient();
                this.$el.find('.renders').addClass('gradient');
                this.controlbar.css('width', renderw - 2);
                this.primary.css('width', '').filter('.togglePrimary').css('width', renderw - 2);
              } else {
                // screen is wider than 16/9
                this.undoGradient();
                this.$el.css('width', '');
                this.mobileShotWrapper.css('width','');
                this.primary.css('width','');
                this.controlbar.css('width', '');
                this.list_pane.css('height', '');
              }

            //if(oldw !== '') {
              GfxUtils.resize();
            //}
          },
          height: offset
        });
      }
    },

    undoContainMoblile: function() {
      this.disposeRatioResize();

      this.$el.css('margin-left','');
      this.primary.css('width','');
      this.$el.css('width', '');
      this.controlbar.css('width', '');
      this.list_pane.css('height', '');
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

          if(oldw !== neww) {
            GfxUtils.resize();
          }
        },
        wcallback: function(w,h) {
          var oldw = this.$el.prop('style').width;
          // screen is wider than 16/9
          this.undoGradient();
          this.$el.css('width', '');
          this.$('.renders').addClass('gradient');
          if(oldw !== '') {
            GfxUtils.resize();
          }
        },
        height: offset
      });
    },

    undoContainDesktop: function() {
      this.disposeRatioResize();
      this.$el.css('width', '');
    }
  });

  return TrackSize;
});
