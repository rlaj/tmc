define('views/index-landing-body',['require','views/landing-body','jquery','underscore','utils/pubsub','utils/favorites','jquery.dropdown_ext'],function(require) {
  var LandingBody = require('views/landing-body'),
      $ = require('jquery'),
      _ = require('underscore'),
      PubSub = require('utils/pubsub'),
      Favorites = require('utils/favorites')
      ;

  require('jquery.dropdown_ext');

  var IndexLandingBody = LandingBody.extend({
    initialize: function() {
      LandingBody.prototype.initialize.apply(this, arguments);

      _.extend(this.options, {
        content_list: {
          json_path : "/en_US/xml/gen/now/#{round}.json",
          // json_path: '/en_US/xml/man/now/now_pretournament.mock.json',
          json_array: this.content_src_ary,
          populate: this.buildDayContent.bind(this)
        },
        media_dropdown_callback: function(type) {
          $.cookie('masNowType', type, { path: '/en_US/' });
        }
      });
    },

    onRender: function() {
      this.loadDefaultDateTypeContent();
    },

    onDispose: function() {
      PubSub.off('unload.masNow', '', this);

      LandingBody.prototype.onDispose.apply(this, arguments);
    },

    defineContentListOverrides: function() {
      var selector = this.$mediaSelector;
      this.list.updateFilters = function(infinite) {
        this._updateFilters(selector,
          {
            'favorite': false,
            'news': false,
            'photos': false,

            // 'stats':false,
            'videos': false,
            'insights': false
          }, function(filter_list) {
            // enable favorites filter as long as player has favorited a player
            var fave_list = Favorites.getPlayerIDs();
            var fave_length = fave_list.length;
            if(fave_length > 0) {
              filter_list.favorite = true;
            }

            // check remaining content for filters listed as false
            var list = this.daycontent;
            if(this.settings.selectedRound === 'latest') {
              list = this.all_content;
            }
            var i = 0,
                l = list.length;
            for(i; i < l; i++) {
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

                // case "stat" :
                //   filter_list.stats = true;  break;
                case 'insight' :
                  filter_list.insights = true;  break;
                default:
                  break;
              }

              // if every option is true already, stop looping
              if(filter_list.photos && filter_list.videos && filter_list.news && filter_list.insights) {
                break;
              }
            }
          }, infinite);
      };

      /* content filter type population ---------------------------------------------- */
      this.list.selectType = function(type) {
        this._selectType(type, function() {
          var data_type = '';
          switch(type) {
            case 'favorite' :
              data_type = 'favorite'; break;
            case 'news' :
              data_type = 'article|text'; break;
            case 'photos' :
              data_type = 'photo|gallery'; break;
            case 'stats' :
              data_type = 'stat'; break;
            case 'videos' :
              data_type = 'video'; break;
            case 'insights' :
              data_type = 'insight'; break;
            default:
              break;
          }
          return data_type;
        });
      };

      this.list._selectDate = this.list.selectDate;
      this.list.selectDate = function(round) {
        this.settings.selectedType = this.options.defaultType;

        // reset scroll count
        this.count = 0;
        this._selectDate(round);

        // store selected value in cookie
        $.cookie('masNowDate', round, { path: '/en_US/' });
      }.bind(this.list);
    },

    buildDayContent: function(content, container) {
      this.list._buildContent(content, container);

      // filter by type and reset layout
      this.list.selectType(this.list.settings.selectedType);
    },

    loadDefaultDateTypeContent: function() {
      // load previously selected date
      var sel_date = $.cookie('masNowDate');
      if(!sel_date) {
        sel_date = this.$daySelector.selectedVal();
      } else {
        var sel_option = this.$daySelector.findBySrc(sel_date);
        var i = sel_option.index();
        this.$daySelector.setOption(i);
      }

      // load previously selected filter
      var sel_type = $.cookie('masNowType');
      if(sel_type) {
        this.$mediaSelector.$('a[href="#' + sel_type + '"]').addClass('selected')
          .siblings('.selected').removeClass('selected');
        this.list.settings.selectedType = sel_type;
      }

      var _this = this;
      $.when(this.list._selectDate(sel_date))
      .then(function() {
        var scrollstate = new $.Deferred();

        // Define recursive scrolling method
        function scrolltocontent(sel_content) {
          var wrapper = this.list.$('a[href="' + sel_content + '"]').parent();
          var load_more = false;
          if(wrapper.length === 0) {
            wrapper = this.list.$('.wrapper').last();
            load_more = true;
          }
          console.log(wrapper);

          // scroll to that content item
          window.scroll(0, wrapper.position().top + $(window).height() - 100);
          if(load_more) {
            _this.scroll_timeoutId = setTimeout(function() {
              scrolltocontent.call(this, sel_content);
            }.bind(this), 200);
          } else {
            scrollstate.resolve();
          }
        }

        // if masNowContent, scroll to data
        var sel_content = $.cookie('masNowContent');
        // if(sel_content && sel_content !== '') {
        //   scrolltocontent.call(_this, sel_content);
        //   $.when(scrollstate)
        //   .done(function() {
        //     console.info('done auto-scrolling');
        //     $.removeCookie('masNowContent', { path: '/en_US/' });
        //   });
        // }
      });

      // set clear cookie state (see this.list.processState) when leaving page
      PubSub.on('unload.masNow', function() {
        var clear = JSON.parse($.cookie('masNowClear'));
        clear.now = 'set';
        $.cookie('masNowClear', JSON.stringify(clear), { path: '/' });
      }, this);

      // store clicked content so we can return to it on subsequent navigation
      this.list._trackContentClick = function(e) {
        var target = e.currentTarget;
        var type = $(target).closest('wrapper');
        if(type !== 'link') {
          $.cookie('masNowContent', target.getAttribute('href'), { path: '/en_US/' });
        }
      };
    }
  });

  return IndexLandingBody;
});

