define('views/watch-landing-body',['require','jquery','underscore','views/landing-body','utils/browser','utils/geoblock','utils/window-size','utils/pubsub','utils/favorites'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      LandingBody = require('views/landing-body'),
      Browser = require('utils/browser'),
      Geo = require('utils/geoblock'),
      Win = require('utils/window-size'),
      PubSub = require('utils/pubsub'),
      Favorites = require('utils/favorites')
      ;

  var WatchLandingBody = LandingBody.extend({
    events: {

    },

    initialize: function() {
      LandingBody.prototype.initialize.apply(this, arguments);

      this.hide_replays = Geo.isBlocked();
      if(!this.hide_replays) {
        // check if Android device
        if(Browser.android) {
          this.hide_replays = true;
        }
      }

      _.extend(this.options, {
        content_list: {
          json_path: '/en_US/xml/gen/watch/#{date}.json',
          json_array: this.content_src_ary,
          populate: this.buildDayContent.bind(this),
          geo_block_types: ['replay'],
          is_blocked: this.hide_replays,
          no_content_text: '<span style="color:white;">No matching videos found.</span>'
        }
      });

      this.attachSizeListeners();
    },

    onRender: function() {
      var date = this.$daySelector.selectedVal();
      this.list.selectDate(date);

      this.$mediaSelector.setOption();
    },

    geoAction: function() {
      this.hideReplayLinks();
    },

    hideReplayLinks: function() {
      this.$mediaSelector.$('a[href$="replay"]').remove();
    },

    attachSizeListeners: function() {
      if(Win.size() === 'global') {
        this.$daySelector.$parent.removeClass('white');
        this.$mediaSelector.$parent.addClass('dark');
      }

      this.listenTo(PubSub, 'windowsize:global:enter', function() {
        this.$daySelector.$parent.removeClass('white');
        this.$mediaSelector.$parent.addClass('dark');
      });

      this.listenTo(PubSub, 'windowsize:global:exit', function() {
        this.$daySelector.$parent.addClass('white');
        this.$mediaSelector.$parent.removeClass('dark');
      });
    },

    defineContentListOverrides: function() {
      var selector = this.$mediaSelector;
      this.list.updateFilters = function(infinite) {
        this._updateFilters(selector,
          {
            'favorite': false,
            'feature': false,
            'highlight': false,
            'interview': false,
            'replay': false
          }, function(filter_list) {
            // enable favorites filter as long as player has favorited a player
            var fave_list = Favorites.getPlayerIDs();
            var fave_length = fave_list.length;
            if(fave_length > 0) {
              filter_list.favorite = true;
            }

            // check remaining content for filters listed as false
            $.each(this.daycontent, function(i) {
              filter_list[this.get('type')] = true;
            });
          }, infinite);
      };

      this.list.selectType = function(type) {
        this._selectType(type, function() {
          return type;
        });
      };

      // overwrite because we don't have complex layout rules here
      $.fn.resetLayout = function(type) { return this; };
    },

    buildDayContent: function(content, container) {
      this.list._buildContent(content, container, function(model) {
        // make sure we clear out label
        model.set('label', '');
        model.set('size', 'half');
        model.set('icon', 'video');
        model.layout.class = 'Video';
      });

      // filter by type and reset layout
      this.list.selectType(this.list.settings.selectedType);

      // // update images
      // container.find('img.srcpic').unveil();
    }


  });

  return WatchLandingBody;
});

