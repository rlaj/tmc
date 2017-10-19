define('views/video-carousel',['require','jquery','backbone','utils/browser','utils/carousel','views/base-carousel','views/video-card','utils/metrics','unveil'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Carousel = require('utils/carousel'),
      BaseCarousel = require('views/base-carousel'),
      VideoCard = require('views/video-card'),
      Metrics = require('utils/metrics')
      ;

  require('unveil');

  var VideoCarouselView = BaseCarousel.extend({

    events: {
    },

    video_data: {},

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('VideoCarouselView');
      BaseCarousel.prototype.initialize.apply(this, arguments);
    },

    loadContentCarousel : function() {

      var that = this;

      $.ajax({
        url: that.options.article_videos,
        type: 'GET',
        cache: 'true',
        dataType: 'json',
        async: true,
        success: function(json_data){
          // utilize data retrieved to populate photo data
          that.video_data = json_data.article;
          that.process();

        }, error : function(xhr, textStatus) {
          // alert('Error loading document - '+article_photos);
          that.logger.info('Error loading ' + that.options.article_videos + ': '+xhr.status);
        }
      });
    },

    process: function() {
      var videos_list = [];

        $.each(this.video_data.video, function(i,o){

          var html = "";
          var obj;

          obj = new VideoCard({item:o}).render();
          this.cards.push(obj);

          html = obj.$el;
          videos_list.push(html);

          this.options.video_data.push($.extend({},o,{
            id: 'body_'+o.id,
            type: 'vod',
            contentType: 'Article:VOD'
          }));

        }.bind(this));

        // write new html
        this.$('.carousel').append(videos_list);

        this.unveil(this.$('.carousel').find('.image img, .photo img'), { horizontal: true });

        // load carousels
        this.carousel = new Carousel();
        h_opts = this.getCarouselOptions();
        this.carousel.init(this.$('.carousel'),h_opts);

    }
  });

  return VideoCarouselView;
});
