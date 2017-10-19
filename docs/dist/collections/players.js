/**
 * ScorePlayersList is a collection of Players that are used to
 * access score data for display mainly on Leader Board & Track.
 */
define('collections/players',['require','jquery','backbone','models/player','collections/base-players'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Player = require('models/player'),
      BasePlayers = require('collections/base-players')
  ;

  var Players = BasePlayers.extend({
    model: Player,
    url: '/en_US/xml/gen/players/select.json',

    parse: function(response) {
      return response.players;
    },
  });

  return new Players();
})

;
