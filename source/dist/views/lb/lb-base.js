define('views/lb/lb-base',['require','jquery','underscore','backbone','utils/metrics','utils/pubsub','utils/scores','views/scorecard','utils/lb/lb-left-offset','utils/lb/lb-window-size','utils/lb/lb-common'],function(require) {
  var $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Metrics = require('utils/metrics'),
      PubSub = require('utils/pubsub'),
      Scores = require('utils/scores'),
      ScorecardView = require('views/scorecard'),
      LBLeftOffset = require('utils/lb/lb-left-offset'),
      LBWin = require('utils/lb/lb-window-size'),
      LBCommon = require('utils/lb/lb-common')
      ;

  var JST = {};

  JST.projected_cut = _.template(
    '<div class="leaderBoardRow cutline"><div class="hr-line"><span>Projected Cut</span></div></div>'
  );

  JST.no_results_found = _.template(
    '<div class="leaderBoardRow noplayers triplebottomborder tripleheight">No Results Found</div>'
  );

  var LBBaseView = Backbone.View.extend({

    defaults: {
      // used for expand/collapse scorecard animation
      animationDuration: 500,
      animationEasing: 'easeInExpo',
      lbFormat: LBCommon.lbFormat.MAIN, // denotes 'main' leaderboard as opposed to leaderboard everywhere
      lbEverywherePlayerRowHeight: 32 //32px is the default for both lb everywhere trad and ou views across all breakpoints
    },

    events: {
      // 'click .favorite': 'triggerFavorite',
    },

    initialize: function(opts) {
      this.showFav = true;
      this.searchMode = false;
      this.minRows = 10;
      this.logger = new eventsCore.util.Logger('LBBaseView');
      this.logger.info('Initialize');
      this.lbFormat = opts.lbFormat || this.defaults.lbFormat;

      /**
       * Updates leaderboard when scores collection is modified by a search or filter action
       * @param {Boolean} searchMode (optional) if modified by a search action
       */
      this.listenTo(PubSub, this.lbFormat + ':scores_collection:modified' , function(searchMode) {
        this.destroyScorecard();
        this.searchMode = searchMode;

        if(this.lbFormat === LBCommon.lbFormat.MAIN) {
          this.fillInLeaderboardWithEmptyRows(this.minRows);
        } else if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE){
          this.fillInLeaderboardWithEmptyRows(this.calculateNumberOfEmptyRowsToInsert());
        }

        this.favoritesShow();
        this.insertCutLine();
        this.addBottomBorders();
      });


      //only display scorecard on main leaderboard
      if(this.lbFormat === LBCommon.lbFormat.MAIN) {
        this.listenTo(PubSub, 'lbbase:playerRowClicked', function(targetPlayerId) {
          this.toggleScorecardForPlayerRow(targetPlayerId);
        });

        this.listenTo(PubSub, 'scorecard:close', function(targetPlayerId) {
          this.toggleScorecardForPlayerRow(targetPlayerId);
        });

      }

      if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        this.listenTo(PubSub, 'leaderboard-everywhere:resize', function(event, ui) {
          //only trigger when lbe panel changes height or we're on mobile layout and viewport has been resized,
          //which then resizes lbe panel (event === undefined)
          if(event === undefined ||  ui.originalSize.height != ui.size.height) {
            this.fillInLeaderboardWithEmptyRows(this.calculateNumberOfEmptyRowsToInsert());
            this.addBottomBorders();
          }
        });
      }
    },

    render: function() {
      this.onRender();
      return this;
    },

    onRender: function() {},

    writeHtml: function() {
      var fpRowObjs = this.buildFavPlayers();
      this.$favPlayerContainer.html(fpRowObjs);

      var prRowObjs = this.buildAllPlayers();
      this.$allPlayerContainer.html(prRowObjs);

      this.insertCutLine();

      this.favoritesShow();
      this.addBottomBorders();

      // event for ou.js to enable isInview()
      PubSub.trigger('writeHtml:complete');
    },

    // Used to populate table with empty rows
    calculateNumberOfEmptyRowsToInsert: function() {
      var bodyHeight = this.$el.innerHeight() - this.$('.headerWrapper').outerHeight();
      var nEmptyRowsToInsert = Math.floor(bodyHeight / this.defaults.lbEverywherePlayerRowHeight);
      return nEmptyRowsToInsert;
    },


    getNumberOfPlayerRowsToShowFromCollection: function(scores_collection) {
      var nCurrentRows = 0;
      if(this.lbFormat === LBCommon.lbFormat.MAIN) {
        nCurrentRows = scores_collection.where({'show': true}).length;
      } else if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        nCurrentRows = scores_collection.where({'showLBEverywherePlayer': true}).length;
      }
      return nCurrentRows;
    },

    /**
     * Create empty rows to fill in leaderboard so that there are
     * at least {minRows} displaying.
     */
    fillInLeaderboardWithEmptyRows: function(minRows) {
      var showFlag = LBCommon.lbShowPlayerFlag.MAIN; // main leaderboard
      if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        showFlag = LBCommon.lbShowPlayerFlag.EVERYWHERE;
      }

      this.$('.leaderBoardRow.playerRow.searchEmptyRow').remove();
      this.$('.leaderBoardRow.noplayers').remove();

      var nCurrentRows = this.getNumberOfPlayerRowsToShowFromCollection(this.scores_collection);

      // count favorite rows when not in search mode
      if(!this.searchMode) {
        var favRows = this.getNumberOfPlayerRowsToShowFromCollection(this.favcollection);
        if(favRows > 0) {
          // add 2 for the rows containing the 'favorite' and 'all players' title
          nCurrentRows += favRows + 2;
        }
      }

      if(nCurrentRows < minRows) {
        var nEmptyRowsToCreate = minRows - nCurrentRows;
        var empty_rows_html = '';

        // if there are no results, create a row for 'no results' message
        if(nCurrentRows === 0) {
          nEmptyRowsToCreate--;
          empty_rows_html += JST.no_results_found({});
        }

        // create empty player rows
        for(var i = 0; i < nEmptyRowsToCreate; i++) {
          empty_rows_html += this.createEmptyPrRow();
        }

        this.$allPlayerContainer.append(empty_rows_html);
      }
    },

    buildFavPlayers: function() {
      var favplayers_list = [];

      this.favcollection.forEach(function(player) {
        var html = '';
        var obj = this.createNewFpRow(player);
        this.fpRows[player.id] = obj;
        this.fpOrder.push(player.id);
        html = obj.$el;
        favplayers_list.push(html);
      }.bind(this));

      return favplayers_list;
    },

    buildAllPlayers: function() {
      var players_list = [];

      this.scores_collection.forEach(function(player) {
        var html = '';
        var obj = this.createNewPrRow(player);
        this.prRows[player.id] = obj;
        this.prOrder.push(player.id);
        html = obj.$el;
        players_list.push(html);
      }.bind(this));

      return players_list;
    },

    removeFavRow: function(model) {
      // var rowObj = LBCommon.findInArrayByPid(this.fpRows, model.id);
      var rowObj = this.fpRows[model.id];

      rowObj.dispose();

      // update fpRows array
      this.fpRows[model.id] = undefined;
      delete this.fpRows[model.id];
      this.fpOrder.splice(this.fpOrder.indexOf(model.id), 1);
      // this.fpRows = _.without(this.fpRows, _.findWhere(this.fpRows, {
      //   pid: model.id
      // }));

      if(this.lbFormat === LBCommon.lbFormat.MAIN) {
        this.fillInLeaderboardWithEmptyRows(this.minRows);
      } else if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        this.fillInLeaderboardWithEmptyRows(this.calculateNumberOfEmptyRowsToInsert());
      }

      this.favoritesShow();

      this.addBottomBorders();
    },

    addFavRow: function(model) {
      var new_player = [];
      var html = '';

      var obj = this.createNewFpRow(model);
      var loc = this.favcollection.indexOf(model);

      // insert array of objs into fpRows based on favcollection location
      this.fpRows[model.id] = obj;
      this.fpOrder.splice(loc, 0, model.id);

      html = obj.$el;
      new_player.push(html);

      // set targetId to be right after the new_player, then add new_player obj above the targetId
      // if new_player's position is the last in the collection, simply append the new_player obj
      var targetId = this.fpOrder[loc + 1];
      if(loc === this.favcollection.length - 1) {
        this.$favPlayerContainer.append(new_player);
      } else {
        var $targetRow = this.fpRows[targetId].$el;
        $targetRow.before(new_player);
      }

      if(this.lbFormat === LBCommon.lbFormat.MAIN) {
        this.fillInLeaderboardWithEmptyRows(this.minRows);
      } else if(this.lbFormat === LBCommon.lbFormat.EVERYWHERE){
        this.fillInLeaderboardWithEmptyRows(this.calculateNumberOfEmptyRowsToInsert());
      }

      this.favoritesShow();
      this.addBottomBorders();
    },

    // when current_sort_order is changed, move the affected row to the new position
    // row data update is done in trad-player-row.js
    moveRow: function(model) {
      // new position to place the row to
      var newPos = this.scores_collection.indexOf(model);
      this._moveRow(model, newPos);
      this.addBottomBorders();
    },

    // when round number is changed either by Concurrent Round selector action (concurrentRound:select)
    // or by srarting a new round (change:currentRound), reorder all the player rows in the OU and Trad views
    // this is called in ou.js and trad.js
    // pass sorted collections and each stored player arrays & containers $el
    reOrderRows: function() {
      this.scores_collection.forEach(function(player, i) {
        var newPos = i;
        this._moveRow(player, newPos);
      }.bind(this));
    },

    _moveRow: function(player, newPos) {
      // find affected obj in the prRows array
      // var playerArrayIndex = LBCommon.findIndexInArrayByPid(this.prRows, player.id);
      var playerArrayIndex = this.prOrder.indexOf(player.id);
      this.logger.info('moving player ' + player.attributes.name + ' from:' + playerArrayIndex + ' to:' + newPos + ', old pos:' + player._previousAttributes.current_sort_order);

      if(playerArrayIndex > -1 && newPos !== playerArrayIndex) {
        // dom $el that needs to be moved
        var targetPlayerObj = this.prRows[player.id].$el;
        targetPlayerObj.detach();

        // remove old player position from order
        this.prOrder.splice(this.prOrder.indexOf(player.id), 1);

        // the targeted dom el for the new position
        var targetId = this.prOrder[newPos];
        if(targetId) {
          var $targetPlayerRow = this.prRows[targetId].$el;
          $targetPlayerRow.before(targetPlayerObj);
        } else {
          // if last row, simply append $el
          this.$allPlayerContainer.append(targetPlayerObj);
        }

        // add new player position to order
        this.prOrder.splice(newPos, 0, player.id);
      }

      // favorite players section
      if(player.get('is_fave')) {
        // var favPlayerArrayIndex = LBCommon.findIndexInArrayByPid(this.fpRows, player.id);
        var favPlayerArrayIndex = this.fpOrder.indexOf(player.id);
        var loc = this.favcollection.indexOf(player);

        if(favPlayerArrayIndex > -1 && favPlayerArrayIndex !== loc) {
          // var tarFpObj = this.fpRows[favPlayerArrayIndex].fpRow.$el;
          var tarFpObj = this.fpRows[player.id].$el;
          tarFpObj.detach();

          // remove old player position from order
          this.fpOrder.splice(this.fpOrder.indexOf(player.id), 1);

          var favTargetId = this.fpOrder[loc];
          if(favTargetId) {
            var $targetFavPlayerRow = this.fpRows[favTargetId].$el;
            $targetFavPlayerRow.before(tarFpObj);
          } else {
            this.$favPlayerContainer.append(tarFpObj);
          }

          // add new player position to order
          this.fpOrder.splice(loc, 0, player.id);
        }
      }
      this._moveExpandedScorecard(player);
    },

    // Move expanded scorecard along with the player row it belongs to
    _moveExpandedScorecard: function(player) {
      if(this.scorecardView) {
        if(this.scorecardView.options.playerId === player.get('id')) {
          this.scorecardView.$el.addClass('noanimation');
          var rowType = this.scorecardView.options.targetPlayerId.substring(0,2); //pr|fp
          if(rowType === 'pr') { //regular player row
            this.prRows[this.scorecardView.options.playerId].$el.after(this.scorecardView.$el);
          } else if(rowType === 'fp') { //favorite player row
            this.fpRows[this.scorecardView.options.playerId].$el.after(this.scorecardView.$el);
          }
        }
      }
    },

    // always sort collection with the selected sort criteria
    // then perform moveRow(), since collections are cloned
    checkUpdates: function(model) {
      this.favcollection.sortCollection(this.sortItem);
      this.scores_collection.sortCollection(this.sortItem);
      this.moveRow(model);
    },

    insertCutLine: function() {
      if(Scores.collection.currentRound === 2 && Scores.collection.cutLine !== '' && this.showCut && !this.searchMode) {
        var is_cut_player = this.scores_collection.findWhere({is_projected_cut: true});
        var loc = this.scores_collection.indexOf(is_cut_player);

        // .playerRow el where the projected cut line row should be added
        var $targetPlayerRow = this.$allPlayerContainer.find('.playerRow:eq(' + loc + ')');
        this.removeCutLine();
        $targetPlayerRow.before(JST.projected_cut());
      } else {
        this.removeCutLine();
      }
    },

    removeCutLine: function() {
      this.$el.find('.cutline').remove();
    },

    showSelectedView: function(currentLB) {
      // LeaderBoard.Common.destroyStickyNav();
      if(LBWin.size() === LBWin.sizes.lgskeuomorphic || LBWin.size() === LBWin.sizes.smskeuomorphic) {
        LBLeftOffset.init(this);
      }

      this.$('.headerWrapper').removeClass('stickybar');

      this.$('.lbScorecardPanel').addClass('noanimation'); // disable scorecard panel animation when switching views

      // get scroll position before hiding previously selected view
      var wrapper = this.$('.content.selected');
      if(wrapper.length > 0) {
        var scrollVal = wrapper.find('.scroll-pane').scrollTop();
        wrapper.removeClass('selected');
      }

      // display currently selected view and set scroll position
      wrapper = this.$('.content.' + this.currentLB);
      wrapper.addClass('selected');
      wrapper.find('.scroll-pane').scrollTop(scrollVal);

      // LeaderBoard.Common.stickyNav(this.$('.headerRow'));
    },

    favoritesShow: function() {
      this.showFav = !this.searchMode;  // hide favorite section and 'all players' title during player search

      if((this.favcollection.length === 0)
        || (this.showFav == false && (this.favcollection.length > 0))) {
        // set css to hide Fav
        this.$('div.titleRow').remove();
        this.showFav = false;
      } else {
        this.$('div.titleRow').remove();
        if(this.$('div.titleRow').length === 0) {
          var favTitleRow = '<div class="titleRow favoritesTitle">Favorites</div>';
          var playersTitleRow = '<div class="titleRow allPlayersTitle">All Players</div>';

          $(favTitleRow).prependTo(this.$favPlayerContainer);
          $(playersTitleRow).prependTo(this.$allPlayerContainer);
        }

        // set css to show Fav
        this.showFav = true;
      }

      // when the Player Filter is used, check if the favorites are visible
      if(this.$favPlayerContainer.find('.leaderBoardRow').not('.hidden').length === 0) {
        // hide the Favorites section
        this.$allPlayerContainer.closest("[id*='-wrapper']").removeClass('showFav').addClass('hideFav');

        // reset to hide Fav
        this.showFav = false;
      }
      this.isShowFav();
    },

    isShowFav: function() {
      var selector = "[id*='-wrapper']"; //Main leaderboard
      if (this.lbFormat === LBCommon.lbFormat.EVERYWHERE){
        selector = ".lbe-players-wrapper";
      }

      if(this.showFav) {
        this.$el.find(selector).removeClass('hideFav').addClass('showFav');
      } else {
        this.$el.find(selector).removeClass('showFav').addClass('hideFav');
      }
    },

    // add darker bottom border to every 3rd row
    addBottomBorders: function(container) {
      // container is passed when resetCurrentLB is triggered
      // when the OU / Trad view is switched by user
      if(container !== undefined) {
        this.$allPlayerContainer = this.$(LBCommon._lbTypeLookUp[container]);
      }
      this.removeBottomBorders(container);
      var rows = this.$allPlayerContainer.find('.leaderBoardRow').not('.hidden');
      for(var i = 0, l = rows.length; i < l; i += 3) {
        rows[i].className += ' triplebottomborder tripleheight';
      }
      if(l > 0) {
        rows[l-1].className += ' lastrow';
      }
    },

    removeBottomBorders: function(container) {
      if(container !== undefined) {
        this.$allPlayerContainer = this.$(LBCommon._lbTypeLookUp[container]);
      }
      this.$allPlayerContainer.find('.leaderBoardRow').filter('.lastrow').removeClass('lastrow').end()
        .filter('.triplebottomborder').removeClass('triplebottomborder').removeClass('tripleheight');
    },

    // FIXME: Revisit to use single view that's attached to the current visible LB view instead of
    // creating one view for each LB view
    playerRowClicked: function(e) {
      //only display scorecard on main leaderboard
      if(this.lbFormat !== LBCommon.lbFormat.EVERYWHERE && e.target.tagName.toLowerCase() !== 'a') {
        var targetPlayerId = $(e.currentTarget).attr('id');
        PubSub.trigger('lbbase:playerRowClicked', targetPlayerId);

        if(this.scorecardView && this.scorecardView.options.targetPlayerId === targetPlayerId) {
          Metrics.measureApp(Metrics.page_section, 'Scorecard', 'Close');
        } else {
          var playerModel = this.scores_collection.get(targetPlayerId.slice(2));
          var playerFullName = playerModel ? playerModel.get('full_name') : '';

          Metrics.trackS({
            prop58: playerFullName
          });

          Metrics.measureApp(Metrics.page_section, 'Scorecard', 'Open');
        }
      }
    },

    playerRowLinkClicked: function(e) {
      //when we're on mobile screen size, close lb everywhere panel when player bio or track link is clicked
      //so that it doesn't block the track page
      if(LBWin.size() <= LBWin.sizes.mobileLandscape && this.lbFormat === LBCommon.lbFormat.EVERYWHERE) {
        PubSub.trigger('leaderboardEverywhere:close');
      }
    },

    toggleScorecardForPlayerRow: function(targetPlayerId) {
      var createNewScorecard = true;
      var destroyScorecard = false;
      var delay = 0;

      if(this.scorecardView) {
        destroyScorecard = true;
        delay = this.defaults.animationDuration;
        this.scorecardView.$el.removeClass('noanimation show');

        // no need to create a new scorecard if toggling currently expanded scorecard
        if(this.scorecardView.options.targetPlayerId === targetPlayerId) {
          createNewScorecard = false;
        }
      }

      // if there's a scorecard already expanded, wait for its collapse
      // animation to complete before disposing and creating a new one
      setTimeout(function() {
        destroyScorecard && this.destroyScorecard();
        createNewScorecard && this.createNewScorecard(targetPlayerId);
      }.bind(this), delay);

      return false;

      // var animationEnd = $.Deferred();
      // $.when(animationEnd).done(function(options) {
      //   if(options.destroyScorecard) {
      //     this.destroyScorecard();
      //   }
      //   if(options.createNewScorecard) {
      //     this.createNewScorecard(options.targetPlayerId);
      //   }
      // }.bind(this));

      // if(this.scorecardView) {
      //   var $scorecardPanel = this.$('.lbScorecardPanel');
      //   destroyScorecard = true;
      //   //After sorting, the scorecard is removed from the DOM but the view still exists
      //   //For this case, just destroy the existing view
      //   if($scorecardPanel.length !== 0) {
      //     destroyScorecard = true;
      //     if(this.scorecardView.options.targetPlayerId === targetPlayerId) {
      //       createNewScorecard = false;
      //     }
      //     $scorecardPanel.removeClass('noanimation show');
      //     if(this.$el.hasClass('selected')) {
      //       $scorecardPanel.on('animationend', function() {
      //         animationEnd.resolve({
      //           destroyScorecard: destroyScorecard,
      //           createNewScorecard: createNewScorecard,
      //           targetPlayerId: targetPlayerId
      //         });
      //       });
      //       return false;
      //     }
      //   }

      // }

      // animationEnd.resolve({
      //   destroyScorecard: destroyScorecard,
      //   createNewScorecard: createNewScorecard,
      //   targetPlayerId: targetPlayerId
      // });
    },

    destroyScorecard: function() {
      if(this.scorecardView) {
        var targetPlayerId = this.scorecardView.options.targetPlayerId;
        this.$('#' + targetPlayerId).removeClass('showScorecard');
        this.scorecardView.dispose();
        this.scorecardView = null;
      }
    },

    createNewScorecard: function(targetPlayerId) {
      if(!this.scorecardView && (targetPlayerId && targetPlayerId.trim() !== '')) {
        var playerId = targetPlayerId.slice(2);
        var playerModel = this.scores_collection.get(playerId);
        this.scorecardView = new ScorecardView({
          type: 'leaderboard',
          targetPlayerId: targetPlayerId, // used to identify which player row (be it regular or favorite) a scorecard belongs to
          player: {
            id: playerId,
            name: playerModel.get('full_name'),
            country: playerModel.get('country')
          }
        });

        var $scorecardPanel = this.scorecardView.render().$el;
        this.$('#' + targetPlayerId).after($scorecardPanel);
        this.$('#' + targetPlayerId).addClass('showScorecard'); //used for setting background color of player row that has its scorecard open
        PubSub.trigger('lookup.unveil');
        $scorecardPanel.addClass('show');

        $scorecardPanel.one('animationstart', function(e) {
          // scroll to the top of the player row with the expanded scorecard
          var scrollVal = this.$('.scroll-pane').scrollTop() + this.$('#' + targetPlayerId).position().top;
          this.$('.scroll-pane').animate({
            scrollTop: scrollVal
          }, this.defaults.animationDuration, this.defaults.animationEasing);
        }.bind(this));
      }
    }
  });

  return LBBaseView;
});
