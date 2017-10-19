define('views/whats-new',['require','backbone','underscore','utils/browser','utils/metrics','utils/pubsub','text!templates/whats-new.html!strip'],function(require) {
	var Backbone = require('backbone'),
		_ = require('underscore'),
		Browser = require('utils/browser'),
		Metrics = require('utils/metrics'),
		PubSub = require('utils/pubsub'),
		whatsNewTemplate = require('text!templates/whats-new.html!strip')
		;


	var WhatsNewView = Backbone.View.extend({
		className: 'whats-new-panel',

		template: _.template(whatsNewTemplate),

		defaults: {
			id: null,
			message: '',
			arrow_direction: ''
		},

		events: {
			'click .close': 'close'
		},

		initialize: function(opts) {
			this.options = _.extend({}, this.defaults, opts);
			this.listenTo(PubSub, 'whats-new:' + this.id + ':reposition', this.reposition);
		},

		render: function() {
			this.$el.html(this.template({
				message: this.options.message,
				arrow_direction: this.options.arrowDirection
			}));
			return this;
		},


		close: function(e) {
			e.preventDefault();
			this.trigger('close', this.id);
			var prefix = Metrics.page_section;
			if(Metrics.page_title !== '' && Metrics.page_title !== Metrics.page_section) {
				prefix += ':' + Metrics.page_title;
			}
			if(!Browser.app) {
				Metrics.measureApp(prefix, 'What\'s New', 'Close', this.id);
			} else {
				Metrics.appMeasure([prefix, 'What\'s New', 'Close', this.id].join(':'));
			}
		},

		// Set custom position. Default position should be set in the scss file.
		reposition: function(position) {
			if(position) {
				this.$el.css(position);
			}
		},

	});

	return WhatsNewView;
});


