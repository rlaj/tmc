define('views/track/nav-bar',['require','underscore','backbone','utils/browser','utils/window-size','views/track/player-list','views/track/player-bar','views/track/stat-bar','models/track/state','utils/track/constants'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Win = require('utils/window-size'),

      TrackPlayerList = require('views/track/player-list'),
      TrackPlayerBar = require('views/track/player-bar'),
      TrackStatBar = require('views/track/stat-bar'),
      State = require('models/track/state'),
      Constants = require('utils/track/constants')
      ;

  var TrackNavBar = Backbone.View.extend({
    el: '.nav-control-wrap',

    events: {
      'keyup #findPlayer': 'find',
      'submit #findPlayer': 'find'
    },

    _defaults: {
      statbar: true,
      primary: true,
      compare: true,
      primary_list_open: false
    },

    initialize: function(options) {
      this.options = _.extend({}, this._defaults, options);

      this.playerlist = new TrackPlayerList({
        el: this.$('#playerList'),
        list_open: this.options.primary_list_open
      });
      this.playerbar = new TrackPlayerBar({
        el: this.$('#playerBar'),
        list: this.playerlist
      });

      if(this.options.statbar) {
        this.statbar = new TrackStatBar({
          el: this.$('#statBar')
        });
      }

      if(this.options.compare) {
        this.listenTo(State, 'change:compare_mode', this.toggleCompareState);
        this.listenTo(State, 'change:view_fairway', this.checkDarkenState);
      }

      this.listenTo(State, 'search:clear', this.clearSearch);
      this.listenTo(State, 'playerlist:primary:onToggle', this.checkLayers);
      this.listenTo(State, 'playerbar:toggle', this.setFullWidth);
    },

    render: function() {
      this.playerlist.render();

      return this;
    },

    onDispose: function() {
      this.playerlist.dispose();
      this.playerbar.dispose();
      if(this.statbar) {
        this.statbar.dispose();
      }
    },

    toggleCompareState: function(model, value, options) {
      if(value) {
        this.$el.addClass('has-compare');
      } else {
        this.$el.removeClass('has-compare');
      }
    },

    checkDarkenState: function() {
      // custom darken navigation elements if on green view for defined holes
      this.$el.removeClass('darken');
      if(!State.get('view_fairway') && _.indexOf(Constants.HOLES_TO_DARKEN, State.get('selected_hole')) > -1) {
        this.$el.addClass('darken');
      }
    },

    /**
     * When player list is open, ensure it shows above shot controls
     * in mobile landscape size
     */
    checkLayers: function(state) {
      if(Win.size() === Win.sizes.global) {
        this.$el.toggleClass('open', state);
      }
    },

    /**
     * When player bar is open, ensure it's full width to cover share icon
     * @param {Boolean} state Defines whether player bar has been opened or closed
     */
    setFullWidth: function(state) {
      if(Win.size() === Win.sizes.global) {
        this.$el.toggleClass('full', state);
      }
    },

    find: function(e) {
      e.preventDefault();

      var _this = e.currentTarget;
      State.trigger('search', _this.value);
    },

    clearSearch: function() {
      this.$('#findPlayer').val('');
      if(Browser.oldIE) {
        this.$('#findPlayer').val('Find a player');
      }
    }
  });

  return TrackNavBar;
});

