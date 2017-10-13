define('models/news-item',['require','backbone','underscore'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore')
  ;

  var typeMap = {
    'photo': 'Photo',
    'link': 'Photo',
    'gallery': 'Photo',
    'video': 'Video',
    'article': 'Article',
    'track': 'Article',
    'text': 'Breaking',
    'social': 'Social',
    'stat': 'Stats',
    'insight': 'Insight'
  };

  var atomicTypes = ['text', 'social', 'stat'];

  var NewsItem = Backbone.Model.extend({
    defaults: {
      size: 'full',
      id: '',
      type: 'article',
      icon: '',
      label: '',
      caption: '',
      credit: '',
      image: {
        small: '',
        medium: '',
        large: '',
        video: ''
      },
      link: '',
      players: '',
      text: '',
      background: '',
      share: '',
      visible: true
    },

    // don't use 'id' as real unique identifier since it's not
    idAttribute: '_id',

    initialize: function() {
      this.layout = {
        class: typeMap[this.get('type')],
        isAtomic: _.indexOf(atomicTypes, this.get('type')) > -1
      };
    },

    parse: function(data) {
      // data.image.video = 'http://mastersprogressivedl.edgesuite.net/2016/GreenSimulation/H05/MAIN/Hole05_Zone4.mp4';
      if(data.image && data.image.video === undefined) {
        data.image.video = '';
      }

      return data;
    }
  });

  return NewsItem;
});

