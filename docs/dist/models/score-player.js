/**
 * ScorePlayer is a Model representation of all associated score related player data,
 * used mainly for Leader Board & Track
 */

define('models/score-player',['require','jquery','backbone','utils/pubsub','utils/lb/lb-common','models/base-player'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      LBCommon = require('utils/lb/lb-common'),
      BasePlayer = require('models/base-player')
  ;

  var ScorePlayer = BasePlayer.extend({
    defaults: {
      id: '',
      display_name: '',
      display_name2: '',
      full_name: '',
      first_name: '',
      last_name: '',
      country_long: '',
      country: '',
      live: '',
      video: false,
      pos: '',
      amateur: false,
      past: false,
      firsttimer: false,
      status: '',
      active: false,
      us: false,
      intl: false,
      teetime: '',
      tee_order: '',
      sort_order: '',
      start: '',
      group: '',
      today: '',
      thru: '',
      groupHistory: '',
      thruHistory: '',
      lastHoleWithShot: '',
      lastLocation: '',
      groupLocation: '',
      topar: '',
      total: '',
      movement: '',
      r1: '',
      r2: '',
      r3: '',
      r4: '',
     // additional attributes
      current_sort_order: '', // sort_order just for current round - defined in score-players.js collection
      is_projected_cut: false, // set True for the 'first' player who doesn't make the cut based on cutLine data
      is_trackable: false, // players that are on Track sets true
      name: '', // display name with (A) status
      r1_prior: '', // round prior score
      r2_prior: '',
      r3_prior: '',
      r4_prior: '',
      r1_roundscores: '',
      r2_roundscores: '',
      r3_roundscores: '',
      r4_roundscores: '',
      r1_score: '', // R1 score that's used for sorting R1 column in trad view
      r2_score: '', // sorts R2 column in trad view
      r3_score: '', // sorts R3 column in trad view
      r4_score: '', // sorts R4 column in trad view
      r1_sort_order: '', // round specific sort order for concurrent rounds
      r2_sort_order: '', // round specific sort order for concurrent rounds
     },
    show: false, // [TODO] - work on this with Player Filter track whether to show this player in a view

    initialize: function() {

      this.logger = new eventsCore.util.Logger('Player Model');
      this.logger.debug('Initialize');

      // format attribute and value for easier access
      var name = this.get('display_name') + (this.get('amateur') ? ' (A)' : '');
      this.set('name', name);

      // detect what's changed in the model
      this.on('change', function() {
        this.logger.debug(this.get('name') + ' changed :%o', this.changedAttributes());
      });

      BasePlayer.prototype.initialize.apply(this, arguments);

      this.set(LBCommon.lbShowPlayerFlag.EVERYWHERE, true);
      this.set(LBCommon.lbShowPlayerFlag.MAIN, true);

    },

    parse: function(response) {
      /** setScoreData:
      * - R#_prior, r#_score (Round score total), r#_roundscores
      */
      var r1num, r2num, r3num, r4num;
      r1num = response.r1.split('|');
      r2num = response.r2.split('|');
      r3num = response.r3.split('|');
      r4num = response.r4.split('|');

      response.r1_prior = r1num[0];
      response.r2_prior = r2num[0];
      response.r3_prior = r3num[0];
      response.r4_prior = r4num[0];

      // setting up Round# score for sorting column
      response.r1_score = r1num[1] === '' ? 500 : parseInt(r1num[1]);
      response.r2_score = r2num[1] === '' ? 500 : parseInt(r2num[1]);
      response.r3_score = r3num[1] === '' ? 500 : parseInt(r3num[1]);
      response.r4_score = r4num[1] === '' ? 500 : parseInt(r4num[1]);

      // for OU score comparison
      response.r1_roundscores = r1num[2];
      response.r2_roundscores = r2num[2];
      response.r3_roundscores = r3num[2];
      response.r4_roundscores = r4num[2];

      /** isTrackable
      */
      var isTrackable = (response.lastHoleWithShot !== '|' && response.status !== 'D');
      if(isTrackable) {
        response.is_trackable = true;
      } else {
        response.is_trackable = false;
      }

      return response;
    }
  });
  return ScorePlayer;
});

