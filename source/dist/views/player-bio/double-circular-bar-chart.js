define('views/player-bio/double-circular-bar-chart',['require','jquery','backbone','utils/window-size','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub')
  ;


  var DoubleCircularBarChart = Backbone.View.extend({

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Donut Circular Bar Chart View');
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
      this.parent.chart.css('width', this.parent.chart.width());
      this.drawBackground();  
      if(!this.parent.options.nodata) {
        this.drawPlayer();
        this.drawField();
      }
      this.parent.loading = false;
    },

  
    redraw: function() {
      if(!this.parent.loading) {
        this.bg.replot({resetAxes: true});
        if(!this.parent.options.nodata) {
          this.plot.replot({resetAxes: true});
          this.plot2.replot({resetAxes: true});
        }
      }
    },

    replot: function() {
      if(!this.parent.loading) {
        this.bg.replot({resetAxes: true});
        if(!this.parent.options.nodata) {
          this.plot.series[0].data = [[1,this.parent.options.player],[2,100-this.parent.options.player]];
          this.plot.replot({resetAxes: true});
          this.plot2.series[0].data = [[1,this.parent.options.field],[2,100-this.parent.options.field]];
          this.plot2.replot({resetAxes: true});
        }
      }

    },

    destroy: function() {
      this.bg.destroy();
      if(!this.parent.options.nodata) {
        this.plot.destroy();
        this.plot2.destroy();
      }
      this.parent.chart.empty();
      // this.parent.resizeContainer.off('donut.resize.'+this.parent.triggername);


    },

    drawBackground: function() {
      var thickness = 0.489;
      if(Win.size() !== Win.sizes.global) {
        thickness = 0.641;
        if(this.parent.options.size === 'round') {
          thickness = 0.524;
        }
      }

      // no value, fill donut circle, thicknes: 1
      if(this.parent.options.nodata) {
        thickness = 0.999;
      }

      var opts = $.extend(true, {}, this.parent.options.donutDefaultOptions, {
        seriesDefaults: {
          rendererOptions: {
            seriesColors: ["#DEDEDE","#DEDEDE"],
            thickness: thickness
          }
        }
      });

      var bg = $('<div class="chartbg"></div>');
      this.parent.chart.append(bg);
      bg.jqplot([[9999,1]], opts);

      this.bg = bg.data('jqplot');

    },

    drawPlayer: function() {
      var thickness = 0.235;
      if(Win.size() !== Win.sizes.global) {
        thickness = 0.403;
        if(this.parent.options.size === 'round') {
          thickness = 0.31;
        }
      }
      var opts = $.extend(true, {}, this.parent.options.donutDefaultOptions, {
        seriesDefaults: {
          rendererOptions: {
            seriesColors: ["#58B81E","#DEDEDE"],
            // diameter: 240,
            // innerDiameter: 150,
            thickness: thickness
          }
        }
      });
      // var plot = $.jqplot('chart', [['',this.parent.options.player],['',100-this.parent.options.player]], opts);

      var plot = $('<div class="plot"></div>');
      this.parent.chart.append(plot);
      console.log([this.parent.options.player,100-this.parent.options.player]);
      plot.jqplot([[this.parent.options.player,100-this.parent.options.player]], opts);

      this.plot = plot.data('jqplot');
    },

    drawField: function() {
      
      var thickness = 0.126;
      if(Win.size() !== Win.sizes.global) {
        thickness = 0.106;
        if(this.parent.options.size === 'round') {
          thickness = 0.119;
        }
      }
      var opts = $.extend(true, {}, this.parent.options.donutDefaultOptions, {
        seriesDefaults: {
          rendererOptions: {
            seriesColors: ["#848383","#DEDEDE"],
            // innerDiameter: 110,
            // diameter: 130,
            thickness: thickness
          }
        }
      });
      // var plot2 = $.jqplot('chart2',[['',this.parent.options.field],['',100-this.parent.options.field]], opts);

      var plot2 = $('<div class="plot2"></div>');
      this.parent.chart.append(plot2);
      console.log([this.parent.options.field,100-this.parent.options.field]);
      plot2.jqplot([[this.parent.options.field,100-this.parent.options.field]], opts);

      this.plot2 = plot2.data('jqplot');
    }


  });

  return DoubleCircularBarChart;
})

;
