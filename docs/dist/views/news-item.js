define('views/news-item',['require','underscore','backbone','text!templates/main-news-item.html!strip','text!templates/atomic-news-item.html!strip','utils/social','utils/common'],function(require) {
  var _ = require('underscore'),
      Backbone = require('backbone'),
      newsItemTemplate = require('text!templates/main-news-item.html!strip'),
      atomicNewsItemTemplate = require('text!templates/atomic-news-item.html!strip'),
      Share = require('utils/social'),
      Common = require('utils/common')
      ;

  var NewsItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'wrapper',

    main_template: _.template(newsItemTemplate),
    atomic_template: _.template(atomicNewsItemTemplate),

    events: {
      'click .containerInsight img': 'playVideo',
      'click .containerInsight .replay': 'playVideo',
      'click video': 'openSocialOverlay',
      'click .containerBreaking': 'openSocialOverlay'
    },

    initialize: function() {
      this.assignAttributes();

      this.listenTo(this.model, 'change:visible', this.toggleVisible);
    },

    render: function() {
      this.$el.html(this.construct());
      this.toggleVisible();

      if(this.model.get('image') && this.model.get('image').video !== '') {
        this.$video = this.$('video');
        this.video = this.$('video')[0];
        this.attachVideoListeners();
      }

      return this;
    },

    toggleVisible: function() {
      this.$el.toggleClass('visible', this.model.get('visible'));
    },

    assignAttributes: function() {
      var layoutSize = Common.toTitleCase(this.model.get('size'));
      this.$el.attr({
        'class': 'wrapper wrapper' + layoutSize,
        'data-size': layoutSize,
        'data-type': this.model.get('type'),
        'data-players': this.model.get('players'),
        'id': 'content' + this.model.get('id'),
        'data-content-id': this.model.get('id')
      });
    },

    construct: function() {
      if(!this.model.layout.isAtomic) {
        return this.main_template({
          isExit: Common.isExitLink(this.model.get('link')),
          klass: this.model.layout.class,
          model: this.model.attributes
        });
      } else {
        var klass = this.model.layout.class || '';
        klass += ' version' + this.model.get('background').toUpperCase();

        return this.atomic_template({
          klass: klass,
          model: this.model.attributes
        });
      }
    },

    attachVideoListeners: function() {
      this.$video.on('pause ended', function() {
        this.$el.addClass('videonotplaying').removeClass('videoplaying');
      }.bind(this));

      this.$video.on('playing', function() {
        this.$el.addClass('videoplaying').removeClass('videonotplaying');
      }.bind(this));
    },

    playVideo: function(e) {
      this.$video.show();
      this.video.play();
    },

    openSocialOverlay: function(e) {
      var $t = $(e.currentTarget);
      if(!$t.parent().is('a')) {
        e.preventDefault();
        var parent = this.$el;

        // links & metrics for containerInsights OR containerBreaking
        if(this.$('.containerPhoto').length > 0) {
          var url = $t.context.getAttribute('data-url');
          var text = $t.context.getAttribute('data-caption');

          Share.loadSocialBox(parent, url, 'Home:Insights', text, '');
        } else {
          var url = '/en_US/index.html';
          var text = $.trim($t.find('.text').text()).slice(0, 50);

          Share.loadSocialBox(parent, url, 'Home:Masters Now:Breaking News', text, '');
        }
      }
    }
  });

  return NewsItemView;
});
