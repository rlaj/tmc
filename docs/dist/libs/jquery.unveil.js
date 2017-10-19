/**
* jQuery Unveil
* A very lightweight jQuery plugin to lazy load images
* http://luis-almeida.github.com/unveil
*
* Licensed under the MIT license.
* Copyright 2013 Luís Almeida
* https://github.com/luis-almeida
*
* Modifications by Yong Chen
*/
(function(factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD (Register as an anonymous module)
    define('unveil',['jquery', 'underscore', 'utils/window-size'], factory);
  } else if(typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'), require('underscore'), require('utils/window-size'));
  } else {
    // Browser globals
    factory(jQuery, _, windowInfo);
  }
}(function($, _, Win) {
  $.fn.unveil = function(options) {
    var defaults = {
      threshold: 200,
      horizontal: false,
      context: ''
    };
    options = _.extend({}, defaults, options);

    var $w = $(window),
        ch = options.horizontal,
        th = options.threshold,

        // retina = window.devicePixelRatio > 1,
        size,

        // reusable window attributes, defined once per 'unveil' call
        // instead of once per every filtered item
        wt,
        wh,
        wb,
        wl,
        wr,

        // attrib = retina? "data-src-retina" : "data-src",
        attrib,
        images = this,
        loaded = $(),
        to_load = $(),
        suffix = '.unveil' + (options.context !== '' ? '.delegate' + options.context : '')
        ;

    // however image size is determined, set data attribute to use here
    function resetSize() {
      // size = window.getComputedStyle(document.body,':after').getPropertyValue('content');
      size = Win.size();
      switch(size) {
        case Win.sizes.desktop: attrib = 'data-high'; break;
        case Win.sizes.tablet:  attrib = 'data-medium'; break;
        case Win.sizes.global:
        default:        attrib = 'data-lower'; break;
      }

      // request portrait specific lower render
      if(attrib === 'data-lower' && Win.orientation() === Win.orientations.portrait) {
        attrib = 'data-lower-portrait';
      }
    }

    function replace(_callback) {
      var source = this.getAttribute(attrib);

      // in case portrait specific lower render is unavailable, use default landscape render
      if(attrib === 'data-lower-portrait' && source === null) {
        source = this.getAttribute('data-lower');
      }
      source = source || this.getAttribute('data-src');

      // if(typeof _callback === "function") {
      //   console.log('unveil: ' + source);
      // }
      if(this.tagName === 'IMG') {
        if(source && source !== this.getAttribute('src')) {
          // console.log('unveil: setting source to ' + source);
          this.setAttribute('src', source);
          if(typeof _callback === 'function') _callback.call(this);
          if(typeof callback === 'function') callback.call(this);
        }
      } else {
        // check background image source instead
        if(source && source !== parseBackgroundImageUrl(this.style.backgroundImage)) {
          this.style.backgroundImage = 'url(' + source + ')';
          if(typeof _callback === 'function') _callback.call(this);
          if(typeof callback === 'function') callback.call(this);
        }
      }
    }

    function parseBackgroundImageUrl(string) {
      return string.replace(/url\(([^)]*)\)/, '$1');
    }

    // unveil each image once
    this.not('.unveiled').one('unveil', function() {
      replace.call(this, function() {
        $(this).addClass('unveiled');
      });
    });

    function getWindowPosition() {
      wt = $w.scrollTop();
      wh = $w.height();
      wb = wt + wh;

      if(ch) {
        wl = $w.scrollLeft();
        wr = wl + $w.width();
      }

      // recheck window innerHeight if height is reported as 0
      if(wh === 0) {
        wh = window.innerHeight;
        wb = wt + wh;
      }
    }

    function filter_inview() {
      var $e = $(this);

      var et = $e.offset().top,
          eb = et + $e.height();

      if(!(eb >= wt - th && et <= wb + th)) {
        return false;
      }

      if(!ch) {
        return true;
      }

      // check horizontal constraint as well
      var el = $e.offset().left,
          er = el + $e.width();

      return er >= wl - th && el <= wr + th;
    }

    function unveil() {
      if(images.length === 0) {
        return;
      }

      getWindowPosition();

      // since :visible is expensive, filter by in view first,
      // then by visible
      var inview = images.filter(filter_inview).filter(':visible');

      to_load = inview.trigger('unveil');

      // console.log('[jQuery.unveil] calling unveil with context %o on set %o', options.context, images.length);
      to_load.off('reset').on('reset', function() {
        // console.log('resetting unveil for ' + this.src);
        replace.call(this);
      });

      images = images.not(to_load);

      loaded = loaded.add(to_load);
    }

    $w
    .on('scroll' + suffix + ' lookup' + suffix, function() {
      unveil();
    })

    // on resize, re-examine src to ensure proper size utilized
    .on('resize' + suffix, _.throttle(function() {
      resetSize();
      loaded.trigger('reset');

    // console.log('unveil: throttled unveil');
    }, 200))

    // allow manual call to force reset the unveiled images
    .on('forcereset' + suffix, function() {
      resetSize();
      loaded.trigger('reset');
    });


    resetSize();
    unveil();

    return this;
  };
}));

