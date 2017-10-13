(function(factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD (Register as an anonymous module)
    define('utils/window-size',['utils/pubsub'], factory);
  } else if(typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('utils/pubsub'));
  } else {
    // Browser globals
    factory(PubSub); // eslint-disable-line no-undef
  }
}(function(PubSub) {
  var WindowSize = function() {
    var size = '',
        orientation = '';

    var xsmall = '20em', // 320px
        small = '32.5em', // 590px
        medium = '45em', // 720px
        large = '57.5em', // 920px
        xlarge = '90em'; // 1440px

    var mqllarge, mqlmedium, mqlorientation;

    var sizes = {
      global: 0,
      tablet: 1,
      desktop: 2
    };

    var orientations = {
      landscape: 0,
      portrait: 1
    };

    var console = window.console;
    if(typeof eventsCore !== 'undefined') {
      console = new eventsCore.util.Logger('WindowSize');
      console.log = console.out;
    }

    var setWindowSize = function(s) {
      console.log('[windowSize.js] setting window size to %o', _.findKey(sizes, function(i) { return i === s;}));
      size = s;
    };

    var setWindowOrientation = function(dir) {
      console.log('[windowSize.js] setting window orientation to %o', _.findKey(orientations, function(i) { return i === dir;}));
      orientation = dir;
    };

    var getWindowSize = function() {
      return size;
    };

    var getWindowOrientation = function() {
      return orientation;
    };

    var addMediaListeners = function() {
      // these will always trigger in the order in which they're defined
      // so mqlmedium will still trigger after mqllarge when maximizing to > large from size < medium
      mqllarge = window.matchMedia('screen and (min-width:' + large + ')');
      mqlmedium = window.matchMedia('screen and (min-width:' + medium + ')');

      mqllarge.addListener(function(mql) {
        if(mql.matches) {
          setWindowSize(sizes.desktop);
          PubSub.trigger('windowsize:desktop:enter');
        } else {
          setWindowSize(sizes.tablet);
          PubSub.trigger('windowsize:tablet:enter');
        }

        // console.info('desktop listener');
      });

      mqlmedium.addListener(function(mql) {
        if(mql.matches) {
          // don't run if this gets called because we've skipped from desktop down to global
          if(size !== sizes.desktop) {
            setWindowSize(sizes.tablet);
            PubSub.trigger('windowsize:tablet:enter');
          }
          PubSub.trigger('windowsize:global:exit');
        } else {
          setWindowSize(sizes.global);
          PubSub.trigger('windowsize:global:enter');
        }

        // console.info('tablet listener');
      });

      mqlorientation = window.matchMedia('screen and (max-aspect-ratio: 13/9)');
      mqlorientation.addListener(function(mql) {
        if(mql.matches) {
          setWindowOrientation(orientations.portrait);
          PubSub.trigger('windowsize:orientation:portrait');
        } else {
          setWindowOrientation(orientations.landscape);
          PubSub.trigger('windowsize:orientation:landscape');
        }
      });
    };

    var init = function() {
      addMediaListeners();
      setWindowOrientation(orientations.landscape);
      if(mqlorientation.matches) {
        setWindowOrientation(orientations.portrait);
      }

      var c = sizes.global;
      if(mqllarge.matches) {
        c = sizes.desktop;
      } else if(mqlmedium.matches) {
        c = sizes.tablet;
      }

      // // global | tablet | desktop
      // // var c = window.getComputedStyle(document.body,':after').getPropertyValue('content');
      // // replace any extra quotes (FF)
      setWindowSize(c); // .replace(/"/g,'');
    };

    init();

    return {
      size: getWindowSize,
      orientation: getWindowOrientation,
      sizes: sizes,
      orientations: orientations
    };
  };

  var win = new WindowSize();

  // export win as global window object to support non-AMD plugins
  // like jquery.unveil
  window.windowInfo = win;

  return win;
}));

