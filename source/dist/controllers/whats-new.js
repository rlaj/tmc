define('controllers/whats-new',['require','jquery','underscore','baseview','views/whats-new','utils/pubsub'],function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		BaseView = require('baseview'),
		WhatsNewView = require('views/whats-new'),
		PubSub = require('utils/pubsub')
		;

	var CONTENTS = {
		'floatVideo': {
			message: 'The Picture in Picture view can be resized and relocated.',
			arrowDirection: 'right'
		},
		'heroVideo': {
			message: 'Video can follow you<br/>anywhere on Masters.com',
			arrowDirection: 'down'
		},
		'shotList': {
			message: 'The shot list is expandable, with video highlights marked with this icon <img src="/images/misc/play-icon.png" border="0" width="15px"/>',
			arrowDirection: 'down'			
		},
		'shotListHighlight': {
			message: 'Select the &nbsp; <img src="/images/misc/play-icon-highlight.png" border="0" width="20px"/> &nbsp; icon in the shot list to view a highlight'
		},
		'greenDetailView': {
			message: 'The green can be selected for a detail view'
		}
	};

	var WhatsNew = BaseView.extend({
		el: '#whatsNew',

		defaults: {
			cookieName: 'whatsNewClosed',
			cookiePath: '/en_US/',
			cookieExpires: 10,
		},

		initialize: function(opts) {
			this.logger = new eventsCore.util.Logger('What\'s New');
			this.options = _.extend({}, this.defaults, opts);

			this.viewsMap = {}; //storage for existing what's new views

			this.listenTo(PubSub, 'whats-new:show', this.show);
			this.listenTo(PubSub, 'whats-new:hide', this.hide);
			this.listenTo(PubSub, 'whats-new:close', this.close);
		},

		render: function() {
			return this;
		},

		show: function(id) {
			var content = CONTENTS[id];
			if(content && !this.isClosed(id)) {
				var view = this.viewsMap[id];
				if(!view) {
					view = new WhatsNewView({
						id: id,
						message: content.message,
						arrowDirection: content.arrowDirection,
					}).render();
					this.viewsMap[id] = view;
					this.listenTo(view, 'close', this.close);
					this.$el.append(view.el);
				} else {
					view.$el.show();
				}

			}
		},

		hide: function(id) {
			this.viewsMap[id] && this.viewsMap[id].$el.hide();
		},

		close: function(id) {
			var view = this.viewsMap[id];
			if(view) {
				view.dispose();
				delete this.viewsMap[id];
				this.saveClosed(id);
			}
		},

		// Remember closed messages by storing their ids in the cookie
		saveClosed: function(id) {
			var obj = this.getClosed();
			obj[id] = true;
			$.cookie(this.options.cookieName, JSON.stringify(obj), { expires: this.options.cookieExpires, path: this.options.cookiePath });
		},

		isClosed: function(id) {
			return this.getClosed()[id] || false;
		},

		//Returns an object {id1: true, id2: true} containing the ids of all closed messages
		getClosed: function() {
			var jsonStr = $.cookie(this.options.cookieName);
			return (jsonStr ? $.parseJSON(jsonStr) : {});
		},

		onDispose: function() {
			for (var key in this.viewsMap) {
				if(this.viewsMap.hasOwnProperty(key)) {
					this.viewsMap[key].dispose();
				}
			}
		}

	});

	return WhatsNew;
});

