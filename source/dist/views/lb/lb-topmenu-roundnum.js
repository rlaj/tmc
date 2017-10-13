define('views/lb/lb-topmenu-roundnum',['require','jquery','underscore','backbone','utils/pubsub','utils/scores','collections/score-players'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScorePlayers = require('collections/score-players')
      ;

  /**
   * LBTopRoundNum is to display the Round Number on the skeuomorphic views
   * listens to score collection for the currentRound change event
   */
  var LBTopRoundNum = Backbone.View.extend({
    el: '.currentRound',

    events: {
      // 'click .menu-link': 'toggle'
    },

    initialize: function($app) {
      this.logger = new eventsCore.util.Logger('LBMenuBar');
      this.logger.info('Initialize');

      this.listenTo(ScorePlayers, 'change:currentRound', this.render);
    },

    render: function() {
      this.$el.html(this.getHtml());
      return this;
    },

    getHtml: function() {
      if(!Scores.isDataLoaded()) {
        PubSub.off('scores:refresh', this.render, this)
          .once('scores:refresh', this.render, this);
        return;
      } else {
        var roundTxt = 'Round ' + Scores.Utilities.currentRound();
        return roundTxt;
      }
    }
  });

  return LBTopRoundNum;
});
