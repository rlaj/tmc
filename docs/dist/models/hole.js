/**
 * Hole is a Model representation of all associated hole data,
 * including the basic hole facts, and perhaps the deeper hole
 * data used for the detail pages, as they're fetched for viewing
 */
define('models/hole',['require','backbone','collections/panoramas'],function(require) {
  var Backbone = require('backbone'),
      Panoramas = require('collections/panoramas')
  ;

  var Hole = Backbone.Model.extend({
    defaults: function() {
      return {
        number: 1,
        feed: '/en_US/xml/man/course/hole1.json',
        plant: 'Tea Olive',
        par: 3,
        yds: 150,
        imageL: {
          src: '/images/course/480x270/H_hole1.jpg',
          width: '748',
          height: '420'
        },
        imageM: {
          src: '/images/course/720x405/H_hole1.jpg',
          width: '748',
          height: '420'
        },
        imageH: {
          src: '/images/course/1024x576/H_hole1.jpg',
          width: '748',
          height: '420'
        },
        thumbnail: {
          src: '/images/course/H_hole1_thumb.jpg',
          width: '246',
          height: '143'
        },
        storylink: {
          src: '/ipad/en_US/course/story/hole1.html'
        },
        storythumb: {
          src: '/images/course/S_hole1.jpg'
        },
        plantText: {
          cdata: '<i>Osmanthus fragrans</i>, native to southern Asia, is an evergreen shrub or small tree belonging to the Olive Family. Its intermittent displays of small white flowers from December to March are delightfully fragrant.  The Tea Olive attains a height of 16 to 20 feet.'
        },
        holeDesc: {
          cdata: 'The first is a slight dogleg right that plays uphill. Drives to the left may catch the trees. The hole requires a precise second shot to an undulating green. A poorly struck approach may result in a difficult two-putt.'
        },
        hist: {
          cdata: 'In 1935, the hole featured a left fairway bunker that was later removed. A greenside bunker, front and left, was added in 1951.'
        },
        lstYrAvSrks: '4.245 (4)',
        cumAvSrks: '4.23 (7)',
        lowAvStks: '4.008 (1974)',
        highAvStks: '4.474 (2007)',
        eagles: 0,
        birdies: 20,
        pars: 177,
        bogies: 75,
        dblBogies: 5,
        other: 1,

        panoramas: new Panoramas()
      };
    },

    channels: {
      '11': 'ac',
      '12': 'ac',
      '13': 'ac',
      '15': '1516',
      '16': '1516'
    },

    idAttribute: 'number',

    initialize: function() {

    },

    parse: function(response) {
      response.number = parseInt(response.number, 10);

      return response;
    }
  });

  return Hole;
});

