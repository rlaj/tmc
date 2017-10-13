/**
 * ScorePlayersList is a collection of Players that are used to
 * access score data for display mainly on Leader Board & Track.
 */
define('collections/score-players',['require','jquery','backbone','models/score-player','utils/lb/lb-common','utils/pubsub','collections/base-players'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      ScorePlayer = require('models/score-player'),
      LBCommon = require('utils/lb/lb-common'),
      PubSub = require('utils/pubsub'),
      BasePlayers = require('collections/base-players')
  ;

  var ScorePlayersList = BasePlayers.extend({
    model: ScorePlayer,
    url: '/en_US/scores/feeds/scores.json',
    // comparator: 'current_sort_order',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('ScorePlayersList');
      this.logger.info('Initialize');

      this.changed_models = [];

      // set up default sort criteria
      this.sort_criteria = 'current_sort_order';

      // listen to the current_sort_order change to reposition playerRow in trad / OU view
      this.on('change:current_sort_order', this.triggerEvent);

      // [TODO] - refine this so r2_sort_order and current_sort_order don't get crashed. Check animation - don't see the rows animating when concurrent round row swaps
      this.on('change:r1_sort_order', this.triggerEvent);
      this.on('change:r2_sort_order', this.triggerEvent);

      // trad sortable column data are changed, trigger event
      // so trad.js can check if header sort is active
      // then sort by active sortItem for both score-collection and fav-collection
      this.on('change:today', this.triggerTradSortEvent);
      this.on('change:thru', this.triggerTradSortEvent);
      this.on('change:r1_score', this.triggerTradSortEvent);
      this.on('change:r2_score', this.triggerTradSortEvent);
      this.on('change:r3_score', this.triggerTradSortEvent);
      this.on('change:r4_score', this.triggerTradSortEvent);
      this.on('change:total', this.triggerTradSortEvent);

      this.on('sync', this.onFetchComplete);
      this.listenTo(PubSub, 'scorecollection:sort', this.onCollectionSort);

      this.oldCurrentRound = '';
      this.oldPlayoffStatus = false;
    },

    fetch: function() {
      this.changed_models = [];
      BasePlayers.prototype.fetch.apply(this, arguments);
    },

    parse: function(response) {
      this.showAsterisk = false;
      this.allTimeExists = false;
      this.concurrentExists = false;
      this.playoffExists = false;
      this.playoffStatus = false;

      this.data = response.data;

      // format currentRound to return just round number, e.g.) 3
      this.currentRound = this.data.currentRound.lastIndexOf('1') + 1;

      // cutline
      this.cutLine = response.data.cutLine;

      // check if Concurrent Round exists
      this.currentRounds = this.data.currentRound;
      var concurrentRounds = (this.currentRounds.length - this.currentRounds.replace(/1/g, '').length);
      if(concurrentRounds > 1) {
        this.concurrentExists = true;
        this.logger.info('concurrent rounds exist');
      }

      // setting up data to score-player model
      // - current_sort_order, r#_sort_order
      this.setSortOrders_DenotesStatus_FirstProjectedCutPlayer();

      // setting up Playoff data to create collection in lb-playoff-player.js
      // need to set it up here so we can listen to this score collection event for
      // playoffExists updates
      if(this.data.playoff !== undefined && this.data.playoff !== '') {
        this.playoffExists = true;
        this.playoffStatus = true; // compare oldPlayoffStatus and trigger event
        this.playoffStartHole = response.data.playoff.starthole;
        this.playoffPlayers = response.data.playoff.player;

        // trigger event and update collection in lb-playoff-players.js
        this.trigger('refresh:playoffData', this.playoffPlayers);
      }

      if(this.oldPlayoffStatus !== this.playoffStatus) {
        this.logger.info('playoff status has been changed');
        PubSub.trigger('change:playoffStatus', this.playoffStatus);
      }

      this.oldPlayoffStatus = this.playoffStatus;

      // fire events based on data changes
      if(this.oldCurrentRound !== undefined && this.currentRound !== this.oldCurrentRound) {
        this.logger.info('current round has been changed');
        this.trigger('change:currentRound', this.currentRound);
      }

      // store values for comparison after score:refresh
      this.oldCurrentRound = this.data.currentRound.lastIndexOf('1') + 1;

      return response.data.player;
    },

    triggerEvent: function(model) {
      this.logger.info('sortOrder:update for ' + model.get('name') + ' :%o', model);
      if(this.changed_models.indexOf(model.id) === -1) {
        this.changed_models.push(model.id);
      }
    },

    // don't want to sort this collection as it will overwrite OU
    // just trigger an event and let trad.js call this.SortColection()
    // Trad uses cloned collection
    triggerTradSortEvent: function(model, value, options) {
      this.logger.info('sortable column data update for ' + model.get('name') + ' :%o', model);
      // only trigger data update if changed value is comparator
      if(model.changed[this.sort_criteria] && this.changed_models.indexOf(model.id) === -1) {
        this.changed_models.push(model.id);
      }
    },

    /**
     * When fetch request completes, check if any models have been marked as having changed.
     * If so, trigger a sortOrder:update event for each model to move it into its new
     * order position
     */
    onFetchComplete: function() {
      PubSub.trigger('scorecollection:sort');
    },

    onCollectionSort: function() {
      this.sortCollection(this.sort_criteria);
      for(var i = this.changed_models.length - 1; i >= 0; i--) {
        var model = this.get(this.changed_models[i]);
        this.trigger('sortOrder:update', model);
      }
    },

    // breaking up parse set up
    setSortOrders_DenotesStatus_FirstProjectedCutPlayer: function() {
      var is_alltimes = false;
      var is_showasterisk = false;
      var cutline_added = false;
      _.each(this.data.player, function(player) {
        // setting up current_sort_order
        var splitSort = player.sort_order.split('|');
        player.current_sort_order = parseInt(splitSort[this.currentRound - 1]);

        // for concurrent rounds, setting up each round sort_order
        player.r1_sort_order = parseInt(splitSort[0]);
        player.r2_sort_order = parseInt(splitSort[1]);
        player.r3_sort_order = parseInt(splitSort[2]);
        player.r4_sort_order = parseInt(splitSort[3]);


        /** setDenotesStatus
        * check if * exists and set this.showAsterisk true to show denote on LB
        * check if tee time exists in the today column
        * flag once if it matches
        */
        if(!is_alltimes && player.today === '' && player.teetime !== '') {
          this.allTimeExists = true;
          this.logger.info('allTimeExists', this.allTimeExists);
          is_alltimes = true;
        }
        if(!is_showasterisk && (player.teetime.indexOf('*') > -1 || player.thru.indexOf('*') > -1)) {
          this.showAsterisk = true;
          this.logger.info('showAsterisk', this.showAsterisk);
          is_showasterisk = true;
        }

        /** set True for the first player who doesn't make the cut based on this.cutLine data
        * assuming the master collection (score-players.js) is always based on current_sort_order
        * because other views are using cloned collection
        */
        var toPar = player.topar;
        toPar = (toPar === 'E') ?  0 : parseInt(toPar);
        if(!cutline_added && toPar > this.cutLine) {
          player.is_projected_cut = true;
          cutline_added = true;
        } else {
          player.is_projected_cut = false;
        }
      }.bind(this)); // ends player each
    },

    // Custom sorting function
    sortCollection: function(criteria) {
      this.comparator = this.criteriaComparator(criteria);
      this.sort();
    },

    criteriaComparator: function(criteria, overloadParam) {
      this.sort_criteria = criteria;

      // for today column sorting
      if(criteria === 'today') {
        return function(a, b) {
          return LBCommon.compareToday(a, b);
        };
      }

      // for thru column sorting
      if(criteria === 'thru') {
        return function(a, b) {
          return LBCommon.compareThru(a, b);
        };
      }

      // other normal sorting
      return function(a, b) {
        var aSortVal = a.get(criteria);
        var bSortVal = b.get(criteria);

        // to match iPad app, sort total using comparePos();
        // if(criteria === 'total') {
        //   var aScoreClass = LBCommon.getFormattedTotalScore(a.attributes);
        //   var bScoreClass = LBCommon.getFormattedTotalScore(b.attributes);

        //   if(aSortVal === '') {
        //     aSortVal = '9999999999';
        //   }
        //   if(bSortVal === '') {
        //     bSortVal = '9999999999';
        //   }

        //   // treat under score as a negative number to properly sort
        //   // when players score is over and smaller numbers, it sorts based on the numbers small to big
        //   // e.g. after R2 - those who missed cut will have smaller total score but it's over, those scores should be listed below other players that play more rounds
        //   if(aScoreClass === 'under') {
        //     aSortVal = -Math.abs(aSortVal);
        //   }
        //   if(bScoreClass === 'under') {
        //     bSortVal = -Math.abs(bSortVal);
        //   }

        //   // if both scores are under, treat them as positive number
        //   // so the order doesn't get reversed
        //   if(aScoreClass === bScoreClass) {
        //     aSortVal = Math.abs(aSortVal);
        //     bSortVal = Math.abs(bSortVal);
        //     return LBCommon.comparePos(a, b);
        //   }
        // }

        // sorting criteria
        if(aSortVal < bSortVal) {
            return -1;
        }

        if(aSortVal > bSortVal) {
            return 1;
        } else {
          return LBCommon.comparePos(a, b);
        }
      };
    }
  });

  return new ScorePlayersList();
});
