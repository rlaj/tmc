define('collections/par3-players',['require','utils/lb/lb-common','models/par3-player','collections/base-players','utils/pubsub'],function(require) {
  var LBCommon = require('utils/lb/lb-common'),
      Par3Player = require('models/par3-player'),
      BasePlayers = require('collections/base-players'),
      PubSub = require('utils/pubsub')
      ;

  var Par3AllPlayersList = BasePlayers.extend({
    model: Par3Player,
    url: '/en_US/xml/gen/scores/par3.ios.json',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3AllPlayersList');
      this.logger.info('Initialize');

      // set up default sort criteria
      this.sort_criteria = 'current_sort_order';
      this.par3ContestData;
      this.oldPar3PlayoffStatus = false;
    },

    parse: function(response) {
      this.par3PlayoffExists = false;
      this.par3PlayoffStatus = false;

      this.data = response.data;
      this.par3ContestData = this.data.player.length;

      // setting up Playoff data to create collection in lb-playoff-player.js
      // need to set it up here so we can listen to this score collection event for
      // playoffExists updates
      if(this.data.playoff !== undefined && this.data.playoff !== '') {
        this.par3PlayoffExists = true;
        this.par3PlayoffStatus = true; // compare oldPar3PlayoffStatus and trigger event
        this.par3PlayoffStartHole = response.data.playoff.starthole;
        this.par3PlayoffPlayers = response.data.playoff.player;

        // trigger event and update collection in lb-playoff-players.js
        this.trigger('refresh:par3PlayoffData', this.par3PlayoffPlayers);
      }

      if(this.oldPar3PlayoffStatus !== this.par3PlayoffStatus) {
        this.logger.info('playoff status has been changed');
        PubSub.trigger('change:par3PlayoffStatus', this.par3PlayoffStatus);
      }

      this.oldPar3PlayoffStatus = this.par3PlayoffStatus;

      return response.data.player;
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

        if(criteria === 'name') {
          if(aSortVal === '') {
            aSortVal = 'zzzzzzzzzzzzzzz';
          }
          if(bSortVal === '') {
            bSortVal = 'zzzzzzzzzzzzzzz';
          }
        }

        // to match iPad app, use comparePos for total sorting
        // if(criteria === 'total') {
        //   if(aSortVal === '') {
        //     aSortVal = '9999999999';
        //   }
        //   if(bSortVal === '') {
        //     bSortVal = '9999999999';
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

  return new Par3AllPlayersList();
});
