/**
 * Holes is a collection of type Hole that should be used to
 * access hole data for display. Calling fetch or sync before
 * the data is necessary, and utilizing the jqXHR signature's
 * callback structure will ensure hole data is always present
 * before trying to use the data
 */
define('collections/holes',['require','collections/static-collection','models/hole'],function(require) {
  var StaticCollection = require('collections/static-collection'),
      Hole = require('models/hole')
  ;

  var HoleInfo = StaticCollection.extend({
    model: Hole,
    url: '/en_US/xml/man/course/holes.json',

    panos_fetched: false,

    initialize: function() {

    },

    parse: function(response) {
      return response.holes;
    },

    comparator: 'number'
  });

  return new HoleInfo();
});
