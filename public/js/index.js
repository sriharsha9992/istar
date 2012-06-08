$(function() {

  // Fetch and display jobs
  function query() {
    $.get('http://137.189.90.124:28017/istar/jobs/', function(jobs) { // http://www.mongodb.org/display/DOCS/Http+Interface
      jobs.rows.forEach(function(r) {
        $('#jobs').append(r.name);
      });
    });
  }
  query();

  // Fetch and display jobs every 10 seconds
//  setInterval(query, 10000);

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Fetch email from cookie
  $('#email').val($.cookie('email'));

  $('.slider').slider({
    range: true,
    slide: function(event, ui) {
      $('#' + this.id + '_lb').text(ui.values[0]);
      $('#' + this.id + '_ub').text(ui.values[1]);
    }
  });

  // Initialize mwt slider
  $('#mwt').slider({
    min: 55,
    max: 566,
    values: [ 400, 500 ],
  });

  // Initialize logp slider
  $('#logp').slider({
    min: -6,
    max: 12,
    values: [ 0, 5 ],
  });

  // Initialize nrb slider
  $('#nrb').slider({
    range: true,
    min: 0,
    max: 34,
    values: [ 2, 8 ],
    slide: function(event, ui) {
      $('#nrb_lb').text(ui.values[0]);
      $('#nrb_ub').text(ui.values[1]);
    }
  });

  // Initialize hbd slider
  $('#hbd').slider({
    range: true,
    min: 0,
    max: 20,
    values: [ 2, 5 ],
    slide: function(event, ui) {
      $('#hbd_lb').text(ui.values[0]);
      $('#hbd_ub').text(ui.values[1]);
    }
  });

  // Initialize hba slider
  $('#hba').slider({
    range: true,
    min: 0,
    max: 18,
    values: [ 2, 10 ],
    slide: function(event, ui) {
      $('#hba_lb').text(ui.values[0]);
      $('#hba_ub').text(ui.values[1]);
    }
  });

  // Initialize charge slider
  $('#charge').slider({
    range: true,
    min: -5,
    max: 5,
    values: [ 0, 0 ],
    slide: function(event, ui) {
      $('#charge_lb').text(ui.values[0]);
      $('#charge_ub').text(ui.values[1]);
    }
  });

  // Initialize ad slider
  $('#ad').slider({
    range: true,
    min: -25,
    max: 29,
    values: [ 0, 12 ],
    slide: function(event, ui) {
      $('#ad_lb').text(ui.values[0]);
      $('#ad_ub').text(ui.values[1]);
    }
  });

  // Initialize pd slider
  $('#pd').slider({
    range: true,
    min: -504,
    max: 1,
    values: [ -50, 0 ],
    slide: function(event, ui) {
      $('#pd_lb').text(ui.values[0]);
      $('#pd_ub').text(ui.values[1]);
    }
  });

  // Initialize tpsa slider
  $('#tpsa').slider({
    range: true,
    min: 0,
    max: 317,
    values: [ 20, 100 ],
    slide: function(event, ui) {
      $('#tpsa_lb').text(ui.values[0]);
      $('#tpsa_ub').text(ui.values[1]);
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
