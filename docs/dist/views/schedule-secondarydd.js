define('views/schedule-secondarydd',['require','underscore','views/secondary-dropdown','utils/metrics','utils/browser'],function(require) {
  var _ = require('underscore'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      Metrics = require('utils/metrics'),
      Browser = require('utils/browser')
      ;

  var scheduleDD = SecondaryDropdown.extend({
    el: '.day-nav',

    events: {
      'click .day-container:not(.selected)': 'selectOption',
      'click .day-container.selected': 'toggleOpen',
      'click .day-container': 'noOp'
    },

    getSelectedMeasureText: function() {
      if(!Browser.app) {
        return 'April ' + this.$selected.find('.date').text();
      }

      return this.$selected.find('.day').text();
    },

    measureApp: function() {
      // don't record dropdown open/close events
      if(arguments[0] === 'Tab') {
        return;
      }

      if(!Browser.app) {
        SecondaryDropdown.prototype.measureApp.apply(this, arguments);
      } else {
        var metricsCall = _.flatten(['Schedule', 'Select Day', arguments]).join(':');
        Metrics.appMeasure(metricsCall);
      }
    }

  });


  return scheduleDD;
});

