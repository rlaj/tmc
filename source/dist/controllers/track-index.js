define('controllers/track-index',['require','jquery','baseview','utils/scores','utils/pubsub','utils/metrics','collections/holes','settings','utils/browser','models/track/state','utils/track/track','views/track/map','views/track/size','views/track/map-size','views/track/nav-bar','views/track/map-overlay'],function(require) {
  var $ = require('jquery'),
      BaseView = require('baseview'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub'),
      Metrics = require('utils/metrics'),
      Holes = require('collections/holes'),
      Settings = require('settings'),
      Browser = require('utils/browser'),

      State = require('models/track/state'),
      TrackUtils = require('utils/track/track'),
      TrackMapView = require('views/track/map'),
      TrackSize = require('views/track/size'),
      TrackMapSize = require('views/track/map-size'),
      TrackNavBar = require('views/track/nav-bar'),
      TrackMapOverlay = require('views/track/map-overlay')
      ;

  var TrackIndex = BaseView.extend({

    show_player_search: false,
    show_hole_detail: false,

    events: {
      'click': 'closeOverlays',
      'click .hole-list li:not(.disabled)': 'selectHole',
      'click #playerSearchLink': 'togglePlayerSearch'
    },

    onInitialization: function() {
      this.size = new TrackMapSize({
        el: this.$('.trackerWrapper')
      });

      this.mapimg = this.$('.renders > img');

      if(this.jsonData.pageState === 'live') {
        this.map = new TrackMapView({
          el: this.$('#holeContainer')
        });

        this.hole_list = this.$('.hole-list li');

        this.hole_overlay = this.$('.hole-info-wrap');
        Holes.fetch({
          success: function() {
            this.loadHoleList();
          }.bind(this)
        });

        this.navbar = new TrackNavBar({
          el: this.$('.nav-control-wrap'),
          statbar: false,
          primary: false,
          compare: false,
          primary_list_open: true
        });

        this.listenTo(State, 'playerlist:primary:toggle', this.togglePlayerSearch);
        this.listenTo(this.map, 'hole:select', this.loadHole);
        this.listenTo(PubSub, 'scores:refresh', this.setCurrentRound);
        this.listenTo(PubSub, 'scores:refresh', this.checkForDisabled);
        this.listenTo(PubSub, 'windowsize:orientation:portrait', this.checkMap);
      } else {
        // make sure Settings.Scores.stub_track is set to true
        Settings.Scores.stub_track = true;
      }
    },

    onRender: function() {
      this.unveil(this.mapimg);
      this.size.render();
      if(this.jsonData.pageState === 'live') {
        this.map.render();

        if(Scores.isDataLoaded()) {
          this.setCurrentRound();
          this.checkForDisabled();
        }

        // TODO: For next year when we have weather data
        // this.setupWeather();
      }

      if(Browser.app && eventsCore.util.getUrlParam('first') === null) {
        TrackUtils.measureState();
      }
    },

    onDispose: function() {
      this.size.dispose();

      if(this.jsonData.pageState === 'live') {
        this.navbar.dispose();
        this.map.dispose();
        if(this.overlay) {
          this.overlay.dispose();
        }
      }
    },

    checkMap: function() {
      if(!this.mapimg.hasClass('unveiled')) {
        PubSub.trigger('scroll.unveil.delegate' + this.cid);
      }
    },

    setCurrentRound: function() {
      var text = 'Round';
      if(Scores.collection.concurrentExists) {
        var rounds = '';

        // check for active rounds
        for(var i = 1; i <= 5; i++) {
          if(Scores.Utilities.isActiveRound(i)) {
            rounds += (i > 1 ? ' & ' : '') + i;
          }
        }
        text += 's ' + rounds;
      } else {
        var currentRound = Scores.Utilities.currentRoundWithPlayoff();
        text += ' ' + currentRound;
        if(currentRound === 5) {
          text = 'Playoff';
        }
      }
      this.$('.course-info').find('.round').html(text);
    },

    checkForDisabled: function() {
      // loop through player list, collect and enable the holes that have players
      var holes = {};
      var has_players = false;

      Scores.collection.filter(function(player) {
        if(Scores.Utilities.isActivePlayer(player.id)) {
          var hole = player.getCurrentHole();
          if(hole && holes[hole] !== true) {
            holes[hole] = true;
            has_players = true;
          }
        }
      });

      for(var i = 1; i <= 18; i++) {
        if(holes[i] === true) {
          this.map.$('#hole' + i).removeClass('disabled');
          this.hole_list.filter('[data-hole="' + i + '"]').removeClass('disabled');
        } else {
          this.map.$('#hole' + i).addClass('disabled');
          this.hole_list.filter('[data-hole="' + i + '"]').addClass('disabled');
        }
      }

      if(!has_players) {
        this.$('.overlay.dialog-message').addClass('visible');
      } else {
        this.$('.overlay.dialog-message').removeClass('visible');
      }
    },

    setupWeather: function() {
      this.setCurrentWeather();
      this.rotateWeather();

      // TODO: How often to refresh weather conditions?
    },

    rotateWeather: function() {
      var i = 0;

      // show temperature conditions first
      this.$('.view').eq(i).addClass('visible');

      // rotate between conditions and wind
      setInterval(function() {
        i++;
        if(i > 1) {
          i = 0;
        }

        var index = i % 2;
        this.$('.view').removeClass('visible').eq(index).addClass('visible');
      }.bind(this), 30000);
    },

    setCurrentWeather: function() {
      this.$('.conditions').find('.temp span').html('70');
      this.$('.conditions').find('.state').attr('data-type', 'rain');

      this.$('.wind').find('.state').find('.direction').html('NE');
      this.$('.wind').find('.state').find('.speed').html('12');
    },

    closeOverlays: function(e) {
      var $this = $(e.target);
      if(this.show_player_search) {
        return this.closePlayerSearch($this, true);
      } else if(this.show_hole_detail) {
        return this.closeHoleOverlay($this, true);
      }

      return true;
    },

    togglePlayerSearch: function(e) {
      if(this.show_hole_detail) {
        this.closeHoleOverlay($(e.target));
      }

      if(!this.show_player_search) {
        this.$('.trackerWrapper').addClass('player_search');
        this.show_player_search = true;

        if(!this.navbar.rendered) {
          this.navbar.render();
        }
        this.navbar.$('#findPlayer').focus();

        TrackUtils.measure('Map', 'Open Search');
      } else {
        this.$('.trackerWrapper').removeClass('player_search');
        this.show_player_search = false;

        TrackUtils.measure('Map', 'Close Search');
      }

      return false;
    },

    closePlayerSearch: function(elem, measure) {
      if(elem.closest('.nav-control-wrap').length === 0) {
        this.$('.trackerWrapper').removeClass('player_search');
        this.show_player_search = false;

        if(measure) {
          TrackUtils.measure('Map', 'Close Search');
        }

        return false;
      }

      return true;
    },

    loadHoleList: function() {
      this.list = this.$('.hole-list');
      Holes.each(function(hole) {
        this.list.find('li[data-hole="' + hole.id + '"]').find('.hole_flora').html(hole.get('plant'));
      }.bind(this));
    },

    selectHole: function(e) {
      var $this = $(e.currentTarget);

      var hole = $this.attr('data-hole');
      this.loadHole($this, hole);

      return false;
    },

    loadHole: function(elem, hole_num) {
      // check if player search is open, close if so
      if(this.show_player_search) {
        this.closePlayerSearch(elem, false);
      }

      var hole = Holes.get(hole_num);

      if(this.overlay === undefined) {
        this.overlay = new TrackMapOverlay({
          el: this.$('.hole-info-wrap'),
          model: hole
        });

        this.listenTo(this.overlay, 'hole:close', function() {
          this.show_hole_detail = false;
        });
      } else {
        this.overlay.model = hole;
        this.overlay.initialize();
      }
      this.overlay.render();

      this.show_hole_detail = true;
      TrackUtils.measure('Open Hole Detail', '' + hole.id);
    },

    closeHoleOverlay: function(elem, measure) {
      if(elem.closest('.hole-info-wrap').length === 0) {
        this.overlay.close();

        if(measure) {
          TrackUtils.measure('Close Hole Detail');
        }
        return false;
      }

      return true;
    }
  });

  return TrackIndex;
});

