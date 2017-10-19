define('views/track/player-bar',['require','underscore','backbone','utils/window-size','utils/scores','utils/pubsub','utils/track/constants','models/track/state','utils/track/track','text!templates/track/player-bar-player.html!strip'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub'),

      Constants = require('utils/track/constants'),
      State = require('models/track/state'),
      TrackUtils = require('utils/track/track'),

      playerTemplate = require('text!templates/track/player-bar-player.html!strip')
      ;

  var PrimaryPlayer = Backbone.View.extend({
    el: '.primary',

    events: {
      'click img.playerImg': 'togglePrimary',
      'click .name': 'selectPlayer',
      'click .favorite': 'toggleFavorite'
    },

    template: _.template(playerTemplate),

    is_open: false,
    is_selectable: false,

    /**
     * Pass in model of type TrackPlayer on creation.
     * Subsequent changing of players go through setPlayer method
     * @return {[type]} [description]
     */
    initialize: function(opts) {
      if(this.model) {
        this.attachListeners();
      }

      if(opts && opts.is_selectable) {
        this.is_selectable = true;
      }

      // update primary player image source
      this.listenTo(PubSub, 'windowsize:global:exit', this.increaseImgSize);
      this.listenTo(PubSub, 'windowsize:global:enter', this.reduceImgSize);
    },

    attachListeners: function() {
      this.listenTo(this.model.get('score_data'), 'change:is_fave', this.updateFavorite);
      this.listenTo(this.model.get('score_data'), 'change:thru', this.updateScore);
    },

    setPlayer: function(player) {
      // change player
      if(this.model) {
        this.stopListening(this.model.get('score_data'));
      }
      this.model = player;
      this.attachListeners();

      this.build();
    },

    build: function() {
      // should be 67x35
      var img_size = '134x70';
      if(Win.size() === Win.sizes.global) {
        img_size = '80x80';
      }
      var html = this.template({
        title: !this.is_selectable ? 'Tracking' : 'Current Leader',
        is_primary: true,
        img_size: img_size,
        player: this.model.attributes
      });
      this.$el.html(html);

      this.updateScore();
      this.updateFavorite();
    },

    updateScore: function() {
      var player_score = this.model.get('score_data');

      var pos = player_score.get('pos');
      if($.trim(pos) === '') {
        pos = '--';
        var status = Scores.Utilities.getStatusCode(player_score.get('status'));
        if(status !== undefined) {
          pos = status;
        }
      }
      this.$('.pos').html(pos);

      var topar = player_score.get('topar');
      topar = topar === '' ? '--' : topar;
      this.$('.total').removeClass('over under').html(topar);

      var klass = Scores.Utilities.className(player_score.get('topar'),true);
      this.$('.total').addClass(klass);
    },

    updateFavorite: function() {
      // check favorite
      var is_fave = this.model.get('score_data').get('is_fave');
      this.$('.favorite').toggleClass('selected', is_fave);
    },

    togglePrimary: function() {
      if(!this.is_selectable) {
        if(Win.size() === Win.sizes.global) {
          this.is_open = !this.is_open;
          if(this.is_open) {
            TrackUtils.measure('Player','Details','Open');
          } else {
            TrackUtils.measure('Player','Details','Close');
            State.trigger('playerlist:close');
          }
          this.$el.toggleClass('togglePrimary', this.is_open);

          State.trigger('playerbar:toggle', this.is_open);
          State.trigger('size:contain');
        }
      } else {
        this.selectPlayer();
      }

      return false;
    },

    toggleFavorite: function() {
      var data = this.model.get('score_data');
      data.trigger('toggleFavorite');

      return false;
    },

    selectPlayer: function() {
      if(this.is_selectable) {
        Backbone.history.navigate(TrackUtils.getURL('pid=' + this.model.id), true);
      }
    },

    reduceImgSize: function() {
      var img = this.$('.player > img');
      var src = img.attr('src');
      src = src.replace('134x70','80x80');
      img.attr('src',src);
    },

    increaseImgSize: function() {
      var img = this.$('.player > img');
      var src = img.attr('src');
      src = src.replace('80x80','134x70');
      img.attr('src',src);
    }
  });

  var SecondaryPlayer = Backbone.View.extend({
    className: 'comparison',

    events: {
      'click .close': 'removePlayer',
      'click .player a': 'selectPlayer'
    },

    template: _.template(playerTemplate),

    initialize: function(options) {
      this.listenTo(this.model, 'change', this.updateScore);
    },

    render: function() {
      var html = this.template({
        title: 'Comparing',
        is_primary: false,
        img_size: '80x80',
        player: this.model.attributes
      });
      this.$el.html(html);
      this.updateScore();

      return this;
    },

    onDispose: function() {

    },

    removePlayer: function() {
      TrackUtils.removeComparePlayer(this.model.id);

      TrackUtils.measure('Remove Compare Player', this.model.id + '');
      TrackUtils.updateURL();
      return false;
    },

    selectPlayer: function() {
      TrackUtils.selectPlayer(this.model.id);

      return false;
    },

    updateScore: function() {
      var player_score = this.model.get('score_data');

      var pos = player_score.get('pos');
      if($.trim(pos) === '') {
        pos = '--';
        var status = Scores.Utilities.getStatusCode(player_score.get('status'));
        if(status !== undefined) {
          pos = status;
        }
      }
      this.$('.pos').html(pos);

      var topar = player_score.get('topar');
      topar = topar === '' ? '--' : topar;
      this.$('.total').removeClass('over under').html(topar);

      var klass = Scores.Utilities.className(player_score.get('topar'),true);
      this.$('.total').addClass(klass);
    }
  });

  var TrackPlayerBar = Backbone.View.extend({
    el: '#playerBar',

    events: {
      'click #togglePrimaryList': 'togglePrimaryList',
      'click #toggleCompareList': 'toggleCompareList'
    },

    persistent_list: false,

    initialize: function(opts) {
      this.list = opts.list;

      // this means it's always set to open, rewire what primary toggle does
      if(this.list.primary_open) {
        this.persistent_list = true;
      } else {
        this.placeholder = this.$('.placeholder');
        this.primary = new PrimaryPlayer({
          el: this.$('.primary'),
          is_selectable: this.persistent_list
        });
        this.secondary = this.$('.secondary');

        this.compare = {};

        this.listenTo(State, 'playerbar:primary:set', this.updatePrimary);
        this.listenTo(State, 'playerbar:compare:add', this.addComparePlayer);
        this.listenTo(State, 'playerbar:compare:remove', this.removeComparePlayer);
      }

      this.listenTo(State, 'playerbar:closelist', this.closeList);
    },

    onDispose: function() {
      if(!this.persistent_list) {
        this.primary.dispose();
        _.each(this.compare, function(comp) {
          comp.dispose();
        });
      }
    },

    updatePrimary: function(player) {
      this.primary.setPlayer(player);
      this.updatePrimaryIcon();
    },

    togglePrimaryList: function() {
      State.trigger('playerlist:primary:toggle');
      this.updatePrimaryIcon();

      return false;
    },

    closeList: function() {
      this.updatePrimaryIcon(false);
      this.toggleCompareIcon(false);
    },

    updatePrimaryIcon: function(state) {
      if(state === true || state === false) {
      } else {
        state = this.list.primary_open;
      }
      this.$('#togglePrimaryList').toggleClass('active', state);
    },

    toggleCompareList: function() {
      State.trigger('playerlist:compare:toggle');
      this.toggleCompareIcon();

      return false;
    },

    toggleCompareIcon: function(state) {
      if(state === true || state === false) {
      } else {
        state = this.list.compare_open;
      }
      this.secondary.toggleClass('active', state);
    },

    addComparePlayer: function(player) {
      var compare = new SecondaryPlayer({
        model: player
      });
      this.compare[player.id] = compare.render();

      this.secondary.find('.compare-flex').before(compare.$el);
      State.trigger('statbar:add', player.id);
    },

    /**
     * Event listener to remove compare player from the player bar
     * @param  {Integer} id Player id to remove
     */
    removeComparePlayer: function(id) {
      var cid = this.compare[id];
      if(cid) {
        cid.dispose();
        delete this.compare[id];
        State.trigger('statbar:remove', id);

        if(this.list.compare_open) {
          State.trigger('playerlist:update');
        }
      }
    }
  });

  return TrackPlayerBar;
});
