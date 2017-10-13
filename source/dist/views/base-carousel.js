define('views/base-carousel',['require','jquery','underscore','backbone','utils/browser','utils/carousel','utils/metrics','unveil'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Browser = require('utils/browser'),
      Carousel = require('utils/carousel'),
      Metrics = require('utils/metrics')
      ;

  require('unveil');

  var BaseCarouselView = Backbone.View.extend({

    events: {

    },

    _template: undefined,
    _default: {
      story: false,
      flyover: false,
      btn: false,

      measure_prefix: [],
      app_measure_prefix: '',
      metrics_suffix: '',
      metrics_keys: {}
    },

    _default_keys: {
      hole: 'Holes',
      photo: 'Photos',
      player: 'Players',
      video: 'VOD',
      panorama: '360 Views'
    },

    initialize: function(opts) {
      if(!this.logger) {
        this.logger = new eventsCore.util.Logger('BaseCarouselView');
      }
      this.logger.info('Initialize');

      this.options = $.extend({}, this._default, opts);
      if(this.options.measure_prefix.length === 0) {
        this.options.measure_prefix = [Metrics.page_section, Metrics.page_title];
      }
      if(this.options.app_measure_prefix === '') {
        this.options.app_measure_prefix = this.options.measure_prefix.join(':');
      }
      this.metrics_keys = _.extend({}, this._default_keys, this.options.metrics_keys);

      this.logger.info('options :%o', this.options);

      this.cards = [];
    },

    render: function() {
      if(Browser.app) {
        this.$('.bx-control').addClass('noarrow');
      }
      this.$el.html(this.loadContentCarousel());
      return this;
    },

    onDispose: function() {
      this.cards.forEach(function(card) {
        card.dispose();
      });
    },

    loadContentCarousel: function() {
      return '';
    },

    getMetricsName: function() {
      var className = this.el.className.match(/hole|photo|player|video|panorama/)[0];
      var metrics_name = this.metrics_keys[className];
      if(metrics_name === undefined) {
        metrics_name = 'Unknown';
      }

      metrics_name = {
        normal: _.flatten([this.options.measure_prefix, [metrics_name]]),
        app: this.options.app_measure_prefix + ':' + metrics_name
      };
      return metrics_name;
    },

    getCarouselOptions : function() {
      var that = this;
      //Articles.handleBlankCarouselItem(div);
      var articleCarouselOpts;
      //var photosNum = $("#photoCarousel .photoItem").length;

      var metrics_name = this.getMetricsName();
      var next_call = _.clone(metrics_name.normal);
      next_call.push('Next');
      var prev_call = _.clone(metrics_name.normal);
      prev_call.push('Previous');

      that.logger.info('global - setting carousel options');
      articleCarouselOpts = {
        infiniteLoop: false,
        hideControlOnEnd: true,
        touchEnabled: true,
        nextSelector : this.$el.find('.bx-control-right'),
        prevSelector : this.$el.find('.bx-control-left'),
        onSliderLoad : function(newIndex){
          that.setCarouselMargins();
          if(newIndex === 0) {
            that.$el.find('.bx-control-left').addClass('disabled');
          }
          var max = that.$('.carousel:first-child').children().length;
          if(newIndex === (max - 1)) {
            that.$el.find('.bx-control-right').addClass('disabled');
          }
        },
        onSlideBefore : function(newSlide, oldIndex, newIndex) {
          var last = newSlide.siblings().length + 1 - 1; // get sibling count, add one for self, then substract one for 0-index
          var carousel = newSlide.closest('.articleCarousel');

          carousel.find('.bx-control.disabled').removeClass('disabled');
          if(newIndex === 0) {
            carousel.find('.bx-control-left').addClass('disabled');
          }
          if (newIndex === last) {
            carousel.find('.bx-control-right').addClass('disabled');
          }
        },
        onSlideNext : function(newSlide, oldIndex, newIndex) {
          if(!Browser.app) {
            Metrics.measureApp.apply(Metrics, next_call);
          }else{
            Metrics.appMeasure(metrics_name.app + ':Next');
          }
        },
        onSlidePrev : function(newSlide, oldIndex, newIndex) {
          if(!Browser.app) {
            Metrics.measureApp.apply(Metrics, prev_call);
          }else{
            Metrics.appMeasure(metrics_name.app + ':Previous');
          }
        }
      };

      return articleCarouselOpts;
    },

    handleBlankCarouselItem : function(which) {
      if(windowSize == 'global'){
        $(which+' .carousel').find('.blank').remove();
      } else {
        switch (which){
          case '.playerCardCarousel':
            $(which+' .carousel').prepend('<div class="playerCard blank"><div class="image no_gradient"><img src="/images/now/trans_16x9.gif" /></div></div>');
            break;
          case '.holeInfoCarousel':
            $(which+' .carousel').prepend('<div class="holeCard blank"><div class="image no_gradient"><img src="/images/now/trans_16x9.gif" /></div></div>');
            break;
          case '.photoCarousel':
            $(which+' .carousel').prepend('<div class="photoItem blank"><div class="photo"><img src="/images/now/trans_16x9.gif"/></div></div>');
            break;
          case '.videoCarousel':
            $(which+' .carousel').prepend('<div class="videoItem blank"><div class="video"><img src="/images/now/trans_16x9.gif"/></div></div>');
            break;
          default: break;
        }
      }
    },

    setCarouselMargins : function() {
      var $carousel = this.$('.carousel');

      // prevent percent rounding issue where slides are wider than slide container,
      // causing stacked slides to appear (mostly at narrower widths)
      var w = $carousel.css('width'); // e.g. 815%
      w = parseFloat(w.replace('%',''));
      w += 10;
      w += '%';
      $carousel.css('width',w);

      // this.clearUnveil();
      // this.unveil($carousel.closest('.bx-wrapper').find('.image img, .photo img'));
    }
  });

  return BaseCarouselView;
});
