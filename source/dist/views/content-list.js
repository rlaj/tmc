/**
 * ContentList is the base View for infinite scrolling content lists
 * used on the home page, watch landing page, and player bio news tab
 * TODO: Really should be using a collection of news item Models here
 * and allow that to dynamically populate the view, but for now, this
 * just works as it did last year
 */
define('views/content-list',['require','backbone','jquery','underscore','utils/pubsub','utils/common','utils/favorites','utils/metrics','collections/news-items','views/news-item','jquery.cookie','jquery.jscroll'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      _ = require('underscore'),
      PubSub = require('utils/pubsub'),
      Common = require('utils/common'),
      Favorites = require('utils/favorites'),
      Metrics = require('utils/metrics'),
      NewsItems = require('collections/news-items'),
      NewsItemView = require('views/news-item')
      ;

  require('jquery.cookie');
  require('jquery.jscroll');

  var ContentList = Backbone.View.extend({
    el: 'section.content',

    events: {
      'click .wrapper > a': 'trackContentClick'
    },

    defaults: {
      json_path: '', // format: string with #{} interpolation for round/day number
      json_array: [], // format: array of possible values, in order, to interpolate with json_path's #{}
      defaultType: 'all',
      populate: function() {},
      geo_block_types: [],
      is_blocked: false,

      navWrapper: undefined, // jQuery object pointing to the page's navWrapper element

      loadPerPage: 10, // load minimum 6 items, adding additional when needed to fill out half content
      contentRefreshInterval: 60,

      cookie_reset_selectors: '#eventLogo a, #home a',
      loading_link: '<a href="#" class="loading"><img src="/images/now/loading.gif" width="89" height="50"></a>',
      no_content_text: 'No matching news entries found.'
    },

    default_settings: {
      selectedRound: '',
      oldestRound: '',
      selectedType: '',
      jscroll_loaded: false,
      oldestLoad: -1, // oldest module loaded
      // oldestId : '',
      newLoad: 0, // "new" tracking module, and newest module loaded
      newestLoad: 0,
      contentRefreshId: undefined
    },

    scroll_section: '',
    all_content: [],
    daycontent: undefined,
    news_items_list: [],
    content_list: [],
    count: 0,

    initialize: function(opts) {
      // must copy any attached objects, otherwise new Views
      // will simply create new references to old, modified objects
      this.options = _.extend({}, this.defaults, opts);
      this.settings = _.extend({}, this.default_settings);
      this.processState();
    },

    render: function() {

    },

    onDispose: function() {
      this.unloadCookieReset();
      this.news_items_list = [];
    },

    /**
     * These functions must be updated to reflect the content types and filtering
     * logic to be used for this ContentList
     */
    selectType: function(type) {
      /** Sample code */
      // this._selectType(type, function() {
      //   return type;
      // });
    },
    updateFilters: function(infinite) {
      /** Sample code */
      // this._updateFilters({
      //   'feature':false,
      //   'highlight':false,
      //   'interview':false,
      //   'replay':false
      // }, function(filter_list) {
      //   // check remaining content for filters listed as false
      //   $.each(this.daycontent, function(i) {
      //     filter_list[this.type] = true;
      //   });
      // }, infinite);
    },

    processState: function() {
      // use masNowClear to determine if we should clear stored date/filter values
      // masNowClear values:
      // 'set' : when user navigates away from homepage (refresh, link, etc)
      // 'stored' : when page user navigates to loads, acknowledge we're one page away from home
      //            and should repopulate filters if user returns to home as next page view
      // 'true' : when user is now two deep from homepage, so we should clear stored values
      // undefined : user never clicked a content item, navigated away, clear all stored values
      var clear,
          string = $.cookie('masNowClear');
      try {
        clear = JSON.parse(string);
      } catch (e) {
        clear = {now: undefined, track: undefined};
      }
      var obj = {now: undefined, track: undefined};
      _.each(clear, function(state, key) {
        switch(state) {
          case 'set':
            obj[key] = 'stored';
            break;
          case 'stored':
            obj[key] = 'true';
            break;
          case 'true':
          case undefined:
            obj[key] = undefined;
            if(key === 'now') {
              $.removeCookie('masNowDate', { path: '/en_US/' });
              $.removeCookie('masNowType', { path: '/en_US/' });
              $.removeCookie('masNowContent', { path: '/en_US/' });
            } else if(key === 'track') {
              $.removeCookie('masTrack', { path: '/en_US/' });
            }
            break;
          default:
            break;
        }
      });
      $.cookie('masNowClear', JSON.stringify(obj), { path: '/' });

      this.loadCookieReset();
    },

    loadCookieReset: function() {
      // set up logo and Home links to clear cookies
      // TODO: Figure out if this is still the best way to do this
      $(this.options.cookie_reset_selectors).on('click.cookie', function() {
        $.cookie('masNowClear', JSON.stringify({now: true, track: true}), { path: '/' });

        // $(window).off('.masNow');
      });
    },

    unloadCookieReset: function() {
      $(this.options.cookie_reset_selectors).off('click.cookie');
    },

    interpolate: function(value) {
      return this.options.json_path.replace(/#{[^}]*}/, value);
    },

    trackContentClick: function() {
      this._trackContentClick.apply(this, arguments);
    },

    _trackContentClick: function() {},

    /* date specific content population ------------------------------------------------ */
    selectDate: function(round) {
      // reset variables
      this.settings.oldestLoad = -1;
      this.settings.newestLoad = 0;
      this.settings.selectedRound = this.settings.oldestRound = round;
      if(this.settings.jscroll_loaded) {
        // selecting new day, destroy previous jscroll object
        this.scroll_section.jscroll.destroy();
        this.settings.jscroll_loaded = false;
      }

      this.$el.html(this.options.loading_link);

      // if viewing latest, use data feed from newest date, allow loadMoreContent to work backwards
      if(this.settings.selectedRound === 'latest') {
        round = this.options.json_array[0];
        this.settings.oldestRound = round;
      }

      var url = this.interpolate(round);

      return this.loadJSON(url, false);
    },

    // split loadJSON and loadJSONData for re-usability
    loadJSON: function(url, infinite) {
      var items = new NewsItems([], {url: url});
      this.news_items_list.push(items);
      return items.fetch({
        success: function(collection, response, options) {
          this.loadJSONData(collection, infinite, response.date);
        }.bind(this)
      });

      // return $.getJSON(url, function(data) {
      //   this.loadJSONData(data.content, infinite, data.date);
      // }.bind(this));
    },

    loadJSONData: function(collection, infinite, header) {
      // process what's new, what should be added
      this.daycontent = collection.models.slice(0);
      this.daycontent.reverse();
      if(this.settings.selectedType === '') {
        this.settings.selectedType = this.options.defaultType;
      }

      // remove geoblocked content types
      this.removeGeoBlockedItems();

      // add content to all_content if we're loading infinite
      this.all_content = _.union(this.all_content, this.daycontent);

      this.scroll_section = $('<div id="scroll_' + this.settings.oldestRound + '" class="scroll_content">')
        .append($(this.options.loading_link).css({
          'height': $(window).height()
        }));

      if(infinite && header !== '' && collection.length > 0) {
        // add header
        this.scroll_section.append('<h3>' + header + '</h3>');
      }

      this.$('.loading').remove();
      this.$el.append(this.scroll_section);

      this.loadJScroll(infinite);
      this.settings.jscroll_loaded = true;

      if(!infinite) {
        // stop refreshing for new content on old date
        clearInterval(this.settings.contentRefreshId);

        // update content id list
        this.content_list = Common.extractIDs(this.daycontent);

        // If auto-updating, uncomment this block
        // this.settings.contentRefreshId = setInterval(function() {
        //   this.updateDate(this.settings.selectedRound);
        // }, this.options.contentRefreshInterval * 1000);
      }

      this.updateFilters(infinite);
    },

    removeGeoBlockedItems: function() {
      if(this.options.geo_block_types.length > 0 && this.options.is_blocked) {
        this.daycontent = _.filter(this.daycontent, function(item) {
          return _.indexOf(this.options.geo_block_types, item.get('type')) === -1;
        }, this);

        // if no content, skip the rest of this, just load next day if available
        if(this.daycontent.length === 0) {
          // remove day from dropdown menu
          this.options.navWrapper.find('a.option[data-src="' + this.settings.oldestRound + '"]').remove();
          this.scrollCallback(true);
          return;
        }
      }
    },

    loadJScroll: function(infinite) {
      // initialize to last content position
      // this.settings.oldestId = content[content.length-1];
      this.settings.oldestLoad = this.daycontent.length;
      if(!infinite) {
        // not in infinite scroll situation, actually switching dates
        // so reset newestLoad concept
        this.settings.newestLoad = this.settings.oldestLoad;
      }

      var that = this;

      // build out content html
      this.scroll_section.jscroll({
        debug: false,
        padding: 200,
        nextSelector: 'a.loading',
        dataType: 'none',
        dataProcess: this._processJScrollData.bind(this),
        callback: function(more_content) {
          // load next data file if no more content in current
          if(!more_content) {
            // figure next URL
            that.scrollCallback();
          }
        }
      });

      // reset resize listener to avoid multiple triggers
      this.stopListening(PubSub, 'throttle:resize', this._forceScroll);
      this.listenTo(PubSub, 'throttle:resize', this._forceScroll);
    },

    _forceScroll: function() {
      $(window).trigger('scroll.jscroll')
        .trigger('scroll.unveil');
    },

    _processJScrollData: function(container) {
      var content = this.daycontent;

      // go from newest to oldestLoad
      this.settings.newLoad = this.settings.oldestLoad;
      this.settings.oldestLoad -= this.options.loadPerPage;
      if(this.settings.oldestLoad < 0) {
        this.settings.oldestLoad = 0;
      }
      if(this.settings.oldestLoad > 0 &&
        content[this.settings.oldestLoad].size === 'half' &&
        content[this.settings.oldestLoad - 1].size === 'half' &&
        content[this.settings.oldestLoad + 1].size !== 'half') {
        this.settings.oldestLoad--;
      }

      // console.log(this.settings.oldestLoad +','+(this.settings.oldestLoad,this.settings.newLoad));
      var subcontent = content.slice(this.settings.oldestLoad, this.settings.newLoad);

      this.options.populate(subcontent, container);
      if(this.settings.oldestLoad > 0) {
        container.append(this.options.loading_link);
      }

      console.log('jscroll newestLoad: ' + this.settings.newLoad);

      // TODO: Should this section be broken off to be defined in Index specific View?
      if(Metrics.page_section === 'Home' && this.settings.selectedType === 'all') {
        if(this.settings.newLoad >= this.options.loadPerPage) {
          var sel_content = $.cookie('masNowContent');
          console.log('checking for metrics scroll state');
          if(this.count > 0 && sel_content === undefined) {
            Metrics.measureApp(Metrics.page_section, 'Scroll', this.count + '');
          }
          this.count += 1;
        }
      }
    },

    scrollCallback: function(forced) {
      if(this.settings.selectedRound === 'latest') {
        var jsary = this.options.json_array;
        var cur = _.indexOf(jsary, this.settings.oldestRound);
        if(cur !== jsary.length - 1) {
          var round = jsary[cur + 1];
          this.settings.oldestRound = round;
          this.loadMoreContent(round, forced);
        } else {
          // end of line, check if any content is visible
          var visible_content = this.$('.wrapper.visible');
          if(visible_content.length === 0) {
            this.$el.append('<div class="wrapper wrapperFull no_content">' + this.options.no_content_text + '</div>');
          }
        }
      } else if(this.daycontent.length === 0) {
        this.$('.loading').remove();
        this.$el.append('<div class="wrapper wrapperFull no_content">' + this.options.no_content_text + '</div>');
      }
    },

    loadMoreContent: function(day, forced) {
      var url = this.interpolate(day);
      this.loadJSON(url, !!!forced);
    },

    /** This isn't used because we're not auto-updating content list */
    updateDate: function(round) {
      // insert content newest that newestLoad
      var url = this.interpolate(round);
      $.getJSON(url, function(data) {
        var old_list = this.content_list;
        this.daycontent = data.content;

        // update content id list
        this.content_list = Common.extractIDs(this.daycontent);

        var newest = this.daycontent.length;

        // console.log('update newestLoad: '+newestLoad);
        // console.log('newest: '+newest);
        if(newest > this.settings.newestLoad) {
          var content = this.daycontent.slice(this.settings.newestLoad, newest);
          this.settings.newestLoad = newest;
          var container = $('<div class="jscroll-added new-content"></div>');
          this.$('.jscroll-added:first-child').before(container);
          this.options.populate(content, container);
        }

        // console.info('start removal');
        // console.time('remove');
        this.removeContent(old_list);

        // console.timeEnd('remove');
        // console.info('end removal');
      });
    },

    /** This isn't used because we're not auto-updating content list */
    removeContent: function(list) {
      // given old list, what is no longer in current list?
      var to_delete = _.difference(list, this.content_list);

      var l = to_delete.length;
      if(l > 0) {
        for(var i = 0; i < l; i++) {
          this.$('#content' + to_delete[i]).remove();
        }

        var section = this.$('div.scroll_content:first-child').find('div.wrapper');
        if(this.settings.selectedType === 'all') {
          section.resetLayout('default');
        } else {
          section.resetLayout();
        }

        this._forceScroll();
      }
    },

    // use this to populate fully functioning selectType method
    _selectType: function(type, callback) {
      // +type+ : all | news | photos | stats | videos
      var sections = this.$('div.scroll_content');
      this.$('.no_content').hide();

      if(type === 'all') {
        this.all_content.forEach(function(model) {
          model.set('visible', true);
        });
        for(var i = 0, l = sections.length; i < l; i++) {
          var section = sections.eq(i);
          var wrappers = section.find('div.wrapper');
          wrappers.resetLayout('default');

          if(wrappers.length > 0) {
            section.find('h3').show();
          }
        }
      } else {
        var data_type = '';
        if(typeof callback === 'function') {
          data_type = callback.call(this);
        }
        if(data_type !== '') {
          var filter_fave = false;
          if(data_type !== 'favorite') {
            data_type = data_type.split('|');
          } else {
            // TODO: Address Favorites here
            data_type = Favorites.getPlayerIDs();
            filter_fave = true;
          }

          var visible_count = 0;

          this.news_items_list.forEach(function(collection) {
            _.each(collection.models, function(model) {
              var check;
              if(filter_fave) {
                check = model.get('players').split(',');
              } else {
                check = [model.get('type')];
              }
              var visible = _.intersection(check, data_type).length > 0;
              model.set('visible', visible);
            });
          });

          // loop through scroll content to do layout per section
          for(var i = 0, l = sections.length; i < l; i++) {
            var scroll_section = sections.eq(i);
            var wrappers = scroll_section.find('div.wrapper.visible');

            // reset the layout for those that are visible
            wrappers.resetLayout();

            visible_count += wrappers.length;
            if(wrappers.length === 0) {
              scroll_section.find('h3').hide();
            } else {
              scroll_section.find('h3').show();
            }
          }

          if(visible_count === 0) {
            this.$('.no_content').show();
          }
        }
      }
      this.settings.selectedType = type;

      // manually trigger lazyload and unveil actions
      this._forceScroll();

      // Don't actually think this does anything since listener is on window, not section
      // unless section's overflow-y property is not visible
      // sections.trigger('scroll.jscroll');
    },

    // use this to populate fully functioning updateFilters method
    // where $filter is a SecondaryDropdown View
    _updateFilters: function($filter, filter_list, callback, infinite) {
      if(infinite === undefined) {
        infinite = false;
      }

      // define function to parse and populate filters on a page by page basis
      if(typeof callback === 'function') {
        callback.call(this, filter_list);
      }

      // disable filters with no content on initial load
      var $m = $filter.$('a');
      $.each(filter_list, function(key) {
        var t = $m.filter('[href$="' + key + '"]');
        if(filter_list[key]) {
          t.removeClass('disabled');
        } else if(!infinite) {
          t.addClass('disabled');
        }
      });

      // set filter to selectedType
      $filter.setOption($filter.findIndexByType(this.settings.selectedType));
    },

    _buildContent: function(content, container, callback) {
      var content_list = [];
      var that = this;

      $.each(content.reverse(), function(i) {
        var html = '';
        if(typeof callback === 'function') {
          callback.call(that, this);
        }
        var obj = new NewsItemView({model: this}).render();
        html = obj.$el;
        content_list.push(html);
      });

      // write new html
      container.html(content_list);

      // update images
      this.unveil(container.find('img.srcpic'));
    }

  });

  return ContentList;
});

