$(function() {

  // Initialize tooltips
  $('.form-group a').tooltip();

  // Initialize pager
  var pager = $('#pager');
  pager.pager('init', [ 'Description', 'Ligands', 'Submitted on', 'Status', 'Progress', 'Result' ], function(job) {
    var status, progress, result;
    if (!job.scheduled) {
      status = 'Queued for execution';
      progress = 0;
    } else if (job.completed < 100) {
      status = 'Phase 1 in progress';
      var num_completed_ligands = 0;
      for (var i = 0; i < job.scheduled; ++i) {
        num_completed_ligands += parseInt(job[i.toString()]);
      }
      progress = num_completed_ligands / job.ligands;
    } else if (job.refined < job.hits) {
      status = 'Phase 2 in progress';
      progress = job.refined / job.hits;
      result = '<a href="jobs/' + job._id + '/phase1.csv.gz"><img src="/excel.png" alt="phase1.csv.gz"></a>';
    } else {
      status = 'Done on ' + $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss');
      progress = 1;
      result = '<a href="jobs/' + job._id + '/phase1.csv.gz"><img src="/excel.png" alt="phase1.csv.gz"></a><a href="jobs/' + job._id + '/phase2.csv.gz"><img src="/excel.png" alt="phase2.csv.gz"></a><a href="jobs/' + job._id + '/hits.pdbqt.gz"><img src="/molecule.png" alt="hits.pdbqt.gz"></a>';
    }
    return [
      job.description,
      job.ligands.comma(),
      $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss'),
      status,
      (100 * progress).toFixed(5) + '%',
      result
    ];
  });

  // Refresh the table of jobs and its pager every second
  var jobs = [], skip = 0;
  var tick = function() {
    $.get('jobs', { skip: skip, count: jobs.length }, function(res) {
      if (res.length) {
        for (var i = skip; i < jobs.length; ++i) {
          var job = res[i - skip];
          jobs[i].scheduled = job.scheduled;
          jobs[i].completed = job.completed;
          jobs[i].refined = job.refined;
          jobs[i].hits = job.hits;
          jobs[i].done = job.done;
          for (var s = 0; s < job.scheduled; ++s) {
            jobs[i][s.toString()] = job[s.toString()];
          }
        }
        pager.pager('refresh', skip, jobs.length, 3, 6, false);
        if (res.length > jobs.length - skip) {
          var len = jobs.length;
          jobs = jobs.concat(res.slice(jobs.length - skip));
          pager.pager('source', jobs);
          pager.pager('refresh', len, jobs.length, 0, 6, true);
	    }
        for (skip = jobs.length; skip && !jobs[skip - 1].done; --skip);
      }
      setTimeout(tick, 1000);
    });
  };
  tick();

  // Load receptor locally
  var receptor_input = $('input[type="file"]');
  if (!window.FileReader) receptor_input.prop('disabled', true);
  receptor_input.change(function() {
    var files = receptor_input.get(0).files;
    if (!files.length) return;
    var reader = new FileReader();
    reader.onload = function () {
      $('#receptor').val(reader.result);
    };
    reader.readAsText(files[0]);
  });

  // Initialize sliders
  $('#mwt').slider({
    range: true,
    min: 55,
    max: 567,
    values: [ 400, 450 ]
  });
  $('#logp').slider({
    range: true,
    min: -6,
    max: 12,
    values: [ 0, 4 ]
  });
  $('#ad').slider({
    range: true,
    min: -25,
    max: 29,
    values: [ 0, 5 ]
  });
  $('#pd').slider({
    range: true,
    min: -504,
    max: 1,
    values: [ -20, 0 ]
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
    values: [ 4, 8 ]
  });
  $('#tpsa').slider({
    range: true,
    min: 0,
    max: 317,
    values: [ 60, 80 ]
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
    max: 35,
    values: [ 4, 6 ]
  });
  $('.slider').slider({
    slide: function(event, ui) {
      $('#' + this.id + '_lb').text(ui.values[0]);
      $('#' + this.id + '_ub').text(ui.values[1]);
    },
    change: function(event, ui) {
      $.get('ligands', {
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
        $('#ligands').text(res.comma());
      });
    }
  });

  // Process submission
  var submit = $('#submit');
  submit.click(function() {
    // Disable the submit button for a while
    submit.prop('disabled', true);
    // Hide tooltips
    $('.form-group a').tooltip('hide');
    // Post a new job without client side validation
    $.post('jobs', {
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
      var keys = Object.keys(res);
      // If server side validation fails, show the tooltips
      if (keys.length) {
        keys.forEach(function(key) {
          $('#' + key + '_label').tooltip('show');
        });
      } else {
		$('html, body').animate({ scrollTop: pager.offset().top });
//      window.scrollTo(pager.offset().left, pager.offset().top);
      }
    }, 'json').always(function() {
      submit.prop('disabled', false);
    });
  });

  // Apply accordion to tutorials
  $('.ui-accordion').accordion({
    collapsible: true,
    active: false,
    heightStyle: 'content',
    activate: function(event, ui) {
      $('img', this).trigger('expand');
    }
  });
  $('.ui-accordion img').lazyload({
    event: 'expand',
    effect: 'fadeIn',
  });
  // Make code pretty
  $('pre.sh').snippet('sh', {
    style: 'typical',
    menu: false,
  });
});
