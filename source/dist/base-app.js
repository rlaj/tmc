require.config({});

// require.config({
//    map: {
//     '*': {
//       'css': 'require-css/css.min'
//     }
//   }
// });

define('base-app',['require','backbone','router','settings','utils/common','relatedcontent','modernizr','eventsCore','utils/relatedcontent.masters'],function(require) {
  var Backbone = require('backbone'),
      Router = require('router'),
      Settings = require('settings'),
      Common = require('utils/common'),
      RelatedContent = require('relatedcontent');

  require('modernizr');
  require('eventsCore');
  require('utils/relatedcontent.masters');

  /**
   * Wrapper method for jQuery.unveil plugin to force pass an identifiable
   * context id through so that we can properly unbind those specific events
   * from the $(window) when the objects are no longer needed
   * @param  {jQuery} jQobjs  Set of jQuery objects upon which .unveil would normally be called
   * @param  {Object} opts Normal hash object to pass through specific options
   */
  Backbone.View.prototype.unveil = function(jQobjs, opts) {
    var options = _.extend({context: this.cid}, opts);
    jQobjs.unveil(options);
  };

  // unbind all window events bound by this suffix
  // primarily used by jquery.unveil plugin for now
  Backbone.View.prototype.clearUnveil = function() {
    $(window).off('.delegate' + this.cid);
  };

  /**
   * Core disposal method for all views
   * @param  {Boolean} keep   (optional) If View should be removed from DOM, pass in true
   */
  Backbone.View.prototype.dispose = function(keep) {
    if(this.onBeforeDispose) {
      this.onBeforeDispose();
    }

    // if the element needs to be removed from the DOM
    // explicitly call this.$el.remove() in the relevant
    // onDispose callback
    this.undelegateEvents();
    if(keep) {
      this.$el.empty();
      this.stopListening();
    } else {
      this.remove();
    }
    this.off();

    this.clearUnveil();

    console.log('[View disposal] disposing view ' + this.cid + ': %o', this);
    if(this.onDispose) {
      this.onDispose();
    }
  };

  var BaseApp = function() {
    this.init = function() {
      Common.initialize();

      RelatedContent.init({
        event_id: 'masters_' + Settings.tournament_year
      });

      this.router = new Router(); // eslint-disable-line no-new
    };
  };

  return BaseApp;
});

