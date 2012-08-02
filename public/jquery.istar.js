(function($) {
  // Add a comma every 3 digits, e.g. turn 11386040 into 11,386,040
  var d3 = /(\d+)(\d{3})/;
  $.comma = function(n) {
    var s = n.toString();
    while (d3.test(s)) s = s.replace(d3, '$1' + ',' + '$2');
    return s;
  };
})(jQuery);
