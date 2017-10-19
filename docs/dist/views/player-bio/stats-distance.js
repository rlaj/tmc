define('views/player-bio/stats-distance',['require','jquery','backbone','utils/window-size','utils/pubsub','text!templates/player-bio/stats-distance.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      statsDistanceTemplate = require('text!templates/player-bio/stats-distance.html!strip')
  ;

  var StatsDistance = Backbone.View.extend({
    el: '#tab_distance',

    template: _.template(statsDistanceTemplate),

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Stats Distance View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 
      this.$el.html(this.template()); //only load the template once
      this.$('.legend .name').html(this.options.bioModel.get('firstname') + ' ' + this.options.bioModel.get('lastname'));
    },


    render: function() {
      this.stats = this.options.scoresModel.get('stats');
      this.scores = this.options.scoresModel.get('scores');
      this.parseRound('round1',this.stats.round1);
      this.parseRound('round2',this.stats.round2);
      this.parseRound('round3',this.stats.round3);
      this.parseRound('round4',this.stats.round4);
      return this;
    },

    parseRound : function(round, stat) {
      var wrapper = this.$('.'+round);
      if(stat !== 'none') {
        // fw|green|ss|strokes|3putts|dd|drive
        var field = stat.field.split('|')[5];
        field = parseFloat(field);
        if(isNaN(field)) {
          // not sure if this case is necessary
          field = -1;
        }
        if(stat.dd === "") { stat.dd = -1; }

        if(stat.dd < 0) {
          stat.dd = -1;
          wrapper.addClass('disabled');
          wrapper.find('.text').html('Not Yet Started');
          wrapper.find('.player, .field').find('.bar').css('width',0);
        } else {
          wrapper.removeClass('disabled');
          // create bar chart based on 100 - 350 yd range
          var p_width = (stat.dd > 0) ? ((stat.dd - 100)/250)*100 : 1;
          wrapper.find('.player .value').html((stat.dd*1).toFixed());
          wrapper.find('.player .bar').css('width', p_width + '%');

          if(field > 0) {
            var f_width = ((field - 100)/250)*100;
            wrapper.find('.field .value').html(field.toFixed());
            wrapper.find('.field .bar').css('width', f_width + '%');
          }
        }
      } else {
        var text = 'Not Yet Started';
        var playing = this.scores.playing;
        if(playing === 'MC') {
          text = 'Missed Cut';
        } else if(playing === 'WD') {
          text = 'Withdrawn';
        } else if(playing === 'DQ') {
          text = 'Disqualified';
        }

        wrapper.addClass('disabled');
        wrapper.find('.text').html(text);
        wrapper.find('.player, .field').find('.bar').css('width',0);

      }
    },
  });

  return StatsDistance;
})

;
