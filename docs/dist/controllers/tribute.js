define('controllers/tribute',['require','jquery','backbone','baseview','views/base-hero','utils/common','utils/browser','utils/metrics','views/photo-carousel'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      BaseHero = require('views/base-hero'),
      Common = require('utils/common'),
      Browser = require('utils/browser'),
      Metrics = require('utils/metrics'),
      PhotoCarousel = require('views/photo-carousel')
      ;

  var TributeView = BaseView.extend({

    onInitialization: function() {
      BaseView.prototype.onInitialization.apply(this, arguments);
    },
    
    onRender: function() {
      BaseView.prototype.onRender.apply(this, arguments);
      
      var $carousel_el = this.$('.articleCarousel');

      // holders for Carousel objects
      this.carousels = [];

      $carousel_el.each(function(i, obj) {
        var article_photos = $(obj).attr('data-path');

        var photoCarousel = new PhotoCarousel({article_photos: article_photos, el: obj }).render();
        this.carousels.push(photoCarousel);

      }.bind(this));

      // unveil default photo/video images
      this.unveil(this.$el.find('img.srcpic'));

    }

  });

  return TributeView;
});

