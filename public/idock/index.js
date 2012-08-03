$(function() {

  // Fetch email from cookie
  var email;
  if (document.cookie) {
    var cookies = document.cookie.split('; ');
    for (var i = 0; i < cookies.length; ++i) {
      var cookie = cookies[i];
      if (cookie.substring(0, 6) === 'email=') {
        email = cookie.substring(6);
        break;
      }
    }
  }
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
    var status, progress;
    if (!job.scheduled) {
      status = 'Queued for execution';
      progress = 0;
    } else if (job.completed < 100) {
      status = 'Phase 1 in progress';
      var num_completed_ligands = 0;
      for (var i = 0; i < job.scheduled; ++i) {
        num_completed_ligands += parseInt(job["slice" + i]);
      }
      progress = num_completed_ligands / job.ligands;
    } else if (!job.done) {
      status = 'Phase 2 in progress';
      progress = job.phase2 / Math.min(job.ligands, 1000);
    } else {
      status = 'Done on ' + $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss');
      progress = 1;
    }
    tds[0] = $.comma(job.ligands);
    tds[1] = $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss');
    tds[2] = status;
    tds[3] = (100 * progress).toFixed(5) + '%';
    tds[4] = job.done ? '<a href="jobs/' + job._id + '/result.tar.gz"><img src="/excel.png" alt="result.tar.gz"/></a>' : null;
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
        if (col(j)) $(this).hide().html(tds[j]).fadeIn('slow');
      });
    });
  }

  // Initialize the table of jobs
  var dones;
  $.get('jobs', { email: email }, function(res) {
    jobs = res;
    for (dones = jobs.length; dones && !jobs[dones - 1].done; --dones);
    last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
    page = last_page;
    refresh();
  });

  // Activate the timer to refresh result every second
/*
  setInterval(function() {
    $.get('done', { email: email, skip: dones }, function(res) {
      if (!res.length) return;
      res.forEach(function(job, i) {
        jobs[dones + i].done = job.done;
      });
      fade(function(i) {
        return (dones <= i) && (i < dones + res.length);
      }, function(j) {
        return j >= 2;
      });
      dones += res.length;
    });
  }, 1000);
*/

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
        $('#ligands').text($.comma(res));
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
      var expireDate = new Date();
      expireDate.setTime(expireDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      document.cookie = 'email=' + $('#email').val() + ';expires=' + expireDate.toUTCString();
      // Redirect to the current page if the email is changed
      if (!email) email = $('#email');
      else if (email.toLowerCase() !== $('#email').val().toLowerCase()) {
        return window.location.replace('/idock');
      }
      // Concat the new job to the existing jobs array, and refresh the table of jobs
      jobs = jobs.concat(res);
      last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
      if (page < last_page) {
        page = last_page;
        refresh();
      }
      fade(function(i) {
        return i + 1 === jobs.length;
      }, function(j) {
        return j <= 3;
      });
    }, 'json');
  });
});
