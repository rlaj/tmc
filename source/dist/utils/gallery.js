define('utils/gallery',['require','jquery','underscore','utils/querystring','backbone','utils/window-size','utils/metrics','utils/pubsub','utils/common','utils/ratio-resize','relatedcontent','utils/date-util','utils/social','unveil','jquery.jscroll','modernizr'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      qsParse = require('utils/querystring'),
      Backbone = require('backbone'),
      Win = require('utils/window-size'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Common = require('utils/common'),
      RatioResize = require('utils/ratio-resize'),
      RelatedContent = require('relatedcontent'),
      DateUtil = require('utils/date-util'),
      Share = require('utils/social')
      ;

  require('unveil');
  require('jquery.jscroll');
  require('modernizr');

  var JST = {};

  // page selector template
  JST.hole_image = _.template(
    '<img src="/images/now/trans_16x9.gif"' +
    'data-lower="<%= low %>" data-medium="<%= medium %>" ' +
    'data-high="<%= high %>" border="0" alt="<%= caption %>" class="width"/>'
  );

  var Gallery = Backbone.View.extend({
    el: '#photoGallery',

    defaults: {
      image: '#photoImage',
      next: '.bx-control-right',
      prev: '.bx-control-left',
      path: '/en_US/xml/gen/course/hero_gallery/hole12.json',
      start: 1, // assume we start with the first image
      hole_number: 1,
      related_id: '',
      share_url: ''
    },

    data: [],
    cache: [],
    photos: [],
    container: '',

    current: -1,
    max: -1,
    fs: false,

    view: 'gallery',
    title: '',

    events: {
      'click .bx-control-left a': 'loadPrevImage',
      'click .bx-control-right a': 'loadNextImage',
      'click #fullscreen a': 'toggleFullScreen'
    },

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);
      this.share_url = location.pathname.substring(0);
      this.photo_id = qsParse.get('id');
      this.start = parseInt(this.options.start, 10);

      this.listenTo(PubSub, 'throttle:resize', this.resizeImage);

      if(this.options.load_details) {
        $(document).on('keydown.gallery', function(e) {
          return this.keyAction(e);
        }.bind(this))
        .on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', this.goFullScreen.bind(this));
      }
    },

    render: function() {
      // load related content data
      if(this.options.related_id !== '') {
        this.loadRelatedContent('galleries');
      }

      // load gallery data
      this.loadGalleryData();

      var offsetHeight = 0,
          titlebar;
      if(this.options.title) {
        if(this.options.title.$el) {
          // if +title+ was passed as TitleSelector View
          titlebar = this.options.title;
        } else {
          // otherwise, assume simply jQuery object
          // desire negative value here to offset fact we're using window height, lack navigation, but have title bar
          offsetHeight = this.options.title.height() - Common.header_height;
        }
      }

      this.ratio_resize = new RatioResize({
        view: this,
        height: offsetHeight,
        title: titlebar,
        hcallback: function(w, h) {
          var img = this.$(this.options.image).find('img');
          img.addClass('height').removeClass('width').css('height', h);

          var rg = this.$('.related_gallery');
          if(rg.length > 0) {
            var width = Math.floor(h * (16 / 9));
            rg.css({
              'width': width
            });
          }
        },
        wcallback: function(w, h) {
          var img = this.$(this.options.image).find('img');
          img.addClass('width').removeClass('height').css('height', '');

          var rg = this.$('.related_gallery');
          if(rg.length > 0 && rg.css('width') !== '') {
            rg.css({
              'width': ''
            });
          }
        }
      });

      return this;
    },

    onDispose: function() {
      this.ratio_resize.dispose();
      if(this.options.load_details) {
        $(document).off('keydown.gallery fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange');
      }
    },

    cacheImage: function(index) {
      var prop = this.getImageSize();
      var img;
      if(index <= this.max) {
        img = this.photos[index - 1];
      } else {
        img = { 'imagefileL': '/images/backgrounds/related_gallery_sm.jpg',
          'imagefileM': '/images/backgrounds/related_gallery_med.jpg',
          'imagefileH': '/images/backgrounds/related_gallery.jpg'
        };
      }

      if(_.indexOf(this.cache, img[prop]) === -1) {
        var cacheImage = document.createElement('img');
        cacheImage.src = img[prop];
        this.cache.push(img[prop]);
      }
    },

    disable: function(item) {
      item.addClass('disabled');
      return item;
    },

    enable: function(item) {
      item.removeClass('disabled');
      return item;
    },

    getImageSize: function() {
      var attrib;
      switch(Win.size()) {
        case Win.sizes.desktop:
          attrib = 'imagefileH';
          break;
        case Win.sizes.tablet:
          attrib = 'imagefileM';
          break;
        case Win.sizes.global:
        default:
          attrib = 'imagefileL';
          break;
      }
      return attrib;
    },

    toggleFullScreen: function(e) {
      if(Modernizr.fullscreen) {
        e.preventDefault();
        if(Common.isFullScreen()) {
          if(document.exitFullscreen) {
            document.exitFullscreen();
          } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if(document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        } else {
          var container = this.$el.get(0);
          if(container.requestFullscreen) {
            container.requestFullscreen();
          } else if(container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
          } else if(container.webkitRequestFullScreen) {
            container.webkitRequestFullscreen();
          } else if(container.msRequestFullscreen) {
            container.msRequestFullscreen();
          }
        }
      }
    },

    /**
     * This method gets called after the full screen action has already happened
     * and as such checks for current state, not the state to be entered
     */
    goFullScreen: function() {
      if(Common.isFullScreen()) {
        this.enterFullScreen();
      } else {
        this.exitFullscreen();
      }
    },

    enterFullScreen: function() {
      this.$el.addClass('infullscreen');
      this.fs = true;

      setTimeout(function() {
        this.resizeImage();
      }.bind(this), 400);

      Metrics.measureApp('Photo Gallery', 'Full Screen');
    },

    exitFullscreen: function() {
      this.$el.removeClass('infullscreen');
      this.fs = false;

      Metrics.measureApp('Photo Gallery', 'Full Screen', 'Exit');
    },

    keyAction: function(e) {
      var keycode;
      keycode = e.keyCode || e.which;

      if(keycode === 37 && this.current > 1) {
        this.populateGallery(this.current - 1, 'Previous');
      } else if(keycode === 39) {
        if(this.current < this.max) {
          this.populateGallery(this.current + 1, 'Next');
        } else if(this.related_list !== undefined && this.related_list.content.length > 0 && this.current === this.max) {
          this.populateGallery(this.max + 1, 'Related');
        }
      }
    },

    loadGalleryData: function() {
      $.ajax({
        url: this.options.path,
        type: 'GET',
        dataType: 'json',
        cache: 'true',
        async: true,
        success: function(json_data) {
            // console.log("json_data-->%o", json_data);
          this.data = json_data.gallery;
          this.photos = json_data.gallery.item;
          this.max = this.photos.length;

          // find start image if start is not null
          this.start = 0;
          if(this.photo_id !== null) {
            for(var i = 0; i < this.max; i++) {
              if(this.photos[i].id === this.photo_id) {
                this.start = i + 1;
                break;
              }
            }
          }

          // make sure +start+ value is valid and within range
          if(!isNaN(this.start) && this.start > 0 && this.start < this.max) {
            this.options.start = this.start;
          }

          // set gallery title for metrics
          this.title = this.data.title[0];
          this.populateGallery(this.options.start, 'init');

          // this.$('.bx-next').focus();
        }.bind(this),
        error: function(json_data, response) {
          console.log('Error loading: ' + json_data.responseText);
        }
      });
    },

    loadGalleryDetails: function(photo) {
      this.$('#photoCaption').html(photo.lcaption);
      this.$('#photoCount').html(this.current + '/' + this.max);
      this.$('#photoDate').html(photo.ldate);
      this.$('#photoCredit').html(photo.credit);
    },

    loadImage: function(index) {
      this.trigger('related:unload');
      var photo = this.photos[index - 1];

      var image_html = JST.hole_image({
        low: photo.imagefileL,
        medium: photo.imagefileM,
        high: photo.imagefileH,
        caption: photo.scaption
      });

      this.$(this.options.image).html(image_html);
      this.unveil(this.$(this.options.image).find('img'));

        // load details if photo gallery
      if(this.options.load_details) {
        this.loadGalleryDetails(photo);
      }

      this.resizeImage();

        // update share URL to one that will load the photo on load
      this.share_url = photo.photopage;
      if(this.share_url === '') { this.share_url = location.pathname + '?id=' + photo.id; }

      var section = 'Photo Gallery';
      var disp_title = this.title;
      if(this.max === 1) {
        section = 'Photo';
        disp_title = photo.lcaption;
      }

      var share = this.$('#titleShare, #share');
      Share.loadSocialOverlay(share, this.share_url, section, Metrics.page_title, disp_title);
    },

    loadNextImage: function(e) {
      e.preventDefault();

      if(this.current < this.max) {
        this.populateGallery(this.current + 1, 'Next');
      } else if(this.related_list !== undefined && this.related_list.content.length > 0 && this.current === this.max) {
        this.populateGallery(this.max + 1, 'Related');
      }
    },

    loadPrevImage: function(e) {
      e.preventDefault();

      if(this.current > 1) {
        this.populateGallery(this.current - 1, 'Previous');
      }
    },

    loadRelatedContent: function(type, url) {
      if(url === undefined) {
        url = '/en_US/cms/feeds/galleriesLastX.json';
      }
      this.related_list = new RelatedContent.List({
        container: this.$el,
        id: this.options.related_id,
        url: url,
        type: (type === 'galleries') ? 'content' : 'tag',
        related: type !== 'galleries',
        filter: type,
        limit: 1,
        link_suffix: { article: 'gallery_recommended'},
        callback: function(params) {
          if((params.status === 'success' && this.content.length === 0) || (params.status === 'error')) {
            console.info('this.loadRelatedContent:  ' + params.status + ', length:  ' + this.content.length);

              // fetching fallback data once
            if(this.type !== 'url') {
              this.reinitialize({
                type: 'url'
              });
              this.load();

                  // this.loadGalleryData();
            }
          }
        }
      });

      var _convertContent = this.related_list.convertContentItem;
      this.related_list.convertContentItem = function(rc) {
        var item = _convertContent(rc);
        var dateObj = new Date(item.get('published').split(' ', 1)[0]);
        item.set('published', DateUtil.getLongDayOfWeek(dateObj) + ',  ' + DateUtil.getLongMonth(dateObj) + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear());
        return item;
      };
      this.related_list.load();

        // console.log("related_list: %o", this.related_list);
    },

    loadRelatedImage: function(index) {
      this.trigger('related:load');
      var related_content = this.related_list.content[0];

      // var extradata = this.related_list.result[0].extradata;

      var imghtml = '<img src="/images/now/trans_16x9.gif"'
                + ' data-lower="/images/backgrounds/related_gallery_sm.jpg" data-medium="/images/backgrounds/related_gallery_med.jpg" data-high="/images/backgrounds/related_gallery.jpg"'
                + ' border="0" alt="" class="width"/>';

      this.$(this.options.image).html(imghtml);
      this.unveil(this.$(this.options.image).find('img'));
      this.resizeImage();

        // fill in data
      var context = this.$('.related_gallery');
      context.find('a').attr('href', related_content.get('link'));
      context.find('img.gallery_thumb').attr('src', related_content.get('image').medium);
      context.find('img').attr('alt', related_content.get('caption'));
      context.find('.title').html(related_content.get('caption'));
      context.find('.date').html(related_content.get('published') + '<span class="count">' + related_content.get('photo_count') + '</span>');
    },

    populateGallery: function(index, state) {
      this.current = index;

      // load image from gallery if not related slide
      if(state !== 'Related') {
        this.loadImage(index);
      } else {
        this.loadRelatedImage();
      }

      this.$('.label').show();

        // handle ends, disable arrows as needed
      if(this.current === 1) {
        this.disable($(this.options.prev));
      }

      if(this.current === this.max) {
        this.disable($(this.options.next));
      }

        // there should not be a next arrow if on related slide
      if(state === 'Related') {
        this.disable($(this.options.next));
      }

      if(this.current > 1) {
        this.enable($(this.options.prev));

          // cache previous image if after first image
        this.cacheImage(index - 1);
      }

      if(this.current < this.max || (this.current === this.max && this.related_list !== undefined && this.related_list.content.length > 0)) {
        this.enable($(this.options.next));

          // cache next image if before last image
        this.cacheImage(index + 1);
      }

      if(state !== undefined) {
        if(state !== 'init') {
          // for access via left/right arrows, either click or keyboard

          if(Metrics.page_section === 'Course') {
            if(state === 'Next') {
              Metrics.measureApp('Course', '' + this.options.hole_number, 'Right');
            } else {
              Metrics.measureApp('Course', '' + this.options.hole_number, 'Left');
            }
          } else {
            this.prop31 = 'related gallery',
            this.prop20 = '',
            this.prop16 = '';

            if(state !== 'Related') {
              this.prop31 = this.photos[index - 1].id;
              this.prop20 = this.photos[index - 1].credit;
              this.prop16 = this.title;
            }

            Metrics.trackS({
              prop16: this.prop16,
              prop20: this.prop20,
              prop31: this.prop31
            });

            Metrics.measureApp('Photo Gallery', state);
          }
        }
      }
    },

    resizeImage: function() {
      this.ratio_resize.calculateRatio();
    }


  });

  return Gallery;
});

