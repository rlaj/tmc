define('collections/news-items',['require','backbone','models/news-item'],function(require) {
  var Backbone = require('backbone'),
      NewsItem = require('models/news-item')
      ;

  var NewsItems = Backbone.Collection.extend({
    model: NewsItem,
    // url: '/en_US/xml/gen/now/now_pre_tourn.json',

    initialize: function(model, options) {
      if(options && options.url) {
        this.url = options.url;
      }
    },

    parse: function(response) {
      return response.content;
    }
  });

  return NewsItems;
});

