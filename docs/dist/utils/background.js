/**********************************************************************
These functions manipulate the background image when resizing the
browser window - legacy support for IE8, everything else can utilize
background-size: cover
**********************************************************************/
define('utils/background',['require','jquery','utils/browser','utils/pubsub'],function(require) {
  var $ = require('jquery'),
      Browser = require('utils/browser'),
      PubSub = require('utils/pubsub');

  var Background = function() {
    this.init = function(elem, evt) {
      if(evt === undefined) {
        evt = 'resize';
      }

      var that = this;
      // assign backgroundResizeHandler to window.resize action
      // always trigger resize on image load just in case takes time to download
      elem.find('img')
        .one('load', function() { PubSub.trigger(evt); })
        .each(function() {
          if(this.complete) { // cache fix: http://stackoverflow.com/questions/2392410/jquery-loading-images-with-complete-callback
            // calling $(this).trigger('load') conflicts with mootools on Timeline
            // change this back when mootools is removed
            that.backgroundResizeHandler();
          }
        });

      this.elem = elem;

      PubSub.on(evt, this.backgroundResizeHandler.bind(this), {cid: 'background'});

      this.backgroundResizeHandler();
    }

    this.dispose = function() {
      PubSub.off(evt, this.backgroundResizeHandler, {cid: 'background'});
    }

    this.backgroundResizeHandler = function() {
      var $bg = this.elem;
      var $bg_img = $bg.find('img');

      // If the inital image isn't cached, it'll report 0 dimensions, or report width as height
      var w = $bg_img.width(), h = $bg_img.height();
      if (h == 0 || w == 0 || (w <= h+1 && w >= h-1)) {
        // so wait until image has loaded (or is ready) by returning nothing
        // allowing img load/complete state to trigger the method again
        return;
      }

      // ipad
      var landscape = false;
      if(Browser.ios) {
        landscape = (window.orientation % 180) ? true : false;
        if (!$bg.addClass('vertical')) {
          $bg.addClass('vertical').removeClass('horizontal');
        }
        $bg.removeClass('horizontal');
        w = $bg_img.width();
        $bg_img.css('marginLeft', -1 * parseInt(w / 2));
      }
      // everything else
      else {
        var bw = $bg.width(), bh = $bg.height();
        if ($bg.hasClass('horizontal')) {
          // console.info('img h:' + h + ', bg h:' + bh);
          // if image height is less than container, image should now adjust horizontally
          if (h < bh) {
            $bg.addClass('vertical').removeClass('horizontal');
            // prev line changes width settings, need to re-query below
            w = $bg_img.width();
            $bg_img.css('marginLeft', -1 * parseInt(w / 2));
          }
        } else {
          // console.info('img w:' + w + ', bg w:' + bw);
          // if image width is less than container, image should now be fixed horizontally
          if (w < bw) {
            $bg.addClass('horizontal').removeClass('vertical');
            $bg_img.css('marginLeft', 0);
          }
        }
        // in all cases, adjust the vertical position of the image
        // bottom: 50% is set here so that on initial load for slow connections, half of the image doens't appear cut off
        h = $bg_img.height();
        // console.info('image height:' + h + ', margintop: ' + (-1 * parseInt(h/2)));
        // console.info('bg height:' + bh + ', margintop: ' + (-1 * parseInt(bh/2)));
        $bg_img.css({'marginTop': -1 * parseInt(h / 2), 'top': '50%'});
      }
    }

    this.init.apply(this, arguments);

    return this;
  }

  return Background;
});
