define('views/player-bio/stats-summary',['require','jquery','underscore','backbone','utils/window-size','utils/pubsub','text!templates/player-bio/stats-summary.html!strip','jqplot.donutRenderer'],function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		Backbone = require('backbone'),
		Win = require('utils/window-size'),
		PubSub = require('utils/pubsub'),
		statsSummaryTemplate = require('text!templates/player-bio/stats-summary.html!strip')
		;
	require('jqplot.donutRenderer');

	var StatsSummary = Backbone.View.extend({
		el: '#tab_summary',

		template: _.template(statsSummaryTemplate),

		defaults: {
			chart_options : {
				title: {text: false},
				legend: { show: false },
				highlighter: {show: false},
				seriesDefaults: {
					renderer: null,
					rendererOptions: {
						seriesColors: ['#FFF000','#37B81E','#AFAEAE','#7A7A7A','#3E3E3E'],
						padding: 0,
						thickness: 0.59,
						startAngle: -90,
						shadow: false,
						highlightMouseOver: false
					}
				},
				grid: {
					drawGridLines: false,
					drawBorder: false,
					shadow: false,
					backgroundColor: 'rgba(0,0,0,0)'
				},
				gridPadding: {
					top: 0, left: 0, right: 0, bottom: 0
				}
			}
		},

		initialize: function(opts) {
			this.logger = new eventsCore.util.Logger('Stats Summary View');
			this.logger.info('initialize');
			this.options = _.extend({}, this.defaults, opts); 
      
			this.options.chart_options.seriesDefaults.renderer = $.jqplot.DonutRenderer;

			this.listenTo(PubSub, 'playerstat:desktop:enter', function() {
				this.setResize();
			});

			this.listenTo(PubSub, 'playerstat:desktop:exit', function() {
				this.unsetResize();
				this.redraw();
			});

			if(Win.size() !== Win.sizes.global) {
				this.setResize();
			} 

      		//For convenience
			String.prototype.toInt = function() {
				return parseInt(this,10) || 0;
			};
		},

		render: function() {
			var overview = this.model.get('stats').overview;

			this.overview = {
				eagle : overview.eagle.toInt(),
				birdie : overview.birdie.toInt(),
				par : overview.par.toInt(),
				bogey : overview.bogey.toInt(),
				double : overview.double.toInt(),
				other : overview.other.toInt()
			};

      		// fill in labels
			this.total = this.overview.eagle + this.overview.birdie + this.overview.par + this.overview.bogey + this.overview.double + this.overview.other;

			this.$el.html(this.template({
				eagle: this.overview.eagle,
				eaglePct: this.getPercent(this.overview.eagle),
				birdie: this.overview.birdie,
				birdiePct: this.getPercent(this.overview.birdie),
				par: this.overview.par,
				parPct: this.getPercent(this.overview.par),
				bogey: this.overview.bogey,
				bogeyPct: this.getPercent(this.overview.bogey),
				double: this.overview.double,
				doublePct: this.getPercent(this.overview.double),
				other: this.overview.other,
				otherPct: this.getPercent(this.overview.other)
			}));

			this.plot();
		},

		getPercent: function(value) {
			return (value / this.total * 100).toFixed();
		},

		setResize : function() {
			this.listenTo(PubSub, 'throttle:resize', function() {
				this.redraw();
			});
		},

		unsetResize : function() {
			this.stopListening(PubSub, 'throttle:resize');
		},

		redraw : function() {
			if(this.chart) {
				this.plot();
			}
		},

		plot : function() {
			var chartId = 'sumChart';
			this.$('#' + chartId).empty();
			var data = [['',this.overview.eagle], ['',this.overview.birdie], ['',this.overview.par], ['',this.overview.bogey], ['',this.overview.double]];
			this.chart = $.jqplot(chartId, [data], this.options.chart_options);
		},

		onDispose: function() {
			delete String.prototype.toInt;
		}

	});

	return StatsSummary;
});


