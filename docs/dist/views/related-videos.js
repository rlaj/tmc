define('views/related-videos',['require','jquery','backbone','relatedcontent','views/content-list','models/news-item','collections/news-items'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      RelatedContent = require('relatedcontent'),
      ContentList = require('views/content-list'),
      NewsItem = require('models/news-item'),
      NewsItems = require('collections/news-items')
      ;

  var RelatedVideos = Backbone.View.extend({
    el: 'section.body',

    defaults: {
      related_id: '',
      video: {},
      url: '/en_US/xml/gen/video/lastX.json'
    },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('RelatedVideos');
      this.logger.info('initialize');

      this.options = _.extend({}, this.defaults, opts);

      this.create();
    },

    render: function() {
      this.related_list.load();

      if(this.options.type !== 'live') {
        this.related_list.events.on('request.success', this.loadNextVideo.bind(this));
      }

      return this;
    },

    onDispose: function() {
      this.content_list.dispose();
    },

    create: function() {
      var view = this;
      var type = this.options.type;

      if(type === 'highlight') {
        this.createHighlight();
      } else if(type === 'shot_highlight') {
        this.createShotHighlight();
      } else if(type === 'replay') {
        this.createReplays();
      } else {
        this.createVODs();
      }

      this.content_list = new ContentList({
        el: this.$('#recContent'),
        populate: this.buildContent.bind(this)
      });

      this.related_list.buildHTML = function() {
        view.content_list.$el.html(view.content_list.options.loading_link);

        view.content_list.loadJSONData(this.content, false);
      };

      var _postProcess = this.related_list.postProcess;
      this.related_list.postProcess = function() {
        // put this.content array into collection
        var content = this.content;
        if(Array.isArray(content)) {
          this.content = new NewsItems(content);
        }

        _postProcess.apply(this, arguments);
      };
    },

    buildContent: function(content, container) {
      this.content_list._buildContent.apply(this, arguments);
    },

    callbackHandler: function(list, params) {
      if((params.status === 'success' && list.content.length === 0) || (params.status === 'error')) {
        // try fetching fallback data once
        if(list.type !== 'url') {
          list.reinitialize({
            type: 'url'
          });

          list.load();
        }
        // if that fails, then hide
        else {
          // hide recommended content
          this.$('#recHeader, #recContent').hide();
        }
      }
    },

    createHighlight: function() {
      var match = this.options.related_id.match(/r\d_(\d+)_\d+/);
      var pid;
      if(match !== null) {
        pid = match[1];
      }

      if(pid === undefined) {
        return null;
      }

      var _this = this;
      this.related_list = new RelatedContent.List({
        id: pid,
        url: this.options.url,
        type: 'tag',
        limit: 300,
        filter: 'video_leaderboard',
        link_suffix: { video: 'vod_recommended' },
        callback: function(params) {
          _this.callbackHandler(this, params);
        }
      });

      this.related_list.postProcess = function() {
        if(this.content.length > 1) {
          // sort oldest first
          this.content.comparator = 'sort';
          this.content.sort();
        }

        // keep only the next highlight, otherwise return empty content list
        var ids = this.content.pluck('cmsId');
        var i = _.indexOf(ids, _this.options.related_id) + 1;
        var models = [];
        if(i > 0 && i < this.content.length) {
          models = this.content.slice(i,i+6);
        } else if(this.type === 'url' && i === 0) {
          models = this.content.models;
        }
        this.content.reset(models);
      };
    },

    createShotHighlight: function() {
      var match = this.options.related_id.match(/r\d_(\d+)_\d+/);
      var pid;
      if(match !== null) {
        pid = match[1];
      }

      if(pid === undefined) {
        return null;
      }

      var _this = this;
      this.related_list = new RelatedContent.List({
        id: pid,
        url: this.options.url,
        type: 'tag',
        limit: 300,
        filter: 'video_shot_highlight',
        link_suffix: { video: 'vod_recommended' },
        callback: function(params) {
          _this.callbackHandler(this, params);
        }
      });

      this.related_list.postProcess = function() {
        if(this.content.length > 1) {
          // sort oldest first
          this.content.comparator = 'sort';
          this.content.sort();
        }

        // keep only the next highlight, otherwise return empty content list
        var ids = this.content.pluck('cmsId');
        var i = _.indexOf(ids, _this.options.related_id) + 1;
        var models = [];
        if(i > 0 && i < this.content.length) {
          models = this.content.slice(i,i+6);
        } else if(this.type === 'url' && i === 0) {
          models = this.content.models;
        }
        this.content.reset(models);
      };
    },

    createReplays: function() {
      var video = this.options.video;
      var channel = video.replay_channel;

      var _this = this;
      this.related_list = new RelatedContent.List({
        id: channel,
        url: this.options.url,
        type: 'tag',
        limit: 300,
        filter: 'video_replay',
        link_suffix: { video: 'vod_recommended' },
        callback: function(params) {
          _this.callbackHandler(this, params);
        }
      });

      this.related_list.postProcess = function() {
        if(this.content.length > 1) {
          // sort newest first
          this.content.comparator = function(a,b) {
            return b.get('sort') - a.get('sort');
          };
          this.content.sort();
        }

        // remove self
        var ids = this.content.pluck('cmsId');
        var i = _.indexOf(ids, _this.options.related_id);
        if(i > -1) {
          this.content.remove(this.content.at(i));
        }
      };
    },

    createVODs: function() {
      var type = this.options.type;
      if(this.options.type === 'vod') {
        type = 'content';
      } else if(this.options.type === 'live') {
        type = 'tag';
      }
      var _this = this;
      this.related_list = new RelatedContent.List({
        container: this.$('#recContent'),
        id: this.options.related_id,
        url: this.options.url,
        type: type,
        limit: 6,
        link_suffix: { video: 'vod_recommended', article: 'article_recommended', galleries: 'gallery_recommended' },
        callback: function(params) {
          _this.callbackHandler(this, params);
        }
      });
    },

    loadNextVideo: function() {
      var v = this.options.video;

      this.logger.info('loadNextVideo for v:%o', v);

      var has_next = false;
      var next_video;
      // find proper next video
      if(v.contentType === 'leaderboard') {
        if(this.related_list && this.related_list.content.length > 0) {
          next_video = this.related_list.content.at(0);
          has_next = true;
        }
      }
      // if we're doing this for other types of VOD content as well,
      // look up first related video as recommendation
      else {
        // look up first related video item, if any
        for(var i=0,l=this.related_list.content.length;i<l;i++) {
          var rc = this.related_list.content.at(i);
          if(rc.get('type') === 'video') {
            next_video = rc;
            has_next = true;
            break;
          }
        }
      }

      if(has_next) {
        this.trigger('nextvideo', next_video);
      }
    }
  });

  return RelatedVideos;
});
