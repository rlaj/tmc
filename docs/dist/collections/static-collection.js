define('collections/static-collection',['require','backbone','jquery'],function(require) {
  var Backbone = require('backbone'),
      $ = require('jquery');

  var StaticCollection = Backbone.Collection.extend({
    /**
     * A static collection does not change, so on subsequent calls to
     * 'fetch', just return the existing collection data, and immediately
     * trigger the success callback, if passed
     * @param  {[Object]} options Default options hash passed to fetch
     */
    fetch: function(options) {
      options = _.extend({}, options);
      if(this.length > 0) {
        if(options.success) {
          options.success.call(options.context, this, this.toJSON(), options);
          this.trigger('sync', this, this.toJSON(), options);
        }
        // same as var d = $.Deferred(); return d.resolve();
        // since $.when() auto-resolves when no parameters are passed
        return $.when();
      } else {
        return Backbone.Collection.prototype.fetch.apply(this, arguments);
      }
    }
  });

  return StaticCollection;
});
