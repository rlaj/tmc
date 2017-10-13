define('views/player-card',['require','backbone','underscore','settings','text!templates/player-card.html!strip','utils/browser','utils/common','utils/scores','utils/favorites'],function(require) {
  var Backbone = require('backbone'),
      _ = require('underscore'),
      Settings = require('settings'),
      playerCardTemplate = require('text!templates/player-card.html!strip'),
      Browser = require('utils/browser'),
      Common = require('utils/common'),
      Scores = require('utils/scores'),
      Favorite = require('utils/favorites')
      ;


  var JST = {};

  JST.favorite_tip = _.template(
    '<div class="favoriteTip">' +
    ' <div class="close">&nbsp;</div>' +
    ' <div class="text">' +
    '   Your favorite players will show up at the top of the Leader Board when the tournament begins.' +
    ' </div>' +
    '</div>'
  );


  var PlayerCard = Backbone.View.extend({
    className: 'playerCard',

    template: _.template(playerCardTemplate),

    defaults: {
      scores: true,

      tv_name: false,
      favorite: false,
      country: false,
      bio_link: false,

      show_amateur_status: false,
      show_favorite_tip: false,

      metrics_suffix: '',

      item: false,
      location: 'module' // 'module', 'filmstrip', 'info'
    },

    events: {
      'click .favorite': 'toggleFavorite',
      'click .favoriteTip .close': 'closeFavoriteTip'
    },


    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('PlayerCard');
      this.logger.info('initialize');

      this.options = _.extend({}, this.defaults, opts);

      if(this.options.item) {
        this.$el.attr({
          class: 'playerCard item'
        });
      } else {
        this.$el.attr({
          'data-id': this.model.id,
          class: 'playerCard ' +  (Settings.Scores.pre ? 'pretour' : 'midtour')
        });
      }

      // If we're displaying scores, then that means view should automatically
      // re-render whenever scores change for this player
      if(this.options.scores) {
        this.listenTo(this.model, 'change:thru', this.render);
      } 

      this.listenTo(this.model, 'change:is_fave', this.updateFavoriteStyle);


      this.on('fadeCard', this._fadeCard, this);
    },

    render: function() {
      this.$el.html(this.build());

      // Allow player card to self-unveil each time it renders
      // because it may auto-refresh whenever score data is being
      // displayed
      this.clearUnveil();
      this.unveil(this.$('.image img, .photo img'));

      return this;
    },

    onDispose: function() {
      this.$('a').off('click');
    },

    build: function() {
      var player = this.model;
      var amateurStatus = '';
      if(this.options.show_amateur_status) {
        amateurStatus = (player.get('amateur')) ? '(A)' : '';
      }

      // build standard player card with scores, etc
      // img = 'http://placehold.it/467x263/0C4825.jpg&text=' + player.first + '+' + player.last;
      var default_img = '/images/now/trans_16x9.gif';

      var today = player.get('today') || '&nbsp;',
          thru = player.get('thru') || '&nbsp;',
          total = player.get('topar') || '&nbsp;',
          imagePathL = '/images/players/2016/720x405/' + player.id + '.jpg',
          imagePathM = '/images/players/2016/960x540/' + player.id + '.jpg',
          imagePathH = '/images/players/2016/960x540/' + player.id + '.jpg';

      if(this.options.location !== 'filmstrip') {
        imagePathL = '/images/players/2016/720x405/' + player.id + '.jpg';
        imagePathM = '/images/players/2016/320x180/' + player.id + '.jpg';
        imagePathH = '/images/players/2016/480x270/' + player.id + '.jpg';
      }

      if(this.options.location === 'info') {
        imagePathL = '/images/players/2016/320x180/' + player.id + '.jpg';
      }

      // allow for app specific URL
      var url = '/en_US/players/player_' + player.id + '.html';
      if(this.options.metrics_suffix !== '') {
        url += '?promo=' + this.options.metrics_suffix;
      }

      // handle error case if country code doesn't exist
      var code = player.get('country') || false;
      var flag_path = '/images/flags/' + player.get('country') + '_sm.gif';
      if(!code) { flag_path = default_img; }

      // if filmstrip, show tee time if thru is empty
      // if(this.options.location === 'filmstrip') {
      //   if(today === '&nbsp;') {
      //     today = player.get('teetime').replace(' ','&nbsp;');
      //   }
      // }

      var html = this.template({
        player: player.attributes,
        amateurStatus: amateurStatus,
        pos: Scores.Utilities.getPosition(player),
        url: url,
        inApp: Browser.app,
        img: default_img,
        imagePath: { L: imagePathL, M: imagePathM, H: imagePathH },
        flag: flag_path,
        options: this.options,
        today: today,
        today_klass: Scores.Utilities.className(player.get('today') || ''),
        total: total,
        topar_klass: Scores.Utilities.className(player.get('topar') || ''),
        thru: thru
      });

      if(Browser.app && this.options.bio_link) {
        html = $(html);
        if(Browser.apptype.android) {
          html.on('click', function(e) {
            e.preventDefault();
            Common.sendAndroidMessage('player?id=' + player.id);
          });
        } else {
          html.on('click', function(e) {
            e.preventDefault();
            Common.sendiOSMessage('player', player.id);
          });
        }
      }

      return html;
    },

    toggleFavorite: function(e) {
      this.model.trigger('toggleFavorite');
      return false;
    },

    updateFavoriteStyle: function() {
      this.$el.find('.favorite').toggleClass('selected', this.model.get('is_fave'));

      // Only display Favorite Tip the first time the favorite icon is clicked and tournament has not begun
      if(Settings.Scores.pre && this.options.show_favorite_tip && Favorite.first) {
        Favorite.first = false;
        this.$el.append(JST.favorite_tip());
        setTimeout(function() {
          this.closeFavoriteTip();
        }.bind(this), 8000);
      }
    },

    closeFavoriteTip: function() {
      this.$el.find('.favoriteTip').remove();
    },

    _fadeCard: function(boolean) {
      if(boolean) {
        this.$el.fadeTo('fast', 0.3);
      } else {
        this.$el.fadeTo('fast', 1);
      }
    }


  });

  return PlayerCard;
});

