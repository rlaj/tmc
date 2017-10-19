define('views/invitees-table-row',['require','backbone'],function(require) {
  var Backbone = require('backbone')
      ;

  var JST = {};

  JST.rowTemplate = _.template(
    '<tr class="item">' +
      '<td class="name"><%= display_name %></td>' +
      '<td class="country"><%= country_long %></td>' +
      '<td class="qualifications"><%= qualifications_html %></td>' +
    '</tr>'
  );

  JST.qualificationTemplate = _.template(
    '<a data-ref="ql_<%= q_num %>" class="quals_hover"><%= q_num %></a>'
  );


  var InviteesTableRowView = Backbone.View.extend({
    initialize: function(opts) {
      this.listenTo(this.model, 'change:show', this._updateView);
    },

    render: function() {
      var player = this.model;

      var qArr = player.get('qualifications').split(',');
      var q_html = '';

      qArr.forEach(function(q) {
        q_html += JST.qualificationTemplate({q_num: q}) + ',';
      });
      q_html = q_html.slice(0, -1); // remove last comma

      var row_html = JST.rowTemplate({
        display_name: this._buildDisplayName(player),
        country_long: player.get('country_long'),
        qualifications_html: q_html
      });

      this.$el.html(row_html);
      return this;
    },


    _buildDisplayName: function(player) {
      var displayName = '';
      if(player.get('firsttimer')) {
        displayName += '#';
      }

      if(player.get('amateur')) {
        displayName += '*';
      }

      if(player.get('not_playing')) {
        displayName += '**';
      }

      if(player.get('augusta')) {
        displayName += '^';
      }

      displayName += player.get('last_name') + ', ' + player.get('first_name');

      return displayName;
    },

    _updateView: function(player) {
      this.$el.toggle(player.get('show'));
    }

  });

  return InviteesTableRowView;
});


