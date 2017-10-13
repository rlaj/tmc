define('views/photo-carousel',['require','jquery','backbone','utils/browser','utils/carousel','views/base-carousel','views/photo-card','views/photo-caption','utils/metrics','unveil'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Carousel = require('utils/carousel'),
      BaseCarousel = require('views/base-carousel'),
      PhotoCard = require('views/photo-card'),
      PhotoCaption = require('views/photo-caption'),
      Metrics = require('utils/metrics')
      ;

  require('unveil');

  var PhotoCarouselView = BaseCarousel.extend({

    events: {
    },

    photo_data: {},

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PhotoCarouselView');
      BaseCarousel.prototype.initialize.apply(this, arguments);
    },

    loadContentCarousel: function() {
      var that = this;

      $.ajax({
        url: that.options.article_photos,
        type: 'GET',
        cache: 'true',
        dataType: 'json',
        async: true,
        success: function(json_data) {
          // utilize data retrieved to populate photo data
          that.photo_data = json_data.gallery;
          that.process();
        }, error: function(xhr, textStatus) {
          // alert('Error loading document - '+article_photos);
          that.logger.info('Error loading ' + that.options.article_photos + ': ' + xhr.status);
        }
      });
    },

    process: function() {
      var photos_list = [];
      var captions_list = [];

      $.each(this.photo_data.item, function(i, o) {
        var html = '';
        var obj;
        var caphtml = '';
        var capobj;

        obj = new PhotoCard({item: o}).render();
        capobj = new PhotoCaption({item: o}).render();
        this.cards.push(obj);
        this.cards.push(capobj);

        html = obj.$el;
        photos_list.push(html);

        caphtml = capobj.$el;
        captions_list.push(caphtml);
      }.bind(this));

      // write new html
      this.$('.carousel').append(photos_list);
      this.$el.next('.photoCaptionCarousel').find('.carousel').append(captions_list);

      // load carousels
      this.photo_carousel = new Carousel();
      this.photo_caption_carousel = new Carousel();

      // separate photo image and caption into separate carousels
      // so that we have clean panel area to line up left/right arrows
      // and use for semi-transparent background
      var that = this;

      var h_opts = this.getCarouselOptions();
      var osb = h_opts.onSlideBefore;

      h_opts.onSlideBefore = function(elem, oldS, newS) {
        osb.call(this, elem, oldS, newS);

        // whenever we slide the photo carousel, navigate the caption carousel to same place
        that.photo_caption_carousel.source.goToSlide(newS);
      };

      // init carousel
      this.photo_carousel.init(this.$('.carousel'), h_opts);

      h_opts.nextSelector = '.photoCaptionCarousel .bx-control-right';
      h_opts.prevSelector = '.photoCaptionCarousel .bx-control-left';
      h_opts.onSlideBefore = function(elem, oldS, newS) {};
      h_opts.touchEnabled = false;

      // init caption carousels
      this.photo_caption_carousel.init(this.$el.next('.photoCaptionCarousel').find('.carousel'), h_opts);

      this.clearUnveil();
      this.unveil(this.$('.carousel').find('.image img, .photo img'), { horizontal: true });
    }
  });

  return PhotoCarouselView;
});

