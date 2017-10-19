define('utils/geoblock',['require','jquery','settings','utils/pubsub','jquery.cookie'],function(require) {
  var $ = require('jquery'),
      Settings = require('settings'),
      PubSub = require('utils/pubsub')
      ;

  // This doesn't need a stored return value since it just extends jQuery
  require('jquery.cookie');

  var Geo = (function($) {
    var block = false;
    var loaded = false;
    var _elem = undefined;
    var _pollOnAir = undefined;

    var geoBlock = function(geo,geovalue) {
      if (geovalue)
        geovalue = "true";
      else{
        geovalue = "false";
      }

      // what is this??
      // if(shedAllGeos){ $('#subPromo1').hide(); }  //do this when shedding content

      $.cookie("geo_cookie",geovalue,{ path: '/' });
      geoBlockHelper();
    }

    var geoBlockHelper = function() {
      block = ($.cookie("geo_cookie") === 'true');
      if(!block){
        // Check the on air status every 30 seconds
        // and if not geoblocked
        if(_pollOnAir === undefined && !Settings.Scores.post) {
          _pollOnAir = setInterval(function() {
            _pollOnAirStatus();
          }, 30000);
        }
        // set initial live state
        _pollOnAirStatus();
      }
      loaded = true;
      if(typeof Geo.checkAction === 'function') {
        Geo.checkAction();
      }
    }

    var isBlocked = function() {
      return block;
    }

    var isLoaded = function() {
      return loaded;
    }

    var _pollOnAirStatus = function() {
      $.ajax({
        type: "GET",
        url: "/en_US/xml/gen/alc/liveVideo.js",
        success: function(){
          PubSub.trigger('livevideo:update');
        },
        error: function(){

        },
        dataType: "script",
        cache: true
      });
    }

    return {
      isBlocked : isBlocked,
      isLoaded: isLoaded,
      geoBlock : geoBlock,
      geoBlockHelper : geoBlockHelper
    }
  })($);

  // need window.geoBlock defined for geocheck.js return function call
  window.geoBlock = Geo.geoBlock;

  /********************************************************************
  get or set geoblock cookie
  ********************************************************************/
  // Only check geo if not on welcome screen.
  if((typeof section === 'undefined' || (section !== undefined && section !== 'welcome')) &&
     (typeof inlineVideo === 'undefined' || (inlineVideo !== undefined && !inlineVideo.embed))) {
    if($.cookie("geo_cookie")){
      Geo.geoBlockHelper();
    } else {
      var g = document.createElement("script");
      g.src = "http://masters3.edgesuite.net/amencornerlive/geo/geocheck.js";
      g.type="text/javascript";
      document.getElementsByTagName("head")[0].appendChild(g);
    }
  }

  return Geo;
});
