define('views/related-next-video',['require','backbone','utils/ratio-resize','utils/window-size'],function(require) {
  var Backbone = require('backbone'),
      RatioResize = require('utils/ratio-resize'),
      Win = require('utils/window-size')
      ;

  var RelatedNextVideo = Backbone.View.extend({
    el: '#nextVideo',

    initialize: function(opts) {
      this.on('render', this.render);
      this.on('show', this.show);
      this.on('hide', this.hide);
      this.on('played', this.played);

      if(opts && opts.video) {
        this.video = opts.video;
      } else {
        this.video = {
          cmsId: '',
          link: '',
          contentType: '',
          image: {
            medium: ''
          },
          caption: ''
        }
      }

      this.resize = new RatioResize({
        title: { height: 50 },
        hcallback: function(w, h) {
              w = Math.floor(h * 16/9);
              if(Win.size() === Win.sizes.global) {
                  w = '';
              }
              this.$el.css({
                  'width': w
              });
          }.bind(this),
        wcallback: function(w, h) {
              if (this.el.style.width !== '') {
                  this.$el.css({
                      'width': ''
                  });
              }
          }.bind(this)
      });
    },

    /**
     * this.video is expected to be an NewsItem model returned from the RelatedContent library
     */
    render: function() {
      // populate banner
      this.$el.attr('id','nextVideo_' + this.video.get('cmsId'));
      var link = this.video.get('link');
      var prompt = 'Next Video';
      if(this.video.get('contentType') === 'leaderboard') {
          prompt = 'Next Highlight';
      }

      link = link.replace(/\.html(\?.*)?/, '.html?promo=vod_next');
      this.$('a').attr('href', link);
      this.$('.photo').html('<img src="' + this.video.get('image').medium + '" />');
      this.$('.prompt').html(prompt);
      this.$('.title').html(this.video.get('caption'));

      return this;
    },

    onDispose: function() {
      this.resize.dispose();
    },

    setVideo: function(video) {
      this.video = video;
      this.render();
    },

    show: function() {
      this.$el.addClass('visible');
    },

    hide: function() {
      this.$el.removeClass('visible');
    },

    played: function() {
      this.$el.addClass('played');
    }
  });

  return RelatedNextVideo;
});
