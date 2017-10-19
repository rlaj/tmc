define('collections/base-players',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
  ;

  var BasePlayers = Backbone.Collection.extend({
    /**
     * Returns an array of all the models in the collection 
     * that pattern matches its value for the given 'key' 
     * with the passed 'value' 
     */
    search: function(key, value) {
      var pattern = new RegExp(value, 'i');
      return this.filter(function(obj) {
        if(key) {
          if(pattern.test(obj.get(key))) {
            return true;
          }
        }
          return false;
      });
    },

    /**
     * Sets the 'showFlag' attribute of all the models in the 
     * collection whose value for the given 'key' pattern matches
     * with the passed 'value' to true
     */
    searchBy: function(key, value, showFlag) {
      //match from first letter of firstname or lastname 
      //i.e. 'John Doe' matches with the value 'j' or 'd' but not with 'o'
      var pattern = new RegExp('^' + value + '|\\s' + value, 'i');
      this.forEach(function(model) {
        model.set(showFlag, pattern.test(model.get(key)));
      });

    },

    /**
     * Sets the 'show' attribute of all the models in the collection
     * whose value for the given 'key' matches exactly with 
     * the passed 'value' to true
     */
    filterBy: function(key, value) {
      this.forEach(function(model) {
        model.set('show', (value === model.get(key)));
      });
    },


    /**
     * Sets the 'show' attribute of all the models 
     * in the collection to true
     */
    showAll: function() {
      this.forEach(function(model) {
          model.set('show', true);
      });
    },

  });

  return BasePlayers;
})

;
