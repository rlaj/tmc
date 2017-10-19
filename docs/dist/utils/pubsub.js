define('utils/pubsub',['require','underscore','jquery','backbone'],function(require) {
  var _ = require('underscore'),
      $ = require('jquery'),
      Backbone = require('backbone');

  var PubSub = _.extend({}, Backbone.Events);

  // create backup jQuery element to act as pubsub bus in the interim
  var $PubSub = $('<div>');

  // track attached events and called events with counts
  var eventList = {
    'bound': {},
    'triggered': {}
  };

  var windowEvtList = 'resize|scroll|touchmove|unload|lookup';
  var winRegExp = new RegExp("^(" + windowEvtList + ")[\.:]*");

  var $w = $(window);

  var recordEvts = false;

  var console = window.console;
  if(typeof eventsCore !== 'undefined') {
    console = new eventsCore.util.Logger('PubSub');
    console.log = console.out;
  }

  /**
   * These methods allow window.resize events to be passed through
   * transparently via the same PubSub event handler as other,
   * non-window based, events
   *
   * As we discover the need to pass other window based events
   * through to the window object, we'll add them here
   */
  var origOn = PubSub.on;
  PubSub.on = function(event, callback, context) {
    // in the event 'once' is used, and does its thing
    if(event && typeof event === 'object') {
      origOn.apply(PubSub, arguments);
    } else {
      // check if 'event' starts with 'resize'
      var evts = event.split(' ');
      for (var i = evts.length - 1; i >= 0; i--) {
        // if so, attach to $(window) event
        if(evts[i].search(winRegExp) === 0) {
          $w.on(evts[i] + '.delegateWindow' + context.cid, callback);
          console.log('[PubSub] attaching window event: %o', evts[i] + '.delegateWindow' + context.cid);
        } else {
          if(evts[i].search(/\./) > -1) {
            $PubSub.on(evts[i], callback);
          } else {
            arguments[0] = evts[i];
            origOn.apply(PubSub, arguments);
          }
        }
        if(recordEvts) {
          var bound_evt = eventList.bound[evts[i]];
          if(bound_evt === undefined) {
            eventList.bound[evts[i]] = 1;
          } else {
            eventList.bound[evts[i]] += 1;
          }
        }
      }
    }

    // returning PubSub here allows chaining
    return PubSub;
  };

  var origOff = PubSub.off;
  PubSub.off = function(event, callback, context) {
    // check if 'event' starts with 'resize'
    if(event) {
      var evts = event.split(' ');
      for (var i = evts.length - 1; i >= 0; i--) {
        // if so, attach to $(window) event
        if(evts[i].search(winRegExp) === 0) {
          $w.off(evts[i] + '.delegateWindow' + context.cid);
        } else {
          if(evts[i].search(/\./) > -1) {
            $PubSub.off(evts[i], callback);
          } else {
            arguments[0] = evts[i];
            origOff.apply(PubSub, arguments);
          }
        }
        if(recordEvts) {
          var bound_evt = eventList.bound[evts[i]];
          if(bound_evt !== undefined) {
            eventList.bound[evts[i]] -= 1;
          }
        }
      }
    } else {
      origOff.apply(PubSub, arguments);
    }

    // returning PubSub here allows chaining
    return PubSub;
  };

  var origTrigger = PubSub.trigger;
  PubSub.trigger = function() {
    var evts = arguments[0].split(' ');

    for (var i = evts.length - 1; i >= 0; i--) {
      // pass any subsequent data arguments through to trigger event
      arguments[0] = evts[i];

      if(evts[i].search(winRegExp) === 0) {
        console.log('[PubSub] triggering window event %o', evts[i]);

        $w.trigger.apply($w, arguments);
      } else {
        console.log('[PubSub] triggering event %o', evts[i]);

        if(evts[i].search(/\./) > -1) {
          $PubSub.trigger.apply($PubSub, arguments);
        } else {
          origTrigger.apply(PubSub, arguments);
        }
        if(recordEvts) {
          var triggered_evt = eventList.triggered[evts[i]];
          if(triggered_evt === undefined) {
            eventList.triggered[evts[i]] = 1;
          } else {
            eventList.triggered[evts[i]] += 1;
          }
        }
      }
    }
  }

  return PubSub;
});

