define('jquery.dropdown_ext',['require','jquery','utils/metrics','utils/window-size'],function(require) {
  var $ = require('jquery'),
      Metrics = require('utils/metrics'),
      Win = require('utils/window-size')
      ;

  $.fn.primaryDropdown = function(callback, metrics_scope) {
    if(metrics_scope === undefined) {
      metrics_scope = [Metrics.page_section, 'Day Picker'];
    }
    this.on('click.primarydropdown', '.selected_container', function(e) {
      e.preventDefault();
      var that = $(this).parents('.filter');
      var metrics_call = metrics_scope.slice(0);
      if (that.hasClass('open')) {
        that.removeClass('open');
        metrics_call.push('Close');
        Metrics.measureApp.apply(window, metrics_call);
      } else {
        that.addClass('open');
        metrics_call.push('Open');
        Metrics.measureApp.apply(window, metrics_call);
      }
    }).on('click.primarydropdown', '.options a', function(e) {
      e.preventDefault();
      var that = $(this).parents('.filter');
      if (!$(this).hasClass('selected')) {
        if (typeof callback === 'function') {
          callback.call(this, $(this).data('src'));
        }
        var sel_option = that.find('.selected_option');
        sel_option.html($(this).html()).toggleClass('toggle'); // 'toggle' class needed to force reset of layout
        $(this).addClass('selected').siblings('.selected').removeClass('selected');

        var metrics_call = metrics_scope.slice(0);
        metrics_call.push($(this).html());
        Metrics.measureApp.apply(window, metrics_call);
      }
      that.removeClass('open');
    });
    return this;
  }

  // opts {
  //   max_size
  //   metrics_action
  // }
  $.fn.secondaryDropdown = function(callback, opts) {
    var max_size;
    var metrics_action = 'View';
    if(opts !== undefined ) {
      max_size = opts.max_size;
      if(opts.metrics_action !== undefined && opts.metrics_action !== '') {
        metrics_action = opts.metrics_action;
      }
    };
    var check_size = function() {
      if (max_size === undefined || max_size === 'global') {
        return Win.size() === 'global';
      } else if (max_size == 'tablet') {
        return Win.size() !== 'desktop';
      } else {
        return true;
      }
    }
    this.on('click', 'a.selected', function(e) {
      e.preventDefault();
      if (check_size()) {
        var p = $(this).parent();
        if (p.hasClass('open')) {
          p.removeClass('open');

          Metrics.measureApp(Metrics.page_section,metrics_action,'Tab','Close');
          // remove duplicate
          p.find('.clone').remove();
        } else {
          p.addClass('open');

          Metrics.measureApp(Metrics.page_section,metrics_action,'Tab','Open');
          // duplicate .selected as first item on list
          var copy = $(this).clone().addClass('clone');
          p.prepend(copy);
        }
      }
    }).on('click', 'a:not(.selected):not(.disabled)', function(e) {
      // mediaSelector must already be open, otherwise inaccessible
      $(this).addClass('selected').siblings('.selected').removeClass('selected');
      Metrics.measureApp(Metrics.page_section,metrics_action,$(this).text());

      if (check_size()) {
        $(this).parent().removeClass('open')
          .find('.clone').remove();
      }

      if (typeof callback === 'function') {
        callback.call(this, $(this).attr('href'));
      }
    }).on('click', 'a', function(e) {
      e.preventDefault();
    });
    return this;
  }

  // $(obj).resetLayout : jQuery object array containing all visible modules in layout
  $.fn.resetLayout = function(type) {
    var _this = this;
    // if resetting to default, use data-size attribute for class
    if (type !== undefined && type === 'default') {
      this.removeClass('wrapperFull wrapperHalf wrapperClear').each(function(i) {
        var $t = $(this);
        // avoid doing any layout changes when using 1/3rd width modules
        if(!$t.hasClass('wrapperThird')) {
          if (i === 0 && $t.data('size') === 'Half' && $(_this[i + 1]).data('size') !== 'Half') {
            $t.addClass('wrapperFull');
            return;
          }
          $t.addClass('wrapper' + $t.data('size'));
        } else {
          if(i%3 === 0) {
            $t.addClass('wrapperClear');
          }
        }
      });
      return this;
    }

    var counter = 0;
    var max = this.length - 1; // index of last item
    this.removeClass('wrapperFull wrapperHalf wrapperClear').each(function(i) {
      var $t = $(this);
      // avoid doing any layout changes when using 1/3rd width modules
      var thirds = $t.hasClass('wrapperThird');

      switch (counter % 3) {
        case 1:
          // avoid singleton 2-up module
          if (!thirds && i === max) {
            $t.addClass('wrapperFull');
            break;
          }
          // if that condition isn't met, automatcailly continue to next case block below
        case 2:
          if(!thirds) {
            // check content type (if atomic & stats, can't use half)
            if ($t.find('.containerStats').length > 0) {
              $t.addClass('wrapperFull');
            } else {
              // use half width layout
              $t.addClass('wrapperHalf');
              counter++;
            }
          } else {
            counter++;
          }
          break;
        case 0:
        default:
          if(!thirds) {
            // use full width layout
            $t.addClass('wrapperFull');
          } else {
            $t.addClass('wrapperClear');
          }
          counter++;
          break;
      }
    });
    return this;
  }
});
