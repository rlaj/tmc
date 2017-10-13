define('views/hole-carousel',['require','jquery','backbone','utils/browser','utils/pubsub','utils/carousel','collections/holes','views/base-carousel','views/hole-card','utils/metrics','unveil'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub'),
      Carousel = require('utils/carousel'),
      Holes = require('collections/holes'),
      BaseCarousel = require('views/base-carousel'),
      HoleCard = require('views/hole-card'),
      Metrics = require('utils/metrics')
      ;

  require('unveil');

  var HoleCarouselView = BaseCarousel.extend({

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('HoleCarouselView');
      BaseCarousel.prototype.initialize.apply(this, arguments);
    },

    // overrides base carousel loadContentCarousel() here
    loadContentCarousel : function() {

      var $hole_data;

      var that = this;

      Holes.fetch({
        success: function(holes){
          that.collection = holes;
          that.process();
        }
      });
    },

    process: function() {
      var holes_list = [];

      _.each(this.options.article_holes, function(hole){

        this.logger.info('loadHoleCarousel - article_holes hole:%o', hole);

          var html = "";
          var obj;
          var hole_num = this.collection.get(hole);

          obj = new HoleCard({model: hole_num, story: true, flyover: true, metrics_suffix: 'course_article'}).render();
          this.cards.push(obj);

          html = obj.$el;
          holes_list.push(html);
      }.bind(this));

      // write new html
      this.$('.carousel').append(holes_list);

      this.clearUnveil();
      this.unveil(this.$('.carousel').find('.image img, .photo img'), { horizontal: true });

      this.hole_carousel = new Carousel();
      h_opts = this.getCarouselOptions();
      this.hole_carousel.init(this.$('.carousel'),h_opts);
    }
  });

  return HoleCarouselView;
});
