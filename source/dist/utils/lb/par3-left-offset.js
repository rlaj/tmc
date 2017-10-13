define('utils/lb/par3-left-offset',['require','utils/pubsub','utils/browser','utils/lb/par3-window-size'],function(require) {
  var PubSub = require('utils/pubsub'),
      Browser = require('utils/browser'),
      Par3Win = require('utils/lb/par3-window-size')
    ;

  var lbLeftOffset = {

    leftoffset: false,

    init: function(passedView) {
      this.$viewWrapper = passedView.$el; // #par3

      this.$content = passedView.$el.find('.par3Content'); // closest .par3-wrapper
      this.$lbWrapper = this.$content.parent(); // closest -wrapper

      this.getLeftOffset();

      if(!this.leftoffset) {
        PubSub.on('resize.skeuomorphic', function() {
          this.getLeftOffset();
        }.bind(this), this);

        // [TODO] can be removed for 2017? no popout LB??
        // hide the popout icon on tablets. use visibility:hidden to keep the width of the icon
        if(Browser.mobiledevice){
          $('.popout').addClass('hidden'); // [TODO] if there is still popout LB for 2017, refine this. $('.popout') is in lb-footer view
        }
        this.leftoffset = true;
      }
      console.log('[lb-left-offset.js][lbLeftOffset] initializing');
    },

    getLeftOffset: function() {
      var _this = this;
      function triggerOffset() {
        var location = _this.$viewWrapper.offset();
        var left = (location.left);
        if(left === 0) {
          setTimeout(triggerOffset, 1000);
        } else {

          if(Par3Win.size() === Par3Win.sizes.lgskeuomorphic) {
            left = (location.left) + 17;
          }
          if(Par3Win.size() === Par3Win.sizes.smskeuomorphic) {
            left = (location.left) + 15;
          }

          PubSub.on('windowsize:lbLargeSkeuomorphic:enter', function() {
            left = (location.left) + 17;
          });
          PubSub.on('windowsize:lbSmallSkeuomorphic:enter', function() {
            left = (location.left) + 15;
          });

          _this.$lbWrapper.css({
            'padding-left': left + 'px'
          });
          _this.$content.css('opacity', '1');
        }
      }
      triggerOffset();
    },

    destroyLeftOffset: function(passedView) {
      this.$content = passedView.$el.find('.par3Content'); // closest #par3-wrapper
      this.$lbWrapper = this.$content.parent(); // closest -wrapper

      PubSub.off('resize.skeuomorphic', undefined, this);
      PubSub.off('windowsize:lbLargeSkeuomorphic:enter', undefined, this);
      PubSub.off('windowsize:lbSmallSkeuomorphic:enter', undefined, this);
      this.leftoffset = false;

      var left = 0;

      this.$lbWrapper.css({
        'padding-left': left + 'px'
      });
    }
  }
  return lbLeftOffset;
});
