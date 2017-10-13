define('views/player-bio/tab-news',['require','backbone','text!templates/player-bio/tab-news.html!strip','views/related-player-content'],function(require) {
  var Backbone = require('backbone'),
      tabNewsTemplate = require('text!templates/player-bio/tab-news.html!strip'),
      RelatedPlayerContentView = require('views/related-player-content')
  ;

  var JST = {};


  var TabNews = Backbone.View.extend({
    el: '#tab_news',
    
    template: _.template(tabNewsTemplate),

    defaults: {
      playerId: null
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Tab News View');
      this.logger.info('initialize');
      this.options = _.extend({}, this.defaults, opts);
    },

    render: function() {
      this.$el.html(this.template({}));
      this.relatedPlayerContentView = new RelatedPlayerContentView({
        el: this.el, 
        playerId: this.options.playerId
      });
      this.relatedPlayerContentView.render();

      this.listenTo(this.relatedPlayerContentView, 'hasContent', function(bool) {
        this.trigger('hasContent', bool);
      });

      return this;
    },



    onDispose: function() {
      this.relatedPlayerContentView.dispose();
    }

  });

  return TabNews;
})

;
