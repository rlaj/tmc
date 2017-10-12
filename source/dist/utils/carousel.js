define('utils/carousel',['require','jquery','underscore','utils/browser','jquery.bxslider'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Browser = require('utils/browser')
      BxSlider = require('jquery.bxslider')
      ;

  var Carousel = function() {
    this.source = '';
    this.active = false;
    this.loading = false;
    this.data = '';   // holds carousel json if avail

    this.defaults = {
      has_images: true,
      useCSS: true, // replace with browser detection for css3 transforms
      use3D: false, // avoid using 3d transforms, causes Chrome issues with fixed positioned backgrounds
      pager: false,
      slideMargin: 10,
      startSlide: 0,
      nextSelector: '.bx-control-right',
      prevSelector: '.bx-control-left',
      nextText : 'Next <!--[if lt IE 9]><span></span><![endif]-->',
      prevText : 'Prev <!--[if lt IE 9]><span></span><![endif]-->'
    };

    // initialize on creation
    if (arguments.length > 0) {
      return this.init.apply(this, arguments);
    } else {
      return this;
    }
  }

  Carousel.prototype.init = function(selector, opts) {
    this.loading = true;
    this.source = $(selector);
    this.options = $.extend({}, this.defaults, opts);
    //console.log(this.options);
    var pop = this.populate(this.source);
    var that = this;
    return $.when(pop)
      .done(function() {
        that.load();
      });
  }

  Carousel.prototype.refresh = function(opts) {
    var curSlide = this.current();
    var opts = $.extend({}, this.options, {
      startSlide: curSlide
    }, opts);
    //console.log('refreshing carousel');
    this.source.reloadSlider(opts);
  }

  Carousel.prototype.load = function() {
    var optSliderLoad = this.options.onSliderLoad;
    var that = this;
    if(this.source.length === 0) {
      return;
    }
    var photoNums = this.source[0].childElementCount;
    this.options.onSliderLoad = function(ci) {
      if (typeof optSliderLoad === 'function') {
        optSliderLoad.call(this, ci);
      }
      that.active = true;
      that.loading = false;

      if(Browser.safari) {
        setTimeout(function() {
          that.source.redrawSlider();
        }, 300);
      }
    }

    if(photoNums <= 1){
      that.options.touchEnabled = false;
    }

    var optSlideAfter = this.options.onSlideAfter;
    this.options.onSlideAfter = function(newSlide, oldIndex, newIndex) {
      if (typeof optSlideAfter === 'function') {
        optSlideAfter.call(this, newSlide, oldIndex, newIndex);
      }
      if(this.has_images) {
        $(window).trigger('lookup.unveil');
      }
    }
    this.source = this.source.bxSlider(this.options);
    // TODO: this doesn't always work, timing issue?
    if (Browser.oldIE) {
      setTimeout(function() {
        console.log('manual refresh on load');
        that.refresh();
      }, 500);
    }
  }

  Carousel.prototype.current = function() {
    return this.source.getCurrentSlide();
  }

  Carousel.prototype.setslide = function(s_num) {
    this.source.goToSlide(s_num);
  }

  Carousel.prototype.destroy = function() {
    console.log('destroying slider');
    this.source.destroySlider();
    this.active = false;
  }

  // define populate as returning a resolved Deferred object to allow for ajax requests
  // assign your own populate methods for each carousel as needed
  Carousel.prototype.populate = function() {
    var d = new $.Deferred();
    // this.source.addClass('loaded');
    return d.resolve();
  }

  Carousel.prototype.redraw = function() {
    this.source.redrawSlider();
  }

return Carousel;

});
