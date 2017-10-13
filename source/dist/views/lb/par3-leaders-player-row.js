define('views/lb/par3-leaders-player-row',['require','jquery','underscore','backbone','text!templates/lb/par3-leaders-player-row.html!strip','text!templates/lb/trad-edge-status-cell.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      playerRowTemplate = require('text!templates/lb/par3-leaders-player-row.html!strip'),
      tradEdgeStatusCellTemplate = require('text!templates/lb/trad-edge-status-cell.html!strip')
      ;

  var JST = {};
  // klass, score
  JST.score_cell = _.template(
    '<div class="data <%= klass %>"><%= score %></div>'
  );

  var Par3PlayerRowView = Backbone.View.extend({
    tagName: 'div',

    main_template: _.template(playerRowTemplate),
    edge_status_cell_template: _.template(tradEdgeStatusCellTemplate),

    events: {
      // 'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3PlayerRowView');
      this.logger.info('Initialize');

      this.options = opts;
    },

    render: function() {
      this.assignAttributes();
      this.$el.html(this.buildPlayerRow());

      return this;
    },

    // TODO - same as Trad - move to central place - or create base player-row view maybe?
    assignAttributes: function() {
      var rowId = '';
      if(this.model.get('id') !== '') {
        rowId = this.options.prefix + this.model.get('id');
      }
      this.$el.attr({
        'class': 'playerRow ' + this.options.klass,
        'id': rowId
      });
    },

    buildPlayerRow: function() {
      var score = this.model.attributes.today;
      var par_ouclass = '';
      if(parseInt(score) >= 0 || score === 'E') {
        par_ouclass = 'over';
      } else if(parseInt(score) < 0) {
        par_ouclass = 'under';
      }

      var formattedScore = score.substring(1);
      if(score === 'E') {
        formattedScore = 'E';
      }

      var splitNum = formattedScore.split('');
      if(splitNum[1] === undefined) {
        // one digit only
        splitNum[1] = splitNum[0];
        splitNum[0] = '&nbsp;';
      }

      return this.main_template({
        player: this.model.attributes,
        is_hoverable: (this.model.attributes.id !== '') ? true : false,
        par_ouclass: par_ouclass,
        secondDigit: splitNum[1],
        firstDigit: splitNum[0]
      });
    }

  });

  return Par3PlayerRowView;
});
