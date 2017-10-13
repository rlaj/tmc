define('views/player-bio/small-donut-chart',['require','jquery','backbone','utils/window-size','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub')
  ;


  var SmallDonutChart = Backbone.View.extend({

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Small Donut Chart View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 

      this.parent = this.options.parent;

    },


    render: function() {
      this.draw();
    },


    draw: function() {
      this.parent.loading = true;
      // set fixed dimensions so we don't go off-center during a resize event
      this.parent.$el.css('width', this.parent.$el.width());

      this.drawPlayer();

      this.parent.loading = false;
    },

  
    redraw: function() {
      if(!this.parent.loading) {
        this.plot.replot({resetAxes: true});
      }
    },

    replot: function() {
      if(!this.parent.loading) {
        this.plot.series[0].data = [[1,this.parent.options.player],[2,100-this.parent.options.player]];
        this.plot.replot({resetAxes: true});
      }
    },

    destroy: function() {
      this.plot.destroy();
      this.parent.$el.empty();
    },

    drawPlayer: function() {
      var opts = $.extend(true, {}, this.parent.options.donutDefaultOptions, {
        seriesDefaults: {
          rendererOptions: {
            seriesColors: ["#58B81E","#DEDEDE"],
            thickness: 0.324
          }
        }
      });

      // no value, fill donut circle, thickness: 1
      if(this.parent.options.player === -1) {
        opts.seriesDefaults.rendererOptions.thickness = 0.999;
      }

      var plot = $('<div class="plot"></div>');
      
      this.parent.chart.append(plot);
      console.log([this.parent.options.player,100-this.parent.options.player]);
      plot.jqplot([[this.parent.options.player,100-this.parent.options.player]], opts);
      
      this.plot = plot.data('jqplot');
    },


  });

  return SmallDonutChart;
})

;
