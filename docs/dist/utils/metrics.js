/* global setAkamaiMediaAnalyticsData akamaiSetViewerId*/

var ffdebug = false;  // turn console messages off
/** *
 * function:  fflog
 * Just a quick function to allow for logging to firebug console.
 *
 * @param type - type of log msg  (error, info, debug, warn)
 * @param msg - message to log
 *
 * Note:  errors always get logged.
 *
 * @return
 */
function fflog(type, msg) {
  if(ffdebug || type === 'error') {
    console[type].call(console, msg);

    // eval('console.'+type+'('+msg+');');
  }
}

define('utils/metrics',['require','jquery','underscore','utils/browser','settings','AppMeasurement','utils/common'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Browser = require('utils/browser'),
      Settings = require('settings'),
      s = require('AppMeasurement'),
      Common = require('utils/common');

  var Metrics = {
    page_section: '',
    page_title: '',
    page_name: '',

    video_action: 'VOD',

    autotrackS: false,
    setProps: {},
    s_code: s,

    noscript: '<noscript><a href="http://www.omniture.com" title="Web Analytics"><img src="http://metrics.masters.com/b/ss/ibmtestmasters1/1/H.21--NS/0?events=event2" height="1" width="1" border="0" alt="" /></a></noscript>',

    /**
     * Tracks individual 'page views' in the traditional sense
     * @param  {Object} data  Contains any and all omniture specific prop values needed to be set to track the given page load call
     * @param  {String} title Specific page title, if provided, to assign for metrics purposes
     * @return {Object}       Returns an element containing the <noscript> tag for omniture to be written out if desired
     */
    trackPageView: function(data) {
      // Need to rely on global pageData object to pass through page-specific data
      console.log(data);
      if(data) {
        // clear existing s values
        this.resetS();

        // apply prop values to omniture object
        this.s(data);
      }

      this.measurePage();

      return {
        el: this.noscript
      };
    },

    measureApp: function() {
      var id = '';
      var mArgs = arguments;
      var mlength = mArgs.length;

       // alert(mArgs.length + " actual parameters");
       // If only 1 parameter was passed in, and that
       // parameter contains an array, treat that array
       // as the arguments array.
      fflog('debug', "'globalMeasure measureApp:  parameter[0] type:  ',mArgs[0].constructor");
      if(mlength === 1 && mArgs[0].constructor === Array) {
        mArgs = mArgs[0];
      }

      fflog('debug', "'globalMeasure measureApp:  interpreted parameters:  ' , mlength");

      if(mArgs[0] === 'home page') {
        mArgs[0] = 'Home';
      }
      for(var i = 0; i < mlength; i++) {
        console.log('measureApp - constr - args:%o', mArgs[i].constructor);
        if(mArgs[i].constructor !== Array) {
          fflog('debug', "'globalMeasure measureApp:  mArgs[%d] type:  ', i, mArgs[i].constructor, '  value:  ', mArgs[i]");
          if(i === 0) {
            id += mArgs[i];
          } else {
            id += ':' + mArgs[i];
          }
        }        else {
          console.log('measureApp - error - args:%o', mArgs[i]);
          fflog('error', "'globalMeasure measureApp:  parameter[%d] is an invalid type:  ', i, mArgs[i].constructor");
          return;
        }
      }

      if(s.suppressEvent2) {
        s.events = null;
      }
      s.events = 'event17';
      s.linkTrackVars = s.apl(s.linkTrackVars, 'events', ',', 1);
      s.linkTrackEvents = s.apl(s.linkTrackEvents, 'event17', ',', 1);

      // Share links
      console.log('measureApp - %o', mArgs);
      if(mArgs[2] === 'Share') {
        if(mArgs[3] !== undefined && mArgs[3] !== '' && mArgs[3] !== 'Close') {
          s.linkTrackVars += ',prop50';
        }
      } else

      // Video Playback
      if(mArgs[mlength - 1].indexOf('.smil') !== -1) {
        s.prop33 = mArgs[mlength - 1];
        s.linkTrackVars += ',prop33';
      } else

      // Account for Most Popular Photos and Most Popular Videos
      // Don't track for show/hide caption or full screen enter/exit
      if((mArgs[0] === 'Photo Gallery') && mArgs[1].indexOf('Caption') === -1 && mArgs[1].indexOf('Full Screen') === -1) { // || (mArgs[2] !== undefined && mArgs[2].indexOf("Photo") != -1)) {
        s.linkTrackVars += ',prop31,prop16,prop20';
      } else

      // Add/Remove Favorite Players
      if(mlength >= 3 && mArgs[mlength - 2].indexOf('Favorite') !== -1) {
        s.linkTrackVars += ',prop47,prop48';
      } else

      // Track Player Select
      if(mlength === 4 && mArgs[0] === 'Track' && mArgs[2] === 'Player Picker' && parseInt(mArgs[3], 10) > 0) {
        s.linkTrackVars += ',prop34';
      } else

      // Track Add Compare Player
      if(mlength === 5 && mArgs[0] === 'Track' && mArgs[2] === 'Add Compare Player' && parseInt(mArgs[4], 10) > 0) {
        s.linkTrackVars += ',prop34';
      } else

      // Track Live Video Change
      if(mlength === 4 && mArgs[0] === 'Track' && mArgs[2] === 'Live Video' && mArgs[3] === 'Open') {
        s.linkTrackVars += ',prop30';
      } else
      if(mlength === 5 && mArgs[0] === 'Track' && mArgs[2] === 'Live Video' && mArgs[4] !== 'Open' && mArgs[4] !== 'Close') {
        s.linkTrackVars += ',prop30';
      }

      if(s.suppressEvent2 !== 'event17') {
        s.linkTrackVars += ',prop11,prop12,prop13';
      }

      s.tl(this, 'o', id);

      fflog('debug', '"globalMeasure measureApp:  id value:  ' + id + '"');

      if(id.indexOf(':') !== -1) {
        var measureAppCMCategory = id.substring(0, id.indexOf(':'));
        var measureAppCMElement = id.substring(id.indexOf(':') + 1);
        if(typeof(cmCreateElementTag) === 'function') {
          cmCreateElementTag(measureAppCMElement, measureAppCMCategory);
        }
      }

      // reset linkTrack* values so it's fresh for next call
      s.linkTrackVars = '';
      s.linkTrackEvents = '';
    },

    /**
     * Measurement call for galleries and inline video loads
     */
    measureAppMediaLoad: function() {
      var id = '';
      var mArgs = arguments;
      var mlength = mArgs.length;

       // alert(mArgs.length + " actual parameters");
       // If only 1 parameter was passed in, and that
       // parameter contains an array, treat that array
       // as the arguments array.
      fflog('debug', "'globalMeasure measureApp:  parameter[0] type:  ',mArgs[0].constructor");
      if(mArgs.length === 1 && mArgs[0].constructor === Array) {
        mArgs = mArgs[0];
      }

      fflog('debug', "'globalMeasure measureApp:  interpreted parameters:  ' , mArgs.length");

      id = '';
      for(var i = 0; i < mArgs.length; i++) {
        if(mArgs[i].constructor !== Array) {
          fflog('debug', "'globalMeasure measureApp:  mArgs[%d] type:  ', i, mArgs[i].constructor, '  value:  ', mArgs[i]");
          if(i === 0) {
            id += mArgs[i];
          } else {
            id += ':' + mArgs[i];
          }
        } else {
          fflog('error', "'globalMeasure measureApp:  parameter[%d] is an invalid type:  ', i, mArgs[i].constructor");
          return;
        }
      }

      s.linkTrackVars = s.apl(s.linkTrackVars, 'events', ',', 1);
      if(mArgs[mlength - 2].indexOf('VOD') > -1 || mArgs[mlength - 1].indexOf('Flyover') > -1) {
        if(s.prop33 === undefined || s.prop33 === '') {
          s.prop33 = mArgs[mlength - 1];
        }
        s.prop17 = 'VOD:' + s.prop33;
        s.linkTrackVars = s.apl(s.linkTrackVars, 'prop17,prop33', ',', 1);
      }

      s.events = 'event17';
      s.linkTrackEvents = 'event17';
      s.linkTrackVars = s.apl(s.linkTrackVars, 'prop11,prop12,prop13', ',', 1);

      s.tl(this, 'o', id);

      fflog('debug', '"globalMeasure measureApp:  id value:  ' + id + '"');

      // reset linkTrack* values so it's fresh for next call
      s.prop33 = '';
      s.linkTrackVars = '';
      s.linkTrackEvents = '';
    }, // measureAppMediaLoad

    measureVideoPlayer: function() {
      var id = '';
      var mArgs = arguments;
      var mlength = mArgs.length;

       // alert(mArgs.length + " actual parameters");
       // If only 1 parameter was passed in, and that
       // parameter contains an array, treat that array
       // as the arguments array.
      fflog('debug', "'globalMeasure measureApp:  parameter[0] type:  ',mArgs[0].constructor");
      if(mArgs.length === 1 && mArgs[0].constructor === Array) {
        mArgs = mArgs[0];
      }

      fflog('debug', "'globalMeasure measureApp:  interpreted parameters:  ' , mArgs.length");

      for(var i = 0; i < mArgs.length; i++) {
        if(mArgs[i].constructor !== Array) {
          fflog('debug', "'globalMeasure measureApp:  mArgs[%d] type:  ', i, mArgs[i].constructor, '  value:  ', mArgs[i]");
          if(i === 0) {
            id += mArgs[i];
          } else {
            id += ':' + mArgs[i];
          }
        } else {
          fflog('error', "'globalMeasure measureApp:  parameter[%d] is an invalid type:  ', i, mArgs[i].constructor");
          return;
        }
      }

      // by default, we want to suppress event2
      s.events = 'event17';
      s.linkTrackVars = s.apl(s.linkTrackVars, 'prop11,prop12,prop13', ',', 1);
      s.linkTrackEvents = s.apl(s.linkTrackEvents, 'event17', ',', 1);

      // capture video start event
      if(mlength >= 3 && mArgs[2] === 'Start') {
        s.linkTrackVars = 'eVar27';
        s.linkTrackEvents = 'event50';
        s.suppressEvent2 = 'event50';
      } else

      // capture video complete event
      if(mlength >= 3 && mArgs[2] === 'Complete') {
        s.linkTrackVars = 'eVar27';
        s.linkTrackEvents = 'event51';
        s.suppressEvent2 = 'event51';
      } else

      // capture panel on/off events
      if(mlength >= 3 && mArgs[2].indexOf('Panel') > -1) {
        s.linkTrackVars = 'prop57,eVar57';
        s.suppressEvent2 = '';
      } else

      // capture popout event
      if(mlength >= 3 && mArgs[2].indexOf('Popout') > -1) {
        s.linkTrackVars = '';
        s.suppressEvent2 = '';
      }

      s.tl(this, 'o', id);

      fflog('debug', '"globalMeasure measureApp:  id value:  ' + id + '"');

      // reset linkTrack* values so it's fresh for next call
      s.linkTrackVars = '';
      s.linkTrackEvents = '';
      s.suppressEvent2 = 'no';
    },

    setPageMetrics: function(title) {
      // update Metrics page section and title values
      this.setPageSection();
      this.setPageTitle(title);

      this.setPageName();
    },

    measurePage: function() {
      this.doPageMeasurement();

      // done with page measurement, all future calls to Metrics.s
      // shoudl auto-assign linkTrackVars, linkTrackEvents based
      // on the keys passed in the data
      this.autotrackS = true;
    },

    setPageName: function() {
      var pageNameVal = '';
      var page_name = this.page_title;
      if(page_name === '') {
        pageNameVal = document.getElementsByTagName('htsearch');
        if(pageNameVal.length > 0) {
          page_name = pageNameVal[0].getAttribute('content');
        }
      }

      this.pageNameVal = pageNameVal;
      this.page_name = page_name;
    },

    doPageMeasurement: function() {
      var page_section = this.page_section;
      if((page_section.length > 0)) {
        s.pageName = page_section;
        if(this.page_name.length > 0 && this.page_name !== page_section) {
          s.pageName += ':' + this.page_name;  // Page Name

          var props = s.pageName.split(':');

          s.prop1 = props[0] + ':' + props[1];        // Section:Subsection 1
          s.prop2 = s.prop1;                          // Section:Subsection 1:Subsection 2
          if(props.length > 2) {
            s.prop2 = s.prop2 + ':' + props[2];
          }
          s.prop3 = s.prop2;                          // Section:Subsection 1:Subsection 2:Subsection 3
          if(props.length > 3) {
            s.prop3 = s.prop3 + ':' + props[3];
          }
          s.prop15 = 'en_US';               // Language
          s.channel = props[0];                       // Site Section
        } else {
          s.prop1 = s.pageName;
          s.prop2 = s.prop1;
          s.prop3 = s.prop2;
          s.prop15 = 'en_US';               // Language
          s.channel = s.pageName;                       // Site Section
        }

        s.prop11 = s.pageName;
        s.prop12 = s.channel;
        s.prop13 = 'www';
      } else {
        s.pageName = '';
        s.prop15 = 'en_US';               // Language
        s.channel = page_section;
      }

      // alert(s.pageName);

      if(!Common.internalRef()) {
        s.prop18 = document.referrer;
      }

      // hero click report metrics
      var qsh = location.search.substring(1);

      // make sure this load actually came from a click on masters.com
      if(document.referrer.search(/\.masters\.com/) > -1 && qsh.indexOf('promo=hero_') > -1) {
        // s.prop49 = qsh.substring(qsh.indexOf('promo=hero_') + 11);
        // if(s.prop49.indexOf('&') > -1) {
        //   s.prop49 = s.prop49.substring(0, s.prop49.indexOf('&'));
        // }
        s.events = s.apl(s.events, 'event6', ',', 1);
      }

      s.prop41 = 'D=g';
      s.eVar41 = 'D=g';

      console.log('pageMeasurement pageName - %o', s.pageName);

      // if((typeof hasReqestedFlashVersion != 'undefined' && !hasReqestedFlashVersion) || page_name.indexOf('Live Index Page') == -1 || !liveVideo){ // don't call on page load if on live video page and video is live
      var s_code = s.t();
      if(s_code) {
        document.writeln(s_code);
      }
    },

    setPageSection: function() {
      var path = location.pathname.substring(0);

      if(this.page_section === '') {
        // auto set section name when possible
        if(path.indexOf('/watch/') !== -1) { this.page_section = 'Watch'; }
        if(path.indexOf('/news/articles/') !== -1) { this.page_section = 'Articles'; }
        if(path.indexOf('/news/gallery/') !== -1) { this.page_section = 'Photo Gallery'; }
        if(path.indexOf('/news/photos/') !== -1) { this.page_section = 'Photo Gallery'; }
        if(path.indexOf('/scores/') !== -1) { this.page_section = 'Leader Board'; }
        if(path.indexOf('/scores/track') !== -1) { this.page_section = 'Track'; }
        if(path.indexOf('/scores/stats/') !== -1) { this.page_section = 'Tournament Info'; }
        if(path.indexOf('/tournament/') !== -1) { this.page_section = 'Tournament Info'; }
        if(path.indexOf('/patron/') !== -1) { this.page_section = 'Patron Info'; }
        if(path.indexOf('/shop/') !== -1) { this.page_section = 'Shop'; }
        if(path.indexOf('/course/') !== -1) { this.page_section = 'Course'; }
        if(path.indexOf('/players/player_') !== -1) { this.page_section = 'Players'; }
        if(path.indexOf('/players/invitees_') !== -1) { this.page_section = 'Players'; }
        if(path.indexOf('/players/pairings/') !== -1) { this.page_section = 'Tee Times'; }
        if(path.indexOf('/info/') !== -1) { this.page_section = 'Site Functions'; }
        if(path.indexOf('/feedback/') !== -1) { this.page_section = 'Site Functions'; }
        if(path.indexOf('/search/') !== -1) { this.page_section = 'Site Functions'; }
        if(path.indexOf('/tribute/') !== -1) { this.page_section = 'Tribute'; }
        if(this.page_section === '') {
          console.info('still undefined: ' + path);
        }
      }
    },

    setPageTitle: function(title) {
      if(this.page_title === '') {
        // if pageTitle was written out for the page for CMS content (articles, vod, etc), use it
        if(title !== undefined) {
          this.page_title = title;
        }
        if(this.page_title === '') {
          this.page_title = $('title').text().replace(' - ' + Settings.tournament_year + ' Masters Tournament', '');
          var dash = this.page_title.indexOf(' - ');
          if(dash !== -1 && dash <= 13) {
            this.page_title = this.page_title.substring(dash + 3);
          }
        }
      }
    },

    /**
     * Resets page_* values back to default empty string
     * so that it's ready for processing for the next page view call
     */
    resetPageValues: function() {
      this.page_title = this.page_section = this.page_name = '';

      // don't auto-assign linkTrack* prop values
      this.autotrackS = false;
    },

    /**
     * Utility function to simplify setting of s.* properties
     * including but not limited to propX, eVarX, linkTrackVars, etc
     * @param {Object} props - hash of all properties to be set on 's'
     */
    s: function(props) {
      _.extend(this.setProps, props);
      _.extend(s, props);
    },

    trackS: function(props) {
      _.extend(this.setProps, props);

      // don't need to reset these because they are auto-reset to ''
      // at the end of each measureApp call
      props.linkTrackVars = s.linkTrackVars;
      props.linkTrackEvents = s.linkTrackEvents;
      var keys = _.keys(props);

      // check if prop* or eVar* keys were passed
      var propKeys = _.groupBy(keys, function(key) {
        return key.substring(0, 4);
      });

      // if so, auto-add those properties to linkTrackVars
      if(propKeys.prop) {
        props.linkTrackVars += ',' + propKeys.prop.join(',');
      }
      if(propKeys.eVar) {
        props.linkTrackVars += ',' + propKeys.eVar.join(',');
      }

      // check if events was passed, auto-add to linkTrackEvents
      if(keys.events) {
        props.linkTrackEvents += keys.events;
      }

      _.extend(s, props);
    },

    /**
     * Resets s values back to default for proper measurement by
     * clearing the props set using the setProps object
     */
    resetS: function() {
      var keys = _.keys(this.setProps);
      console.log('resetting s prop values %o', keys);
      for(var i = keys.length - 1; i >= 0; i--) {
        s[keys[i]] = '';
      }
      this.setProps = {};

      // reset s.events so we only track event2 on page load
      s.events = null;
    },

    appMeasure: function(measureString) {
      try {
        if(Browser.apptype.android) {
          Common.sendAndroidMessage('track?text=' + measureString);
        } else if(Browser.apptype.ios) {
          Common.sendiOSMessage('metrics', measureString);
        }
      } catch (e) {
        console.log(e);
      }
    },

    /**
     * Sends measurement action to track a page state change
     * @param  {String} measureString Colon delimited string of linkName to be tracked
     * @param  {Object} contextData   Key/Value pair of context data to be passed
     */
    appState: function(measureString, contextData) {
      try {
        if(Browser.apptype.android) {
          var str = 'track?text=' + measureString + '&metricType=state';
          var dataString = '';
          if(contextData) {
            var keys = _.keys(contextData);
            dataString = '';
            for(var i = 0; i < keys.length; i++) {
              dataString += '&' + keys[i] + '=' + contextData[keys[i]];
            }
          }
          Common.sendAndroidMessage(str + dataString);
        }
      } catch (e) {
        console.log(e);
      }
    },

    appShare: function(e, url) {
      if(Browser.apptype.ios) {
        Common.sendiOSMessage('share', {x: e.pageX, y: e.pageY});
      } else if(Browser.apptype.android) {
        Common.sendAndroidMessage('share' + (url ? '?url=' + encodeURIComponent(url) : ''));
      }
    },

    // force exit link tracking
    openExternal: function(lnk, newWindow, w, h, shared) {
      if(typeof(cmCreateElementTag) === 'function') {
        cmCreateElementTag(lnk, cmCategoryId);
      }

      if(lnk.indexOf('http://' === -1)) {
        switch(lnk) {
          case 'ibm': lnk = 'http://www.ibm.com/'; break;
          case 'tix1': lnk = 'https://oss.ticketmaster.com/html/outsider.htmI?CAMEFROM=&GOTO=https%3A%2F%2Foss.ticketmaster.com%2Fhtml%2Frequest.htmI%3Fl%3DEN%26team%3Dusopentennis%26STAGE%3D1%26PROC%3DBUY%26EventName%3D11DEPSIT'; break;
          default: break;
        }
      }

      // measurement code
      s.events = '';
      s.linkTrackVars = 'events,prop11,prop12,prop13';
      s.linkTrackEvents = '';
      s.tl(this, 'e', lnk);

      if(newWindow) {
        if(w && h) {
          newWindow = window.open(lnk, 'consoleWindow', 'width=' + w + ',height=' + h + ',resizable=yes,status=yes,toolbar=yes,menubar=yes,location=yes');
        } else {
          newWindow = window.open(lnk, 'newWindow', 'menubar=1,toolbar=1,location=1,directories=1,status=1,scrollbars=1,resizable=1');
        }
      } else {
        document.location.href = lnk;
      }
    }
  };

  return Metrics;
});

