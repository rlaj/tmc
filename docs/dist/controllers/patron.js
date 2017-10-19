define('controllers/patron',['require','jquery','underscore','utils/querystring','backbone','baseview','utils/metrics','views/secondary-dropdown','views/print-window','jquery.dropdown_ext'],function(require) {
  	var $ = require('jquery'),
      _ = require('underscore'),
      qsParse = require('utils/querystring'),
      Backbone = require('backbone'),
      BaseView = require('baseview'),
      Metrics = require('utils/metrics'),
      SecondaryDropdown = require('views/secondary-dropdown'),
      PrintView = require('views/print-window')
      ;

      require('jquery.dropdown_ext');

    var PatronInfo = BaseView.extend({

      onInitialization: function(){
        BaseView.prototype.onInitialization.apply(this, arguments);

        this.$mediaSelector = new SecondaryDropdown({el: this.$('.tabs')});
        this.$mediaSelector.setCallback(function (href){
          var tabNo = href.substring(5);
          this.toggleContent(tabNo);
        }.bind(this));

        this.printOptions();

        this.parseParams();
      },

      onDispose: function (){
        this.printMap.dispose();
        this.printDirections.dispose();
      },

      printOptions : function(){
        this.printDirections = new PrintView({
            el: this.$('.printLink'),
            navbar : false,
            page_title : this.pageTitle,
            print_div: 'directionsprint',
            metrics_name : 'Tournament:Patron Info:Directions & Parking'
        });

        this.printMap = new PrintView({
            el : this.$('.printMap'),
            navbar : false,
            page_title : this.pageTitle,
            print_div : 'parkingprint',
            metrics_name : 'Tournament:Patron Info: Directions & Parking'
        });

      },

      toggleContent: function(tabNo){
        this.$tab = this.$('#tab-'+tabNo);

        //selected tabs
        // $('.tabWrapper .tabs').find('a.selected').removeClass('selected').siblings();
        // $('.tabWrapper .tabs').find('a[href="#tab-'+tabNo+'"]').addClass('selected');
        this.$tab.addClass('selected').siblings().removeClass('selected');

        this.clearUnveil();
        this.unveil(this.$tab.find('img.srcpic'));
      },

      parseParams: function (){
        // var page = qsParse.get('page');
        var page = eventsCore.util.getUrlParam('page');

        if(page !== null) {
          switch(page) {
            case 'atthemasters': page = 1; break;
            case 'directions': page = 2; break;
            case 'localinfo': page = 3; break;
            case 'ticketing': page = 4; break;
            default: page = 1; break;
          }

          this.$mediaSelector.setOption(page-1);
          this.toggleContent(page);
        }
      }

    });

    return PatronInfo;
});

