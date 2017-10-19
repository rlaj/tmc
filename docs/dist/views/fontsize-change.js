define('views/fontsize-change',['require','jquery','backbone','utils/browser','utils/metrics','jquery.cookie'],function(require) {
	var $ = require('jquery'),
		Backbone = require('backbone'),
		Browser = require('utils/browser'),
		Metrics = require('utils/metrics')
	;

	require('jquery.cookie');

	var FontSize = Backbone.View.extend({
		el : '.fontSizeChange',

		events: {
			'click #normal': 'getNormal',
			'click #larger': 'getLarger',
			'click #largest': 'getLargest'
		},

		defaults: {
			_default: 'normal'
		},

		size: 'normal',

		initialize: function(opts){
			if(opts){
				this.article_text = opts.article_text;
			}
			var cookieVal = $.cookie('masFontSize');
			if(cookieVal !== null && cookieVal !== 'normal'){
		      if(cookieVal === 'larger'){
		        this.getLarger(true);
		      }else if(cookieVal === 'largest'){
		        this.getLargest(true);
		      }
		    } else if (cookieVal === null) {
		      switch(this._default) {
		        case 'larger': this.getLarger(true); break;
		        case 'largest': this.getLargest(true); break;
		        default: break;
		      }
		    }
		},

		render: function() {},

		getLarger: function(init){
			this.getSize('larger', init);
		},

		getLargest: function(init){
			this.getSize('largest', init);
		},

		getNormal: function(){
			this.getSize('normal');
		},

		getSize: function(sz, init) {
			if(this.size !== sz) {
		      var article_text = this.article_text;
		      if(article_text !== undefined) {
		        article_text.removeClass('larger largest').addClass(sz);
		      }
		      this.$('#'+sz).addClass('selected').siblings().removeClass('selected');
		      $.cookie('masFontSize', sz, { path: "/", expires: 100 } );
		      this.size = sz;
		      if(init !== true) {
		        if(!Browser.app) {
		          Metrics.measureApp('Articles','Article','font'+sz);
		        } else {
		          Metrics.appMeasure('News:Articles:font' + sz);
		        }
		      }
		    }
		},

		changeableContent: function(){
		    if(article_text){ return article_text;}
		      else { return null; }
		  }

	});

	return FontSize;

});
