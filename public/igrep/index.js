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
  var jobs, last_page, page,
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
    tds[3] = (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" class="csv" alt="log.csv"/></a>' : '');
    tds[4] = (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" class="csv" alt="pos.csv"/></a>' : '');
    return tds;
  }

  // Refresh the table of jobs
  function refreshJobs() {
    var offset = 8 * (page - 1);
    $('tr', jobsbody).each(function (i) {
      var row = tr(jobs[offset + i]);
      $('td', $(this)).each(function (j) {
        $(this).hide().html(row[j]).fadeIn();
      });
    });

    // Refresh pager
    if (page == 1) {
      frstpage.addClass('disabled');
      prevpage.addClass('disabled');
    } else {
      frstpage.removeClass('disabled');
      prevpage.removeClass('disabled');
    }
    if (page == last_page) {
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
    last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
    page = last_page;
    refreshJobs();
  });

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
      if (res) {
        Object.keys(res).forEach(function(param) {
          $('#' + param + '_label').tooltip('show');
        });
        return;
      }
      email = $('#email').val();
      $.get('jobs', { email: email, skip: jobs.length }, function(res) {
        jobs = jobs.concat(res);
        last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
        page = last_page;
        refreshJobs();
      });
      // Save email into cookie
      $.cookie('email', email, { expires: 7 });
    }, 'json');
  });
});
