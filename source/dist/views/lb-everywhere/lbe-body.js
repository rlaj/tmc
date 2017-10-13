define('views/lb-everywhere/lbe-body',['require','jquery','utils/browser','utils/metrics','utils/pubsub','views/lb/lb-base','utils/lb/lb-common','views/lb/trad','views/lb/ou','utils/scores'],function(require) {
	var $ = require('jquery'),
		Browser = require('utils/browser'),
		Metrics = require('utils/metrics'),
		PubSub = require('utils/pubsub'),
		LBBase = require('views/lb/lb-base'),
		LBCommon = require('utils/lb/lb-common'),
		TradView = require('views/lb/trad'),
		OUView = require('views/lb/ou'),
		Scores = require('utils/scores')
		;

	var LBBodyView = LBBase.extend({
		el: '.lb-body',

		events: {
		},

		initialize: function(opts) {
			this.logger = new eventsCore.util.Logger('LBBodyView');
			this.logger.info('Initialize');

			this.currentLB = opts.lbtype; // "trad" or "ou"

      		// listener - events fired by lbsubmenu when view selector is clicked
			this.listenTo(PubSub, 'lbEverywhere:showLBView', this.resetCurrentLB);

		},

		onRender: function() {
			this.drawLeaderboard();
			return this;
		},

		onDispose: function() {
			this.tradplayerlist.dispose();
			this.ouplayerlist.dispose();
		},

		drawLeaderboard: function() {
			if(!Scores.isDataLoaded()) {
				PubSub.off('scores:refresh', this.drawLeaderboard, this)
          				.once('scores:refresh', this.drawLeaderboard, this);
				return;
			} else {
				this.buildOULB();
				this.buildTradLB();
				this.showSelectedView(this.currentLB);
			}
		},

		buildTradLB: function() {
			this.tradplayerlist = new TradView({
				el: this.$('#traditional'),
				lbFormat: LBCommon.lbFormat.EVERYWHERE
			}).render();
		},

		buildOULB: function() {
			this.ouplayerlist = new OUView({
        	el: this.$('#overunder'),
        	lbFormat: LBCommon.lbFormat.EVERYWHERE
      		}).render();
		},

    	// view selector changed - listener currenLB:update
    	// reset this.currentLB to be updated value
		resetCurrentLB: function(newLB) {
			this.currentLB = newLB;
			this.showSelectedView(this.currentLB);

      		// when LB view is switched b/w OU and Trad,
      		// redraw the bottom border
			var container = newLB + 'AllPlayersContainer';
			this.addBottomBorders(container);
			PubSub.trigger('lookup.unveil');
		},

    	//override lb-base
		showSelectedView: function(currentLB) {
     		 // get scroll position before hiding previously selected view
			var wrapper = this.$('.content.selected');
			if(wrapper.length > 0) {
        		var scrollVal = wrapper.find('.scroll-pane').scrollTop();
				wrapper.removeClass('selected');
			}

      		// display currently selected view and set scroll position
			wrapper = this.$('.content.' + this.currentLB);
			wrapper.addClass('selected');
      		wrapper.find('.scroll-pane').scrollTop(scrollVal);

		}    

	});
	return LBBodyView;
});
