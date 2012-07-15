$(function() {

  // Fetch email from cookie
  var email = $.cookie('email');
  $('#email').val(email);

  // Fetch jobs
  $.get('/jobs', { email: email }, function(jobs) {
    jobs.forEach(function(job) {
      $('#jobs').append(' ' + job.description);
    });
  });

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

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
  $('#tpsa').slider({
    range: true,
    min: 0,
    max: 317,
    values: [ 20, 100 ]
  });
  $('#charge').slider({
    range: true,
    min: -5,
    max: 5,
    values: [ 0, 0 ]
  });
  $('#nrb').slider({
    range: true,
    min: 0,
    max: 34,
    values: [ 2, 8 ]
  });
  $('.slider').slider({
    slide: function(event, ui) {
      $('#' + this.id + '_lb').text(ui.values[0]);
      $('#' + this.id + '_ub').text(ui.values[1]);
    },
    change: function(event, ui) {
      $.get('/ligands', {
        mwt_lb: $('#mwt_lb').text(),
        mwt_ub: $('#mwt_ub').text(),
        logp_lb: $('#logp_lb').text(),
        logp_ub: $('#logp_ub').text(),
        ad_lb: $('#ad_lb').text(),
        ad_ub: $('#ad_ub').text(),
        pd_lb: $('#pd_lb').text(),
        pd_ub: $('#pd_ub').text(),
        hbd_lb: $('#hbd_lb').text(),
        hbd_ub: $('#hbd_ub').text(),
        hba_lb: $('#hba_lb').text(),
        hba_ub: $('#hba_ub').text(),
        tpsa_lb: $('#tpsa_lb').text(),
        tpsa_ub: $('#tpsa_ub').text(),
        charge_lb: $('#charge_lb').text(),
        charge_ub: $('#charge_ub').text(),
        nrb_lb: $('#nrb_lb').text(),
        nrb_ub: $('#nrb_ub').text()
      }, function (res) {
        $('#ligands').text(res);
      });
    }
  });

  // Process submission
  $('#submit').click(function() {
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
      email: $('#email').val(),
      mwt_lb: $('#mwt_lb').text(),
      mwt_ub: $('#mwt_ub').text(),
      logp_lb: $('#logp_lb').text(),
      logp_ub: $('#logp_ub').text(),
      ad_lb: $('#ad_lb').text(),
      ad_ub: $('#ad_ub').text(),
      pd_lb: $('#pd_lb').text(),
      pd_ub: $('#pd_ub').text(),
      hbd_lb: $('#hbd_lb').text(),
      hbd_ub: $('#hbd_ub').text(),
      hba_lb: $('#hba_lb').text(),
      hba_ub: $('#hba_ub').text(),
      tpsa_lb: $('#tpsa_lb').text(),
      tpsa_ub: $('#tpsa_ub').text(),
      charge_lb: $('#charge_lb').text(),
      charge_ub: $('#charge_ub').text(),
      nrb_lb: $('#nrb_lb').text(),
      nrb_ub: $('#nrb_ub').text()
    }, function(res) {
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
  });
});
