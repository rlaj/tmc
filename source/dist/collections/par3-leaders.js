define('collections/par3-leaders',['require','backbone','utils/lb/lb-common','models/par3-player','collections/par3-players'],function(require) {
  var Backbone = require('backbone'),
      LBCommon = require('utils/lb/lb-common'),
      Par3Player = require('models/par3-player'),
      Par3Players = require('collections/par3-players')
      ;

  var Par3LeadersPlayersList = Backbone.Collection.extend({
    model: Par3Player,

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3LeadersPlayersList');
      this.logger.info('Initialize');

      // set up default sort criteria
      this.sort_criteria = 'current_sort_order';

      this.createCollection();

      this.listenTo(Par3Players, 'add', this.addLeader);
      this.listenTo(Par3Players, 'remove', this.removeLeader);
    },

    createCollection: function(params) {
      this.reset(Par3Players.models);
    },

    addLeader: function(model) {
      this.add(model);
      this.sortCollection(this.sort_criteria);
      this.logger.info(model.get('name') + ' is added to par3 leaders collection: %o', model);
    },

    removeLeader: function(model) {
      this.sortCollection(this.sort_criteria);
      this.remove(model);
      this.logger.info(model.get('name') + ' is removed from par3 leaders collection: %o', model);
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

        if(criteria === 'total') {
          if(aSortVal === '') {
            aSortVal = '9999999999';
          }
          if(bSortVal === '') {
            bSortVal = '9999999999';
          }
        }

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

  return Par3LeadersPlayersList;
});
