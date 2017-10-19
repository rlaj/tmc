define('views/download-link',['require','backbone'],function(require) {
  var Backbone = require('backbone');

  var JST = {};

  JST.download_link_template =  _.template(
    '<a href="<%= url %>">Download this Page</a>'
  );

  var CurrentTime = Backbone.View.extend({
    el: '.link',

    events: {
      'click a': '_download'
    },


    initialize: function(opts) {
      this.urlId = opts && opts.urlId;
      this.urlMap = {
        'round1': '/pdf/Masters-GroupingsAndStartingTimes-Rd1.pdf',
        'round2': '/pdf/Masters-GroupingsAndStartingTimes-Rd2.pdf',
        'round3': '/pdf/Masters-GroupingsAndStartingTimes-Rd3.pdf',
        'round4': '/pdf/Masters-GroupingsAndStartingTimes-Rd4.pdf'
      };

      this.on('show', this._show);

    },

    render: function() {
      var url = this.urlMap[this.urlId];
      if(url && url.trim()) {
        this.$el.html(JST.download_link_template({url: url}));
      } else {
        this.$el.html('');
      }
      return this;
    },

    _show: function(urlId) {
      this.urlId = urlId;
      this.render();
    },

    _download: function(e) {
      if(e.target.href) {
        window.location.href = e.target.href;
      }
      return false;
    }

  });

  return CurrentTime;
})

;
