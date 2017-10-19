define('controllers/past-winners',['require','baseview','utils/metrics','utils/title-selector','views/past-winners'],function(require) {
  var BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      TitleSelector = require('utils/title-selector'),
      PastWinnersTable = require('views/past-winners')
      ;

  var PastWinnersView = BaseView.extend({

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);
      this.titleSelector = new TitleSelector({
        el: this.$('#pageTitle'),
        max: 1,
        measure_key: [Metrics.page_section, 'Select Records & Stats']
      });

      this.pastWinners = new PastWinnersTable({
        el: this.$('.past-winners-content'),
        metrics_name: [Metrics.page_section, Metrics.page_title]
      });
    },

    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);
      this.pastWinners.render();
    },

    onDispose: function() {
      this.pastWinners.dispose();
      this.titleSelector.dispose();
    }


  });

  return PastWinnersView;
});


