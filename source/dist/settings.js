/**
 * Treat this as a JSON data object, fetched via a Settings model instead??
 */
(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD (Register as an anonymous module)
    define('settings',['jquery'], factory);
  } else if(typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    root.Settings = factory($);
  }
}(this, function($) {
  // initialize with default settings
  var Settings =  {
    'tournament_year': 2017,

    // set this var to false when nav is invitees, true when it's players page
    'playersListNav': true,

    // set this var to false when nav is tournament LB, true when it's Par 3
    'leaderboardPar3': false,

    // set this to true to show the favorites filter on the home and watch pages
    'showFavorites': true,

    // uncomment this var only when round 1 pairings should be default on tee times
    // if commented out, tee times will default to latest round available in data feed
    'default_pairings_round': 1,

    // set this to enable/disable console output by default
    // - can be overridden with query param +debug+ set to "true|console"
    'enable_logging': true,

    'default_broadcast_channel': 'simul',

    'Scores': {
      'pre': false, // scoring has not yet begun, don't fetch score file
      'live': true, // scoring is active
      'post': false, // scoring has completed, only fetch score file once

      'stub_track': false // whether Track should be stubbed or not
    }
  };

  /**
   * Sample file contents of settings.json that match the defaults above.
   * Delete all comments from JSON file, else won't parse as valid JSON.
   *
   {
     "ty": 2016,    // tournament_year
     "pln": true,   // playersListNav
     "p3": false,   // leaderboardPar3
     "f": true,     // shotFavorites
     "pr": 1,       // default_pairings_round
     "el": true,    // enable_logging
     "ch": "simul", // default_broadcast_channel
     "s": {         // Scores
       "p": false,  //  pre
       "l": true,   //  live
       "t": false,  //  post
       "st": false  //  stub_track
     }
   }
   */

  // synchronously fetch updated settings
  $.ajax('/en_US/xml/man/settings.json', {
    async: false,
    dataType: 'json',
    success: function(data) {
      Settings = {
        tournament_year: data.ty,
        playersListNav: data.pln,
        leaderboardPar3: data.p3,
        showFavorites: data.f,
        default_pairings_round: data.pr,
        enable_logging: data.el,
        default_broadcast_channel: data.ch,
        Scores: {
          pre: data.s.p,
          live: data.s.l,
          post: data.s.t,
          stub_track: data.s.st
        }
      };
    }
  });

  return Settings;
}));

