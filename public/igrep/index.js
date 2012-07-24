$(function () {

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

  // Fetch jobs
  $.get('jobs', { email: email }, function(jobs) {
    var jobs;
    jobs.forEach(function(job) {
      var done = job.done != undefined;
      jobs += '<tr><td>' + getGenome(job.genome) + '</td><td>' + $.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss') + '</td><td>' + (done ? $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss') : 'Queued for execution') + '</td><td>' + (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" class="csv" alt="log.csv"/></a>' : '') + '</td><td>' + (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" class="csv" alt="pos.csv"/></a>' : '') + '</td></tr>';
    });
    $('#jobs').html(jobs);
  });

  // Initialize tooltips
  $('.control-label a[rel=tooltip]').tooltip();

  // Process submission
  $('#submit').click(function () {
    // Hide tooltips
    $('.control-label a[rel=tooltip]').tooltip('hide');
    // Post a new job without client side validation
    $.post('jobs', {
      genome: $('#genome').val(),
      queries: $('#queries').val(),
      email: $('#email').val()
    }, function (res) {
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
    return false;  // Prevent default postback.
  });
});
