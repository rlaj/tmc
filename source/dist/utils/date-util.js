define('utils/date-util',['require'],function(require) {
  var DateUtil = {
    longDaysInWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDaysInWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    longMonthsInYear  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortMonthsInYear : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    getLongMonth : function(date) {
      return this.longMonthsInYear[date.getMonth()];
    },
    getShortMonth : function(date) {
      return this.shortMonthsInYear[date.getMonth()];
    },
    getLongDayOfWeek : function(date) {
      return this.longDaysInWeek[date.getDay()];
    },
    getShortDayOfWeek : function(date) {
      return this.shortDaysInWeek[date.getMonth()];
    }

  }

  return DateUtil;
});
