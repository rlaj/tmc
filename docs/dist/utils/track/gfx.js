define('utils/track/gfx',['require','backbone','settings','utils/pubsub','utils/window-size','models/track/state','utils/track/constants'],function(require) {
  var Backbone = require('backbone'),
      Settings = require('settings'),
      PubSub = require('utils/pubsub'),
      Win = require('utils/window-size'),
      State = require('models/track/state'),
      Constants = require('utils/track/constants')
      ;

  var TrackGfxUtils = {
    canvas_list: [],

    container_width: 0,
    container_height: 0,

    clear_shots: function() {
      for(var i in State.get('open_shot_stack')) {
        State.get('open_shot_stack')[i].destroy();
      }
      State.set('open_shot_stack', []);
    },

    redraw: function() {
      console.log('Gfx redraw');

      this.clear_shots();

      for(var key in this.canvas_list) {
        this.canvas_list[key].redraw();
      }

      // this.showShotOverlay();
    },

    clear: function() {
      console.log('Gfx clear');

      this.clear_shots();

      for(var key in this.canvas_list) {
        this.canvas_list[key].clear();
      }
    },

    /* If we're not converting from 4:3 dimensions to 16:9 renders, don't need to recalculate percentages */
    // returns value between 0 and 1 for x coordinate relative to set width
    pctx: function(value) {
      return value;

      // return (value / Track.WIDTH);
    },

    // returns value between 0 and 1 for y coordinate relative to set height
    pcty: function(value) {
      return value;

      // return (value / Track.NEW_HEIGHT);
    },

    // given percentage between 0 and 1, return coordinate value relative to container dimensions
    relative: function(key, value) {
      var dim = this.container_width;
      if(key === 'y') {
        dim = this.container_height;
      }
      return Math.floor(dim * this['pct' + key].call(this, value));
    },

    repositionWhatsNewForShotList: function() {
      var right = ((document.body.clientWidth - this.container_width) / 2) + 50;  //add margin of 70 to align with open panel control
      PubSub.trigger('whats-new:shotList:reposition', {right: right});
    },

    resize: function() {
      console.log('Gfx resizing');
      this.container_width = this.container.outerWidth();
      this.container_height = this.container.outerHeight();

      this.repositionWhatsNewForShotList();

      console.log('Gfx preliminary dimensions w:%o h:%o', this.container_width, this.container_height);
      if(this.container_width === this.container_height || this.container_height <= this.container_width / 2) {
        console.log('Gfx auto-recalculate size, %o <= %o', this.container_height, this.container_width / 2);
        if(Win.size() === Win.sizes.global) {
          // image still loading, calculate 3x5 manually
          this.container_height = Math.ceil(this.container_width * 0.6);
        } else {
          // image still loading, calculate 4x3 manually
          this.container_height = Math.ceil(this.container_width * 0.75);
        }
      }

      console.log('Gfx finished dimensions w:%o h:%o', this.container_width, this.container_height);

      // canvas contents will disappear as soon as dimensions are assigned
      // this._canvas.width = this.container_width;
      // this._canvas.height = this.container_height;
      var redraw = true;
      for(var key in this.canvas_list) {
        var success = this.canvas_list[key].resize(this.container_width, this.container_height);
        redraw = redraw && success;
      }

      if(!Settings.Scores.pre && Settings.Scores.stub_track !== true && redraw) {
        this.redraw();
      }

      // mobile landscape - calculate shot-list height & apply it to jscrollPane
      if(Win.size() === Win.sizes.global) {
        if(Win.orientation() === Win.orientations.landscape) {
          State.trigger('shotlist:resize');
        }

        // reinitiate playerList jscroll pane if exists
        State.trigger('playerlist:resize');
      }
    },

    switchToView: function(view) {
      if(!State.get('forced_green')) {
        // $('#'+view+'View').addClass('selected').siblings().removeClass('selected');
        if(view === Constants.VIEW.fairway && !State.get('view_fairway')) {
          this.container.removeClass('green');
          State.set('view_fairway', true);
        } else if(view === Constants.VIEW.green && State.get('view_fairway')) {
          this.container.addClass('green');
          State.set('view_fairway', false);
        }
        PubSub.trigger('lookup.unveil');
      }
    },

    forceGreenView: function(shot) {
      console.log('Gfx forced green view activated');

      if(shot) {
        if(shot.get('number') === 1 && shot.get('ongreen')) {
          this.switchToView(Constants.VIEW.green);
          this.redraw();
          State.trigger('controls:arrows:reset');
        } else {
          State.trigger('controls:shot:select', shot.get('number'));
        }
      } else {
        this.switchToView(Constants.VIEW.green);
        this.redraw();
        State.trigger('controls:arrows:reset');
        State.set('forced_green', true);
      }
    },

    exitForcedGreenView: function() {
      console.log('Gfx forced green view exit');
      State.set('forced_green', false);
    }
  };

  return TrackGfxUtils;
});

