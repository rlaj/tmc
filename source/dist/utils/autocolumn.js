define('utils/autocolumn',['require','jquery','utils/window-size','utils/browser'],function(require) {
  var $ = require('jquery'),
      Win = require('utils/window-size'),
      Browser = require('utils/browser')
      ;

  var AutoColumn = function() {
    this.opts;
    this.defaults = {
      max: 3,
      min: 1,
      breakpoint: '949px',
    };
    this.container;
    this.multilist;
    this.column_count = 1;

    this.init = function(container, options) {
      this.opts = $.extend({}, this.defaults, options);

      this.container = container;
      this.multilist = container.find('.multi-column-list');
      if (this.multilist.length === 0) {
        this.multilist = this.container;
      }

      this.column_count = this.options.min;
      if (Win.size() === Win.sizes.desktop) {
        this.column_count = this.options.max;
      } else if (Win.size() === Win.sizes.tablet && this.options.max >= 2) {
        this.column_count = 2;
      }

      var _this = this;

      // only set up listener if we have a column range
      if (Browser.oldIE && this.opts.max !== this.opts.min) {
        var mqllrg = window.matchMedia('screen and (min-width:' + this.opts.breakpoint + ')');

        mqllrg.addListener(function(mql) {
          if (mql.matches) {
            _this.column_count = _this.opts.max;
          } else {
            _this.column_count = _this.opts.max - 1;
            if (_this.column_count < _this.opts.min) {
              _this.column_count = _this.opts.min;
            }
          }
          _this.run();
        });
      }
    }

    // IE8/9 Polyfill for lack of CSS3 Multi-Column support
    // use CSS3 Multi-Column for all other browsers
    this.run = function(list) {
      if (list.find('.columns').length !== this.column_count) {
        var list_items = list.find('li');

        // unwrap columns first if they've already been wrapped
        if (list.find('.column').length !== 0) {
          list_items.unwrap().removeClass('column_break');
        }

        var count = list_items.length;

        var per_col = Math.ceil(count / this.column_count);
        list_items.filter('li:nth-of-type(' + per_col + 'n+1)').addClass('column_break');

        var width = (100 / this.column_count);

        var li = list_items.first();
        for (var i = 0; i < this.column_count; i++) {
          var col = li.nextUntil('li.column_break').andSelf();
          li = col.last().next();

          var klass = '';
          if (i === 0) {
            klass += ' first';
          }
          if (i === this.column_count - 1) {
            klass += ' last';
          }
          col.wrapAll('<div class="column ' + klass + '" style="width: ' + width + '%">');
        }
      }
    }

    // initialize on creation
    if (arguments.length > 0) {
      return this.init.apply(this, arguments);
    } else {
      return this;
    }
  }

  return AutoColumn;
});
