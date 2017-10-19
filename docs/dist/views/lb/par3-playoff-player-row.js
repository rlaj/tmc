define('views/lb/par3-playoff-player-row',['require','jquery','underscore','backbone','text!templates/lb/par3-playoff-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      par3PlayoffPlayerRowTemplate = require('text!templates/lb/par3-playoff-player-row.html!strip')
      ;

  var JST = {};
  JST.playoff_score_cell = _.template('<td class="hole_no"><div class="<%= klass %>"><%= score %></div></td>');
  JST.empty_playoff_cell = _.template('<td class="hole_no">&nbsp;</td>');

  var Par3PlayoffPlayerRowView = Backbone.View.extend({
    tagName: 'tr',

    main_template: _.template(par3PlayoffPlayerRowTemplate),

    events: {
      // 'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3PlayoffPlayerRowView');
      this.logger.info('Initialize');

      this.options = opts;
      this.playoff_holes = this.options.playoff_holes;
      this.progress = this.options.progress;

      this.listenTo(this.model, 'change:score', this.render);
    },

    render: function() {
      this.assignAttributes();
      this.$el.html(this.buildPlayerRow());

      return this;
    },

    assignAttributes: function() {
      this.$el.attr({
        'class': 'player',
        'data-id': this.model.get('id')
      });
    },

    buildPlayerRow: function() {
      var scorecard;
      var scoreData = this.model.get('score').split(',');
      // if(Browser.ie8) {
      //   klass = (i % 2 === 1 ? 'odd' : '');
      // }

      scorecard = this.prepareScorecard(scoreData);

      return this.main_template({
        player: this.model.attributes,
        sorecards: scorecard,
        empty_cells: this.getEmptyTDs(scoreData.length)
      });
    },

    prepareScorecard: function(scoredata) {
      var scorecard;
      var scoreData = scoredata;

      for(var i = 0, l = scoreData.length; i < l; i++) {
        scorecard += JST.playoff_score_cell({
          player: this.model.attributes,
          klass: this.getClassForPlayoffScore(scoreData[i]),
          score: scoreData[i]
        });
      }
      return scorecard;
    },

    getClassForPlayoffScore: function(score) {
      var scoreClass = '';
      score = parseInt(score, 10);

      // par for playoff hole is always 3
      if(score <= 1) {
        scoreClass = 'eagle';
      } else if(score === 2) {
        scoreClass = 'birdie';
      } else if(score === 3) {
        scoreClass = 'par';
      } else if(score === 4) {
        scoreClass = 'bogey';
      } else if(score >= 5) {
        scoreClass = 'dbl_bogey';
      }
      return scoreClass;
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

  return Par3PlayoffPlayerRowView;
});
