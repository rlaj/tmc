define('utils/lb/par3-window-size',['require','utils/pubsub'],function(require) {
  var PubSub = require('utils/pubsub');

  var lbWindowSize = function() {
    var size = '',
        orientation = '';

  var lbxsmall = '20em',  // 320px
      lbsmall = '32.5em', // 590px
      lbmedium = '45em',  // 720px
      lblarge = '57.5em', // 920px
      lblarger = '75em', // 1200px - not in use on Par 3 page
      lblargest = '90em', // 1440px - not in use on Par 3 page
      lbmediumHeight = '43.250em', // 692px
      lblargeHeight = '50.813em'; // 813px

    var mqllblarge, mqllbmedium;

    var sizes = {
      global: 0,
      tablet: 1,
      desktop: 2,
      smskeuomorphic: 3,
      lgskeuomorphic: 4

    };

    var orientations = {
      landscape: 0,
      portrait: 1
    };

    var init = function() {
      addMediaListeners();

      var c = sizes.global;
      if(mqllblarge.matches) {
        c = sizes.lgskeuomorphic;
      } else if(mqllbmedium.matches) {
        c = sizes.smskeuomorphic;
      } else if(mqllbmedium.matches) {
        c = sizes.tablet;
      } 

      // // global | tablet | desktop
      // // var c = window.getComputedStyle(document.body,':after').getPropertyValue('content');
      // // replace any extra quotes (FF)
      setWindowSize(c); //.replace(/"/g,'');
    }

    var addMediaListeners = function() {
      mqllblarge = window.matchMedia('screen and (min-width:' + lblarge + ') and (min-height:' + lblargeHeight + ')');
      mqllbmedium = window.matchMedia('screen and (min-width:' + lbmedium + ') and (min-height:' + lbmediumHeight + ')');

      mqllblarge.addListener(function(mql) {
        if(mql.matches) {
          setWindowSize(sizes.lgskeuomorphic);
          PubSub.trigger('windowsize:lbLargeSkeuomorphic:enter');
        } else {
          setWindowSize(sizes.smskeuomorphic);
          PubSub.trigger('windowsize:lbSmallSkeuomorphic:enter');
        }
      });

      mqllbmedium.addListener(function(mql) {
        if(mql.matches) {
          // don't run if this gets called because we've skipped from desktop down to global
          if(size !== sizes.lgskeuomorphic) {
            setWindowSize(sizes.smskeuomorphic);
            PubSub.trigger('windowsize:lbSmallSkeuomorphic:enter');
          }
          PubSub.trigger('windowsize:lbGlobal:exit');
        } else {
          setWindowSize(sizes.desktop);
          PubSub.trigger('windowsize:lbGlobal:enter');
        }
      });
    }

    var setWindowSize = function(s) {
      size = s;
      console.log('[par3WindowSize.js] setting window size to ' + Object.keys(sizes)[s]);
    }

    var getWindowSize = function() {
      return size;
    }

    init();

    return {
      size : getWindowSize,
      sizes: sizes
    };
  }

  var win = new lbWindowSize();

  // export win as global window object to support non-AMD plugins
  // like jquery.unveil
  return window.windowInfo = win;
});
