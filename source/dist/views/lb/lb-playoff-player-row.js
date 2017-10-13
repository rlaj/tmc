define('views/lb/lb-playoff-player-row',['require','jquery','underscore','backbone','utils/lb/lb-common','utils/pubsub','utils/scores','settings','text!templates/lb/lb-playoff-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      Settings = require('settings'),
      playoffPlayerRowTemplate = require('text!templates/lb/lb-playoff-player-row.html!strip')
      ;

  var JST = {};
  // klass, score
  JST.playoff_video_cell = _.template(
    '<td class="hole_no <%= videoKlass %>" data-hole="<%= playoffHoleNum %>"><a href="<%= videoLink %>"><div class="<%= klass %>"><%= score %></div></a></td>'
  );
  JST.playoff_score_cell = _.template('<td class="hole_no"><div class="<%= klass %>"><%= score %></div></td>');
  JST.empty_playoff_cell = _.template('<td class="hole_no">&nbsp;</td>');

  var PlayoffPlayerRowView = Backbone.View.extend({
    tagName: 'tr',

    main_template: _.template(playoffPlayerRowTemplate),

    events: {
      // 'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PlayoffPlayerRowView');
      this.logger.info('Initialize');

      this.options = opts;
      this.playoff_holes = this.options.playoff_holes;
      this.progress = this.options.progress;

      this.listenTo(this.model, 'change:score change:video', this.render);
    },

    render: function() {
      this.assignAttributes();
      this.$el.html(this.buildPlayerRow());

      return this;
    },

    assignAttributes: function() {
      this.$el.attr({
        'class': 'player ' + this.options.klass,
        'data-id': this.model.get('id')
      });
    },

    buildPlayerRow: function() {
      var scorecard;
      var scoreData = this.model.get('score').split(',');
      var videoData = this.model.get('video').split(',');
      var klass = '';
      // if(Browser.ie8) {
      //   klass = (i % 2 === 1 ? 'odd' : '');
      // }

      scorecard = this.prepareScorecard(scoreData, videoData);

      return this.main_template({
        player: this.model.attributes,
        sorecards: scorecard,
        empty_cells: this.getEmptyTDs(scoreData.length)
      });
    },

    prepareScorecard: function(scoredata, videodata) {
      var scorecard;
      var scoreData = scoredata;
      var videoData = videodata;

      for(var i = 0, l = scoreData.length; i < l; i++) {
        var videoKlass = Scores.Playoff.getClassForPlayoffVideo(videoData[i]);
        var playoffHoleNum = (i + 1);
        var videoLink = '/en_US/watch/' + Settings.tournament_year + '/r5_' + this.model.id + '_' + playoffHoleNum + '.html?promo=highlight_lb';

        if(videoKlass === 'video') {
          scorecard += JST.playoff_video_cell({
            klass: Scores.Playoff.getClassForPlayoffScore(scoreData[i]),
            videoKlass: videoKlass,
            videoLink: videoLink,
            score: scoreData[i],
            playoffHoleNum: playoffHoleNum
          });
        } else {
          scorecard += JST.playoff_score_cell({
            player: this.model.attributes,
            klass: Scores.Playoff.getClassForPlayoffScore(scoreData[i]),
            score: scoreData[i]
          });
        }
      }
      return scorecard;
    },

    getEmptyTDs: function(totalNumberOfScores) {
      var numberOfTds = this.progress - totalNumberOfScores;
      var emptyTds = '';
      for(var i = 0; i < numberOfTds; i++) {
        emptyTds += JST.empty_playoff_cell({});
      }
      return emptyTds;
    }

  });

  return PlayoffPlayerRowView;
});
