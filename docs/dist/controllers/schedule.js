define('controllers/schedule',['require','jquery','baseview','utils/common','utils/metrics','utils/window-size','utils/browser','views/schedule-secondarydd'],function(require) {
  var $ = require('jquery'),
      BaseView = require('baseview'),
      Common = require('utils/common'),
      Metrics = require('utils/metrics'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser'),
      ScheduleSecondaryDropdown = require('views/schedule-secondarydd')
      ;

  var ScheduleView = BaseView.extend({
    events: {
      'click .schedule .footnote a': 'gotoFootnote'
    },

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);

      this.defaultContainer = this.$('.day-container[data-current="true"]');
      this.defaultContainer.addClass('selected');

      this.ScheduleSecondaryDropdown = new ScheduleSecondaryDropdown({
        el: this.$('.day-nav'),
        metrics: Metrics.page_name
      });

      this.ScheduleSecondaryDropdown.setCallback(function(href) {
        var $currentElement = this.$('a.day-container[href="' + href + '"]');
        $currentElement.addClass('selected').siblings('.selected').removeClass('selected');
        this.loadDayInfo($currentElement.attr('data-url'));
      }.bind(this));
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);
      this.loadDefaultDay();
    },

    onDispose: function() {
      this.ScheduleSecondaryDropdown.dispose();
    },

    gotoFootnote: function() {
      var $t = $(this),
          href = $t.attr('href');

      var index = href.search(/\/en_US\/news\/articles\/\d{4}-\d{2}-\d{2}\//);
      if(index > -1) {
        var new_href = href;

          // don't prepend /ipad if it already exists
        if(href.substring(index - 4, index) !== 'ipad') {
          new_href = href.slice(0, index) + '/ipad' + href.slice(index);
        }

          // attach proper app query string to article link
        new_href += new_href.search(/\?/) > -1 ? '&' : '?';
        if(Browser.apptype.android) {
          new_href += 'android';
        } else if(Browser.apptype.ios) {
          new_href += 'ios';
        }
        $t.attr('href', new_href);
      }
    },

    loadDayInfo: function(selectedDay) {
      this.$('.schedule').load(selectedDay, function() {
        this.showFootnote();
      }.bind(this));
      if(Win.size() !== Win.sizes.global) {
        this.scrollToContent();
      }
    },

    loadDefaultDay: function() {
      this.defaultDay = this.defaultContainer.attr('data-url');
      this.loadDayInfo(this.defaultDay);
    },

    scrollToContent: function() {
      var top = this.$('.day-nav').position().top + this.$('section.page-wrap').position().top;
      top -= Common.header_height;

      if(window.scrollY < top) {
        window.scrollTo(0, top);
      }
    },

    showFootnote: function() {
      // iPad/en_US/schedule.html - foot note show only on android & not iOS

      if(Browser.android || Browser.apptype.android) {
        this.$('.androidonly').show();
      } else {
        this.$('.iosonly').show();
      }
    }

  });

  return ScheduleView;
});

