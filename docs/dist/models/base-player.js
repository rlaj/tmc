define('models/base-player',['require','jquery','backbone','utils/favorites'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone'),
      Favorite = require('utils/favorites')
  ;

  var BasePlayer = Backbone.Model.extend({
    initialize: function() {
      this.set('show', true);
      this.set('is_fave', Favorite.check(this.get('id')));

      this.on('toggleFavorite', function() {
        Favorite.toggle(this.id);
      });

      this.listenTo(Favorite, 'add:' + this.id, function() {
        this.set('is_fave', true);
      });

      this.listenTo(Favorite, 'remove:' + this.id, function() {
        this.set('is_fave', false);
      });

      /** setting up full_name for each Model
      * can overrite in Model by calling setFullName function
      * ex: par3-player.js
      */
      this.setFullName(this.get('first_name'), this.get('last_name'));
    },

    setFullName: function(first, last) {
      //used for search & filter
      this.set('full_name', first + ' ' + last);
    }
  });

  return BasePlayer;
})

;
