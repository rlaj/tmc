define('controllers/watch-index',['require','jquery','backbone','baseview','utils/metrics','utils/geoblock','views/watch-landing-hero','views/watch-landing-body'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      Geo = require('utils/geoblock'),
      WatchLandingHero = require('views/watch-landing-hero'),
      WatchLandingBody = require('views/watch-landing-body')
      ;

  var WatchIndexView = BaseView.extend({
    geo_checked: false,

    initialize: function(html) {
      BaseView.prototype.initialize.apply(this, [html]);

      this.logger = new eventsCore.util.Logger('WatchIndexView');
      this.logger.info('initialize');
    },

    onInitialization: function() {
      Geo.checkAction = this.geoAction.bind(this);
      this.hero = new WatchLandingHero({
        el: this.$('div.content-wrap'),
        state: this.jsonData.pageState
      });
      this.contentBody = new WatchLandingBody({
        el: this.$('section.body')
      });
    },

    geoAction: function() {
      if(this.geo_checked) {
        return;
      }
      if(Geo.isLoaded()) {
        if(Geo.isBlocked()) {
          this.hero.geoAction();
          this.contentBody.geoAction();
        }

        this.geo_checked = true;
      }
    },

    onRender: function() {
      this.logger.info('onRender');
      this.geoAction();

      this.hero.render();
      this.contentBody.render();
    },

    onDispose: function() {
      this.contentBody.dispose();
    }

  });

  return WatchIndexView;
});

