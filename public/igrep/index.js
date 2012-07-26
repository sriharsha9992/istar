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
      frstpage = $('#frstpage'),
      lastpage = $('#lastpage'),
      prevpage = $('#prevpage'),
      nextpage = $('#nextpage');
  frstpage.click(function() {
    if (frstpage.hasClass('disabled')) return;
    page = 0;
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

  // Refresh the table of jobs
  function refreshJobs() {
    var rows;
    for (var i = 8 * page; i < 8 * (page + 1); ++i) {
      if (i >= jobs.length) {
        rows += '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>';
        continue;
      }
      var job = jobs[i];
      var done = job.done != undefined;
      rows += '<tr><td>' + getGenome(job.genome) + '</td><td>' + $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss') + '</td><td>' + (done ? $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss') : 'Queued for execution') + '</td><td>' + (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" class="csv" alt="log.csv"/></a>' : '') + '</td><td>' + (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" class="csv" alt="pos.csv"/></a>' : '') + '</td></tr>';
    }
    $('#jobs').hide().html(rows).fadeIn();

    // Refresh pager
    if (page == 0) {
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
  }

  // Initialize the table of jobs
  $.get('jobs', { email: email }, function(res) {
    jobs = res;
    last_page = jobs.length ? ((jobs.length - 1) >> 3) : 0;
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
        last_page = jobs.length ? ((jobs.length - 1) >> 3) : 0;
        page = last_page;
        refreshJobs();
      });
      // Save email into cookie
      $.cookie('email', email, { expires: 7 });
    }, 'json');
  });
});
