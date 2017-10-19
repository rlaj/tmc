define('views/base-hero',['require','backbone','utils/ratio-resize','utils/common','utils/pubsub','unveil'],function(require) {
  var Backbone = require('backbone'),
      RatioResize = require('utils/ratio-resize'),
      Common = require('utils/common'),
      PubSub = require('utils/pubsub')
      ;

  require('unveil');

  var HeroView = Backbone.View.extend({
    el: 'section.hero-wrap',

    events: {
      // 'click .media_promo a': 'triggerVideo'
    },

    video_activated: false,
    video_callback: function() {},

    initialize: function() {
      this.$welcome = this.$('#welcome');
      this.titleSelector = {
        height: 0
      };

      this.onInitialization.apply(this, arguments);
    },

    render: function() {
      console.log('[HeroView render]');
      if(typeof this.titleSelector.render === 'function') {
        this.titleSelector.render();
      }
      this.processImage();
      this.hideBack();

      if(this.$welcome.hasClass('background')) {
        this.unveil(this.$welcome);
      }

      this.onRender();

      return this;
    },

    dispose: function() {
      console.log('[HeroView disposal] disposing view ' + this.cid + ': %o', this);
      if(typeof this.titleSelector.dispose === 'function') {
        this.titleSelector.dispose();
      }
      this.unwrapResize();

      this.onDispose();

      Backbone.View.prototype.dispose.apply(this, arguments);
    },

    onInitialization: function() {},
    onRender: function() {},
    onDispose: function() {},

    processImage: function() {
      var ratio = 16/9;
      // handle hero image unveiling and resizing to keep within user's viewport
      var $img = this.$el.filter('.standard');
      if($img.length > 0) {
        var percent;
        if($img.hasClass('article')) {
          percent = '20%';
        }
        $img = $img.find('.hero-content > img, .imageWrapper > img');
        this.unveil($img);
        this.hero_resize = new RatioResize({
          view: this,
          title: this.titleSelector,
          hcallback: function(w, h) {
            if($img === undefined) {
              $img = this.$('.hero-content > img, .imageWrapper > img');
            }
            console.log('ratio-hcallback - img:%o w:%o h:%o', $img, w, h);
            if($img.length > 0) {
              $img.css({
                'width': 'auto',
                'height': h
              });
            }
            w = Math.round(h / (1/ratio));
            PubSub.trigger('ratio:resize', $img, w, h);
          },
          wcallback: function(w, h) {
            if($img === undefined) {
              $img = this.$('.hero-content > img, .imageWrapper > img');
            }
            console.log('ratio-wcallback - img:%o w:%o h:%o', $img, $img.width(), $img.height());
            if($img.length > 0) {
              if($img[0].style.height !== '') {
                $img.css({
                  'width': '',
                  'height': ''
                });
              }
            }
            h = Math.round(w * (1/ratio));
            PubSub.trigger('ratio:resize', $img, w, h);
          },
          height: percent
        });

        // this.trigger('ratio:resize', {el:$img});
      }

      var $halfimg = this.$el.filter('.half-height');
      if($halfimg.length > 0) {
        this.unveil($halfimg.find('.hero-content > img'));
      }
    },

    unwrapResize: function() {
      if(this.hero_resize) {
        this.hero_resize.dispose();
      }
    },

    hideBack: function() {
      if(Common.hideBackLink()) {
        this.$('.back-button').find('.headerlink').hide();
      }
    },

    activateVideo: function(callback) {
      this.video_activated = true;
      if(callback !== undefined && typeof callback === 'function') {
        this.video_callback = callback;
      }
    },

    triggerVideo: function() {
      if(this.video_activated) {
        var wrapper = this.$('.videoPlayerWrapper');
        var id = wrapper.attr('id').substring(6);

        // TODO: The ID should be send to a video module
        // which takes care of all the below logic
        // if(!Global.Browser.app) {
        //   if(inlineVideo.ready) {
        //     Utilities.Landing.Hero.showVideo();
        //     inlineVideo.load(id);

        //     measureAppMediaLoad(Metrics.page_section,Metrics.video_action,inlineVideo.videos[id].title);
        //     if(typeof callback === 'function') {
        //       callback.call(this);
        //     }
        //   }
        // } else {
        //   if(Global.Browser.apptype.android) {
        //     location.href = 'mobileapps://video?id=' + id;
        //   } else {
        //     window.webkit.messageHandlers.video.postMessage(id);
        //   }
        // }
      }
    },

    showVideo: function() {
      return this.$welcome.addClass('dim')
        .find('.videoPlayerWrapper').show();
    },

    hideVideo: function() {
      return this.$welcome.removeClass('dim')
        .find('.videoPlayerWrapper').hide();
    }
  });

  return HeroView;
});

