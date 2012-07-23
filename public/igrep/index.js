$(function () {

  // Fetch email from cookie
  var email = $.cookie('email');
  $('#email').val(email);

  // Fetch jobs
  $.get('jobs', { email: email }, function(jobs) {
    var jobs;
    jobs.forEach(function(job) {
      jobs.append('<tr><td></td><td></td><td></td><td></td></tr>');
    });
    $('#jobs').html(jobs);
  });

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Process submission
  $('#submit').click(function () {
    // Hide tooltips
    $('.control-label a[rel=tooltip]').tooltip('hide');
    // Post a new job without client side validation
    $.post('jobs', {
      genome: $('#genome').val(),
      queries: $('#queries').val(),
      email: $('#email').val()
    }, function (res) {
      // If server side validation fails, show the tooltips
      if (res != undefined) {
        Object.keys(res).forEach(function(param) {
          $('#' + param + '_label').tooltip('show');
        });
        return;
      }
      // Save email into cookie
      $.cookie('email', $('#email').val(), { expires: 7 });
    }, 'json');
    return false;  // Prevent default postback.
  });
});
