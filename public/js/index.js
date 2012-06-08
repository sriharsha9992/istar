$(function() {

  // Fetch jobs
  $.get('/jobs', function(jobs) {
    jobs.forEach(function(job) {
      $('#jobs').append(job.name);
    });
  });

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Fetch email from cookie
  $('#email').val($.cookie('email'));

  // Initialize sliders
  $('#mwt').slider({
    range: true,
    min: 55,
    max: 566,
    values: [ 400, 500 ]
  });
  $('#logp').slider({
    range: true,
    min: -6,
    max: 12,
    values: [ 0, 5 ]
  });
  $('#nrb').slider({
    range: true,
    min: 0,
    max: 34,
    values: [ 2, 8 ]
  });
  $('#hbd').slider({
    range: true,
    min: 0,
    max: 20,
    values: [ 2, 5 ]
  });
  $('#hba').slider({
    range: true,
    min: 0,
    max: 18,
    values: [ 2, 10 ]
  });
  $('#charge').slider({
    range: true,
    min: -5,
    max: 5,
    values: [ 0, 0 ]
  });
  $('#ad').slider({
    range: true,
    min: -25,
    max: 29,
    values: [ 0, 12 ]
  });
  $('#pd').slider({
    range: true,
    min: -504,
    max: 1,
    values: [ -50, 0 ]
  });
  $('#tpsa').slider({
    range: true,
    min: 0,
    max: 317,
    values: [ 20, 100 ]
  });
  $('.slider').slider({
    slide: function(event, ui) {
      $('#' + this.id + '_lb').text(ui.values[0]);
      $('#' + this.id + '_ub').text(ui.values[1]);
    }
  });

  // Process submission
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
          $('#' + err.substring(0, err.indexOf(' ')) + '_label').tooltip('show');
        });
        return;
      }

      // Save email into cookie
      $.cookie('email', $('#email').val(), { expires: 7 });

      // Refresh jobs
      query();

    }, 'json');
  });
});
