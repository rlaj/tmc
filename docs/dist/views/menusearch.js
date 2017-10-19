define('views/menusearch',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
      ;

  var MenuSearch = Backbone.View.extend({
    el: '#searchBox',

    events: {
      'submit form': 'validateSearchForm',
      'submit #searchButton': 'validateSearchForm'
    },

    initialize: function() {
      this.query = this.$('input[type="text"]');
    },

    render: function() {

    },

    validateSearchForm: function() {
      var x = this.query.val();
      if (x == null || x == "" || x == 'Search') {
          return false;
      }
      return true;
    }
  });

  return MenuSearch;
});
