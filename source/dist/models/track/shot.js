define('models/track/shot',['require','backbone','utils/window-size','models/track/state','models/track/point','utils/track/constants'],function(require) {
  var Backbone = require('backbone'),
      Win = require('utils/window-size'),
      State = require('models/track/state'),
      Point = require('models/track/point'),
      Constants = require('utils/track/constants')
      ;

  var Shot = Point.extend({
    defaults: function() {
      var _defaults = _.extend({}, Point.prototype.defaults, {
        penalty: false,
        number: 0,
        viewing: false,
        dimmed: false,

        distance: 0,
        ongreen: false,
        origin: undefined,
        remaining: 0,
        has_video: false
      });

      return _defaults;
    },

    initialize: function(attr, opts) {
      Point.prototype.initialize.apply(this, arguments);

      this.set('distance', parseFloat(attr.length));
      this.set('ongreen', attr.ongreen === 'true');
      this.set('origin', parseInt(attr.from, 10));
      this.set('remaining', parseFloat(attr.remaining, 10));
      this.set('isGrid', attr.isGrid === 'true');

      this.set('has_video', this.get('highlightURL') !== '');

      // assign whether it's a penalty stroke or not
      if(attr.inWater === '1' || this.get('origin') === 12) {
        this.set('penalty', true);
      }
    },

    destroy: function() {
      this.clearDetailTimeout();
    },

    // all select functions return +this+ object to allow for chaining
    select: function () {
      this.set('selected', true);
      return this;
    },

    deselect: function () {
      this.set('selected', false);
      return this;
    },

    toggleSelect: function () {
      this.set('selected', !this.get('selected'));
      return this;
    },

    show_details: function (overlay, open_shot) {
      if(Win.size() !== Win.sizes.global){
        this.set('viewing', true);
        this.undim_details();
        if(overlay === undefined) {
          if(this.get('type') === Constants.STATE.PRIMARY) {
            overlay = this.get('canvas').marker_container.$('.shot-overlay.shot' + this.get('number'));
          } else if (this.get('type') === Constants.STATE.GHOST) {
            overlay = this.get('canvas').marker_container.$('.ghost-overlay');
          }
        }
        if(!overlay.hasClass('visible')) {
          this.logger.info('showing ' + (this.type === Constants.STATE.GHOST ? 'ghost ' : '') + 'shot details for ' + this.get('player').get('id') + ' shot ' + this.get('number'));
          overlay.addClass('visible');
          clearTimeout(this.get('timeoutId'));
          this.set('timeoutId', setTimeout(function() {
            this.hide_details();
          }.bind(this), this.get('timeout')));

          if(this.get('type') === Constants.STATE.PRIMARY) {
            State.set('open_shot_detail', this.get('number'));
          }

          var l = State.get('open_shot_stack').length;
          if(l > 0) {
            var shot;
            for(var i=0;i<l;i++) {
              shot = State.get('open_shot_stack')[i];
              if(shot.get('type') === Constants.STATE.PRIMARY) {
                shot.dim_details();
              }
            }
          }

          State.get('open_shot_stack').push(this);

          // if(open_shot !== undefined) {
          //   open_shot.dim_details();
          // }
        } else {
          this.logger.info('already showing shot details for shot ' + this.get('number'));
        }
      }

      // for Mobile Track Shot List - select shot-row
      if(this.get('type') === Constants.STATE.PRIMARY) {
        State.trigger('shotrow:set', this);
      }
      return this;
    },

    // refresh_details: function () {
    //   this.viewing = true;
    //   this.canvas.marker_container.find('.detail-overlay.shot' + this.number).addClass('visible');
    //   return this;
    // },

    hide_details: function () {
      if(Win.size() !== Win.sizes.global){
        this.logger.info('hiding ' + (this.get('type') === Constants.STATE.GHOST ? 'ghost ' : '') + 'shot details for ' + this.get('player').get('id') + ' shot ' + this.get('number'));
        this.set('viewing', false);
        var klass = '';
        if(this.get('type') === Constants.STATE.PRIMARY) {
          State.unset('open_shot_detail');
          klass = '.shot' + this.get('number');
        }

        var i = State.get('open_shot_stack').indexOf(this);
        var l = State.get('open_shot_stack').length - 1;
        if(i > -1) {
          State.get('open_shot_stack').splice(i,1);

          if(i === l && l > 0) {
            // we just popped the last element off the stack, undim the next one
            State.get('open_shot_stack')[l-1].undim_details();
          }
        }

        this.clearDetailTimeout();
        var container = this.get('canvas').marker_container;
        if(container) {
          container.$('.detail-overlay' + klass + '.visible').removeClass('visible');
        }

        // if(shot !== undefined) {
        //   shot.undim_details();
        // }
        return this;
      }
    },

    dim_details: function () {
      if(Win.size() !== Win.sizes.global){
        this.set('dimmed', true);
        var container = this.get('canvas').marker_container;
        if(container) {
          container.$('.shot-overlay.shot' + this.get('number') + '.visible').addClass('dim');
        }
      }
    },

    undim_details: function () {
      if(Win.size() !== Win.sizes.global){
        this.set('dimmed', false);
        var container = this.get('canvas').marker_container;
        if(container) {
          container.$('.shot-overlay.shot' + this.get('number') + '.dim').removeClass('dim');
        }
      }
    },

    clearDetailTimeout: function() {
      clearTimeout(this.get('timeoutId'));
    }
  });

  return Shot;
});
