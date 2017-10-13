define('utils/title-list',['require','backbone','utils/window-size','utils/metrics','utils/browser','utils/autocolumn','utils/pubsub'],function(require) {
  var Backbone = require('backbone'),
      Win = require('utils/window-size'),
      Metrics = require('utils/metrics'),
      Browser = require('utils/browser'),
      AutoColumn = require('utils/autocolumn'),
      PubSub = require('utils/pubsub')
      ;

  var TitleList = Backbone.View.extend({
    el: '#pageSelector',

    events: {
      'click .selector a': 'toggleList',
      'click .filters a': 'selectTab',
      'click .option_wrapper a': 'selectOption'
    },

    defaults: {
      max: 3,
      min: 1,
      search: '',
      measure_key: 'Multi Column Menu',
      metrics_suffix: ''
    },

    height: 0,
    open: false,
    selected_tab: 0,

    pageNav: true,

    initialize: function(opts) {
      this.options = _.extend({}, this.defaults, opts);

      this.options.measure_prefix =
        typeof this.options.measure_key === 'string' ?
        this.options.measure_key :
        this.options.measure_key.join(':');

      this.multilist = this.$('.multi-column-list');
      if(this.multilist.length === 0) {
        this.multilist = this.$el;
      }

      this.toggleSelector = this.$('.selector');
      // if (this.options.search !== '') {
      //   $(this.options.search).submit(function(e) {
      //     _this.find(this.value);
      //     e.preventDefault();
      //   }).keyup(function(e) {
      //     _this.find(this.value);
      //   })

      //   // submit/reset button always has ID of text field ID + Button
      //   // i.e. searchField, searchFieldButton
      //   $(this.options.search + 'Button').on('click', function(e) {
      //     $(_this.options.search).val('');
      //     _this.find('');

      //     measureApp.call(window, _this.options.measure_prefix, 'Search', 'Cancel');
      //   })
      // }

      if(!Modernizr.csscolumns) {
        this.autocolumn = new AutoColumn(this.$el, opts);
      }
    },

    render: function() {

    },

    onDispose: function() {

    },

    /**
     * Check if channel is disabled or currently selected. If so, do nothing.
     * Otherwise, allow execution of document navigation
     * @param  {Event} e Standard jQuery event object
     */
    selectOption: function(e) {
      //console.log('selectOption - pageNav:%o parent:%o', this.pageNav, this.$el.parent());
      var $this = $(e.currentTarget);

      if ($this.parent().hasClass('selected') || $this.parent().hasClass('disabled')) {
        console.log('selectOption - prevent page nav to channel:%o', $(e.currentTarget).attr('id'));
        e.preventDefault();

        return false;
      }

      this.closeList();
      if (!this.pageNav && this.options.sendPanel) {
        PubSub.trigger(this.options.sendPanel + ':change', $this.attr('id'), this.options.sendPanel);

        e.preventDefault();

        return false;
      }

      // if metrics_suffix is defined, auto-append to end of url before sending on its way
      if(this.options.metrics_suffix !== '') {
        var url = $this.attr('href');
        if(url.indexOf('promo') === -1) {
          url += (url.indexOf('?') > -1 ? '&' : '?') + 'promo=' + this.options.metrics_suffix;
          $this.attr('href', url);
        }
      }
    },

    toggleList: function(e) {
      e.preventDefault();
      if(!this.open) {
        this.openList();
        Metrics.measureApp(this.options.measure_prefix, 'Open');
      } else {
        this.closeList();
        Metrics.measureApp(this.options.measure_prefix, 'Close');
      }

      return false;
    },

    openList: function() {
      this.toggleSelector.find('a').addClass('open');
      this.multilist.addClass('open');

      this.list = this.$('ul.selected');
      if(!Modernizr.csscolumns) {
        this.autocolumn.run(this.list);
      }

      this.open = true;
      this.trigger('list:open');
    },

    closeList: function() {
      this.toggleSelector.find('a').removeClass('open');
      this.multilist.removeClass('open');
      this.list = null;

      this.open = false;
      this.trigger('list:close');
    },

    selectTab: function(e) {
      e.preventDefault();

      var $this = $(e.currentTarget);
      var index = $this.parent().index();
      if(index !== this.selected_tab) {
        $this.parent().addClass('selected').siblings().removeClass('selected');

        this.list = this.$('[data-id="' + $this.attr('href').substring(1) + '"]');
        this.list.addClass('selected').siblings().removeClass('selected');

        if(this.autocolumn) {
          this.autocolumn.run(this.list);
        }

        this.selected_tab = index;

        Metrics.measureApp(this.options.measure_prefix, $this.text());
      }
    },

    // not needed if no search capability
    find: function(term) {
      if (term === '') {
        this.multilist.find('.search').removeClass('active');
        this.multilist.find('.option_wrapper, .filters').show();
      } else {
        term = term.toLowerCase();
        var lis = this.multilist.find('div.option_wrapper li').filter(':not(.header)');
        var results = lis.filter(function(i) {
          if ($(this).text().toLowerCase().search(term) > -1) {
            return true;
          } else {
            return false;
          }
        }).clone();

        if (results.length === 0) {
          results = '<li>No Results Found</li>';
        } else if (results.length > 10) {
          results = results.slice(0, 11);
          results.last().html('...');
        }

        this.multilist.find('.search').addClass('active')
          .siblings('.search_results').find('ul').html(results);
        this.multilist.find('.option_wrapper, .filters').hide();
      }
    },

    setNav: function(nav) {
      this.pageNav = nav;
    }
  });

  return TitleList;
});
