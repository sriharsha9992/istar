$(function() {

  // Fetch email from cookie
  var email = $.cookie('email');
  $('#email').val(email);
  
  // Get a genome via its taxonomy id.
  var genomes = $('option');
  function getGenome(taxon_id) {
    var genome;
    genomes.each(function() {
      var g = $(this);
      if (g.val() == taxon_id) genome = g.text();
    });
    return genome;
  }

  // Initialize pager
  var jobs, dones, last_page, page,
      jobsbody = $('#jobsbody'),
      frstpage = $('#frstpage'),
      lastpage = $('#lastpage'),
      prevpage = $('#prevpage'),
      nextpage = $('#nextpage'),
      whatpage = $('#whatpage');
  frstpage.click(function() {
    if (frstpage.hasClass('disabled')) return;
    page = 1;
    refreshJobs();
  });
  lastpage.click(function() {
    if (lastpage.hasClass('disabled')) return;
    page = last_page;
    refreshJobs();
  });
  prevpage.click(function() {
    if (prevpage.hasClass('disabled')) return;
    page -= 1;
    refreshJobs();
  });
  nextpage.click(function() {
    if (nextpage.hasClass('disabled')) return;
    page += 1;
    refreshJobs();
  });
  whatpage.change(function() {
    var p = parseInt(whatpage.val());
    if ((p < 1) || (p > last_page) || (p === page)) return;
    page = p;
    refreshJobs();
  });

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
    var done = job.done != undefined;
    tds[0] = getGenome(job.genome);
    tds[1] = $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss');
    tds[2] = (done ? $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss') : 'Queued for execution');
    tds[3] = (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" class="csv" alt="log.csv"/></a>' : null);
    tds[4] = (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" class="csv" alt="pos.csv"/></a>' : null);
    return tds;
  }

  // Refresh the table of jobs
  function refreshJobs(fade) {
    var offset = 8 * (page - 1);
    $('tr', jobsbody).each(function(i) {
      var row = tr(jobs[offset + i]);
      $('td', $(this)).each(function(j) {
        if (fade && fade(offset + i, j)) return $(this).hide().html(row[j]).fadeIn('slow');
        $(this).html(row[j]);
      });
    });

    // Refresh pager
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

  // Initialize the table of jobs
  $.get('jobs', { email: email }, function(res) {
    jobs = res;
    for (dones = jobs.length; dones && !jobs[dones - 1].done; --dones);
    last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
    page = last_page;
    refreshJobs();
  });

  // Refresh result every second
  setInterval(function() {
    $.get('done', { email: email, skip: dones }, function(res) {
      if (!res.length) return;
      res.forEach(function(job, i) {
        jobs[dones + i].done = job.done;
      });
      refreshJobs(function(i, j) {
        return (dones <= i) && (i < dones + res.length) && (j >= 2);
      });
      dones += res.length;
    });
  }, 1000);

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Process submission
  $('#submit').click(function() {
    // Hide tooltips
    $('.control-label a[rel=tooltip]').tooltip('hide');
    // Post a new job without client side validation
    $.post('jobs', {
      email: $('#email').val(),
      genome: $('#genome').val(),
      queries: $('#queries').val()
    }, function(res) {
      // If server side validation fails, show tooltips
      if (!Array.isArray(res)) {
        Object.keys(res).forEach(function(param) {
          $('#' + param + '_label').tooltip('show');
        });
        return;
      }
      jobs = jobs.concat(res);
      last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
      page = last_page;
      refreshJobs(function(i, j) {
        return (i + 1 === jobs.length) && (j <= 2);
      });
      // Save email into cookie
      email = $('#email').val();
      $.cookie('email', email, { expires: 7 });
    }, 'json');
  });
});
