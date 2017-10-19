define('views/watch-carousel',['require','backbone','jquery','utils/metrics','utils/carousel','text!templates/watch-carousel-item.html!strip','utils/geoblock','utils/pubsub','utils/channel-controller','utils/scores','utils/scores-video','views/player-card'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Metrics = require('utils/metrics'),
      Carousel = require('utils/carousel'),
      carouselItem = require('text!templates/watch-carousel-item.html!strip'),
      Geo = require('utils/geoblock'),
      PubSub = require('utils/pubsub'),
      ChannelController = require('utils/channel-controller'),
      Scores = require('utils/scores'),
      ScoresVideo = require('utils/scores-video'),
      PlayerCard = require('views/player-card')
      ;

  var JST = {};

  // hole, player_rows
  JST.overlay_hole = _.template(
    '<div class="hole"><div class="holeNo">Hole No. <%= hole %></div>' +
    '  <table class="holePlayers" cellspacing="0" cellpadding="0" border="0">' +
    '    <tr><th>&nbsp;</th><th>Position</th><th>Today</th><th>Total</th></tr>' +
    '    <%= player_rows %>' +
    '  </table>' +
    '</div>'
  );

  // player { name, pos, today, topar }, today, topar
  JST.overlay_hole_players = _.template(
    '<tr>' +
    '  <td class="player"><%= player.display_name %></td>' +
    '  <td class="stat"><%= player.pos %></td>' +
    '  <td class="stat <%= today %>"><%= player.today %></td>' +
    '  <td class="stat <%= topar %>"><%= player.topar %></td>' +
    '</tr>'
  );

  JST.overlay_hole_empty =
    '<tr class="divider"><td colspan="4">&nbsp;</td></tr>';

  JST.overlay_hole_noplayers =
    '<tr class="noplayers"><td colspan="4">No players on hole</td></tr>';

  var WatchCarouselItem = Backbone.View.extend({
    tagName: 'li',
    class: 'channel',

    template: _.template(carouselItem),
    link_template: '<a href="/en_US/watch/live.html?videoChannel=<%= id %>">',

    events: {
      'click a.info': 'openInfo',
      'click a.radio': 'launchRadio'
    },

    initialize: function(opts) {
      this.options = _.extend({}, opts);
      this.link_template = _.template(this.options.link_template);

      this.replay = this.model.get('replay');
      if(this.hide_replays) {
        this.replay = '';
      }

      this.$el.attr({
        id: this.model.get('id'),
        'data-channel': this.model.get('id')
      });

      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.setTextStrings();
      this.$el.attr('title', this.model.get('name') + ' - ' + this.statusText);

      var html = this.template({
        obj: this.model.attributes,
        link: this.link_template({id: this.model.id}),
        statusText: this.statusText,
        liveClass: this.liveClass,
        show_info: this.model.get('fg') !== '' || this.model.id === 'ac' || this.model.id === '1516',
        replay: this.replay
      });

      this.$el.html(html);

      // this.setElement(html);

      this.loadInfo();

      return this;
    },

    onDispose: function() {

    },

    launchRadio: function(e) {
      e.preventDefault();
      PubSub.trigger('radio:launch');
    },

    setTextStrings: function() {
      this.liveClass = 'offair';
      this.statusText = 'Off Air';
      if(this.model.get('live')) {
        this.liveClass = 'live';
        this.statusText = 'Live';
        if(this.model.id === 'radio') {
          this.statusText = 'On Air';
        }
      }
    },

    /**
     * Click handler for a.info click. Pass this View through event bus so it's accessible to
     * whatever needs to handle it
     */
    openInfo: function() {
      this.trigger('info:open', this);
    },

    /**
     * Populate info screen for each individual slide with current data
     * Content is then cloned to the main watch-info view for display
     */
    loadInfo: function() {
      if(this.model.id === 'ac' || this.model.id === '1516' || this.model.id === 'fg1') {
        if(!Scores.isDataLoaded()) {
          PubSub.off('scores:refresh', this.loadInfo, this)
            .once('scores:refresh', this.loadInfo, this);
          console.log('[WatchCarouselItem] channel %o returning early because data not loaded', this.model.get('name'));
          return;
        } else {
          try {
            console.log('[WatchCarouselItem] channel %o running loadInfo', this.model.get('name'));

            this.infowrapper = this.$('.infoWrapper');

            if(this.model.id === 'ac' || this.model.id === '1516') {
              this.loadHoleInfo();
            } else if(this.model.id === 'fg1') {
              ScoresVideo.assignFeaturedGroupPlayers();
              this.loadPlayerInfo();
              this.loadPlayerFeatured();
            }
          } catch (e) {
            console.error('[WatchCarouselItem] loading players on channel %o failed on error: %o', this.model.get('name'), e);
          }
        }
      }
    },

    loadHoleInfo: function() {
      ScoresVideo.parsePlayersByChannel();

      var holewrapper = $('<div class="holeCardWrapper hole' + this.model.id + '">');
      var channel = ScoresVideo.holeChannels[this.model.id];

      // channels have multiple holes, iterate over each
      $.each(channel, function(id, v) {
        // console.log('hole: '+id);
        var hole = this;
        var lastplayer;
        var player_html = '';
        for(var i = 0, m = hole.players.length; i < m; i++) {
          var player = Scores.collection.get(hole.players[i]);

          // console.log(hole[this].tee_order + ': ' + hole[this].teetime);
          if(i !== 0 && lastplayer !== undefined
             && lastplayer.get('teetime') !== player.get('teetime')) {
              // create empty row
            player_html += JST.overlay_hole_empty + JST.overlay_hole_empty;
          }
          player_html += JST.overlay_hole_players({
            player: player.attributes,
            today: Scores.Utilities.className(player.get('today')),
            topar: Scores.Utilities.className(player.get('topar'))
          });

          lastplayer = player;
        }

        if(player_html === '') {
          // no players
          player_html += JST.overlay_hole_noplayers;
        }

        var html = JST.overlay_hole({
          hole: id,
          player_rows: player_html
        });

        holewrapper.append(html);
      });
      this.infowrapper.append(holewrapper);
    },

    loadPlayerFeatured: function() {
      var channel = ScoresVideo.groupChannels[this.model.id];
      var featured_html = [];

      var l = channel.players.length;
      if(l === 4) {
        this.$('.containerFeaturedPlayers').addClass('twoplayers');
      }
      for(var i = 0; i < l; i++) {
        var pid = channel.players[i];
        var player = Scores.collection.get(pid);
        if(player !== undefined) {
          var pcard = new PlayerCard({
            model: player,
            tv_name: true,
            scores: false,
            item: true,
            show_amateur_status: true,
            location: 'info',
            metrics_suffix: 'bio_watch'
          }).render();
          pcard.$el.addClass('featured');
          featured_html.push(pcard.$el);
        }
      }
      this.$('.containerFeaturedPlayers').append(featured_html);
    },

    loadPlayerInfo: function() {
      var cardwrapper = $('<div class="playerCardWrapper">');
      var channel = ScoresVideo.groupChannels[this.model.id];

      var l = channel.players.length;
      if(l === 4) {
        cardwrapper.addClass('twoplayers');
      }
      for(var i = 0; i < l; i++) {
        var pid = channel.players[i];
        var player = Scores.collection.get(pid);
        if(player !== undefined) {
          var pcard = new PlayerCard({
            model: player,
            metrics_suffix: 'bio_watch',
            location: 'info'
          });
          cardwrapper.append(pcard.render().$el);
        }
      }
      this.infowrapper.append(cardwrapper);
    }
  });

  var WatchCarousel = Backbone.View.extend({
    el: 'ul.carousel',

    events: {

    },

    initialize: function(opts) {
      this.options = _.extend({}, opts);
      this.cards = [];
      this.currentOrder = [];

      this.carousel = new Carousel();
      this.carousel.populate = this.populateCarousel.bind(this);

      this.on('enable', this.enable, this);
      this.on('disable', this.disable, this);
      this.on('refresh', this.refresh, this);
    },

    render: function() {
      this.carousel.init(this.$el, this.defineCarouselOptions());

      return this;
    },

    redraw: function() {
      this.carousel.redraw();
    },

    onDispose: function() {
      this.cards.forEach(function(card) {
        card.dispose();
      });
      this.destroyCarousel();
    },

    destroyCarousel: function() {
      this.carousel.destroy();
    },

    refresh: function(isInfoOpen) {
      this.populateCarousel(isInfoOpen);
    },

    /**
     * Enable/Disable don't actually do anything, but record state of carousel
     */
    disable: function() {
      this.enabled = false;
    },
    enable: function() {
      this.enabled = true;
    },

    defineCarouselOptions: function() {
      var onSliderLoad = function(currentIndex) {
        // prevent percent rounding issue where slides are wider than slide container,
        // causing stacked slides to appear (mostly at narrower widths)
        var w = this.el.style.width; // e.g. 815%
        w = parseFloat(w.replace('%', ''));
        w += 10;
        w += '%';
        this.el.style.width = w;

        // unveil here to make sure we catch the cloned elements
        // console.log('carousel unveiling: %o', this.$el.parents('.bx-wrapper').find('img'));
        this.unveil(this.$('.channelImage img'), { horizontal: true });

        onSliderResize();

        console.log('carousel: triggering scroll after load');
        PubSub.trigger('scroll');
      }.bind(this);

      var onSlideBefore = function(newSlide, oldIndex, newIndex) {
        this.trigger('carousel:newslide');
      }.bind(this);

      var onSliderResize = function() {
        this.trigger('carousel:resize');

        // Trigger event so scrollFade can recalculate opacity based on new position
        // Still confused why triggering 'scroll' event here doesn't do anything
        PubSub.trigger('throttle:resize');
      }.bind(this);

      return {
        onSliderLoad: onSliderLoad,
        onSlideBefore: onSlideBefore,
        onSliderResize: onSliderResize,
        onSlideNext: function() { Metrics.measureApp('Watch', 'Channel View', 'Next'); },
        onSlidePrev: function() { Metrics.measureApp('Watch', 'Channel View', 'Previous'); },

        infiniteLoop: !Geo.isBlocked()
      };
    },

    populateCarousel: function(isInfoOpen) {
      var idx, ch;
      if(this.carousel.active) {
        idx = this.carousel.current();

        // find channel user is currently viewing
        ch = this.currentOrder[idx];
      }

      var objs = this.populateItems();

      // update carousel channels
      this.clearUnveil();
      this.$el.html(objs);

      if(this.carousel.active) {
        // get new index of current viewed channel only if info panel
        // was open
        if(isInfoOpen === true) {
          idx = this.currentOrder.indexOf(ch);
        }
        this.carousel.refresh({ startSlide: idx });

        // TODO: reopen info card
      }

      // debugger;
    },

    populateItems: function() {
      if(this.cards.length === 0) {
        var html = [];
        ChannelController.collection.forEach(function(channel, index, collection) {
          var item = this.createNewCard(channel);
          this.cards.push(item);
          this.currentOrder.push(channel.id);
          html.push(item.$el);
        }.bind(this));

        return html;
      } else {
        this.cards.forEach(function(card) {
          card.$el.detach();
        });
        var new_cards = [];
        var new_order = [];
        var html = [];
        ChannelController.collection.forEach(function(channel, index, collection) {
          var card = this.cards[index];

          // if channel position has not moved
          if(card === undefined || channel.id !== this.cards[index].model.id) {
            // check if channel existed before
            var pos = _.indexOf(this.currentOrder, channel.id);

            // if so, add to new card order list
            if(pos > -1) {
              card = this.cards[pos];
              delete this.cards[pos];
            } else {
              // if not, create new carousel item
              card = this.createNewCard(channel);
            }
          } else {
            delete this.cards[index];
          }
          new_cards.push(card);
          new_order.push(channel.id);
          html.push(card.$el);
        }.bind(this));

        // dispose any remaining cards in this.cards
        this.cards.forEach(function(card) {
          if(card) {
            card.dispose();
            this.stopListening(card);
          }
        }.bind(this));

        this.cards = new_cards;
        this.currentOrder = new_order;
        return html;
      }
    },

    createNewCard: function(channel) {
      var item = new WatchCarouselItem({model: channel, link_template: this.options.link_template}).render();
      this.listenTo(item, 'info:open', function(view) {
        this.trigger('info:open', view);
      });

      return item;
    }

  });

  return WatchCarousel;
});

