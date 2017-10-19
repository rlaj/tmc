define('views/track/track',['require','backbone','utils/pubsub','utils/metrics','models/track/state','utils/track/constants','utils/track/gfx','utils/track/track','collections/track/players'],function(require) {
  var Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),

      State = require('models/track/state'),
      Constants = require('utils/track/constants'),
      GfxUtils = require('utils/track/gfx'),
      TrackUtils = require('utils/track/track'),
      Players = require('collections/track/players')
      ;

  var TrackView = Backbone.View.extend({
    el: '#holeContainer.tracker',

    events: {
      'click a.marker': 'selectShot',
      'click div.detail-overlay a.close': 'closeOverlay',
      'click div.ghost-overlay a.ghost_link': 'selectPlayer',
      'click': 'closeAll',

      'click canvas': 'checkGreenNavigation'
    },

    fairway_tmpl: _.template('<img src="/images/now/trans_4x3.gif" data-high="/images/scores/track/H<%= hole %>W@2x.jpg" data-medium="/images/scores/track/H<%= hole %>W.jpg" data-lower="/images/scores/track/H<%= hole %>W.jpg" data-lower-portrait="/images/scores/track/H<%= hole %>P.jpg" data-view="fairway" id="mapFairway" />'),
    green_tmpl: _.template('<img src="/images/now/trans_4x3.gif" data-high="/images/scores/track/H<%= hole %>C@2x.jpg" data-medium="/images/scores/track/H<%= hole %>C.jpg" data-lower="/images/scores/track/H<%= hole %>C.jpg" data-view="green" id="mapGreen" />'),

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Track/HoleContainer');

      GfxUtils.container = this.$el;

      PubSub.on('resize', GfxUtils.resize.bind(GfxUtils), this);
      this.listenTo(State, 'holeimage:change', this.changeHoleImage);

      this.listenTo(State, 'markerwrapper:add', this.addView);
    },

    render: function() {
      this.$('#mapFairway').ready(function() {
        this.logger.info('fairway ready, resizing');
        GfxUtils.resize();
      }.bind(this));
    },

    onDispose: function() {
      PubSub.off('resize', GfxUtils.resize, this);
      GfxUtils.container = undefined;
    },

    /**
     * Function call to handle prepending CanvasView, MarkerContainerView
     * elements to the #markerWrapper container
     * @param {View} view CanvasView or MarkerContainerView to add to the DOM
     */
    addView: function(view) {
      this.$('#markerWrapper').prepend(view.$el);
    },

    selectShot: function(e) {
      e.preventDefault();
      var $this = $(e.currentTarget);

      // get related shot object
      var shotnum = $this.data('shot');

      if(shotnum === State.get('selected_shot').get('number')) {
        TrackUtils.measure('Shot ' + shotnum, 'Reselect');
      } else {
        TrackUtils.measure('Shot ' + shotnum, 'Select');
      }

      State.trigger('controls:shot:select', shotnum);
    },

    closeOverlay: function(e) {
      e.preventDefault();
      var $this = $(e.currentTarget);
      var wrapper = $this.closest('.marker-wrapper');

      // get player id, shot number
      var pid = wrapper.attr('data-id').match(/\d+/)[0];
      pid = pid ? parseInt(pid, 10) : pid;

      var overlay = $this.closest('.detail-overlay');
      var shotnum = overlay.attr('data-shot');

      shotnum = shotnum ? parseInt(shotnum, 10) : shotnum;

      // hide overlay for player's shot
      var index = shotnum - 1;
      if(index < 0) {
        index = 0;
      }
      Players.get(pid).get('current_hole').shots[index].hide_details();

      if(overlay.hasClass('shot-overlay')) {
        var text = 'Shot ' + shotnum;
        if(shotnum === 0) {
          text = 'On Tee';
        }
        TrackUtils.measure(text, 'Hide Overlay');
      } else if(overlay.hasClass('ghost-overlay')) {
        TrackUtils.measure('Ghost Shot', 'Hide Overlay');
      }
    },

    selectPlayer: function(e) {
      e.preventDefault();
      var id = $(e.currentTarget).attr('data-id');
      TrackUtils.selectPlayer(id);
    },

    closeAll: function(e) {
      e.preventDefault();

      // if clicking anywhere on render, auto-close player list, hole/round selector
      if(e.target.nodeName.toLowerCase() === 'canvas' || $(e.target).closest('#maps').length > 0) {
        State.trigger('playerlist:close');
        State.trigger('controls:options:hide');
        State.trigger('shotlist:close');
      }
    },

    changeHoleImage: function() {
      var hole = State.get('selected_hole');
      if(State.get('showing_playoff')) {
        if(hole % 2 === 0) {
          hole = '10';
        } else {
          hole = '18';
        }
      } else {
        if(hole < 10) {
          hole = '0' + hole;
        }
      }

      // use data-lower-portrait mode to supply mobile landscape portrait render
      this.$('#mapFairway').replaceWith(this.fairway_tmpl({hole: hole}));
      this.$('#mapGreen').replaceWith(this.green_tmpl({hole: hole}));

      this.clearUnveil();
      this.unveil(this.$('#mapFairway, #mapGreen'));
    },

    checkGreenNavigation: function(e) {
      if(State.get('view_fairway')) {
        var x = e.pageX,
            y = e.pageY;

        // get click position relative to container
        var offset = this.$el.offset();
        x = x - offset.left;
        y = y - offset.top;

        // get hole pin location
        var pin = State.get('hole_info').pin;
        var px = pin.getRel('x'),
            py = pin.getRel('y');

        // calculate clicked distance from pin
        var dist = Math.sqrt(Math.pow((x - px), 2)  + Math.pow((y - py), 2));

        // if close enough, trigger green view
        if(dist < 50) {
          // find if the first shot on the green
          var shots = Players.getPlayer().get('current_hole').shots;
          var shot,
              l = shots.length;
          for(var i = 1; i < l; i++) {
            if(shots[i].get('ongreen')) {
              shot = shots[i];
              break;
            }
          }

          // if we only have one shot and it's on the green, pass that shot
          if(l === 1 && shot === undefined && shots[0].get('ongreen')) {
            shot = shots[0];
          }

          GfxUtils.forceGreenView(shot);

          TrackUtils.measure('Green');
          return false;
        }
      }

      return true;
    }
  });

  return TrackView;
});

