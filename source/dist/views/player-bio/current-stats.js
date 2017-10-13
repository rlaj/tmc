define('views/player-bio/current-stats',['require','backbone','underscore','utils/scores'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      ScoresUtil = require('utils/scores')
  ;

  var JST = {};

  JST.current_stats = _.template(
    '<div id="currentInfo" class="current_stats visible">' +
      '<div class="section"><div class="header">Position</div><div class="value"><%= position %></div></div>' +
      '<div class="section"><div class="header">Today</div><div class="value <%= klass.today %>"><%= today %></div></div>' +
      '<div class="section"><div class="header">Thru</div><div class="value"><%= thru %></div></div>' +
      '<div class="section"><div class="header">Total</div><div class="value <%= klass.total %>"><%= total %></div></div>' +
    '</div>'
  );

  var CurrentStatsView = Backbone.View.extend({
    el: '.currentStatsSection',

    defaults: {
      autosync: true
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Current Stats View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts);

      if(this.options.autosync) {
        this.listenTo(this.model, 'sync', this.render);
      }
    },

    render: function() {
      this.scores = this.model.get('scores');
      var playingText = '&nbsp;';
      var today;
      var showAsterisk;
      var position = this.scores.position === '' ? '&nbsp;' : this.scores.position;
      var today = this.scores.today === '' ? '&nbsp;' : this.scores.today;
      var total = this.scores.total === '' ? '&nbsp;' : this.scores.total;

      var playingStr = this.scores.playing;
      if(playingStr === 'F') {
        playingText = 'F';
      } else if (playingStr.indexOf(':') !== -1) {
        today = this.scores.playing;
      } else {
        playingText = this.scores.playing;
        if(playingStr.indexOf('*') !== -1) {
          showAsterisk = true;
        }
      }

      var todayKlass = ScoresUtil.Utilities.className(today);
      var totalKlass = ScoresUtil.Utilities.className(total);

      this.$el.html(JST.current_stats({
        position: position,
        today: today,
        thru: playingText,
        total: this.scores.total,
        klass: { 'today': todayKlass, 'total': totalKlass }
      }));

      return this;
    }


  });

  return CurrentStatsView;
})

;
