define('views/track/player-list',['require','backbone','underscore','jquery','utils/favorites','utils/scores','utils/pubsub','utils/track/constants','models/track/state','utils/track/track','jquery.mousewheel','jquery.jscrollpane'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      $ = require('jquery'),
      Favorite = require('utils/favorites'),
      Scores = require('utils/scores'),
      PubSub = require('utils/pubsub'),

      Constants = require('utils/track/constants'),
      State = require('models/track/state'),
      TrackUtils = require('utils/track/track')
      ;

  require('jquery.mousewheel');
  require('jquery.jscrollpane');

  var TrackPlayerList = Backbone.View.extend({
    rendered: false,

    overlay: '',
    group_list: '',

    list_type: Constants.STATE.PRIMARY, // update when switching to compare list

    el: '#playerList',

    primary_open: false,
    compare_open: false,

    group_template: _.template(
            // TODO: these should be 39x39
            '<img src="/images/players/2016/80x80/<%= id %>.jpg" alt="<%= name.first + " " + name.last %>"/>'
            + '<div class="name" data-first="<%= name.first %>" data-last="<%= name.last %>"></div>'),

    list_template: _.template(
            '<li><a href="/en_US/players/player_<%= id %>.html" data-id="<%= id %>">'
            // TODO: these should be 67x50
            + '  <img src="/images/players/2016/201x150/<%= id %>.jpg" alt="<%= name %>"/>'
            + '  <div class="name"><%= name %></div>'
            + '  <div class="favorite <%= is_fave ? "selected" : "" %>"></div>'
            + '</a></li>'),

    events: {
      'click li > a': 'doListAction',
      'click li .favorite': 'toggleFavorite'
    },

    initialize: function(opts) {
      this.primary_open = opts.list_open;

      this.result_list = this.$('#resultList');
      this.favorite_list = this.$('#favoriteList');
      this.group_list = this.$('.group ul.players');

      if(!this.primary_open) {
        this.listenTo(State, 'playerlist:primary:toggle', this.toggleList);
        this.listenTo(State, 'playerlist:compare:toggle', this.toggleCompare);
        this.listenTo(State, 'playerlist:close', this.closeList);
        this.listenTo(State, 'playerlist:update', this.updateList);
      }
      this.listenTo(State, 'playerlist:resize', this.resize);

      this.listenTo(State, 'grouplist:clear', this.clearGroupList);
      this.listenTo(State, 'grouplist:add', this.addGroupPlayer);

      this.listenTo(State, 'search', this.search);

      this.listenTo(PubSub, 'favorite:add', this.updateFavorites);
      this.listenTo(PubSub, 'favorite:remove', this.updateFavorites);
    },

    render: function() {
      this.$('.scroll-pane').jScrollPane({showArrows: true, verticalGutter: -10});

      if(this.primary_open) {
        this.openList();

        // using TEE state for permanently open list
        this.setListAction(Constants.STATE.TEE);
      }

      this.rendered = true;
      return this;
    },

    toggleList: function() {
      if(!this.primary_open) {
        this.closeList();
        this.list_type = Constants.STATE.PRIMARY;
        this.openList();
        TrackUtils.measure('Player Picker', 'Open');
      } else {
        this.closeList();
        TrackUtils.measure('Player Picker', 'Close');
      }

      State.trigger('playerlist:primary:onToggle', this.primary_open);
    },

    toggleCompare: function() {
      if(!this.compare_open) {
        this.closeList();
        this.list_type = Constants.STATE.COMPARE;
        this.openList();
        TrackUtils.measure('Compare Player', 'Open');
      } else {
        this.closeList();
        TrackUtils.measure('Compare Player', 'Close');
      }
    },

    openList: function() {
      this.$el.addClass('open');

      switch(this.list_type) {
        case Constants.STATE.TEE:
          this.setListAction(Constants.STATE.TEE);
          this.primary_open = true;
          break;
        case Constants.STATE.COMPARE:
          this.$el.addClass('compare-list');
          this.setListAction(Constants.STATE.COMPARE);
          this.compare_open = true;
          break;
        case Constants.STATE.PRIMARY:
        default:
          this.$el.removeClass('compare-list');
          this.setListAction(Constants.STATE.PRIMARY);
          this.primary_open = true;
          break;
      }

      this.showFavorites();
      this.updateGroup();

      // hide round/hole selectors when opening player search list
      State.trigger('controls:options:hide');
      State.trigger('shotlist:close');
    },

    closeList: function() {
      this.$el.removeClass('open compare-list');
      // reset search field
      // TODO: Move to PlayerNavBar
      State.trigger('search:clear');

      this.setListAction();
      this.primary_open = false;
      this.compare_open = false;

      State.trigger('playerbar:closelist');
    },

    setListAction: function(state) {
      this.list_state = state;
    },

    updateList: function() {
      this.showFavorites();
      this.updateGroup();
    },

    /**
     * Perform player selection based on list state
     */
    doListAction: function(e) {
      var $t = $(e.currentTarget);
      switch(this.list_state) {
        case Constants.STATE.COMPARE :
          if(!$t.parent().hasClass('disabled')) {
            TrackUtils.selectComparePlayer($t.attr('data-id'));
          }
          break;
        case Constants.STATE.PRIMARY :
          // select player
          if(!$t.parent().hasClass('disabled')) {
            TrackUtils.selectPlayer($t.attr('data-id'));
          }
          break;
        case Constants.STATE.TEE:
          // go to player page
          if(!$t.parent().hasClass('disabled')) {
            Backbone.history.navigate(TrackUtils.getURL('pid=' + $t.attr('data-id')), true);
          }
          break;
        default:
          break;
      }
      return false;
    },

    toggleFavorite: function(e) {
      var $this = $(e.currentTarget);
      var id = $this.parent().data('id');

      Favorite.toggle(id);
      $this.toggleClass('selected');

      return false;
    },

    /**
     * Remove all players in the group list
     * @param  {Integer} to_keep Keep this many players starting at the first player in the list
     */
    clearGroupList: function(to_keep) {
      if(to_keep && to_keep > 0) {
        // clean out group list items except for first x players
        this.group_list.find('li').slice(to_keep).remove();
      } else {
        this.group_list.empty();
      }
    },

    addGroupPlayer: function(player) {
      var li = this.createGroupListItem(player);
      this.group_list.append(li);
    },

    // +player+ : player object from score file
    createListItem: function(player) {
      var name = player.get('first_name') + ' ' + player.get('last_name');
      var is_fave = Favorite.check(player.id);
      var html = this.list_template({
        id: player.id,
        name: name,
        is_fave: is_fave
      });

      return $(html);
    },

    // +player+ : Track.Player object
    createGroupListItem: function(player) {
      var html,
          li = $('<li>');
      html = li;
      if(player.get('state') !== Constants.STATE.PRIMARY) {
        html = $('<a href="/en_US/players/player_' + player.id + '.html" data-id="' + player.id + '"></a>');
        li.append(html);
      }

      var content = this.group_template(player.attributes);
      html.append(content);

      return li;
    },

    search: function(term) {
      if(term === '') {
        // show favorites
        this.showFavorites();
      } else {
        // show results
        var result_container = this.result_list.removeClass('hidden');
        result_container.siblings('.list').addClass('hidden');

        var low_term = term.toLowerCase();

        var result_list = result_container.find('ul').empty();

        var current_round = Scores.Utilities.currentRoundWithPlayoff();

        var players = Scores.Utilities.search(low_term);
        for(var i = 0, l = players.length; i < l; i++) {
          var player = players[i];
          var html = this.createListItem(player);

          var klass = this.getDisabledPlayerClass(player, current_round);
          html.addClass(klass);

          result_list.append(html);
        }

        this.resize();
      }
    },

    resize: function() {
      var jsp;
      if(this.result_list) {
        jsp = this.result_list.find('.scroll-pane').data('jsp');
        if(jsp) {
          jsp.reinitialise();
        }
      }
      if(this.favorite_list) {
        jsp = this.favorite_list.find('.scroll-pane').data('jsp');
        if(jsp) {
          jsp.reinitialise();
        }
      }
    },

    // given list has been opened, load the user's favorite players
    // only if user has at least one favorite
    showFavorites: function() {
      // hide the player search list
      this.result_list.addClass('hidden');

      if(Favorite.favplayers.length > 0) {
        this.favorite_list.removeClass('hidden');
      }

      this.updateFavorites();
    },

    updateFavorites: function() {
      // clear out existing data
      var fav_list = this.favorite_list.find('ul').empty();

      var current_round = Scores.Utilities.currentRoundWithPlayoff();

      var fav_players = Favorite.favplayers;
      for(var i = 0, l = fav_players.length; i < l; i++) {
        var fid = parseInt(fav_players[i], 10);
        var player = Scores.Utilities.findByID(fid);
        if(player === undefined) {
          continue;
        }
        var html = this.createListItem(player);

        var klass = this.getDisabledPlayerClass(player, current_round);
        html.addClass(klass);

        html.find('.favorite').addClass('selected');

        fav_list.append(html);
      }

      var jsp = this.favorite_list.find('.scroll-pane').data('jsp');
      if(jsp) {
        jsp.reinitialise();
      }
    },

    // update enabled/disabled state of group players based on primary/compare list type
    updateGroup: function() {
      switch(this.list_type) {
        case Constants.STATE.COMPARE :
          this.group_list.find('li').each(function(i) {
            var li = $(this);
            var a = li.find('a');
            if(a.length === 0) { return; }

            var id = parseInt(a.attr('data-id'), 10);
            if(State.player_position.compare.indexOf(id) > -1) {
              li.addClass('disabled');
            } else {
              li.removeClass('disabled');
            }
          });
          break;
        case Constants.STATE.PRIMARY :
        default :
          this.group_list.find('li.disabled').removeClass('disabled');
          break;
      }
    },

    getDisabledPlayerClass: function(player, curr_rd) {
      var klass = '';
      var pid = parseInt(player.id, 10);
      switch(this.list_type) {
        case Constants.STATE.COMPARE :
          if(pid === State.player_position.primary || State.player_position.compare.indexOf(pid) > -1) {
            klass += ' disabled';
          }
          // determine whether player has played current hole
          var split = Scores.Utilities.isSplit(player, curr_rd);
          var has_played = Scores.Utilities.hasPlayedHole(player, State.get('selected_round'), State.get('selected_hole'), split);

          if(!has_played) {
            klass += ' unavailable disabled';
          }
          break;
        case Constants.STATE.PRIMARY :
          if(pid === State.player_position.primary) {
            klass += ' disabled';
          }
          break;
        default :
      }

      // determine if player has started playing yet
      var standing = Scores.Utilities.inGoodStanding(player);
      if(standing === 'X') {
        klass += ' not_started unavailable disabled';
      }

      return klass;
    }
  });

  return TrackPlayerList;
});

