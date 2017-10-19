define('views/pairings-round',['require','backbone','views/pairings-group','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      PairingsGroupView = require('views/pairings-group'),
      PubSub = require('utils/pubsub')
      ;

  var JST = {};
  JST.no_matches = _.template('<div class="pairingsNoResults">No Matches</div>');

  var Pairings = Backbone.View.extend({
    el: '.roundContent',

    defaults: {
    },

    initialize: function(opts) {
      this.hasSplitTee = false;
      this.playerCardViewsMap = opts.playerCardViewsMap || {};
      this.groupViewsMap = {};
      if(this.$('.pairingsNoResults').length === 0) {
        this.$el.append(JST.no_matches({}));
      }      
    },

    render: function() {
      this.buildRound();
      return this;
    },


    buildRound: function() {
      var that = this;
      this.$('.pairingsGroupRow').detach();

      var fragment = document.createDocumentFragment();
      this.model.group.forEach(function(group) {
        var el;
        var groupView = that.groupViewsMap[group.number];
        if (groupView) {
          el = groupView.render().el;
        } else {
          var groupView = new PairingsGroupView({model: group, collection:that.collection, playerCardViewsMap: that.playerCardViewsMap});
          that.listenToOnce(groupView, 'hasSplitTee', function() { //only need to know if at least 1 group has split tee
            that.hasSplitTee = true;
          });

          el = groupView.render().el;
          that.groupViewsMap[group.number] = groupView;
        }
        fragment.appendChild(el);
      });
      this.$el.append(fragment);

      //notify tee-times controller to show/hide split tee text
      //use PubSub to directly trigger listener on tee-times, thereby
      //skipping this view's parent: pairings-content 
      PubSub.trigger('pairings-round:hasSplitTee', this.hasSplitTee);

      // Check for empty results everytime search or filter is performed
      this.listenTo(this.collection, 'modified', function() {
        this._displayMessageIfNoSearchResults();
        PubSub.trigger('lookup.unveil');
      }); 

      this._displayMessageIfNoSearchResults();

    },

    /**
     * Show 'no matches' message when there are no search results 
     */    
    _displayMessageIfNoSearchResults: function() {
      var noResults = true;
      for(var i in this.groupViewsMap) {
        var groupView = this.groupViewsMap[i];
        if(groupView.show) {
          noResults = false;
          break;
        }
      }

      if(noResults) {
        this.$('.pairingsNoResults').show();
      } else {
        this.$('.pairingsNoResults').hide();
      }
    },

    /**
     * Stop all the listeners in this round view and in all of this 
     * round's group views
     */
    stopAllListeners: function() {
      this.stopListening();
      for (var key in this.groupViewsMap) {
        if(this.groupViewsMap.hasOwnProperty(key)) {
          this.groupViewsMap[key].stopListening();
        }
      }
    },

    onDispose: function() {
      for (var key in this.groupViewsMap) {
        if(this.groupViewsMap.hasOwnProperty(key)) {
          this.groupViewsMap[key].dispose();
        }
      }
    },


  });

  return Pairings;
})

;
