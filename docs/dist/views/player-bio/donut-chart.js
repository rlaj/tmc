define('views/player-bio/donut-chart',['require','jquery','backbone','utils/window-size','utils/pubsub','views/player-bio/double-circular-bar-chart','views/player-bio/small-donut-chart','jqplot.donutRenderer'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      DoubleCircularBarChart = require('views/player-bio/double-circular-bar-chart'),
      SmallDonutChart = require('views/player-bio/small-donut-chart')
  ;

  require('jqplot.donutRenderer');

  var DonutChart = Backbone.View.extend({

    defaults: {
      loading: false,
      player: '',
      field: '',
      size: 'overview',
      nodata: false,
      largeDonut: null,
      smallDonut: null,
      donutDefaultOptions: {
          title: {text: false},
          legend: { show: false },
          highlighter: {show: false},
          seriesDefaults: {
            renderer: null,
            rendererOptions: {
              // seriesColors: dataColors,
              padding: 0,
              // thickness: 0.70,
              startAngle: -90,
              shadow: false,
              highlightMouseOver: false
            }
          },
          grid: {
            drawGridLines: false,
            drawBorder: false,
            shadow: false,
            background: 'rgba(0,0,0,0)'
          },
          gridPadding: {
            top: 0, left: 0, right: 0, bottom: 0
          }
        }      
    },


    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Donut Chart View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts); 
      this.chart = this.options.chart;
      this.loading = false;
      this.wrapper = this.chart.parent().parent();
      this.resizeContainer = this.chart.closest('.stat_content');
      this.triggername = 'stat' + this.wrapper.data('round');

      this.options.nodata = false;
      if(this.options.player === -1 && this.options.field === -1) {
        this.options.nodata = true;
      }

      this.options.donutDefaultOptions.seriesDefaults.renderer = $.jqplot.DonutRenderer;

      if(this.wrapper.hasClass('round')) {
        this.options.size = 'round';
      }

      this.listenTo(PubSub, 'playerstat:desktop:enter', function() {
        this.initDesktop();
      });

      this.listenTo(PubSub, 'playerstat:desktop:exit', function() {
        this.initMobile();
      });

      this.on('donut.redraw', function() {
        this.chart.css('width', this.chart.parent().width());
        if(Win.size() === Win.sizes.global) {
          this.initMobile();
        } else {
          that.initDesktop();
        }
      });
    },


    render: function() {
      this.draw();
    },

    draw: function() {
      if(this.options.size === 'overview') {
        // always use doubleCircularBarChart
        this.largeDonut = new DoubleCircularBarChart({
          parent: this
        });
        this.largeDonut.render();
      } else {
        // choose between double and small based on windowSize
        

        this.smallDonut = new SmallDonutChart({
          parent: this
        });
        this.largeDonut = new DoubleCircularBarChart({
          parent: this
        });

        if(Win.size() === Win.sizes.global) {
          this.smallDonut.draw();
        } else {
          this.largeDonut.render();
        }
      }
      this.attachResize();
    },

    // replot: function(player, field) {
    //   // these are values out of 100
    //   this.player = player || "";
    //   this.field = field || "";

    //   this.nodata = false;
    //   if(this.player === -1 && field === -1) {
    //     this.nodata = true;
    //   }

    //   if(this.options.size === 'overview') {
    //     // always use doubleCircularBarChart
    //     this.largeDonut.replot();
    //   } else {
    //     // choose between double and small based on windowSize
    //     if(Win.size() === Win.sizes.global) {
          
    //       this.smallDonut.replot();
    //     } else {
    //       this.largeDonut.replot();
    //     }
    //   }
    //   this.attachResize();
    // },

    attachResize: function() {
      console.log('finished loading global donut '+this.resizeContainer.attr('id') + '.' + this.triggername);
      var that = this;
      this.on('donut.resize', function() {
        this.resize();
      });
    },

    resize: function() {
      console.log('resizing global donut '+this.resizeContainer.attr('id') + '.' + this.triggername);
      this.chart.css('width', this.chart.parent().width());
      if(this.options.size === 'overview') {
        // always use doubleCircularBarChart
        this.largeDonut.redraw();
      } else {
        // choose between double and small based on windowSize
        if(Win.size() === Win.sizes.global) {
          this.smallDonut.redraw();
        } else {
          this.largeDonut.redraw();
        }
      }
    },

    initDesktop: function() {
      if(this.options.size === 'round') {
        this.smallDonut.destroy();
        this.largeDonut.draw();
      } else {
        this.largeDonut.destroy();
        this.largeDonut.draw();
      }
    },

    initMobile: function() {
      if(this.options.size === 'round') {
        this.largeDonut.destroy();
        this.smallDonut.draw();
      } else {
        this.largeDonut.destroy();
        this.largeDonut.draw();
      }
    },
    onDispose: function() {
      this.largeDonut && this.largeDonut.dispose();
      this.smallDonut && this.smallDonut.dispose();
      this.stopListening('donut.resize');
      this.stopListening('donut.redraw');
    }


  });

  return DonutChart;
})

;
