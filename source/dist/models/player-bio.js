define('models/player-bio',['require','underscore','backbone'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone')
  ;

  var babel = {
    'countryCode': 'nationcode',
    'countryName': 'nation',
    'bestFinish': 'best',
    'firstLast': 'firstlast',
    'tournamentsEntered': 'tournaments',
    'cutsMade': 'cuts',
    'roundsPlayed': 'rounds',
    'moneyWon': 'money',
    'scoringAvg': 'avg',
    'lowRound': 'low',
    'highRound': 'high',
    'roundsUnderPar': 'underpar',
    'bioText': 'overview'
  };

  var PlayerBio = Backbone.Model.extend({

    defaults: {

    },

    initialize: function() {
      if(this.get('amateur') === undefined) {
        this.set('amateur', this.get('turnedPro') === '' ? '1' : '');
      }
    },

    url: function() {
      return '/en_US/xml/gen/players/' + this.get('filename');
    },


    parse: function(response) {
      var player = response.bio.player;

      var keys = _.keys(player);
      for(var i = 0, l = keys.length; i < l; i++) {
        if(babel[keys[i]]) {
          player[babel[keys[i]]] = player[keys[i]];
        }
      }

      return player;
    }


  });

  return PlayerBio;
});



