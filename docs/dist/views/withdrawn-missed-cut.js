define('views/withdrawn-missed-cut',['require','backbone','tablesaw','text!templates/withdrawn-missed-cut.html!strip','text!templates/withdrawn-missed-cut-row.html!strip'],function(require) {
  var Backbone = require('backbone'),
      Tablesaw = require('tablesaw'),
      withdrawnMissedCutTemplate = require('text!templates/withdrawn-missed-cut.html!strip'),
      withdrawnMissedCutRowTemplate =  require('text!templates/withdrawn-missed-cut-row.html!strip')
      ;

  var Pairings = Backbone.View.extend({
    el: '.withdrawnMissedCutContent',

    tableTemplate: _.template(withdrawnMissedCutTemplate),
    rowTemplate: _.template(withdrawnMissedCutRowTemplate),

    render: function() {
      this._buildTable();
      return this;
    },

    /**
     * Build the table containing players who withdrew/missed cuts
     */       
    _buildTable: function() {
      var playersArr = this.model;

      //build player rows
      var rows_html = '';
      for(var i = 0; i < playersArr.length; i++) {
        var row_class = (i % 2 === 0 ? 'row1' : 'row2');
        var par_klass = (parseInt(playersArr[i].par_total,10) >= 0 ? 'over' : 'under' );
        rows_html += this.rowTemplate({player:playersArr[i], row_class: row_class, par_klass: par_klass});
      }

      //insert player rows into the table
      this.$el.html(this.tableTemplate({rows: rows_html}));

      // need to refresh table to activate tablesaw
      this.$("#wdmctable").table().data("table").refresh();
    },

  });

  return Pairings;
})

;
