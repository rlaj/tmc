define('views/player-bio/stats-pie',['require','jquery','backbone','utils/window-size','utils/pubsub','views/player-bio/donut-chart','text!templates/player-bio/stats-pie.html!strip'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      DonutChart = require('views/player-bio/donut-chart'),
      statsPieTemplate = require('text!templates/player-bio/stats-pie.html!strip')
  ;


  var StatsPie = Backbone.View.extend({
    template: _.template(statsPieTemplate),

    defaults: {
      name: null,
      attr: null,
      stats: null,
      description: {
        greens: 'The percentage of times a player reached the green in two or more strokes less than par',
        fairways: 'Fairways hit are calculated for the course\'s fourteen par 4s and 5s',
        sand: 'The percentage of times a player was able to get up and down from a greenside bunker'
      },
      href: {
        greens: 'gir.html',
        fairways: 'fir.html',
        sand: 'sand.html'        
      },
      link_text: {
        greens: 'Greens Hit (All Players)',
        fairways: 'Driving Accuracy (All Players)',
        sand: 'Sand Saves (All Players)'        
      },
      attrIndex: { // fw|green|ss|strokes|dd|drive
        fw: 0,
        gir: 1,
        ss: 2,
        strokes: 3,
        dd: 4,
        longest: 5
      }
    },


    initialize: function(opts) {
      this.chartViews = [];
      this.logger = new eventsCore.util.Logger('Stats Pie View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 
      this.on('stopListeners', this.stopListeners);
    },

    stopListeners: function(){
      this.stopListening(PubSub, 'playerstat:desktop:enter');
      this.stopListening(PubSub, 'playerstat:desktop:exit');
      this.stopListening(PubSub, 'throttle:resize');
      this.disposeCharts();
    },


    startListeners: function() {
      // switch between large text and small text inside round by round donuts
      this.listenTo(PubSub, 'playerstat:desktop:enter', function() {
        this.initDesktop();
        var sel = this.$('.stat_content.selected');
        // assign any drawn or waiting for resize charts to be redrawn
        sel.siblings('[data-stat-drawn$=true]').attr('data-stat-drawn','redraw.enter');
        // since we're now back at desktop size, reset any charts that were waiting to be redrawn at mobile size
        sel.siblings('[data-stat-drawn="redraw.exit"]').attr('data-stat-drawn','true');
      });


      this.listenTo(PubSub, 'playerstat:desktop:exit', function() {
        this.initMobile();
        var sel = this.$('.stat_content.selected');
        // assign any drawn or waiting for resize charts to be redrawn
        sel.siblings('[data-stat-drawn$=true]').attr('data-stat-drawn','redraw.exit');
        // since we're now back at mobile size, reset any charts that were waiting to be redrawn at desktop size
        sel.siblings('[data-stat-drawn="redraw.enter"]').attr('data-stat-drawn','true');
      });


      this.listenTo(PubSub, 'throttle:resize', function() {
        if(this.$el.attr('data-stat-drawn').search('redraw') < 0) {
          this.chartViews.forEach(function(chart) {
            chart.trigger('donut.resize');
          });
        }
        this.$el.siblings('[data-stat-drawn=true]').attr('data-stat-drawn','resize.true');
      });
    },

    render: function(opts) {
      this.startListeners();

      this.$el.html(this.template({
        description: this.options.description[this.options.name],
        href: this.options.href[this.options.name],
        link_text: this.options.link_text[this.options.name]
      })); 

      this.$el.attr('data-stat-drawn','true');

      this.stats = this.options.scoresModel.get('stats');
      this.scores = this.options.scoresModel.get('scores');

      var stat_drawn = this.$el.attr('data-stat-drawn');
      if(stat_drawn.search('redraw') > -1) {
        var data = stat_drawn.split('.');
        if(data[1] === 'enter') {
          this.initDesktop();
        } else if(data[1] === 'exit') {
          this.initMobile();
        }

        this.chartViews.forEach(function(chart) {
          chart.trigger('donut.redraw');
        });

        this.$el.attr('data-stat-drawn','true');
      }
      else {
        var that = this;
        if(this.chartViews.length > 0) {
          this.chartViews.forEach(function(chart) {
            chart.dispose();
          });

          this.chartViews = [];
        } 
        
        this.buildChart('overview', this.stats.overview);
        this.buildChart('round1', this.stats.round1);
        this.buildChart('round2', this.stats.round2);
        this.buildChart('round3', this.stats.round3);
        this.buildChart('round4', this.stats.round4);


        // always show fractional text if viewing sand saves
        if(this.options.name === 'sand' && Win.size() === Win.sizes.global) {
          this.$('.round .text_sm').addClass('visible').siblings('.player').hide();
        }
      }
      return this;
    },

 
    buildChart: function(round, stat, update) {
      var player = ['',''];
      var field = -1;
      if(stat !== 'none') {
        // made | total
        player = stat[this.options.attr].split('|');

        // fw|green|ss|strokes|dd|drive
        field = stat.field.split('|')[this.options.attrIndex[this.options.attr]];
        field = parseFloat(field);
        if(isNaN(field)) {
          field = -1;
        }
      }

      // use -1 to replace empty values, indicating no chances
      for(var i=0; i < 2; i++) {
        if(player[i] === '') {
          player[i] = -1; 
        }
        else { 
          player[i] = parseInt(player[i],10); 
        }
      }

      if(player[1] > 0) {
        player[2] = ((player[0]/player[1])*100);
      } else {
        player[2] = -1;
      }

      var wrapper = this.$('.' + round);
      var stat = wrapper.find('.stat');
      var chart = wrapper.find('.chart').empty('').css('width','');
      var title = wrapper.find('.title');

      stat.find('.player').html(player[2].toFixed()).removeClass('novalue');
      stat.find('.field').html(field.toFixed());

      var text_size = 'text';
      if(Win.size() === Win.sizes.global) {
        text_size = 'text_sm';
      }

      // fill in text options
      if(player[1] > 0) {
        title.removeClass('disabled');
        stat.find('.text, .text_sm').removeClass('visible')
          .siblings('.player, .field').removeClass('showtext').css('display','');
        stat.find('.text_sm').html(player[0]+'/'+player[1]);
        title.find('.value').html(player[0]+'/'+player[1]).removeClass('disabled');
      } else if (player[1] === 0) {
        // this state only possible for sand saves
        title.removeClass('disabled');
        stat.find('.text, .text_sm').removeClass('visible')
          .siblings('.player, .field').removeClass('showtext').css('display','');
        stat.find('.text_sm').html('0/0')
          .end().find('.player').html('--').addClass('novalue');
        title.find('.value').html(player[0]+'/'+player[1]).removeClass('disabled');
      } else {
        field = -1;

        // no chances, find out why
        var text = '--|Not yet Started';
        var playing = this.scores.playing;
        if(playing === 'MC') {
          text = 'MC|Missed Cut';
        } else if(playing === 'WD') {
          text = 'WD|Withdrawn';
        } else if(playing === 'DQ') {
          text = 'DQ|Disqualified';
        }

        text = text.split('|');
        stat.find('.text').html(text[1]);
        stat.find('.text_sm').html(text[0]);

        title.addClass('disabled');

        stat.find('.'+text_size).addClass('visible')
          .siblings().removeClass('visible')
          .end().siblings('.player, .field').addClass('showtext').hide();
      }

      var donutChart = new DonutChart({
        chart: chart,
        player: player[2],
        field: field
      });
      this.chartViews.push(donutChart);
      donutChart.render();
    },

    initDesktop : function() {
      var container = this.$('.round');
      var text_sm = container.find('.text_sm.visible');
      text_sm.removeClass('visible').siblings('.text').addClass('visible');
      if(this.$el.attr('id') === 'tab_sand') {
        // show: text or player
        // hide: text_sm
        container.find('.text').removeClass('visible').siblings('.player').show();
        container.find('.player.showtext').hide().siblings('.text').addClass('visible');
      }
    },

    initMobile : function() {
      var container = this.$('.round');
      var text = container.find('.text.visible');
      text.removeClass('visible').siblings('.text_sm').addClass('visible');
      if(this.$el.attr('id') === 'tab_sand') {
        // show: text_sm
        // hide: text, player
        container.find('.text_sm').addClass('visible');
        container.find('.player').hide().siblings('.text').css('display','');
      }
    
    },

    onDispose: function() {
      this.disposeCharts();
    },

    disposeCharts: function() {
      this.chartViews.forEach(function(chart) {
        chart.dispose();
      });
    }




  });

  return StatsPie;
})

;
