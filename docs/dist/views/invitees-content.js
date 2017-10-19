define('views/invitees-content',['require','backbone','views/invitees-table-row','views/invitees-table-tooltip','text!templates/invitees-content.html!strip','utils/browser','utils/metrics'],function(require) {
  var Backbone = require('backbone'),
      InviteesTableRowView = require('views/invitees-table-row'),
      InviteesTableTooltipView = require('views/invitees-table-tooltip'),
      inviteesContentTemplate = require('text!templates/invitees-content.html!strip'),
      Browser = require('utils/browser'),
      Metrics = require('utils/metrics')
      ;

  var JST = {};
  JST.past_champions_item = _.template(
    '<div class="name"><%= name %></div>'
  );

  JST.qualifications_list_item = _.template(
    '<li><span class="qualificationsList ql_<%=qId%>"><%=qValue%></span></li>'
  );

  var InviteesTableView = Backbone.View.extend({
    el: '.inviteesContent',

    events: function() {
      var _events = {
        'click a.sort': '_sort'
      };

      if(!Browser.mobiledevice) {
        _events['mouseover a.quals_hover'] = '_showTooltip';
        _events['mouseout a.quals_hover'] = '_hideTooltip';
        _events['mousemove a.quals_hover'] = '_moveTooltip';
      } else {
        _events['click a.quals_hover'] = '_showTooltipOnMobile';
      }

      return _events;
    },

    template: _.template(inviteesContentTemplate),

    initialize: function(opts) {
      this.sortBy = null;
      this.$currentTooltip = null;
      this.inviteeRowViewsMap = {};
      this.listenTo(this.collection, 'reset', this._buildInviteesTable);
      this.inviteesTableTooltipView = new InviteesTableTooltipView();
      this.listenTo(this.inviteesTableTooltipView, 'close', this._hideTooltip);
      this.pastChampionsNotPlaying = opts.pastChampionsNotPlaying;
      this.qualificationsList = opts.qualificationsList;
    },

    render: function() {
      this.$el.html(this.template({}));
      this._buildPastChampionsNotPlaying();
      this._buildQualificationsList();
      this._buildInviteesTable();
      return this;
    },

    _buildInviteesTable: function() {
      var that = this;

      var fragment = document.createDocumentFragment();

      if(Object.keys(this.inviteeRowViewsMap).length === 0) {  //First time building row views
        this.collection.forEach(function(player) {
          var view = new InviteesTableRowView({model: player}).render();
          that.inviteeRowViewsMap[player.cid] = view;
          fragment.appendChild(view.el);
        });

      } else {
        this.collection.forEach(function(player) {
          var view = that.inviteeRowViewsMap[player.cid];
          fragment.appendChild(view.el);
        });
      }

      this.$('.inviteesList').html(fragment);

    },

    _buildPastChampionsNotPlaying: function() {
      var pastChampionsHtml = "";
      this.pastChampionsNotPlaying.forEach(function(player) {
        pastChampionsHtml += JST.past_champions_item({name: player});
      });
      this.$('.inviteesNotPlaying .list').html(pastChampionsHtml);
    },

    _buildQualificationsList: function() {
      var qualificationsListHtml = "";
      for(var i = 0; i < this.qualificationsList.length; i++) {
        qualificationsListHtml += JST.qualifications_list_item({qId: i + 1, qValue: this.qualificationsList[i]});
      }
      this.$('.inviteesQualifications .content ol').html(qualificationsListHtml);
    },


    /**
     * Sorts the invitees table
     */
    _sort: function(e) {
      var sortBy = $(e.target).data('ref');
      if(this.sortBy !== sortBy) {
        var sortedCollection = this.collection.sortBy(function(player) {
          return player.get(sortBy).toLowerCase();
        });
        this.collection.reset(sortedCollection);
        this.sortBy = sortBy;

        Metrics.measureApp(Metrics.page_section, Metrics.page_title, 'Sort', $(e.target).text());
      }
      return false;
    },

    _showTooltip: function(e) {
      var qId = $(e.target).data('ref');
      var tipHtml = this._getQualificationTipHtml(qId);
      this.$currentTooltip = this.inviteesTableTooltipView.render(tipHtml).$el;
      this.$currentTooltip.appendTo('body').fadeIn('slow');
    },

    _hideTooltip: function(e) {
      this.$currentTooltip.detach();
      this.$currentTooltip = null;
    },


    /**
     * On non-mobile devices, move tooltip to follow the pointer
     */
    _moveTooltip: function(e) {
      var mousex = e.pageX - 351;
      var half_tooltip = this.$currentTooltip.height() / 2;
      var mousey = e.pageY - half_tooltip;
      this.$currentTooltip.css({ top: mousey, left: mousex })
    },


    _showTooltipOnMobile: function(e) {
      this._showTooltip(e);
      var tipwidth = $('.inviteesList').width();
      var mousex = $('.inviteesList').position().left;
      var mousey = e.pageY - 37;
      this.$currentTooltip.css({ width: tipwidth, top: mousey, left: mousex });
      return false;
    },

    /**
     * Get the qualification content for the given qId
     * @param  {String} qId (required)
     */
    _getQualificationTipHtml: function(qId) {
      var id = qId.split('_')[1].split('-')[0]; //get id given this format: ql_id-A
      var tipHtml = id +'. <br/>' + this.qualificationsList[id-1];
      return tipHtml;
    },



    onDispose: function() {
      for (var key in this.inviteeRowViewsMap) {
        if(this.inviteeRowViewsMap.hasOwnProperty(key)) {
          this.inviteeRowViewsMap[key].dispose();
        }
      }

      this.inviteesTableTooltipView && this.inviteesTableTooltipView.dispose();
    }

  });

  return InviteesTableView;
})

;
