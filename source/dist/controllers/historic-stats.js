define('controllers/historic-stats',['require','jquery','underscore','backbone','baseview','utils/metrics','utils/common','utils/pubsub','settings','utils/scores','tablesaw','utils/title-selector','views/secondary-dropdown'],function(require) {
  	var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub'),
      Settings = require('settings'),
      Scores = require('utils/scores'),
      Tablesaw = require('tablesaw'),
      TitleSelector = require('utils/title-selector'),
      SecondaryDropdown = require('views/secondary-dropdown')
      ;

  var HRStats = BaseView.extend({
    stats_data: [],
    page_load: true,
    round_id: 1,


    events: {
      'click .option_wrapper a': 'attachEvents',
      'click .selected_container': 'activateSelectorDropdown'
    },

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);

      this.titleSelector = new TitleSelector({
        el: this.$('#pageTitle'),
        max: 1,
        measure_key: ['Tournament Info', 'Select Records & Stats']
      });

      this.$stats_tbl = this.$('.tablesaw');
    },

    processPageVars: function() {
      var pageDetails = this.jsonData.pageDetails;

      if(pageDetails && pageDetails.pageTitle !== undefined) {
        this.pageTitle = pageDetails.pageTitle;
      }
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);

      this.populateStatsSelector();
    },

    onDispose: function() {
      this.titleSelector.dispose();
    },

    populateStatsSelector: function() {
      var filter = this.$('.filter');
      var filter_options = filter.find('.options a');
      var page = this.jsonData.page;

      $.each(filter_options, function() {
        $(this).removeClass('selected');

        if(page == $(this).attr('data-src')) {
          filter.find('.selected_container a').text($(this).text()).toggleClass('toggle');  // 'toggle' class needed to force reset of layout
          $(this).addClass('selected');
        }
      });

      this.$stats_tbl.table('refresh');
    },

    attachEvents: function() {
      var $this = $(this);
      if($this.parent().hasClass('selected') || $this.parent().hasClass('disabled')) {
        e.preventDefault();
        return;
      }
    },

    activateSelectorDropdown: function(e) {
      e.preventDefault();
      var that = $(e.currentTarget).parents('.filter');
      if(that.hasClass('open')) {
        that.removeClass('open');
        Metrics.measureApp('Tournament Info', 'Historical Records & Stats', 'View', 'Close');
      } else {
        that.addClass('open');
        Metrics.measureApp('Tournament Info', 'Historical Records & Stats', 'View', 'Open');
      }
    }

  });

  return HRStats;
});

