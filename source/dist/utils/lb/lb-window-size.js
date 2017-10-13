define('utils/lb/lb-window-size',['require','utils/pubsub'],function(require) {
  var PubSub = require('utils/pubsub');

  var lbWindowSize = function() {
    var size = '',
        orientation = '';

  var lbMobilePortrait = '20em',  // 320px
      lbMobileLandscape = '30em', // 480px
      lbmedium = '45em',  // 720px
      lblarge = '57.5em', // 920px
      // md - 2016 change lblarger to 1000 width so ipad will show small skeuomorphic view
      // md - 2015 was 75em', // 1200px
      lblarger = '64em', // 1024px
      lblargest = '90em', // 1440px
      lblargerHeight = '38.750em', // 620px
      lblargestHeight = '50em'; // 800px

    var mqllblargest, mqllblarger, mqllblarge, mqllbmedium, mqlMobileLandscape;

    var sizes = {
      global: 0,
      mobileLandscape: 1,
      tablet: 2,
      desktop: 3,
      smskeuomorphic: 4,
      lgskeuomorphic: 5,
    };

    var orientations = {
      landscape: 0,
      portrait: 1
    };

    var init = function() {
      addMediaListeners();

      var c = sizes.global;
      if (mqllblargest.matches) {
        c = sizes.lgskeuomorphic;
      } else if (mqllblarger.matches) {
        c = sizes.smskeuomorphic;
      } else if (mqllblarge.matches) {
        c = sizes.desktop;
      } else if (mqllbmedium.matches) {
        c = sizes.tablet;
      } else if (mqlMobileLandscape.matches) {
        c = sizes.mobileLandscape;
      }

      // // global | tablet | desktop
      // // var c = window.getComputedStyle(document.body,':after').getPropertyValue('content');
      // // replace any extra quotes (FF)
      setWindowSize(c); //.replace(/"/g,'');
    }

    var addMediaListeners = function() {
      // these will always trigger in the order in which they're defined
      // so mqlmedium will still trigger after mqllarge when maximizing to > large from size < medium
      mqllblargest = window.matchMedia('screen and (min-width:'+lblargest+') and (min-height:'+lblargestHeight+')');
      mqllblarger = window.matchMedia('screen and (min-width:'+lblarger+') and (min-height:'+lblargerHeight+')');
      mqllblarge = window.matchMedia('screen and (min-width:'+lblarge+')');
      mqllbmedium = window.matchMedia('screen and (min-width:'+lbmedium+')');
      mqlMobileLandscape = window.matchMedia('screen and (min-width:'+ lbMobileLandscape +')');


      mqllblargest.addListener(function(mql) {
        if (mql.matches) {
          setWindowSize(sizes.lgskeuomorphic);
          PubSub.trigger('windowsize:lbLargeSkeuomorphic:enter');
        } else {
          setWindowSize(sizes.smskeuomorphic);
          PubSub.trigger('windowsize:lbSmallSkeuomorphic:enter');
        }
      });

      mqllblarger.addListener(function(mql) {
        if (mql.matches) {
          if (size !== sizes.lgskeuomorphic) {
            setWindowSize(sizes.smskeuomorphic);
            PubSub.trigger('windowsize:lbSmallSkeuomorphic:enter');
          }
          PubSub.trigger('windowsize:lbDesktop:exit')
        } else {
          setWindowSize(sizes.desktop);
          PubSub.trigger('windowsize:lbDesktop:enter');
        }
      });

      mqllblarge.addListener(function(mql) {
        if (mql.matches) {
          if (size === sizes.desktop) {
            setWindowSize(sizes.desktop);
            PubSub.trigger('windowsize:lbDesktop:enter');
          }
          PubSub.trigger('windowsize:lbTablet:exit')
        } else {
          setWindowSize(sizes.tablet);
          PubSub.trigger('windowsize:lbTablet:enter');
        }
      });

      mqllbmedium.addListener(function(mql) {
        if (mql.matches) {
          if (size === sizes.tablet) {
            setWindowSize(sizes.tablet);
            PubSub.trigger('windowsize:lbTablet:enter');
          }
          PubSub.trigger('windowsize:lbMobileLandscape:exit')
        } else {
          setWindowSize(sizes.mobileLandscape);
          PubSub.trigger('windowsize:lbMobileLandscape:enter');
        }
      });

      mqlMobileLandscape.addListener(function(mql) {
        if (mql.matches) {
          if (size === sizes.mobileLandscape) {
            setWindowSize(sizes.mobileLandscape);
            PubSub.trigger('windowsize:lbMobileLandscape:enter');
          }
          PubSub.trigger('windowsize:lbGlobal:exit')
        } else {
          setWindowSize(sizes.global);
          PubSub.trigger('windowsize:lbGlobal:enter');
        }
      });


    }

    var setWindowSize = function(s) {
      size = s;
      console.log('[lbWindowSize.js] setting window size to ' + Object.keys(sizes)[s]);
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

  return win;
});
