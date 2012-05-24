$(function() {

  // Fetch and display jobs
  function query() {
    $.get('http://127.0.0.1:28017/istar/jobs/', function(jobs) { // http://www.mongodb.org/display/DOCS/Http+Interface
      $('#jobs').append(jobs);
    });
  }
  query();

  // Fetch and display jobs every 10 seconds
  setInterval(query, 10000);

  // Initialize tooltips.
  $('.control-label a[rel=tooltip]').tooltip();

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

      // Save result._id into cookie. Can be done in server side

      // Refresh jobs
      query();

    }, 'json');
  });
});
