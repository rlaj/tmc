define('views/pairings-tab',['require','backbone','utils/pubsub','text!templates/pairings-tab.html!strip'],function(require) {
  var Backbone = require('backbone'),
      PubSub = require('utils/pubsub'),
      pairingsTabTemplate = require('text!templates/pairings-tab.html!strip')
      ;
  

  var PairingsTab = Backbone.View.extend({
    el: '.pairingsTab',

    template: _.template(pairingsTabTemplate),

    events: {
      'click a': '_clickTab'
    },

    defaults: {
        round1: false,
        round2: false,
        round3: false,
        round4: false,
        withdrawn: false
    },


    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);
    },

    render: function() {
      this.$el.html(this.template({options:this.options}));
      this.$el.find('.' + this.options.selected).addClass('selected');
      return this;
    },


    onDispose: function() {
    },
    

    // _clickTab: function(e) {
    //   $t = $(e.target);

    //   //selected tab is disabled
    //   if($t.hasClass('disabled')) {
    //     return false;
    //   }

    //   //currently selected tab
    //   var $selected = this.$el.find('.selected');
    //   if($t.data('ref') === $selected.data('ref')) {
    //     return false;
    //   }

    //   //remove previously selected and set new selected tab
    //   $selected.removeClass('selected');
    //   $t.addClass('selected');
    //   this.trigger($t.data('ref'));
    //   return false;
    // }


  });

  return PairingsTab;
})

;
