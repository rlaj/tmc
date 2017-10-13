define('views/print-window',['require','jquery','backbone','utils/browser','utils/metrics'],function(require) {
	var $ = require('jquery'),
		Backbone = require('backbone'),
		Browser = require('utils/browser'),
		Metrics = require('utils/metrics')
	;

	var PrintWindow = Backbone.View.extend({
		el: '.printLink',

		events: { 
			'click': 'printWindow'
		},

		initialize: function(opts){ 
            this.options = $.extend({
                navbar : false,
                page_title : '2017 Masters Tournament',
                text_only : false,
                metrics_name : 'Tournament:Patron Info' 
            }, opts);
        },

		printWindow: function (e){
			e.preventDefault();
			var previewURL = window.location.href;
			var printWindow = window.open('','PrintWindow','width=780,height=600');
			var urlsplit = previewURL.split("?");
			
			
			if(!this.options.text_only){
				this.options.print_text = document.getElementById(this.options.print_div).innerHTML;
			}

						
			var html = '<html><head><title>'+ this.options.page_title +'</title> '
				+ '<link rel="stylesheet" href="/mas/css/reset.css" type="text/css">'
		        + '<link rel="stylesheet" href="/mas/css/global.css" type="text/css">'
		        + '<link rel="stylesheet" href="/mas/css/print.css" type="text/css">'
		  		+ '<style type="text/css"> body,td,select,input { font-family : Arial, Helvetica, sans-serif; } '
		  		+ '.text{font-size : 11px;}'
		      + 'h2,h3{font-weight:bold;}'
		      + 'p{ margin-bottom: 1em;}'
		  		+ '.patron_info { padding-top: 25px; text-align: center;}</style> '
		  		+ '<script language="Javascript1.2">function printpage() { window.print();} </script>'
		  		+ '</head><body onload="printpage();" topmargin="20" leftmargin="20" marginheight="20" marginwidth="20">';

		  	if(this.options.navbar){
				html += '<div style="orphans:5;"><div id="navbar" style="page-break-after:avoid;">'+'<img src="/images/misc/print_logo.jpg" alt="Masters" id="Masters" width="202" height="45"></div>';
			}

		  	html += '<div id="pagecontent">'
		  		+ '<h1>'+ this.options.page_title + '</h1>'
		  		+ this.options.print_text
		  		+ '<br><br><br>';

			if(this.options.pageURL){
				html += '<div id="url">'+urlsplit[0]+'</div>';
			}

			html += '</div></body></html>';

			printWindow.document.open();
			printWindow.document.write(html);
			printWindow.document.close();

			Metrics.measureApp(this.options.metrics_name, this.options.page_title, 'print');
		}

	});

	return PrintWindow;
      
});
