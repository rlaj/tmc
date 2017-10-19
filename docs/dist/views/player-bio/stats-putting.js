define('views/player-bio/stats-putting',['require','jquery','backbone','utils/window-size','utils/pubsub','text!templates/player-bio/stats-putting.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      statsPuttingTemplate = require('text!templates/player-bio/stats-putting.html!strip')
  ;

  var StatsPutting = Backbone.View.extend({
    el: '#tab_putting',

    template: _.template(statsPuttingTemplate),

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Stats Putting View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 

      this.$el.html(this.template()); //only load the template once

      this.$('.legend .name').html(this.options.bioModel.get('firstname') +' '+ this.options.bioModel.get('lastname'));

    },

    render: function() {
      // parse overview
      this.stats = this.options.scoresModel.get('stats');
      this.scores = this.options.scoresModel.get('scores');

      var overview = this.stats.overview;
      var player = overview.strokes.split('|');
      // only has putting average currently, needs 3 putt total
      var field = overview.field.split('|');

      var field_avg = field[3];
      var field_three = field[4];

      this.$('.player .overview').html(player[0] + '<span>'+player[1]+'</span>');
      this.$('.field .overview').html(field_avg + '<span>' + field_three +'</span>');

      // parse each round
      this.parseRound('round1',this.stats.round1);
      this.parseRound('round2',this.stats.round2);
      this.parseRound('round3',this.stats.round3);
      this.parseRound('round4',this.stats.round4);

      return this;
    },


    parseRound : function(round, stat) {
      var p_wrapper = this.$('.player .'+round);
      var f_wrapper = this.$('.field .'+round);

      if(stat !== 'none') {
        if(stat.strokes === '') {
          stat.strokes = '|';
        }
        var field_ary = stat.field.split('|');
        var field = [field_ary[3],field_ary[4]];

        // use 2.2 strokes as top end of avg strokes/putt
        var max_strokes = 2.2;
        var player = stat.strokes.split('|');
        var text = 'Not Yet Started';
        if(player[0] !== "") {
          p_wrapper.removeClass('disabled');
          player[2] = (player[0]/max_strokes)*100;
          if(player[2] > 100) {
            player[2] = 100;
          }
          p_wrapper.find('.bar').css('width',player[2] + '%');
          p_wrapper.find('.value').html(player[0] + ' ('+player[1]+')');
        } else {
          p_wrapper.addClass('disabled');
          p_wrapper.find('.text').html(text);
          p_wrapper.find('.bar').css('width',0);
        }

        if(field[0] !== "") {
          f_wrapper.removeClass('disabled');
          field[2] = (field[0]/max_strokes)*100;
          if(field[2] > 100) {
            field[2] = 100;
          }
          f_wrapper.find('.bar').css('width',field[2] + '%');
          f_wrapper.find('.value').html(field[0] + ' ('+field[1]+')');
        } else {
          f_wrapper.addClass('disabled');
          f_wrapper.find('.text').html(text);
          f_wrapper.find('.bar').css('width',0);
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

        p_wrapper.addClass('disabled');
        p_wrapper.find('.text').html(text);
        p_wrapper.find('.bar').css('width',0);

        // TODO: what to do about field here? no data is provided
        f_wrapper.addClass('disabled');
        f_wrapper.find('.text').html('Not Available');
        f_wrapper.find('.bar').css('width',0);
      }
    },

  });

  return StatsPutting;
})

;
