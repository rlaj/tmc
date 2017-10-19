define('collections/favorite-players',['require','jquery','backbone','models/score-player','collections/score-players','utils/lb/lb-common'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      ScorePlayer = require('models/score-player'),
      ScorePlayers = require('collections/score-players'),
      LBCommon = require('utils/lb/lb-common')
      ;

  var FavPlayersCollection = Backbone.Collection.extend({

    model: ScorePlayer,
    comparator: 'current_sort_order',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('FavPlayersCollection');
      this.logger.info('Initialize');

      // set up default sort criteria
      this.sort_criteria = 'current_sort_order';

      this.create();
    },

    create: function(params) {
      var favColl = [];

      ScorePlayers.forEach(function(player) {
        this.listenTo(player, 'change:is_fave', this.checkFav);
        this.listenTo(player, 'change:current_sort_order', this.sortFav);
        if(player.get('is_fave')) {
          favColl.push(player);
        }
      }.bind(this));

      favColl =  ScorePlayers.filter(function(player) {
        return player.get('is_fave') === true;
      });
      this.reset(favColl);
    },

    checkFav: function(model) {
      model.get('is_fave') ? this.addFav(model) : this.removeFav(model);
    },

    addFav: function(model) {
      this.add(model);
      this.sortCollection(this.sort_criteria);
      this.logger.info(model.get('name') + ' is added to fav: %o', model);
    },

    removeFav: function(model) {
      this.sortCollection(this.sort_criteria);
      this.remove(model);
      this.logger.info(model.get('name') + ' is removed from favorite: %o', model);
    },

    sortFav: function(model) {
      if(model.get('is_fave')) {
        this.sortCollection(this.sort_criteria);
        this.logger.info(model.get('name') + ', current_sort_order at ' + model.get('current_sort_order') + ' is changed: %o', this);
      }
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

  return FavPlayersCollection;

});
