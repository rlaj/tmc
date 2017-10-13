define('views/lb/par3-all-player-row',['require','jquery','underscore','backbone','utils/lb/lb-common','utils/pubsub','text!templates/lb/par3-all-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      playerRowTemplate = require('text!templates/lb/par3-all-player-row.html!strip')
      ; 

  var JST = {};
  // klass, score
  JST.score_cell = _.template(
    '<div class="data <%= klass %>"><%= score %></div>'
  );

  var Par3PlayerRowView = Backbone.View.extend({
    tagName: 'div',

    main_template: _.template(playerRowTemplate),

    events: {
      // 'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3PlayerRowView');
      this.logger.info('Initialize');

      this.options = opts;

      this.listenTo(this.model, 'change:show', function(model, show) {
        LBCommon.togglePlayerRowDisplay(this.$el, show);
      });
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

      return this.main_template({
        player: this.model.attributes,
        is_hoverable: (this.model.attributes.id !== '') ? true : false,
        par_ouclass: par_ouclass
      });
    }

  });

  return Par3PlayerRowView;
});
