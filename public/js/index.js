$(function() {

  // Fetch and display jobs
  function query() {
    $.get('http://137.189.90.124:28017/istar/jobs/', function(jobs) { // http://www.mongodb.org/display/DOCS/Http+Interface
      jobs.rows.forEach(function(r) {
        $('#jobs').append(r.name);
      });
    }).error(function(r) {
      $('#jobs').text(r.statusText);
    });
  }
  query();

  // Fetch and display jobs every 10 seconds
//  setInterval(query, 10000);

  // Initialize tooltips.
  $('.control-label a[rel=tooltip]').tooltip();

  // Fetch email from cookie
  var cookieName = 'istar',
      cookieNameLength = cookieName.length;

  $('#submitbtn').click(function(){

    // Hide tooltips
    $('.control-label a[rel=tooltip]').tooltip('hide');

    // Post a new job without client side validation
    $.post('/jobs', {
      receptor: $('#receptor').val(),
      center_x: $('#center_x').val(),
      center_y: $('#center_y').val(),
      center_z: $('#center_z').val(),
      size_x: $('#size_x').val(),
      size_y: $('#size_y').val(),
      size_z: $('#size_z').val(),
      description: $('#description').val(),
      email: $('#email').val()
    }, function(result) {

      // If server side validation failed, show the tooltips
      if (result._id == null) {
        result.forEach(function(err) {
          $('#' + err.param + '_label').tooltip('show');
        });
        return;
      }

      // Refresh jobs
      query();

      // Save email into cookie
      var cookieValue;
      if (document.cookie) {
        var cookies = document.cookie.split('; ');
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i];
          if (cookie.substring(0, cookieNameLength + 1) == (cookieName + '=')) {
            cookieValue = cookie.substring(cookieNameLength + 1);
            break;
          }
        }
      }
      var record = $('#email').val();
      if (cookieValue) {
        document.cookie = cookieName + "=" + record;
      } else {
        var expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        document.cookie = cookieName + "=" + record + ";expires=" + expireDate.toUTCString();
      }

    }, 'json');
  });
});
