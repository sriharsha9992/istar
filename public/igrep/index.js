$(function() {

  // Fetch email from cookie
  var email = $.cookie('email');
  $('#email').val(email);

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
  var genome = $('#genome');
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
    tds[0] = $('option[value=' + job.genome + ']', genome).text();
    tds[1] = $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss');
    tds[2] = (done ? $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss') : 'Queued for execution');
    tds[3] = (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" class="csv" alt="log.csv"/></a>' : null);
    tds[4] = (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" class="csv" alt="pos.csv"/></a>' : null);
    return tds;
  }

  // Refresh the table of jobs and its pager
  var jobs, jobs_trs = $('#jobs tr');
  function refresh() {
    var offset = 8 * (page - 1);
    jobs_trs.each(function(i) {
      var row = tr(jobs[offset + i]);
      $('td', $(this)).each(function(j) {
        $(this).html(row[j]);
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
  function fade(select) {
    var offset = 8 * (page - 1);
    jobs_trs.each(function(i) {
      var row = tr(jobs[offset + i]);
      $('td', $(this)).each(function(j) {
        if (select(offset + i, j)) $(this).hide().html(row[j]).fadeIn('slow');
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
  var d = setInterval(function() {
    $.get('done', { email: email, skip: dones }, function(res) {
      if (!res.length) return;
      res.forEach(function(job, i) {
        jobs[dones + i].done = job.done;
      });
      fade(function(i, j) {
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
      // Concat the new job to the existing jobs array, and refresh the table of jobs
      jobs = jobs.concat(res);
      last_page = jobs.length ? ((jobs.length + 7) >> 3) : 1;
      if (page < last_page) {
        page = last_page;
        refresh();
      }
      fade(function(i, j) {
        return (i + 1 === jobs.length) && (j <= 2);
      });
      // Reactivate the timer if it is stopped
      
      // Save email into cookie
      email = $('#email').val();
      $.cookie('email', email, { expires: 7 });
    }, 'json');
  });
});
