define('views/lb/par3-closest-player-row',['require','jquery','underscore','backbone','utils/lb/lb-common','utils/pubsub','text!templates/lb/par3-closest-player-row.html!strip'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      closestPlayerRowTemplate = require('text!templates/lb/par3-closest-player-row.html!strip')
      ; 

  var JST = {};
  // klass, score
  JST.score_cell = _.template(
    '<div class="data <%= klass %>"><%= score %></div>'
  );

  var Par3ClosestPlayerRowView = Backbone.View.extend({
    tagName: 'div',

    main_template: _.template(closestPlayerRowTemplate),

    events: {
      // 'click .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Par3ClosestPlayerRowView');
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
      var formattedDistance = parseInt(this.model.get('distance'), 10) + '';
      var splitNum = formattedDistance.split('');

      if(isNaN(formattedDistance)) {
        // if the distance is blank, display blank
        splitNum[1] = '&nbsp;';
        splitNum[0] = '&nbsp;';
      } else {
        if(splitNum[1] === undefined) {
          // one digit only
          splitNum[1] = splitNum[0];
          splitNum[0] = '&nbsp;';
        }
      }

      return this.main_template({
        player: this.model.attributes,
        is_hoverable: (this.model.attributes.id !== '') ? true : false,
        secondDigit: splitNum[1],
        firstDigit: splitNum[0]
      });
    }

  });

  return Par3ClosestPlayerRowView;
});
