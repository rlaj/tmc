define('views/track/mobile-shot-list',['require','underscore','jquery','backbone','utils/pubsub','utils/window-size','settings','utils/browser','utils/common','models/track/state','utils/track/track','text!templates/track/mobile-shot-row.html!strip','jquery.touchswipe','jquery.jscrollpane'],function(require) {
  var _ = require('underscore'),
      $ = require('jquery'),
      Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      Win = require('utils/window-size'),
      Settings = require('settings'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),

      State = require('models/track/state'),
      TrackUtils = require('utils/track/track'),

      mobileShotRow = require('text!templates/track/mobile-shot-row.html!strip')
      ;

  require('jquery.touchswipe');
  require('jquery.jscrollpane');

  var MobileShotListView = Backbone.View.extend({
    el: '.mobile-shot-list-wrapper',

    template: _.template(mobileShotRow),

    events: {
      'click .toggleMobileShotByShot': 'toggleMobileShotByShot',
      'click .shot-row': 'selectShot'
    },

    list_enabled: true,
    list_is_open: false,

    initialize: function() {
      this.shot_list = this.$('.shot-list');
      this.pane = this.shot_list.find('.scroll-pane');
      this.shot_row = this.shot_list.find('.shot-row');
      this.icon = this.$('.toggleMobileShotByShot');
      this.icon.toggleClass('enabled', this.list_enabled);

      this.listenTo(PubSub, 'windowsize:global:enter', this.checkShotList);
      this.listenTo(PubSub, 'windowsize:global:exit', this.disableShotList);

      this.listenTo(PubSub, 'windowsize:orientation:portrait', this.destroyScrollPane);
      this.listenTo(PubSub, 'windowsize:orientation:landscape', this.initialiseScrollPane);

      this.listenTo(State, 'shotlist:update', this.updateShotList);

      this.listenTo(State, 'shotlist:resize', this.reinitialiseScrollPane);
      this.listenTo(State, 'shotlist:set', this.setMobileShotList);
      this.listenTo(State, 'shotlist:toggle', this.toggleMobileShotByShot);

      this.listenTo(State, 'shotrow:set', this.setMobileShotRow);

      this.listenTo(State, 'hole:change', this.updateHoleInfo);
    },

    render: function() {
      this.addSwipeTo('.body');

      return this;
    },

    onDispose: function() {
      this.removeSwipeTo();
      this.destroyScrollPane();
    },

    updateHoleInfo: function(hole) {
      this.$('#holeNum').html(hole.get('number'));
      this.$('#parNum').html(hole.get('par'));
      var round = State.get('selected_round');
      if(round === 5) {
        round = 'P';
      }
      this.$('.roundNum').html(round);
    },

    checkShotList: function() {
      this.selectMobileShotRow();
      this.updateShotList();

      return false;
    },

    enableShotList: function() {
      this.initialiseScrollPane();
    },

    disableShotList: function() {
      this.reinitialiseScrollPane();
    },

    updateShotList: function() {
      if(Win.size() === Win.sizes.global) {
        if(Win.orientation() === Win.orientations.landscape) {
          this.enableShotList();
        } else {
          this.disableShotList();
        }
      }
    },

    // load and update shot list
    setMobileShotList: function(data) {
      this.pane.find('ul').empty();
      this.shot_list.removeClass('highlight');

      // loop through shots and prepend in the shot list
      var mobileShotList;
      for(var i = 0, l = data.length; i < l; i++) {
        var shotNum = data[i].get('number');
        var shot = data[i];

        mobileShotList = this.template({
          number: shotNum
        });

        mobileShotList = $(mobileShotList);
        if(shotNum === 0) {
          mobileShotList.html('Group is on tee');
        }

        if(shot.get('has_video')) {
          mobileShotList.addClass('highlight')
            .attr({
              'data-id': shot.get('highlightId'),
              'data-url': shot.get('highlightURL')
            });
          this.shot_list.addClass('highlight');
        }

        if(shotNum > 0) {
          mobileShotList.removeClass('tee');
          var mobileSpan = mobileShotList.find('.distance span').removeClass('feet inch');
          TrackUtils.setShotDistance(mobileSpan, shot);

          mobileSpan = mobileShotList.find('.topin').removeClass('score').find('span').removeClass('feet inch score');
          TrackUtils.setShotToPin(mobileSpan, shot);
        } else {
          mobileShotList.addClass('tee');
        }

        this.shot_list.find('ul').prepend(mobileShotList);
        this.updateShotList();
      }

      // select Mobile Shot List Row
      this.setMobileShotRow(State.get('selected_shot'));

      // FIXME: Existing rules said if no next shot, disable shot list toggle arrow
      // but that doesn't really make sense. Only case would be if only one shot,
      // but that also makes it weird if you navigate from another hole with the list
      // already open?
      this.list_enabled = data.length > 1;
      this.icon.toggleClass('enabled', this.list_enabled);
    },

    clearExtraShotRows: function(playerData) {
      // NOT USING FOR NOW -- keeping it in case we want to update shot list line by line
      // clear out extra .shot-row, create/update shot detail list for mobile
      var playerShotData = playerData;
      var mobileShotRowsNum = this.shot_row.length;
      var allShotsNum = playerShotData.current_hole.shots.length;
      if((mobileShotRowsNum !== 0) && (mobileShotRowsNum > allShotsNum)) {
        var rowsToClear = mobileShotRowsNum - allShotsNum;
        for(var rowIndex = 0; rowIndex < rowsToClear; rowIndex++) {
          // var rowIndexToClear =  allShotsNum + rowIndex;
          var rowIndexToClear =  0; // always .shot-row:eq(0) is to clear as the list is reversed
          this.shot_list.find('.shot-row:eq(' + rowIndexToClear + ')').remove();
        }
      }
    },

    // set selected shot-row when loaded and refreshed
    setMobileShotRow: function(shot) {
      var shotRows = this.$('.shot-row');
      var shotRowShot = this.shot_list.find('.shot-row.shot' + shot.get('number'));

      // hide the shot-row by default
      shotRows.removeClass('selected').addClass('hide');
      shotRowShot.addClass('selected').removeClass('hide');
    },

    // when shot nav is navigated in the desktop view,
    // make sure to update the mobile shot-list selection
    selectMobileShotRow: function() {
      var $selectedShot = State.get('selected_shot');
      this.setMobileShotRow($selectedShot);
    },

    toggleMobileShotByShot: function(state) {
      if((Win.size() === Win.sizes.global)) {
        if(state === true) {
          this.openMobileShotList();
          return;
        } else if(state === false) {
          this.closeMobileShotList();
          return;
        }

        if(this.list_is_open) {
          this.closeMobileShotList();
        } else {
          this.openMobileShotList();
        }
      }
    },

    closeMobileShotList: function() {
      if(this.list_is_open) {
        this.shot_list.removeClass('open');
        this.icon.removeClass('open');
        this.shot_list.find('.shot-row').removeClass('show');
        this.list_is_open = false;
        TrackUtils.measure('Shot List', 'Close');

        if(Win.orientation() === Win.orientations.landscape) {
          this.initialiseScrollPane();
        } else {
          this.destroyScrollPane();
        }
      }
    },

    openMobileShotList: function() {
      if(!this.list_is_open) {
        this.shot_list.addClass('open');
        this.icon.addClass('open');
        this.shot_list.find('.shot-row').addClass('show');
        this.list_is_open = true;
        TrackUtils.measure('Shot List', 'Open');

        if(Win.orientation() === Win.orientations.landscape) {
          this.initialiseScrollPane();
        } else {
          this.destroyScrollPane();
        }
      }
    },

    selectShot: function(e) {
      var $this = $(e.currentTarget);
      var $target = $(e.target);

      var selectedShot = $this.data('shot').toString();
      if(!$target.hasClass('shot-video') || !$this.hasClass('highlight')) {
        State.trigger('controls:shot:select', selectedShot);
        TrackUtils.measure('Shot List', 'Shot', selectedShot);
      } else {
        // launch shot video path
        console.log('[Shot Row ' + selectedShot + '] attempting to launch shot video');
        // PubSub.trigger('whats-new:close', 'shotListHighlight');

        if(Browser.app && Browser.apptype.android) {
          var id = $this.data('id');
          Common.sendAndroidMessage('video?id=' + id);
        } else {
          var url = $this.data('url');
          Backbone.history.navigate(url, true);
        }
      }
    },

    initialiseScrollPane: function() {
      this.pane = this.shot_list.find('.scroll-pane');
      var list = this.pane.data('jsp');
      if(list !== undefined) {
        this.reinitialiseScrollPane(true);
      } else {
        if(!Settings.Scores.stub_track) {
          this.pane.jScrollPane({showArrows: true, verticalGutter: -10});
        }
      }
    },

    destroyScrollPane: function() {
      var list = this.pane.data('jsp');
      if(list !== undefined) {
        list.destroy();

        // destroying list re-attaches .scroll-pane
        // so we must reset its reference here
        this.pane = this.shot_list.find('.scroll-pane');
      }
    },

    reinitialiseScrollPane: function(force) {
      var list = this.pane.data('jsp');
      if(force || list !== undefined) {
        list.reinitialise();
      }
    },

    addSwipeTo: function(selector) {
      this.removeSwipeTo();
      this.swipe_obj = $(selector).swipe({
        swipe: function(event, direction, distance, duration, fingerCount) {
          if(Win.size() === Win.sizes.global && Win.orientation() === Win.orientations.portrait) {
            switch(direction) {
              case 'up':
                State.trigger('shotlist:toggle', true);
                break;
              case 'down':
                State.trigger('shotlist:toggle', false);
                break;
              case 'left':
                State.trigger('controls:hole:next');
                break;
              case 'right':
                State.trigger('controls:hole:previous');
                break;
              default:
                break;
            }
          }
        },

        // Default is 75px, set to 3px
        threshold: 50
      });
    },

    removeSwipeTo: function() {
      if(this.swipe_obj) {
        this.swipe_obj.swipe('destroy');
      }
      this.swipe_obj = undefined;
    }
  });

  return MobileShotListView;
});

