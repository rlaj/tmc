define('views/pairings-content',['require','backbone','settings','utils/pubsub','views/player-card','views/pairings-round','views/withdrawn-missed-cut','momentTimezone'],function(require) {
  var Backbone = require('backbone'),
      Settings = require('settings'),
      PubSub = require('utils/pubsub'),
      PlayerCardView = require('views/player-card'),
      PairingsRoundView = require('views/pairings-round'),
      WithdrawnMissedCutView = require('views/withdrawn-missed-cut')
      ;

  moment = require('momentTimezone');


  var JST = {};

  JST.default =  _.template(
      '<div class="roundContent"></div>' +
      '<div class="withdrawnMissedCutContent"> </div>'
  );

  var PairingsContent = Backbone.View.extend({
    el: '.pairingsContent',

    defaults: {
    },

    initialize: function(opts) {
      this.playerCardViewsMap = {};
      this.roundViewsMap = {};
      this.pairings = opts.pairings;
      var that = this;

      // Setup one view for each player card.
      // All round views will share the same card view.
      this.collection.models.forEach(function(player) {
        var playerCardView = new PlayerCardView({
          model: player,
          id: 'p_' + player.get('id'),

          scores: false,

          favorite: true,
          country: true,
          bio_link: true,

          show_amateur_status: true,
          show_favorite_tip: true,

          metrics_suffix: 'bio_tee',
          item: true
        });

        var view = playerCardView.render();
        that.playerCardViewsMap[player.id] = view;
      });


      this.on('show', this._show);

    },

    render: function() {
      this.$el.html(JST.default({}));
      if(Settings.default_pairings_round) {
        var roundPairings = this.pairings.get('round'+ Settings.default_pairings_round);
        this._buildRound(roundPairings);
      } else {
        this._buildLastRound();
      }
      return this;
    },


    /**
     * Display content for tabName
     * @param {String} tabName (required)
     */
    _show: function(tabName) {
      var roundPairings = this.pairings.get(tabName);
      if(roundPairings) {
        if(roundPairings.group) { //round content
          this.$('.withdrawnMissedCutContent').hide();
          this.$('.roundContent').show();
          this._buildRound(roundPairings);
        } else if (roundPairings.player && roundPairings.player.length > 0) { //withdrawn/missed content
          this.$('.roundContent').hide();
          this.$('.withdrawnMissedCutContent').show();
          this._buildWithrawnMissedCut(roundPairings.player);
        }
      }

    },



    /**
     * Build the view for the latest round only
     */
    _buildLastRound: function() {
      var that = this;
      var rounds = ['round4', 'round3', 'round2', 'round1'];
      for(var i = 0; i < rounds.length; i++) {
        var roundPairings = this.pairings.get(rounds[i]);
        if(roundPairings && roundPairings.group && roundPairings.group.length > 0) {
          this._buildRound(roundPairings);
          break;
        }
      }
    },


    /**
     * Build the view for a given round
     * @param {Object} roundPairings
     */
    _buildRound: function(roundPairings) {
      this.currentRoundView && this.currentRoundView.stopAllListeners();
      var roundView = this.roundViewsMap[roundPairings.day];
      if(roundView) { //view for the round already exists
        roundView.render();

      } else { //create new view for the round
        var roundView = new PairingsRoundView({model: roundPairings, collection: this.collection,
        playerCardViewsMap: this.playerCardViewsMap}).render();
        this.roundViewsMap[roundPairings.day] = roundView;
        PubSub.trigger('lookup.unveil');
      }
      this.currentRoundView = roundView;
    },

    /**
     * Build the view for the withdrawn/missed cut tab
     * @param {Array} playersArr
     */
    _buildWithrawnMissedCut: function(playersArr) {
      if(!this.withdrawnMissedCutView) {
        this.withdrawnMissedCutView = new WithdrawnMissedCutView({model: playersArr});
        this.withdrawnMissedCutView.render();
      }
    },

    onDispose: function() {
      //dispose player card views
      for (var key in this.playerCardViewsMap) {
        if(this.playerCardViewsMap.hasOwnProperty(key)) {
          this.playerCardViewsMap[key].dispose();
        }
      }

      //dispose round views
      for (var key in this.roundViewsMap) {
        if(this.roundViewsMap.hasOwnProperty(key)) {
          this.roundViewsMap[key].dispose();
        }
      }

      this.withdrawnMissedCutView && this.withdrawnMissedCutView.dispose();

    },

  });

  return PairingsContent;
})

;
