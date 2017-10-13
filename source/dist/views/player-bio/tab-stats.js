define('views/player-bio/tab-stats',['require','backbone','jquery','utils/metrics','utils/window-size','utils/pubsub','text!templates/player-bio/tab-stats.html!strip','views/secondary-dropdown','views/player-bio/stats-summary','views/player-bio/stats-distance','views/player-bio/stats-drive','views/player-bio/stats-putting','views/player-bio/stats-pie'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Metrics = require('utils/metrics'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      tabStatsTemplate = require('text!templates/player-bio/tab-stats.html!strip'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      StatsSummary = require('views/player-bio/stats-summary'),
      StatsDistance = require('views/player-bio/stats-distance'),
      StatsDrive = require('views/player-bio/stats-drive'),
      StatsPutting = require('views/player-bio/stats-putting'),
      StatsPie = require('views/player-bio/stats-pie')
  ;


  var JST = {};

  JST.stat_description_overlay =  _.template(
    '<div class="overlay" id="statDescription" style="display:block;">' +
      '<div class="title"><%= title %></div>' +
        '<div class="text"><%= description %> </div>' +
          '<button class="close" id="btnClose">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );


  var TabStats = Backbone.View.extend({
    el: '#tab_stats',

    events: {
      'click .stat_tab_wrapper a': '_selectTab',
      'click .infoIcon': '_showInfo',
      'click #btnClose' : '_hideInfo'
    },

    defaults: {
      autosync: true,
      selectedTab: '#tab_summary'
    },

    template: _.template(tabStatsTemplate),

    initialize: function(opts) {
      this.statViewsMap = {};
      this.logger = new eventsCore.util.Logger('Tab Stats View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts);

      if(this.options.autosync) {
        //only update the stat that is currently being viewed
        this.listenTo(this.options.scoresModel, 'sync', function() {
          this._activateTab(this.options.selectedTab);
        });
      }

      this.on('stopListenersForPieTabs', function() {
        this._stopListenersForPieTabs(this.options.selectedTab);
      });

      this.on('reactivateTab', function() {
        this._activateTab(this.options.selectedTab);
      });

      //Handle screen resize from desktop to mobile
      this.listenTo(PubSub, 'windowsize:global:enter', function() {
        PubSub.trigger('playerstat:desktop:exit');
      });

      //Handle screen resize from mobile to desktop
      this.listenTo(PubSub, 'windowsize:global:exit', function() {
        PubSub.trigger('playerstat:desktop:enter');
      });

    },

    render: function() {
      this.$el.html(this.template());

      // Dropdown selector is only visible on mobile size screens
      this.$statSelector = new SecondaryDropdown({
        el: this.$('#statSelector'),
        max_size: 'tablet',
        metrics: 'Player Detail'
      });
      this.$statSelector.setCallback(function(href) {
        //update the tab for non-mobile screen size
        var $tab =  this.$('.stat_tab_wrapper a[href$="'+href+'"]');
        $tab && $tab.addClass('selected').siblings().removeClass('selected');

        this._activateTab(href);
      }, this);

      setTimeout(function() {
        this._activateTab(this.options.selectedTab);
      }.bind(this), 1);

      return this;
    },

    /**
     * Handles clicks on tab appearing on non-mobile screen sizes
     */
    _selectTab: function(e) {
      e.preventDefault();

      $t = $(e.target);
      $t.addClass('selected').siblings().removeClass('selected');

      //update the dropdown for mobile screen sizes
      //FIXME: pass -1 to select first option (index: 0). should fix secondary dropdown to handle 0 properly
      this.$statSelector && this.$statSelector.setOption($t.index() ? $t.index() : -1);
      this._activateTab($t.attr('href'));

      Metrics.measureApp(Metrics.page_section, 'Player Detail', $t.text());
    },


    _showTabContainer: function(tabId) {
      //Hide previously selected tab container and show currently selected one
      var $stat_content = this.$('.stat_content' + tabId);
      $stat_content && $stat_content.addClass('selected').siblings().removeClass('selected');
    },

    _activateTab: function(tabId) {
      //stop the listeners for the previously active pie view so that its charts
      //don't get unnecessarily replotted (and error out) when they're not on display
      this._stopListenersForPieTabs(this.options.selectedTab);

      this._showTabContainer(tabId);

      if(!this.statViewsMap[tabId]) {
        switch(tabId) {
          case '#tab_summary':
            this.statViewsMap[tabId] =  new StatsSummary({
              model: this.options.scoresModel
            });
            break;
          case '#tab_sand':
            this.statViewsMap[tabId] = new StatsPie({
              el: this.$('#tab_sand'),
              scoresModel: this.options.scoresModel,
              name: 'sand',
              attr: 'ss'
            });
            break;
          case '#tab_fairways':
            this.statViewsMap[tabId] = new StatsPie({
              el: this.$('#tab_fairways'),
              scoresModel: this.options.scoresModel,
              name: 'fairways',
              attr: 'fw'
            });
            break;
          case '#tab_greens':
            this.statViewsMap[tabId] = new StatsPie({
              el: this.$('#tab_greens'),
              scoresModel: this.options.scoresModel,
              name: 'greens',
              attr: 'gir'
            });
            break;
          case '#tab_distance':
            this.statViewsMap[tabId] = new StatsDistance({
              scoresModel: this.options.scoresModel,
              bioModel: this.options.bioModel
            });
            break;
          case '#tab_putting':
            this.statViewsMap[tabId] = new StatsPutting({
              scoresModel: this.options.scoresModel,
              bioModel: this.options.bioModel
            });
            break;
          case '#tab_drive':
            this.statViewsMap[tabId] = new StatsDrive({
              scoresModel: this.options.scoresModel,
              bioModel: this.options.bioModel
            });
           break;
          default:
        } //end of switch
      } //end of if

      this.statViewsMap[tabId].render();
      this.options.selectedTab = tabId;
    },

    /**
     * Stop all listeners for summary, greens, fairways, and sand views if they exist
     */
    _stopListenersForPieTabs: function(tabId) {
      if(tabId === '#tab_greens' || tabId === '#tab_fairways' || tabId === '#tab_sand') {
        this.statViewsMap[tabId] && this.statViewsMap[tabId].trigger('stopListeners');
      }
    },

    _showInfo: function(e) {
      var title = this.$('a[href="' + this.options.selectedTab + '"]').first().text();
      var description = this.$(this.options.selectedTab).find('.description').first().text();

      var overlay_html = JST.stat_description_overlay({
        title: title,
        description: description
      });

      this.$('#statInfo').html(overlay_html);
      this.$('#overlayFade').show();

      Metrics.measureApp(Metrics.page_section, Metrics.page_title, title, 'Info','Open');
    },

    _hideInfo: function(e) {
      this.$('#statInfo').empty();
      this.$('#overlayFade').hide();
      var title = this.$('a[href="' + this.options.selectedTab + '"]').first().text();
      Metrics.measureApp(Metrics.page_section, Metrics.page_title, title, 'Info','Close');
    },


    onDispose: function() {
      this.$statSelector && this.$statSelector.dispose();
      for (var key in this.statViewsMap) {
        if(this.statViewsMap.hasOwnProperty(key)) {
          this.statViewsMap[key].dispose();
        }
      }
    }

  });

  return TabStats;
})

;
