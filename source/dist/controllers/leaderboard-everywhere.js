define('controllers/leaderboard-everywhere',['require','jquery','underscore','backbone','baseview','utils/browser','utils/metrics','utils/lb/lb-common','views/lb-everywhere/lbe-body','utils/pubsub','collections/score-players','utils/scores','views/players-search','utils/window-size','jquery.ui','jquery.ui.touch-punch','jquery.jscrollpane','jquery.mousewheel'],function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		Backbone = require('backbone'),
		BaseView = require('baseview'),
		Browser = require('utils/browser'),
		Metrics = require('utils/metrics'),
		LBCommon = require('utils/lb/lb-common'),
		LBEBodyView = require('views/lb-everywhere/lbe-body'),
		PubSub = require('utils/pubsub'),
		ScorePlayers = require('collections/score-players'),
		Scores = require('utils/scores'),
		PlayersSearchView = require('views/players-search'),
		Win = require('utils/window-size')
		;

	require('jquery.ui');
	require('jquery.ui.touch-punch');
	require('jquery.jscrollpane');
	require('jquery.mousewheel');


	//jQuery Resizable only includes content width. We need to make sure that
	//absolute width/height includes padding and content widths (no borders)
	var ABSOLUTE_MINIMUM_WIDTH = 347;
	var ABSOLUTE_MAXIMUM_WIDTH = 1178;
	var HORIZONTAL_PADDING = 12; //left and right padding between lb everywhere panel and lb scores table

	var ABSOLUTE_MINIMUM_HEIGHT = 340;
	var ABSOLUTE_MAXIMUM_HEIGHT = 596;
	var VERTICAL_PADDING = 15; //top and bottom padding between lb everywhere panel and lb scores table

	var TOP_MENUBAR_HEIGHT = 50; //used as a marker for the panel's top boundary


	// i.e. lb_col_4 <= 286, 287 >= lb_col_5 <= 346
	var BREAKPOINTS = {
		'lb_col_4': 286,
		'lb_col_5': 346,
		'lb_col_7': 567,
		'lb_col_all': ABSOLUTE_MAXIMUM_WIDTH,
		'lb_size_small': 800, //only applies when showing all columns for trad and ou (lb_col_all)
		'lb_size_large': ABSOLUTE_MAXIMUM_WIDTH
	};

	var LeaderboardEverywhere = BaseView.extend({
		el: '#leaderboard_everywhere',

		defaults: {
			minHeight: ABSOLUTE_MINIMUM_HEIGHT - VERTICAL_PADDING,
			minWidth: ABSOLUTE_MINIMUM_WIDTH - HORIZONTAL_PADDING,  //temporarily* set min width to the one that display 5 cols
			maxHeight: ABSOLUTE_MAXIMUM_HEIGHT - VERTICAL_PADDING,
			maxWidth: ABSOLUTE_MAXIMUM_WIDTH - HORIZONTAL_PADDING,
			defaultView: LBCommon._lbTypeLookUp.trad, // "trad" or "ou"
			playoffStatusUrl: '/en_US/xml/gen/scores/playoffText.json',
			playoffStatusRefreshDelay: 30000 //30 secs
		},

		events: {
			'click .closePanel': 'closePanelBroadcast',
			'click .lbe-menu-link': 'clickLBMenuLink',

			//player search on desktop & tablet layouts
			'click .lb-footer .lbe_player_search.collapsed': 'expandPlayerSearchField',
			'blur .lb-footer .lbe_player_search': 'collapsePlayerSearchField',

			//player search on mobile layout
			'click .lbe_top_player_search.lbe_player_search #lbSearch': 'activatePlayerSearchField',
			'mousedown .lbe_top_player_search.lbe_player_search #lbSearch': 'clickClearButton',
			'blur .lbe_top_player_search.lbe_player_search #lbSearch': 'deactivatePlayerSearchField',
			'click .draggable-handle': 'blurPlayerSearchField',
		},

		initialize: function(opts) {
			this.logger = new eventsCore.util.Logger('Leaderboard Everywhere');
			this.selectedView = null; //ou | trad. used to determine which view to call reinitScroll for
			this.listenTo(PubSub, 'leaderboardEverywhere:open', this.openPanel);
			this.listenTo(PubSub, 'leaderboardEverywhere:close', this.closePanel);
			PubSub.on('resize', this.keepPanelWithinViewport.bind(this), this);
			this.listenTo(PubSub, 'throttle:resize', function() {
				//only mobile layout relies on viewport resize event.
				if(Win.size() === Win.sizes.global) {
					this.resize();
					//on mobile devices, resizing the viewport via screen rotation or keyboard display (android)
					// also resizes the lbe panel without triggering jquery resizable callbacks
					PubSub.trigger('leaderboard-everywhere:resize');
					this.updateScrollBarColumn();
				}
			});

			this.listenTo(PubSub, 'windowsize:global:enter', this.enterMobileLayout);
			this.listenTo(PubSub, 'windowsize:global:exit', this.enterDesktopLayout);
			this.listenTo(ScorePlayers, 'change:currentRound', this.updateRound);
			this.listenTo(PubSub, 'change:playoffStatus', this.updatePlayoffStatus);
			this.listenTo(PubSub, 'everywhere:scores_collection:modified', function() {
				//defer call to updateScrollBarColumn (by placing it in the callback queue)
				//until all player rows have been rendered
				setTimeout(this.updateScrollBarColumn.bind(this), 0);
			});
			this.options = _.extend({}, this.defaults, opts);

			var selectedView = $.cookie(LBCommon._lbCookieNames.LBeverywhere) || this.options.defaultView;
			this.selectLBView(selectedView);
	        this.lbView = new LBEBodyView({
	          el: this.$('.lb-body'),
	          lbtype: selectedView,
	        });
		},

		render: function() {
			this.$el.draggable({
				containment: 'window',
				handle: '.draggable-handle',
				scroll: false,
				stop: function(event, ui) {
					if(this.$el.position().top <= TOP_MENUBAR_HEIGHT) { //move lbe panel downwards
						this.$el.css('top', TOP_MENUBAR_HEIGHT);
					}

					//store position in cookie
					LBCommon.setLBEverywherePanelPosition(this.$el.position().top, ui.position.left);
					Metrics.measureApp('Leader Board Everywhere',  'Drag');
				}.bind(this)
			}).resizable({
				containment: 'section#app-wrap',
				resize: function(event, ui) {
					//call more often to avoid ghost effect when decreasing panel size
					this.resize();
					this.reinitScroll();
				}.bind(this),

				stop: function(event, ui) {
					PubSub.trigger('leaderboard-everywhere:resize', event, ui);
					Metrics.measureApp('Leader Board Everywhere',  'Resize');
					this.updateScrollBarColumn();//delay call to updateScrollBarColumn to minimize slowness of resizing
				}.bind(this),
				handles: {
					'nw': '#nwHandle',
					'sw': '#swHandle',
					'se': '#seHandle'
				},
				minWidth: this.options.minWidth,
				minHeight: this.options.minHeight,
				maxWidth: this.options.maxWidth,
				maxHeight: this.options.maxHeight
			});
			this.$el.draggable('disable');
			this.$el.resizable('disable');
			// this.$el.toggleClass('show'); //remove later


			this.lbView.render();
			this.buildPlayersSearchView();

			//Set the width and height of the panel with the value retrieved from the cookie
			//otherwise, the default size is 320 x 330, which was declared in the css
			var panelSize = LBCommon.getLBEverywherePanelSize();
			if(panelSize) {
				this.$el.css('width', panelSize.width);
				this.$el.css('height', panelSize.height);
			}

			//Set the top and left position of the panel with the value retrieved from the cookie
			//otherwise, the default position is 60px for top & 10px for right, which was declared in the css
			var panelPosition = LBCommon.getLBEverywherePanelPosition();
			if(panelPosition) {
				this.$el.css('top', panelPosition.top);
				this.$el.css('left', panelPosition.left);
				this.$el.css('right', 'auto');
			}

			this.resize();
			return this;
		},

		openPanel: function() {
			//if user has not selected a view and the panel size is large enough to display ou, default to ou view
			if(!$.cookie(LBCommon._lbCookieNames.LBeverywhere) && this.$el.hasClass('lb-col-all')) {
				this.selectLBView(LBCommon._lbTypeLookUp.ou);
			}
			this.$el.addClass('show');
			this.keepPanelWithinViewport();
			this.updateScrollBarColumn();

			if(Win.size() >= Win.sizes.tablet) {
				this.$el.draggable('enable');
				this.$el.resizable('enable');
			}
		},

		closePanel: function() {
			this.$el.removeClass('show');
			this.$el.draggable('disable');
			this.$el.resizable('disable');
		},

		// Needs to notify main menu that we are closing the panel
		closePanelBroadcast: function() {
			PubSub.trigger('leaderboardEverywhere:close');
	        Metrics.trackS({
	          prop56: 'LB Panel Off',
	          eVar56: 'LB Panel Off'
	        });
	        Metrics.measureApp('Leader Board Everywhere', 'LB Panel Off');
		},

		resize: function() {
			var outerWidth = this.$el.outerWidth(); // border + padding + content widths
			var className;
			if(outerWidth <= BREAKPOINTS.lb_col_4) {
				className = 'lb-col-4';
			} else if(outerWidth <= BREAKPOINTS.lb_col_5) {
				className = 'lb-col-5';
			} else  if(outerWidth <= BREAKPOINTS.lb_col_7) {
				className = 'lb-col-7';
			} else {
				className = 'lb-col-all';
			}

			if(!this.$el.hasClass(className)) {
				this.$el.removeClass(function(index, className) {
					return (className.match(/lb-col-[\w]*/g) || []).join(' ');
				});

				if(className !== 'lb-col-all') {
					//auto-switch to traditional view when not all columns are displaying
					this.selectLBView(LBCommon._lbTypeLookUp.trad);
				} else {
					//auto-switch to ou view only if user has not yet selected a preferred view
					this.selectLBView($.cookie(LBCommon._lbCookieNames.LBeverywhere) || LBCommon._lbTypeLookUp.ou);
				}
				this.$el.addClass(className);
			}

			//when displaying all columns for trad and ou
			//adjust font sizes and column widths
			if(className === 'lb-col-all') {
				var sizeClassName = '';
				if(outerWidth > BREAKPOINTS.lb_col_7 && outerWidth <= BREAKPOINTS.lb_size_small) {
					sizeClassName = 'lb-size-small';
				}
				else if(outerWidth > BREAKPOINTS.lb_size_small) {
					sizeClassName = 'lb-size-large';
				}

				if(!this.$el.hasClass(sizeClassName)) {
					this.$el.removeClass(function(index, className) {
						return (className.match(/lb-size-[\w]*/g) || []).join(' ');
					});
					this.$el.addClass(sizeClassName);
				}
			}

			//only need to store width and height in cookie when we're on desktop layout
			if(Win.size() > Win.sizes.global) {
				LBCommon.setLBEverywherePanelSize(this.$el.width(), this.$el.height());
			}
		},

		keepPanelWithinViewport: function() {
			if(Win.size() > Win.sizes.global){
				//horizontal boundary
				var left = this.$el.position().left;
				var right = left + this.$el.outerWidth();
				if(right > document.body.clientWidth) {
					if(left <= 0) { //resize to fit panel within available space
						var newWidth = this.$el.outerWidth() - HORIZONTAL_PADDING - (right - document.body.clientWidth);
						this.$el.css('width', newWidth);
						this.updateScrollBarColumn();
						LBCommon.setLBEverywherePanelSize(this.$el.width(), this.$el.height());
					} else { //move panel to the left
						var newLeft = left - (right - document.body.clientWidth);
						this.$el.css({left: newLeft});
						var position = this.$el.position();
						LBCommon.setLBEverywherePanelPosition(position.top, position.left);
					}
				}

				//vertical boundary
				if(this.$el.position().top <= TOP_MENUBAR_HEIGHT) { //move panel downwards
					this.$el.css('top', TOP_MENUBAR_HEIGHT);
				}

				var top = this.$el.position().top;
				var bottom = top + this.$el.outerHeight();

				if(bottom > document.body.clientHeight) {
					if(top <= TOP_MENUBAR_HEIGHT) { //resize to fit panel within available space
						//resize if panel is still greater than minimum height
						if(this.$el.outerHeight() > ABSOLUTE_MINIMUM_HEIGHT) {
							var newHeight = this.$el.outerHeight() - VERTICAL_PADDING - (bottom - document.body.clientHeight);
							this.$el.css({height: newHeight});
							LBCommon.setLBEverywherePanelSize(this.$el.width(), this.$el.height());
						}
					} else { //move panel upwards
						var newTop = top - (bottom - document.body.clientHeight);
						this.$el.css({top: newTop});
						var position = this.$el.position();
						LBCommon.setLBEverywherePanelPosition(position.top, position.left);
					}
				} 
			}
		},

		clickLBMenuLink: function(e) {
			var id = $(e.target).data('id');
			this.selectLBView(id);

			//save currently selected view in the cookie
			if(id === LBCommon._lbTypeLookUp.trad) {
				LBCommon.setLbEverywhereTradCookie();
			} else if(id === LBCommon._lbTypeLookUp.ou) {
				LBCommon.setLbEverywhereOuCookie();
			}

			Metrics.measureApp('Leader Board Everywhere',  'Menu', id, 'Select');
		},

		selectLBView: function(id) {
			var $selected = this.$('.lbe-menu-link.selected');
			if($selected.data('id') !== id || $selected.length === 0) {
				$selected.removeClass('selected'); //unselect previouly selected menu
				this.$('.lbe-menu-link[data-id="'+ id + '"]').addClass('selected');
				PubSub.trigger('lbEverywhere:showLBView', id);
			}
			this.selectedView = id;
			this.updateScrollBarColumn();
		},

		//Update Round Number in the footer
		updateRound: function() {
			this.$('.lb-footer .round').html('ROUND ' + Scores.Utilities.currentRound());
		},

		// Show playoff status block in the footer
		updatePlayoffStatus: function() {
			if(Scores.collection.playoffExists) {
				this.$('.lb-footer .round').addClass('hide'); //hide 'Round N'
				this.$('.lbe-menu-link').addClass('alwaysHide'); //hide ou/trad links at all lbe panel sizes
				this.$('.playoff-wrapper').removeClass('hide');
				this.getAndUpdatePlayoffText();
				this.timer = setInterval(this.getAndUpdatePlayoffText.bind(this), this.options.playoffStatusRefreshDelay);
			} else {
				// this block will probably never get called since there is nothing after playoffs??
				this.$('.lb-footer .round').removeClass('hide'); //show 'Round N'
				this.$('.lbe-menu-link').removeClass('alwaysHide');
				this.$('.playoff-wrapper').addClass('hide');	
				clearInterval(this.timer);
			}
		},

		// Update playoff text with the data fetched from CMS
		getAndUpdatePlayoffText: function() {
			Backbone.ajax({
				type: 'GET',
				dataType: 'json',
				url: this.options.playoffStatusUrl,
				success: function(data){
					this.$('.playoff-wrapper .body').html(data.leaderboardPlayoff_Text);
				}.bind(this),
		        error: function(jqXHR, textStatus, errorThrown) {
		        	console.error('Error fetching playoff text in controller/leaderboard-everywhere: ' + textStatus);
		        }
			});
		},

		buildPlayersSearchView: function() {
			if(!Scores.isDataLoaded()) {
				PubSub.once('scores:refresh', this.buildPlayersSearchView, this);
			} else {
				var scores_collection = Scores.collection.clone();
		        this.playersSearchView = new PlayersSearchView({
		          el: this.$('.lbe_player_search'),
		          collection: scores_collection,
		          searchKey: 'full_name',
		          showFlag: LBCommon.lbShowPlayerFlag.EVERYWHERE,
		          metrics: ['Leader Board Everywhere']
		        });
		        this.playersSearchView.render();

				this.listenTo(scores_collection, 'modified', function(action, opts) {
					var searchMode = (action === 'search' && opts !== '') ? true : false;
					PubSub.trigger(LBCommon.lbFormat.EVERYWHERE + ':scores_collection:modified', searchMode);
				});

			}
		},

		expandPlayerSearchField: function(e) {
			Metrics.measureApp('Leader Board Everywhere',  'Player Search', 'Open');
			var $t = $(e.currentTarget);
			$t.removeClass('collapsed').addClass('expanded');
			$t.find('input').focus();
		},

		collapsePlayerSearchField: function(e) {
			var $t = $(e.currentTarget);
			if($t.find('input').val() === '') {
				$t.removeClass('expanded').addClass('collapsed');
			}
		},

		activatePlayerSearchField: function(e) {
			var $t = $(e.currentTarget);
			$t.addClass('active');
			$t.find('input').focus();
		},

		deactivatePlayerSearchField: function(e){
			$(e.currentTarget).removeClass('active');
		},

		// need this method so we can avoid 'blurring' the
		// player search input field when we click on the clear button
		clickClearButton: function(e){
			if($(e.target).hasClass('lbClearButton')) {
				e.preventDefault();
			}
		},

		// need this method to workaround issue with jquery Draggable,
		// which prevents player search input field from being 'blurred'
		// when we click on a draggable handle
		blurPlayerSearchField: function(e) {
			var searchClass = 'lbe_player_search'; //ignore clicks to elements related to player search
			var $t = $(e.target);
			if(!$t.hasClass(searchClass) && $t.parents('.' + searchClass).length === 0) {
				this.$('.' + searchClass + ' input').blur();
			}
		},

		//need to reinitialize custom jscroll pane every time selected view or panel size changes
	    reinitScroll: function() {
	      var jsp = this.$('.custom-scroll-pane.'+ this.selectedView).data('jsp');
	      if(jsp) {
	        jsp.reinitialise();
	      } else {
	        this.$('.custom-scroll-pane.' + this.selectedView).jScrollPane({verticalGutter: 0});
	      }
	    },

		updateScrollBarColumn: function() {
			this.reinitScroll();
			var wrapper = this.$('.content.'+ this.selectedView);
			if(wrapper.find('.jspVerticalBar').length === 0) { //hide header scrollbar column if jscroll pane is not there
				wrapper.find('.scrollbar-column').addClass('hide');
			} else {
				wrapper.find('.scrollbar-column').removeClass('hide');
			}
	    },

	    enterMobileLayout: function() {
			this.$el.draggable('disable');
			this.$el.resizable('disable');
	    },

	    enterDesktopLayout: function() {
			this.$el.draggable('enable');
			this.$el.resizable('enable');
			this.resize();
			this.keepPanelWithinViewport();
			this.updateScrollBarColumn();
	    },

		onDispose: function() {
			clearInterval(this.timer);
			PubSub.off('resize', undefined, this);
		},
	});

	return LeaderboardEverywhere;
});

