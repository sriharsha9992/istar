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

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Fetch email from cookie
  $('#email').val($.cookie('email'));

  // Initialize mwt slider
  $('#mwt_slider').slider({
    range: true,
    min: 10,
    max: 550,
    values: [ 400, 500 ],
    slide: function(event, ui) {
      $('#mwt_lb').text(ui.values[0]);
      $('#mwt_ub').text(ui.values[1]);
    }
  });
  $('#mwt_lb').text($('#mwt_slider').slider("values", 0));
  $('#mwt_ub').text($('#mwt_slider').slider("values", 1));

  // Initialize logp slider
  $('#logp_slider').slider({
    range: true,
    min: -6,
    max: 9,
    values: [ -1, 6 ],
    slide: function(event, ui) {
      $('#logp_lb').text(ui.values[0]);
      $('#logp_ub').text(ui.values[1]);
    }
  });
  $('#logp_lb').text($('#logp_slider').slider("values", 0));
  $('#logp_ub').text($('#logp_slider').slider("values", 1));

  // Initialize hbd slider
  $('#hbd_slider').slider({
    range: true,
    min: 0,
    max: 10,
    values: [ 1, 6 ],
    slide: function(event, ui) {
      $('#hbd_lb').text(ui.values[0]);
      $('#hbd_ub').text(ui.values[1]);
    }
  });
  $('#hbd_lb').text($('#hbd_slider').slider("values", 0));
  $('#hbd_ub').text($('#hbd_slider').slider("values", 1));

  // Initialize hba slider
  $('#hba_slider').slider({
    range: true,
    min: 0,
    max: 20,
    values: [ 1, 10 ],
    slide: function(event, ui) {
      $('#hba_lb').text(ui.values[0]);
      $('#hba_ub').text(ui.values[1]);
    }
  });
  $('#hba_lb').text($('#hba_slider').slider("values", 0));
  $('#hba_ub').text($('#hba_slider').slider("values", 1));

  // Initialize nrb slider
  $('#nrb_slider').slider({
    range: true,
    min: 0,
    max: 15,
    values: [ 2, 9 ],
    slide: function(event, ui) {
      $('#nrb_lb').text(ui.values[0]);
      $('#nrb_ub').text(ui.values[1]);
    }
  });
  $('#nrb_lb').text($('#nrb_slider').slider("values", 0));
  $('#nrb_ub').text($('#nrb_slider').slider("values", 1));

  // Initialize tpsa slider
  $('#tpsa_slider').slider({
    range: true,
    min: 0,
    max: 200,
    values: [ 20, 80 ],
    slide: function(event, ui) {
      $('#tpsa_lb').text(ui.values[0]);
      $('#tpsa_ub').text(ui.values[1]);
    }
  });
  $('#tpsa_lb').text($('#tpsa_slider').slider("values", 0));
  $('#tpsa_ub').text($('#tpsa_slider').slider("values", 1));

  // Initialize ad slider
  $('#ad_slider').slider({
    range: true,
    min: -100,
    max: 100,
    values: [ -50, 50 ],
    slide: function(event, ui) {
      $('#ad_lb').text(ui.values[0]);
      $('#ad_ub').text(ui.values[1]);
    }
  });
  $('#ad_lb').text($('#ad_slider').slider("values", 0));
  $('#ad_ub').text($('#ad_slider').slider("values", 1));

  // Initialize pd slider
  $('#pd_slider').slider({
    range: true,
    min: -200,
    max: 50,
    values: [ -150, 0 ],
    slide: function(event, ui) {
      $('#pd_lb').text(ui.values[0]);
      $('#pd_ub').text(ui.values[1]);
    }
  });
  $('#pd_lb').text($('#pd_slider').slider("values", 0));
  $('#pd_ub').text($('#pd_slider').slider("values", 1));

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
