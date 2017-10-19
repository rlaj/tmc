define('collections/invitees',['require','jquery','backbone','models/invitee','collections/base-players'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Invitee = require('models/invitee'),
      BasePlayers = require('collections/base-players')
      ;

  var Invitees = BasePlayers.extend({
    model: Invitee,
    url: '/en_US/xml/gen/players/invitees_2016.xml',

    // url: '/en_US/xml/man/invitees_mock.xml',

    parse: function(response) {
      var $xml = $(response);
      return $xml.find('player').map(function() {
        $player = $(this);
        var qualificationsStr = $player.attr('qualifications').replace(/[()]/g, '');

          // qualifications are in ascending order starting with 1, which denotes past championship
        var past = qualificationsStr.split(',')[0] === '1' ? true : false;

        return {
          first_name: $player.attr('fname'),
          last_name: $player.attr('lname'),
          country_long: $player.attr('cntry'),
          qualifications: qualificationsStr,
          amateur: ($player.attr('Amateur') === '1' ? true : false),
          firsttimer: ($player.attr('First')  === '1' ? true : false),
          augusta: ($player.attr('Augusta')  === '1' ? true : false),
          past: past,
          not_playing: ($player.attr('INP')  === '1' ? true : false)
        };
      }).get();
    },

    fetch: function(options) {
      options = options || {};
      options.dataType = 'xml';
      return BasePlayers.prototype.fetch.call(this, options);
    }
  });

  return new Invitees();
});


