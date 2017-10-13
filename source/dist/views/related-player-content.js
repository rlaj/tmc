define('views/related-player-content',['require','jquery','backbone','settings','relatedcontent','models/news-item','collections/news-items','views/content-list','views/secondary-dropdown'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Settings = require('settings'),
      RelatedContent = require('relatedcontent'),
      NewsItem = require('models/news-item'),
      NewsItems = require('collections/news-items'),
      ContentList = require('views/content-list'),
      SecondaryDropdown = require('views/secondary-dropdown')
      ;

  var RelatedPlayerContentView = Backbone.View.extend({
    el: '',

    defaults: {
      current_year: Settings.tournament_year,
      last_year: Settings.tournament_year - 1,
      min_year: Settings.tournament_year - 2
    },

    events: {},

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Related Player Content');
      this.logger.info('initialize');

      this.options = _.extend({}, this.defaults, opts);

      this.$mediaSelector = new SecondaryDropdown({
        el: this.$('#mediaSelector'),
        metrics: 'Player Detail'
      });
      this.$mediaSelector.setCallback(function(href) {
        var type = href.substring(5);
        this.content_list.selectType(type);
      }, this);


      this.create();
    },

    render: function() {
      this.related_list.load();
      return this;
    },

    create: function() {
      this.setupRelatedContentList();
      this.setupContentList();
      this.defineContentListOverrides();
      this.defineRelatedListOverrides();
    },

    setupRelatedContentList: function() {
      var that = this;
      this.related_list = new RelatedContent.List({
        id: this.options.playerId,
        limit: 300,
        startdate: this.options.min_year + '-01-01',
        link_suffix: { video: 'vod_players',  article: 'article_players', photo: 'photo_players', galleries: 'gallery_players' },
        layout: 'player',
        callback: function(params) {
          if(params.status === 'success' && this.content.length > 0 && this.content.models[0].get('year') >= this.min_year) {
            that.trigger('hasContent', true);
          } else {
            that.trigger('hasContent', false);
          }
        }
      });
      this.related_list.current_year = this.options.current_year;
      this.related_list.last_year = this.options.last_year;
      this.related_list.min_year = this.options.min_year;
    },


    setupContentList: function() {
      this.content_list = new ContentList({
        json_array: ['', this.options.last_year, this.options.min_year],
        populate: this.buildContent.bind(this)
      });

      this.content_list.settings.oldestLoad = -1;
      this.content_list.settings.newestLoad = 0;
      this.content_list.settings.oldestRound = '';
      this.content_list.settings.selectedRound = 'latest';
    },

    defineRelatedListOverrides: function() {
      var that = this;

      this.related_list.buildHTML = function() {
        that.content_list.all_content = this.content.models;
        var filteredCollection;

        // fetch content until we find a non-empty year or reached min year
        for(var i = this.current_year; i >= this.min_year; i--) {
          filteredCollection = new NewsItems(this.content.where({year: i}));
          if(filteredCollection.length > 0) {
            if(i < this.current_year) {
              that.content_list.settings.oldestRound = i;
            }
            that.content_list.loadJSONData(filteredCollection, true, i === this.current_year ? '' : i);
            i = this.min_year;
          }
        }

        that.content_list.news_items_list.push(filteredCollection);
      };

      this.related_list.postProcess = function() {
        // remove all content prior to min_year and of type 'galleries'
        this.content = this.content.filter(function(content) {
          return content.get('year') >= this.min_year && content.get('type') !== 'galleries';
        }.bind(this));

        this.content = new NewsItems(this.content);
      };
    },

    defineContentListOverrides: function() {
      var selector = this.$mediaSelector;

      this.content_list.updateFilters = function() {
        this._updateFilters(selector,
          {
            'news': false,
            'photos': false,
            'videos': false
          }, function(filter_list) {
          // check remaining content for filters listed as false
            var list = this.daycontent;
            if(this.settings.selectedRound === 'latest') {
              list = this.all_content;
            }
            for(i = 0; i < list.length; i++) {
              var content = list[i];
              switch(content.get('type')) {
                case 'photo' :
                case 'gallery' :
                  filter_list.photos = true;  break;
                case 'video' :
                  filter_list.videos = true;  break;
                case 'article' :
                case 'text' :
                  filter_list.news = true;  break;
              }

            // if every option is true already, stop looping
              if(filter_list.photos && filter_list.videos && filter_list.news) {
                break;
              }
            }
          });
      };

      this.content_list.selectType = function(type) {
        this._selectType(type, function() {
          var data_type = '';
          switch(type) {
            case 'news' :
              data_type = 'article|text'; break;
            case 'photos' :
              data_type = 'photo|gallery'; break;
            case 'videos' :
              data_type = 'video'; break;
          }
          return data_type;
        });
      };

      this.content_list.loadMoreContent = function(year) {
        // filter content by year
        var filteredContent = this.all_content.filter(function(content) {
          return content.get('year') === year;
        });

        var filteredCollection = new NewsItems(filteredContent);
        this.news_items_list.push(filteredCollection);
        this.loadJSONData(filteredCollection, true, year);
      };
    },

    buildContent: function(content, container) {
      this.content_list._buildContent(content, container);

      // filter by type and reset layout
      this.content_list.selectType(this.content_list.settings.selectedType);
    },


    dispose: function() {
      this.content_list && this.content_list.dispose();
      this.$mediaSelector && this.$mediaSelector.dispose();
    }


  });

  return RelatedPlayerContentView;
});


