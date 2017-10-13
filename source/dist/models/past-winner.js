//*   past winners data for the year  */

define('models/past-winner',['require','jquery','backbone'],function(require) {
  var $ = require('jquery'),
      Backbone = require('backbone')
  ;

  var PastWinner = Backbone.Model.extend({
  	defaults: {
    year: 2017
  },

    initialize: function(opts) {
      this.logger = new eventsCore.util.Logger('Past Winners Model');
      this.logger.info('Initialize');

      this.options = _.extend({year: this.defaults.year}, opts);
    },

  	urlRoot: '/en_US/xml/man/history/',

  	url: function() {
    var url = this.urlRoot + this.options.year + '.xml';
  		return url;
  	},

    fetch: function(options) {
      options = options || {};
      options.dataType = 'xml';
      return Backbone.Model.prototype.fetch.call(this, options);
    },

    parse: function(data) {
      this.parsedata = {};

      // set starting location
      var len = data.childNodes[0].childNodes.length;
      for(var a = 0; a < len; a++) {
        var child = data.childNodes[0].childNodes[a];

        //if nodetype is an element proceeed
        if(child.nodeType === 1) {
          // console.log('child--> %o', child);
          // loop through childNodes
          this.attArray = {};

          // get attributes of childNodes
          for(var k = 0; k < child.attributes.length; k++) {
            var attr = child.attributes[k];
            this.addtoJSON(this.attArray, attr.name, attr.value);
          }

          // update array
          this.addtoJSON(this.parsedata, child.nodeName, this.attArray);

        }
      }

      // console.log("parsedata--> %o", this.parsedata);
      return this.parsedata;
    },

    addtoJSON: function(arrayName, name, value) {
      if(arrayName[name]) {
        if(arrayName[name].constructor != Array) {
          arrayName[name] = [arrayName[name]];
        }
        arrayName[name][arrayName[name].length] = value;
      }      else {
        arrayName[name] = value;
      }
    }

  });

  return PastWinner;
});

