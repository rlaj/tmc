define('views/related-article',['require','jquery','backbone','text!templates/related-article-item.html!strip','utils/browser','utils/common','relatedcontent','models/news-item','utils/date-util'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      relatedArticleTemplate = require('text!templates/related-article-item.html!strip'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      RelatedContent = require('relatedcontent'),
      NewsItem = require('models/news-item'),
      DateUtil = require('utils/date-util')
      ;

  var RelatedArticleView = Backbone.View.extend({
    el: '.next_article',

    events: {},

    template: _.template(relatedArticleTemplate),

    defaults: {
      related_id: '',
      url: '/en_US/cms/feeds/articlesLastX.json'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('RelatedArticles');
      this.logger.info('initialize');

      this.options = _.extend({}, this.defaults, opts);

      this.create();
    },

    /**
     * This kicks off the request to fetch related data and build the HTMl component
     */
    render: function() {
      this.related_list.load();

      return this;
    },

    construct: function() {
      console.log('construct - data:%o', this.jsonData);

      var new_href = this.jsonData.link;
      if(Browser.app) {
        var href = new_href;
        var index = href.search(/\/en_US\/news\/articles\/\d{4}-\d{2}-\d{2}\//);

        // don't prepend /ipad if it already exists
        if(href.substring(index - 4, index) !== 'ipad') {
          new_href = href.slice(0, index) + '/ipad' + href.slice(index);
        }
      }

      var html = this.template({
        id: this.jsonData.id,
        author_date: this.jsonData.author_date,
        photo: this.jsonData.photo,
        title: this.jsonData.title,
        link: new_href
      });
      this.$el.html(html);
    },

    /**
     * Define all RelatedContent specific function definitions
     */
    create: function() {
      var view = this;
      this.related_list = new RelatedContent.List({
        container: this.$el,
        id: this.options.related_id,
        url: this.options.url,
        type: 'content',
        filter: 'articles',
        limit: 1,
        link_suffix: {article: 'article_next'},
        callback: function(params) {
          if((params.status === 'success' && this.content.length === 0) || (params.status === 'error')) {
            console.info('Articles.loadRelatedContent:  ' + params.status + ', length:  ' + this.content.length);

            // try fetching fallback data once
            if(this.type !== 'url') {
              this.reinitialize({
                type: 'url'
              });

              this.load();
            }

            // if that fails, then hide
            else { // eslint-disable-line brace-style
              // hide recommended content
              view.$el.hide();
            }
          }
        }
      });

      var _convertContent = this.related_list.convertContentItem;
      this.related_list.convertContentItem = function(rc) {
        var item = _convertContent(rc);

        var dateObj = new Date(item.get('published').split(' ', 1)[0]);
        item.set('published', DateUtil.getLongDayOfWeek(dateObj) + ',  ' + DateUtil.getLongMonth(dateObj) + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear());
        return item;
      };

      /**
       * Because this is called only after AJAX data fetch, must construct HTML
       * here instead of in parent view
       */
      this.related_list.buildHTML = function() {
        if(this.content.length > 0) {
          var context = view.$el;
          var item = this.content[0];

          view.jsonData = {
            id: item.get('cmsId'),
            author_date: item.get('published'),
            photo: item.get('image').medium,
            title: item.get('caption'),
            link: item.get('link')
          };

          view.construct();
        }
      };
    }

  });

  return RelatedArticleView;
});


