define('controllers/index',['require','jquery','underscore','backbone','baseview','views/landing-hero','utils/metrics','utils/geoblock','views/index-landing-body','unveil'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      LandingHero = require('views/landing-hero'),
      Metrics = require('utils/metrics'),
      Geo = require('utils/geoblock'),
      IndexLandingBody = require('views/index-landing-body')
      ;

  require('unveil');

  var IndexView = BaseView.extend({
    events: {

    },

    geo_checked: false,

    processPageVars: function() {
      this.props = {
        prop36: this.jsonData.metrics.prop36
      };

      Metrics.page_section = 'Home';
    },

    onInitialization: function() {
      Geo.checkAction = this.geoAction.bind(this);

      this.hero = new LandingHero({el: this.$('section.hero-wrap')});
      this.hero.$welcome_alt = this.$('#welcome_alt');

      this.contentBody = new IndexLandingBody({el: this.$('section.body')});
    },

    geoAction: function() {
      console.log('[index.js] running Index Geo.checkAction, ' + this.geo_checked);
      if(this.geo_checked) {
        return;
      }
      if(Geo.isLoaded()) {
        var blocked_hero = this.hero.$welcome_alt,
            hero = this.hero.$welcome;
        if(Geo.isBlocked()) {
          // swap cover image
          var props = {};
          _.each(['lower','medium','high','lower-portrait'], function(state) {
            props['data-' + state] = blocked_hero.data(state);
          });
          hero.attr(props);
          // hero.find('.iebg').html(blocked_hero.find('.iebg').html());
          this.unveil(hero);

          // swap link
          hero.find('.hero_promo').html(blocked_hero.find('.hero_promo').html());
          hero.find('.contentWrapper').html(blocked_hero.find('.contentWrapper').html());
        }
        blocked_hero.remove();
        this.geo_checked = true;
      }
    },

    onRender: function() {
      // run this before rendering so geoblocked hero never appears
      this.geoAction();

      this.hero.render();
      this.contentBody.render();
    },

    onDispose: function() {
      this.contentBody.dispose();
    }

  });

  return IndexView;
});
