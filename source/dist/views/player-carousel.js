define('views/player-carousel',['require','backbone','utils/carousel','utils/browser','views/base-carousel','views/player-card','settings','utils/metrics','utils/scores','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      Carousel = require('utils/carousel'),
      Browser = require('utils/browser'),
      BaseCarousel = require('views/base-carousel'),
      PlayerCard = require('views/player-card'),
      Settings = require('settings'),
      Metrics = require('utils/metrics'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub')
      ;

  var Players;

  var PlayerCarouselView = BaseCarousel.extend({

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PlayerCarouselView');
      BaseCarousel.prototype.initialize.apply(this, arguments);
    },

    loadContentCarousel: function() {
      // Draw player list with scores if Scores are live or post
      // as player card view will auto-update scores as they change
      if(Settings.Scores.live || Settings.Scores.post) {

        if(Scores.isDataLoaded()) {
          this.loadPlayerInfo();
        } else {
          this.listenToOnce(PubSub, 'scores:refresh', this.loadPlayerInfo);
        }

      }
      // Otherwise, if pre-tournament, use player list data to populate
      // player cards
      else if(Settings.Scores.pre) {

        require(['collections/players'], function(coll) {
          Players = coll;
          Players.fetch({
            success: function(collection, response, options) {
              this.loadPrePlayerInfo(collection);
            }.bind(this)
          });
        }.bind(this));

      }
    },

    loadPlayerInfo: function() {
      // Only build cards the first time through. Allow model events
      // to trigger re-rendering of card when data updates
      if(this.cards.length === 0) {
        var player_html = [];

        this.options.article_players.forEach(function(id) {
          var player = Scores.collection.get(id);
          if(player) {
            var card = new PlayerCard({
              model: player,
              country: true,
              bio_link: true,
              metrics_suffix: 'bio_article',
              favorite: !Browser.app,
              location: 'filmstrip'
            }).render();
            this.cards.push(card);
            player_html.push(card.$el);
          }
        }.bind(this));

        // write new html
        this.$('.carousel').append(player_html);

        this.carousel = new Carousel();
        var opts = this.getCarouselOptions();
        this.carousel.init(this.$('.carousel'),opts);
      }

    },

    loadPrePlayerInfo: function(player_list) {
      var player_html = [];

      this.options.article_players.forEach(function(id) {
        var player = player_list.get(id);
        if(player) {
          var card = new PlayerCard({
            model: player,
            scores: false,
            country: true,
            // don't link to player bios if not showing player list
            bio_link: Settings.playersListNav,
            metrics_suffix: 'bio_article',
            favorite: !Browser.app,
            location: 'filmstrip'
          }).render();
          this.cards.push(card);
          player_html.push(card.$el);
        }
      }.bind(this));

      // write new html
      this.$('.carousel').append(player_html);

      this.carousel = new Carousel();
      var opts = this.getCarouselOptions();
      this.carousel.init(this.$('.carousel'),opts);
    }

  });

  return PlayerCarouselView;
});
