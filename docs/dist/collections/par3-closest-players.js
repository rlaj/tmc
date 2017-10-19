define('collections/par3-closest-players',['require','models/par3-closest-player','collections/base-players'],function(require) {
  var Par3ClosestPlayer = require('models/par3-closest-player'),
      BasePlayers = require('collections/base-players')
  ;

  var Par3ClosestPlayersList = BasePlayers.extend({
    model: Par3ClosestPlayer,
    url: '/en_US/xml/gen/scores/par3.ios.json',

    initialize: function() {
      this.logger = new eventsCore.util.Logger('Par3ClosestPlayersList');
      this.logger.info('Initialize');

      // default minimum closestTotal num
      this.closestTotal = 9;
    },

    parse: function(response) {
      this.closestTotal = response.closest.length;

      // fire events based on data changes
      if(this.oldClosestTotal !== undefined && this.closestTotal !== this.oldClosestTotal) {
        this.logger.info('closest players total number has been changed');
        this.trigger('closest:change:closestTotal');
      }

      // store values for comparison after score:refresh
      this.oldClosestTotal = response.closest.length;

      return response.closest;
    }

  });

  return new Par3ClosestPlayersList();
});

