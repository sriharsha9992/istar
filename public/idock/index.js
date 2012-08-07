$(function() {

  // Fetch email from cookie
  var email = getCookie('email');
  $('#email').val(email);

  // Initialize tooltips
  $('.control-label a').tooltip();

  // Initialize pager
  var last_page, page,
      frstpage = $('#frstpage'),
      lastpage = $('#lastpage'),
      prevpage = $('#prevpage'),
      nextpage = $('#nextpage'),
      whatpage = $('#whatpage');
  frstpage.click(function() {
    if (frstpage.hasClass('disabled')) return;
    page = 1;
    refresh();
  });
  lastpage.click(function() {
    if (lastpage.hasClass('disabled')) return;
    page = last_page;
    refresh();
  });
  prevpage.click(function() {
    if (prevpage.hasClass('disabled')) return;
    page -= 1;
    refresh();
  });
  nextpage.click(function() {
    if (nextpage.hasClass('disabled')) return;
    page += 1;
    refresh();
  });
  whatpage.change(function() {
    var p = parseInt(whatpage.val());
    if ((p < 1) || (p > last_page) || (p === page)) return;
    page = p;
    refresh();
  });

  // Construct td's of a tr from a job
  function tr(job) {
    var tds = new Array(5);
    if (job === undefined) {
      tds[0] = '&nbsp;';
      tds[1] = '&nbsp;';
      tds[2] = '&nbsp;';
      tds[3] = '&nbsp;';
      tds[4] = '&nbsp;';
      return tds;
    }
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
      result = '<a href="jobs/' + job._id + '/phase1.csv.gz"><img src="/excel.png" alt="phase1.csv.gz"></a><a href="jobs/' + job._id + '/phase2.csv.gz"><img src="/excel.png" alt="phase2.csv.gz"></a><a href="jobs/' + job._id + '/hits.pdbqt.gz"><img src="/mol.png" alt="hits.pdbqt.gz"></a>';
    }
    tds[0] = job.ligands.comma();
    tds[1] = $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss');
    tds[2] = status;
    tds[3] = ((100 * progress).toFixed(5) + '%');
    tds[4] = result;
    return tds;
  }

  // Refresh the table of jobs and its pager
  var jobs = [], jobs_trs = $('#jobs tr');
  function refresh() {
    var offset = 8 * (page - 1);
    jobs_trs.each(function(i) {
      var tds = tr(jobs[offset + i]);
      $('td', $(this)).each(function(j) {
        $(this).html(tds[j]);
      });
    });
    if (page === 1) {
      frstpage.addClass('disabled');
      prevpage.addClass('disabled');
    } else {
      frstpage.removeClass('disabled');
      prevpage.removeClass('disabled');
    }
    if (page === last_page) {
      lastpage.addClass('disabled');
      nextpage.addClass('disabled');
    } else {
      lastpage.removeClass('disabled');
      nextpage.removeClass('disabled');
    }
    whatpage.val(page);
  }

  // Fade selected cells
  function fade(row, col) {
    var offset = 8 * (page - 1);
    jobs_trs.each(function(i) {
      if (!row(offset + i)) return;
      var tds = tr(jobs[offset + i]);
      $('td', $(this)).each(function(j) {
        if (col(j) && ($(this).html() !== tds[j])) $(this).html(tds[j]);
      });
    });
  }

  // Fade only the new job
  function fadeNew() {
    fade(function(i) {
      return i + 1 === jobs.length;
    }, function(j) {
      return j <= 3;
    });
  }

  // Initialize the table of jobs
  var dones;
  function fetch(callback) {
    $.get('jobs', { email: email }, function(res) {
      if (Array.isArray(res)) jobs = res;
      for (dones = jobs.length; dones && !jobs[dones - 1].done; --dones);
      last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
      page = last_page;
      refresh();
      if (callback) callback();
    });
  }
  fetch();

  // Activate the timer to refresh result every second
  setInterval(function() {
    $.get('done', { email: email, skip: dones }, function(res) {
      if (!res.length) return;
      var new_dones = 0;
      res.forEach(function(job, i) {
        jobs[dones + i].scheduled = job.scheduled;
        jobs[dones + i].completed = job.completed;
        jobs[dones + i].refined = job.refined;
        jobs[dones + i].hits = job.hits;
        if (job.done) {
          jobs[dones + i].done = job.done;
          ++new_dones;
        }
        for (var s = 0; s < job.scheduled; ++s) {
          jobs[dones + i][s.toString()] = job[s.toString()];
        }
      });
      fade(function(i) {
        return (dones <= i) && (i < dones + res.length);
      }, function(j) {
        return j >= 2;
      });
      dones += new_dones;
    });
  }, 1000);

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
  $('#submit').click(function() {
    // Hide tooltips
    $('.control-label a').tooltip('hide');
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
      // If server side validation fails, show the tooltips
      if (!Array.isArray(res)) {
        Object.keys(res).forEach(function(param) {
          $('#' + param + '_label').tooltip('show');
        });
        return;
      }
      // Save email into cookie
      setCookie('email', $('#email').val(), 7);
      // Check if the email is changed
      if (email && email.toLowerCase() === $('#email').val().toLowerCase()) {
        // Concat the new job to the existing jobs array, and refresh the table of jobs
        jobs = jobs.concat(res);
        last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
        if (page < last_page) {
          page = last_page;
          refresh();
        }
        fadeNew();
      } else {
        email = $('#email').val();
        fetch(fadeNew);
      }
    }, 'json');
  });
});
