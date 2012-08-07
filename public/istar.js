function getCookie(key) {
  var m = document.cookie.match(new RegExp('(?:^|;)\\s?' + key + '=(.*?)(?:;|$)'));
  if (m) return m[1];
}

function setCookie(key, val, days) {
  var d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = key + '=' + val + ';expires=' + d.toUTCString();
}

// Add a comma every 3 digits, e.g. turn 11386040 into 11,386,040
var d3 = /(\d+)(\d{3})/;
Number.prototype.comma = function() {
  var s = this.toString();
  while (d3.test(s)) s = s.replace(d3, '$1' + ',' + '$2');
  return s;
};
