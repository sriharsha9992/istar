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
    tds[3] = (done ? '<a href="jobs/' + job._id + '/log.csv"><img src="/excel.png" alt="log.csv"/></a>' : null);
    tds[4] = (done ? '<a href="jobs/' + job._id + '/pos.csv"><img src="/excel.png" alt="pos.csv"/></a>' : null);
    return tds;
  }

  // Refresh the table of jobs and its pager
  var jobs, jobs_trs = $('#jobs tr');
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
      fade(function(i) {
        return i + 1 === jobs.length;
      }, function(j) {
        return j <= 2;
      });
      // Save email into cookie
      email = $('#email').val();
      $.cookie('email', email, { expires: 7 });
    }, 'json');
  });

  // Define genomes
  var genomes = new Array(17);
  genomes[0] = {
    name: 'Monodelphis domestica (Gray short-tailed opossum)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 3502373038,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 748055161,
      header: '>gi|126361933|ref|NC_008801.1|NC_008801 Monodelphis domestica file 1, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 541556283,
      header: '>gi|126362075|ref|NC_008802.1|NC_008802 Monodelphis domestica file 2, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 527952102,
      header: '>gi|126362809|ref|NC_008803.1|NC_008803 Monodelphis domestica file 3, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 435153693,
      header: '>gi|126362810|ref|NC_008804.1|NC_008804 Monodelphis domestica file 4, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 304825324,
      header: '>gi|126362941|ref|NC_008805.1|NC_008805 Monodelphis domestica file 5, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 292091736,
      header: '>gi|126362942|ref|NC_008806.1|NC_008806 Monodelphis domestica file 6, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 260857928,
      header: '>gi|126362943|ref|NC_008807.1|NC_008807 Monodelphis domestica file 7, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 312544902,
      header: '>gi|126362944|ref|NC_008808.1|NC_008808 Monodelphis domestica file 8, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 79335909,
      header: '>gi|126362945|ref|NC_008809.1|NC_008809 Monodelphis domestica file X, reference assembly (based on MonDom5), whole genome shotgun sequence'
    }]
  };
  genomes[1] = {
    name: 'Pan troglodytes (Chimpanzee)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 3175582169,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 229974691,
      header: '>gi|114795050|ref|NC_006468.2|NC_006468 Pan troglodytes file 1, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr2A.fa',
      nucleotides: 114460064,
      header: '>gi|114795440|ref|NC_006469.2|NC_006469 Pan troglodytes file 2A, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr2B.fa',
      nucleotides: 248603653,
      header: '>gi|114796131|ref|NC_006470.2|NC_006470 Pan troglodytes file 2B, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 203962478,
      header: '>gi|114796132|ref|NC_006490.2|NC_006490 Pan troglodytes file 3, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 194897272,
      header: '>gi|114796133|ref|NC_006471.2|NC_006471 Pan troglodytes file 4, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 183994906,
      header: '>gi|114796134|ref|NC_006472.2|NC_006472 Pan troglodytes file 5, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 173908612,
      header: '>gi|114796135|ref|NC_006473.2|NC_006473 Pan troglodytes file 6, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 160261443,
      header: '>gi|114796136|ref|NC_006474.2|NC_006474 Pan troglodytes file 7, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 145085868,
      header: '>gi|114796137|ref|NC_006475.2|NC_006475 Pan troglodytes file 8, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 138509991,
      header: '>gi|114796138|ref|NC_006476.2|NC_006476 Pan troglodytes file 9, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 135001995,
      header: '>gi|114795051|ref|NC_006477.2|NC_006477 Pan troglodytes file 10, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 134204764,
      header: '>gi|114795052|ref|NC_006478.2|NC_006478 Pan troglodytes file 11, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 135371336,
      header: '>gi|114795053|ref|NC_006479.2|NC_006479 Pan troglodytes file 12, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 115868456,
      header: '>gi|114795054|ref|NC_006480.2|NC_006480 Pan troglodytes file 13, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 107349158,
      header: '>gi|114795055|ref|NC_006481.2|NC_006481 Pan troglodytes file 14, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 100063422,
      header: '>gi|114795056|ref|NC_006482.2|NC_006482 Pan troglodytes file 15, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 90682376,
      header: '>gi|114795057|ref|NC_006483.2|NC_006483 Pan troglodytes file 16, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 83384210,
      header: '>gi|114795065|ref|NC_006484.2|NC_006484 Pan troglodytes file 17, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 77261746,
      header: '>gi|114795066|ref|NC_006485.2|NC_006485 Pan troglodytes file 18, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 64473437,
      header: '>gi|114795187|ref|NC_006486.2|NC_006486 Pan troglodytes file 19, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 62293572,
      header: '>gi|114795211|ref|NC_006487.2|NC_006487 Pan troglodytes file 20, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 46489110,
      header: '>gi|114795212|ref|NC_006488.2|NC_006488 Pan troglodytes file 21, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chr22.fa',
      nucleotides: 50165558,
      header: '>gi|114795213|ref|NC_006489.2|NC_006489 Pan troglodytes file 22, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 155361357,
      header: '>gi|114796139|ref|NC_006491.2|NC_006491 Pan troglodytes file X, reference assembly (based on Pan_troglodytes-2.1)'
    }, {
      file: 'ref_chrY.fa',
      nucleotides: 23952694,
      header: '>gi|114796141|ref|NC_006492.2|NC_006492 Pan troglodytes file Y, reference assembly (based on Pan_troglodytes-2.1)'
    }]
  };
  genomes[2] = {
    name: 'Homo sapiens (Human)',
    version: 1,
    ncbiBuild: 37,
    nucleotides: 3095677412,
    files: [{
      file: 'ref_GRCh37_chr1.fa',
      nucleotides: 249250621,
      header: '>gi|224589800|ref|NC_000001.10| Homo sapiens file 1, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr2.fa',
      nucleotides: 243199373,
      header: '>gi|224589811|ref|NC_000002.11| Homo sapiens file 2, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr3.fa',
      nucleotides: 198022430,
      header: '>gi|224589815|ref|NC_000003.11| Homo sapiens file 3, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr4.fa',
      nucleotides: 191154276,
      header: '>gi|224589816|ref|NC_000004.11| Homo sapiens file 4, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr5.fa',
      nucleotides: 180915260,
      header: '>gi|224589817|ref|NC_000005.9| Homo sapiens file 5, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr6.fa',
      nucleotides: 171115067,
      header: '>gi|224589818|ref|NC_000006.11| Homo sapiens file 6, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr7.fa',
      nucleotides: 159138663,
      header: '>gi|224589819|ref|NC_000007.13| Homo sapiens file 7, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr8.fa',
      nucleotides: 146364022,
      header: '>gi|224589820|ref|NC_000008.10| Homo sapiens file 8, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr9.fa',
      nucleotides: 141213431,
      header: '>gi|224589821|ref|NC_000009.11| Homo sapiens file 9, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr10.fa',
      nucleotides: 135534747,
      header: '>gi|224589801|ref|NC_000010.10| Homo sapiens file 10, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr11.fa',
      nucleotides: 135006516,
      header: '>gi|224589802|ref|NC_000011.9| Homo sapiens file 11, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr12.fa',
      nucleotides: 133851895,
      header: '>gi|224589803|ref|NC_000012.11| Homo sapiens file 12, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr13.fa',
      nucleotides: 115169878,
      header: '>gi|224589804|ref|NC_000013.10| Homo sapiens file 13, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr14.fa',
      nucleotides: 107349540,
      header: '>gi|224589805|ref|NC_000014.8| Homo sapiens file 14, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr15.fa',
      nucleotides: 102531392,
      header: '>gi|224589806|ref|NC_000015.9| Homo sapiens file 15, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr16.fa',
      nucleotides: 90354753,
      header: '>gi|224589807|ref|NC_000016.9| Homo sapiens file 16, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr17.fa',
      nucleotides: 81195210,
      header: '>gi|224589808|ref|NC_000017.10| Homo sapiens file 17, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr18.fa',
      nucleotides: 78077248,
      header: '>gi|224589809|ref|NC_000018.9| Homo sapiens file 18, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr19.fa',
      nucleotides: 59128983,
      header: '>gi|224589810|ref|NC_000019.9| Homo sapiens file 19, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr20.fa',
      nucleotides: 63025520,
      header: '>gi|224589812|ref|NC_000020.10| Homo sapiens file 20, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr21.fa',
      nucleotides: 48129895,
      header: '>gi|224589813|ref|NC_000021.8| Homo sapiens file 21, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chr22.fa',
      nucleotides: 51304566,
      header: '>gi|224589814|ref|NC_000022.10| Homo sapiens file 22, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chrX.fa',
      nucleotides: 155270560,
      header: '>gi|224589822|ref|NC_000023.10| Homo sapiens file X, GRCh37 primary reference assembly'
    }, {
      file: 'ref_GRCh37_chrY.fa',
      nucleotides: 59373566,
      header: '>gi|224589823|ref|NC_000024.9| Homo sapiens file Y, GRCh37 primary reference assembly'
    }]
  };
  genomes[3] = {
    name: 'Macaca mulatta (Rhesus monkey)',
    version: 1,
    ncbiBuild: 1,
    nucleotides: 2863665185,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 228252215,
      header: '>gi|109156578|ref|NC_007858.1|NC_007858 Macaca mulatta file 1, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 189746636,
      header: '>gi|109156887|ref|NC_007859.1|NC_007859 Macaca mulatta file 2, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 196418989,
      header: '>gi|109156890|ref|NC_007860.1|NC_007860 Macaca mulatta file 3, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 167655696,
      header: '>gi|109156893|ref|NC_007861.1|NC_007861 Macaca mulatta file 4, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 182086969,
      header: '>gi|109156895|ref|NC_007862.1|NC_007862 Macaca mulatta file 5, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 178205221,
      header: '>gi|109157119|ref|NC_007863.1|NC_007863 Macaca mulatta file 6, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 169801366,
      header: '>gi|109158192|ref|NC_007864.1|NC_007864 Macaca mulatta file 7, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 147794981,
      header: '>gi|109158193|ref|NC_007865.1|NC_007865 Macaca mulatta file 8, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 133323859,
      header: '>gi|109158194|ref|NC_007866.1|NC_007866 Macaca mulatta file 9, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 94855758,
      header: '>gi|109156579|ref|NC_007867.1|NC_007867 Macaca mulatta file 10, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 134511895,
      header: '>gi|109156580|ref|NC_007868.1|NC_007868 Macaca mulatta file 11, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 106505843,
      header: '>gi|109156645|ref|NC_007869.1|NC_007869 Macaca mulatta file 12, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 138028943,
      header: '>gi|109156646|ref|NC_007870.1|NC_007870 Macaca mulatta file 13, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 133002572,
      header: '>gi|109156648|ref|NC_007871.1|NC_007871 Macaca mulatta file 14, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 110119387,
      header: '>gi|109156649|ref|NC_007872.1|NC_007872 Macaca mulatta file 15, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 78773432,
      header: '>gi|109156650|ref|NC_007873.1|NC_007873 Macaca mulatta file 16, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 94452569,
      header: '>gi|109156884|ref|NC_007874.1|NC_007874 Macaca mulatta file 17, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 73567989,
      header: '>gi|109156885|ref|NC_007875.1|NC_007875 Macaca mulatta file 18, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 64391591,
      header: '>gi|109156886|ref|NC_007876.1|NC_007876 Macaca mulatta file 19, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 88221753,
      header: '>gi|109156888|ref|NC_007877.1|NC_007877 Macaca mulatta file 20, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 153947521,
      header: '>gi|109158195|ref|NC_007878.1|NC_007878 Macaca mulatta file X, reference assembly (based on Mmul_051212), whole genome shotgun sequence'
    }] 
  };
  genomes[4] = {
    name: 'Rattus norvegicus (Rat)',
    version: 1,
    ncbiBuild: 4,
    nucleotides: 2718881021,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 267910886,
      header: '>gi|62750345|ref|NC_005100.2|NC_005100 Rattus norvegicus file 1, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 258207540,
      header: '>gi|62750359|ref|NC_005101.2|NC_005101 Rattus norvegicus file 2, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 171063335,
      header: '>gi|62750360|ref|NC_005102.2|NC_005102 Rattus norvegicus file 3, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 187126005,
      header: '>gi|62750804|ref|NC_005103.2|NC_005103 Rattus norvegicus file 4, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 173096209,
      header: '>gi|62750805|ref|NC_005104.2|NC_005104 Rattus norvegicus file 5, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 147636619,
      header: '>gi|62750806|ref|NC_005105.2|NC_005105 Rattus norvegicus file 6, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 143002779,
      header: '>gi|62750807|ref|NC_005106.2|NC_005106 Rattus norvegicus file 7, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 129041809,
      header: '>gi|62750808|ref|NC_005107.2|NC_005107 Rattus norvegicus file 8, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 113440463,
      header: '>gi|62750809|ref|NC_005108.2|NC_005108 Rattus norvegicus file 9, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 110718848,
      header: '>gi|62750810|ref|NC_005109.2|NC_005109 Rattus norvegicus file 10, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 87759784,
      header: '>gi|62750811|ref|NC_005110.2|NC_005110 Rattus norvegicus file 11, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 46782294,
      header: '>gi|62750812|ref|NC_005111.2|NC_005111 Rattus norvegicus file 12, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 111154910,
      header: '>gi|62750813|ref|NC_005112.2|NC_005112 Rattus norvegicus file 13, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 112194335,
      header: '>gi|62750814|ref|NC_005113.2|NC_005113 Rattus norvegicus file 14, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 109758846,
      header: '>gi|62750815|ref|NC_005114.2|NC_005114 Rattus norvegicus file 15, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 90238779,
      header: '>gi|62750816|ref|NC_005115.2|NC_005115 Rattus norvegicus file 16, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 97296363,
      header: '>gi|62750817|ref|NC_005116.2|NC_005116 Rattus norvegicus file 17, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 87265094,
      header: '>gi|62750818|ref|NC_005117.2|NC_005117 Rattus norvegicus file 18, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 59218465,
      header: '>gi|62750819|ref|NC_005118.2|NC_005118 Rattus norvegicus file 19, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 55268282,
      header: '>gi|62750820|ref|NC_005119.2|NC_005119 Rattus norvegicus file 20, reference assembly (based on RGSC v3.4)'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 160699376,
      header: '>gi|62750821|ref|NC_005120.2|NC_005120 Rattus norvegicus file X, reference assembly (based on RGSC v3.4)'
    }]
  };
  genomes[5] = {
    name: 'Mus musculus (Mouse)',
    version: 1,
    ncbiBuild: 37,
    nucleotides: 2654895218,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 197195432,
      header: '>gi|149288852|ref|NC_000067.5|NC_000067 Mus musculus file 1, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 181748087,
      header: '>gi|149338249|ref|NC_000068.6|NC_000068 Mus musculus file 2, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 159599783,
      header: '>gi|149352351|ref|NC_000069.5|NC_000069 Mus musculus file 3, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 155630120,
      header: '>gi|149354223|ref|NC_000070.5|NC_000070 Mus musculus file 4, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 152537259,
      header: '>gi|149354224|ref|NC_000071.5|NC_000071 Mus musculus file 5, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 149517037,
      header: '>gi|149361431|ref|NC_000072.5|NC_000072 Mus musculus file 6, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 152524553,
      header: '>gi|149361432|ref|NC_000073.5|NC_000073 Mus musculus file 7, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 131738871,
      header: '>gi|149361523|ref|NC_000074.5|NC_000074 Mus musculus file 8, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 124076172,
      header: '>gi|149361524|ref|NC_000075.5|NC_000075 Mus musculus file 9, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 129993255,
      header: '>gi|149288869|ref|NC_000076.5|NC_000076 Mus musculus file 10, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 121843856,
      header: '>gi|149288871|ref|NC_000077.5|NC_000077 Mus musculus file 11, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 121257530,
      header: '>gi|149292731|ref|NC_000078.5|NC_000078 Mus musculus file 12, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 120284312,
      header: '>gi|149292733|ref|NC_000079.5|NC_000079 Mus musculus file 13, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 125194864,
      header: '>gi|149292735|ref|NC_000080.5|NC_000080 Mus musculus file 14, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 103494974,
      header: '>gi|149301884|ref|NC_000081.5|NC_000081 Mus musculus file 15, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 98319150,
      header: '>gi|149304713|ref|NC_000082.5|NC_000082 Mus musculus file 16, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 95272651,
      header: '>gi|149313536|ref|NC_000083.5|NC_000083 Mus musculus file 17, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 90772031,
      header: '>gi|149321426|ref|NC_000084.5|NC_000084 Mus musculus file 18, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 61342430,
      header: '>gi|149323268|ref|NC_000085.5|NC_000085 Mus musculus file 19, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 166650296,
      header: '>gi|149361525|ref|NC_000086.6|NC_000086 Mus musculus file X, reference assembly (C57BL/6J)'
    }, {
      file: 'ref_chrY.fa',
      nucleotides: 15902555,
      header: '>gi|149361526|ref|NC_000087.6|NC_000087 Mus musculus file Y, reference assembly (C57BL/6J)'
    }]
  };
  genomes[6] = {
    name: 'Bos taurus (Cow)',
    version: 1,
    ncbiBuild: 4,
    nucleotides: 2634413324,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 161106243,
      header: '>gi|194719325|ref|NC_007299.3|NC_007299 Bos taurus file 1, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 140800416,
      header: '>gi|194719396|ref|NC_007300.3|NC_007300 Bos taurus file 2, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 127923604,
      header: '>gi|194719407|ref|NC_007301.3|NC_007301 Bos taurus file 3, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 124454208,
      header: '>gi|194719408|ref|NC_007302.3|NC_007302 Bos taurus file 4, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 125847759,
      header: '>gi|194719431|ref|NC_007303.3|NC_007303 Bos taurus file 5, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 122561022,
      header: '>gi|194719536|ref|NC_007304.3|NC_007304 Bos taurus file 6, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 112078216,
      header: '>gi|194719537|ref|NC_007305.3|NC_007305 Bos taurus file 7, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 116942821,
      header: '>gi|194719538|ref|NC_007306.3|NC_007306 Bos taurus file 8, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 108145351,
      header: '>gi|194719539|ref|NC_007307.3|NC_007307 Bos taurus file 9, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 106383598,
      header: '>gi|194719326|ref|NC_007308.3|NC_007308 Bos taurus file 10, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 110171769,
      header: '>gi|194719387|ref|NC_007309.3|NC_007309 Bos taurus file 11, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 85358539,
      header: '>gi|194719388|ref|NC_007310.3|NC_007310 Bos taurus file 12, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 84419198,
      header: '>gi|194719389|ref|NC_007311.3|NC_007311 Bos taurus file 13, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 81345643,
      header: '>gi|194719390|ref|NC_007312.3|NC_007312 Bos taurus file 14, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 84633453,
      header: '>gi|194719391|ref|NC_007313.3|NC_007313 Bos taurus file 15, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 77906053,
      header: '>gi|194719392|ref|NC_007314.3|NC_007314 Bos taurus file 16, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 76506943,
      header: '>gi|194719393|ref|NC_007315.3|NC_007315 Bos taurus file 17, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 66141439,
      header: '>gi|194719394|ref|NC_007316.3|NC_007316 Bos taurus file 18, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 65312493,
      header: '>gi|194719395|ref|NC_007317.3|NC_007317 Bos taurus file 19, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 75796353,
      header: '>gi|194719397|ref|NC_007318.3|NC_007318 Bos taurus file 20, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 69173390,
      header: '>gi|194719398|ref|NC_007319.3|NC_007319 Bos taurus file 21, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr22.fa',
      nucleotides: 61848140,
      header: '>gi|194719399|ref|NC_007320.3|NC_007320 Bos taurus file 22, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr23.fa',
      nucleotides: 53376148,
      header: '>gi|194719400|ref|NC_007324.3|NC_007324 Bos taurus file 23, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr24.fa',
      nucleotides: 65020233,
      header: '>gi|194719401|ref|NC_007325.3|NC_007325 Bos taurus file 24, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr25.fa',
      nucleotides: 44060403,
      header: '>gi|194719402|ref|NC_007326.3|NC_007326 Bos taurus file 25, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr26.fa',
      nucleotides: 51750746,
      header: '>gi|194719403|ref|NC_007327.3|NC_007327 Bos taurus file 26, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr27.fa',
      nucleotides: 48749334,
      header: '>gi|194719404|ref|NC_007328.3|NC_007328 Bos taurus file 27, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr28.fa',
      nucleotides: 46084206,
      header: '>gi|194719405|ref|NC_007329.3|NC_007329 Bos taurus file 28, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chr29.fa',
      nucleotides: 51998940,
      header: '>gi|194719406|ref|NC_007330.3|NC_007330 Bos taurus file 29, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 88516663,
      header: '>gi|194719540|ref|NC_007331.3|NC_007331 Bos taurus file X, reference assembly (based on Btau_4.0), whole genome shotgun sequence'
    }]
  };
  genomes[7] = {
    name: 'Canis familiaris (Dog)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 2445110183,
    files: [{
      file: 'chr1.fa',
      nucleotides: 125616256,
      header: '>gi|74027283|ref|NC_006583.2|NC_006583 Canis familiaris file 1, whole genome shotgun sequence'
    }, {
      file: 'chr2.fa',
      nucleotides: 88410189,
      header: '>gi|74027284|ref|NC_006584.2|NC_006584 Canis familiaris file 2, whole genome shotgun sequence'
    }, {
      file: 'chr3.fa',
      nucleotides: 94715083,
      header: '>gi|74027285|ref|NC_006585.2|NC_006585 Canis familiaris file 3, whole genome shotgun sequence'
    }, {
      file: 'chr4.fa',
      nucleotides: 91483860,
      header: '>gi|74027286|ref|NC_006586.2|NC_006586 Canis familiaris file 4, whole genome shotgun sequence'
    }, {
      file: 'chr5.fa',
      nucleotides: 91976430,
      header: '>gi|74027287|ref|NC_006587.2|NC_006587 Canis familiaris file 5, whole genome shotgun sequence'
    }, {
      file: 'chr6.fa',
      nucleotides: 80642250,
      header: '>gi|74027288|ref|NC_006588.2|NC_006588 Canis familiaris file 6, whole genome shotgun sequence'
    }, {
      file: 'chr7.fa',
      nucleotides: 83999179,
      header: '>gi|74027508|ref|NC_006589.2|NC_006589 Canis familiaris file 7, whole genome shotgun sequence'
    }, {
      file: 'chr8.fa',
      nucleotides: 77315194,
      header: '>gi|74028536|ref|NC_006590.2|NC_006590 Canis familiaris file 8, whole genome shotgun sequence'
    }, {
      file: 'chr9.fa',
      nucleotides: 64418924,
      header: '>gi|74029186|ref|NC_006591.2|NC_006591 Canis familiaris file 9, whole genome shotgun sequence'
    }, {
      file: 'chr10.fa',
      nucleotides: 72488556,
      header: '>gi|74029679|ref|NC_006592.2|NC_006592 Canis familiaris file 10, whole genome shotgun sequence'
    }, {
      file: 'chr11.fa',
      nucleotides: 77416458,
      header: '>gi|74030065|ref|NC_006593.2|NC_006593 Canis familiaris file 11, whole genome shotgun sequence'
    }, {
      file: 'chr12.fa',
      nucleotides: 75515492,
      header: '>gi|74030454|ref|NC_006594.2|NC_006594 Canis familiaris file 12, whole genome shotgun sequence'
    }, {
      file: 'chr13.fa',
      nucleotides: 66182471,
      header: '>gi|74030724|ref|NC_006595.2|NC_006595 Canis familiaris file 13, whole genome shotgun sequence'
    }, {
      file: 'chr14.fa',
      nucleotides: 63938239,
      header: '>gi|74031036|ref|NC_006596.2|NC_006596 Canis familiaris file 14, whole genome shotgun sequence'
    }, {
      file: 'chr15.fa',
      nucleotides: 67211953,
      header: '>gi|74031414|ref|NC_006597.2|NC_006597 Canis familiaris file 15, whole genome shotgun sequence'
    }, {
      file: 'chr16.fa',
      nucleotides: 62570175,
      header: '>gi|74031659|ref|NC_006598.2|NC_006598 Canis familiaris file 16, whole genome shotgun sequence'
    }, {
      file: 'chr17.fa',
      nucleotides: 67347617,
      header: '>gi|74031862|ref|NC_006599.2|NC_006599 Canis familiaris file 17, whole genome shotgun sequence'
    }, {
      file: 'chr18.fa',
      nucleotides: 58872314,
      header: '>gi|74032563|ref|NC_006600.2|NC_006600 Canis familiaris file 18, whole genome shotgun sequence'
    }, {
      file: 'chr19.fa',
      nucleotides: 56771304,
      header: '>gi|74032809|ref|NC_006601.2|NC_006601 Canis familiaris file 19, whole genome shotgun sequence'
    }, {
      file: 'chr20.fa',
      nucleotides: 61280721,
      header: '>gi|74033247|ref|NC_006602.2|NC_006602 Canis familiaris file 20, whole genome shotgun sequence'
    }, {
      file: 'chr21.fa',
      nucleotides: 54024781,
      header: '>gi|74033520|ref|NC_006603.2|NC_006603 Canis familiaris file 21, whole genome shotgun sequence'
    }, {
      file: 'chr22.fa',
      nucleotides: 64401119,
      header: '>gi|74033931|ref|NC_006604.2|NC_006604 Canis familiaris file 22, whole genome shotgun sequence'
    }, {
      file: 'chr23.fa',
      nucleotides: 55389570,
      header: '>gi|74034090|ref|NC_006605.2|NC_006605 Canis familiaris file 23, whole genome shotgun sequence'
    }, {
      file: 'chr24.fa',
      nucleotides: 50763139,
      header: '>gi|74034289|ref|NC_006606.2|NC_006606 Canis familiaris file 24, whole genome shotgun sequence'
    }, {
      file: 'chr25.fa',
      nucleotides: 54563659,
      header: '>gi|74034591|ref|NC_006607.2|NC_006607 Canis familiaris file 25, whole genome shotgun sequence'
    }, {
      file: 'chr26.fa',
      nucleotides: 42029645,
      header: '>gi|74034898|ref|NC_006608.2|NC_006608 Canis familiaris file 26, whole genome shotgun sequence'
    }, {
      file: 'chr27.fa',
      nucleotides: 48908698,
      header: '>gi|74035213|ref|NC_006609.2|NC_006609 Canis familiaris file 27, whole genome shotgun sequence'
    }, {
      file: 'chr28.fa',
      nucleotides: 44191819,
      header: '>gi|74035392|ref|NC_006610.2|NC_006610 Canis familiaris file 28, whole genome shotgun sequence'
    }, {
      file: 'chr29.fa',
      nucleotides: 44831629,
      header: '>gi|74035445|ref|NC_006611.2|NC_006611 Canis familiaris file 29, whole genome shotgun sequence'
    }, {
      file: 'chr30.fa',
      nucleotides: 43206070,
      header: '>gi|74035446|ref|NC_006612.2|NC_006612 Canis familiaris file 30, whole genome shotgun sequence'
    }, {
      file: 'chr31.fa',
      nucleotides: 42263495,
      header: '>gi|74035447|ref|NC_006613.2|NC_006613 Canis familiaris file 31, whole genome shotgun sequence'
    }, {
      file: 'chr32.fa',
      nucleotides: 41731424,
      header: '>gi|74035448|ref|NC_006614.2|NC_006614 Canis familiaris file 32, whole genome shotgun sequence'
    }, {
      file: 'chr33.fa',
      nucleotides: 34424479,
      header: '>gi|74035449|ref|NC_006615.2|NC_006615 Canis familiaris file 33, whole genome shotgun sequence'
    }, {
      file: 'chr34.fa',
      nucleotides: 45128234,
      header: '>gi|74035450|ref|NC_006616.2|NC_006616 Canis familiaris file 34, whole genome shotgun sequence'
    }, {
      file: 'chr35.fa',
      nucleotides: 29542582,
      header: '>gi|74035451|ref|NC_006617.2|NC_006617 Canis familiaris file 35, whole genome shotgun sequence'
    }, {
      file: 'chr36.fa',
      nucleotides: 33840356,
      header: '>gi|74035452|ref|NC_006618.2|NC_006618 Canis familiaris file 36, whole genome shotgun sequence'
    }, {
      file: 'chr37.fa',
      nucleotides: 33915115,
      header: '>gi|74035453|ref|NC_006619.2|NC_006619 Canis familiaris file 37, whole genome shotgun sequence'
    }, {
      file: 'chr38.fa',
      nucleotides: 26897727,
      header: '>gi|74035454|ref|NC_006620.2|NC_006620 Canis familiaris file 38, whole genome shotgun sequence'
    }, {
      file: 'chrX.fa',
      nucleotides: 126883977,
      header: '>gi|74035455|ref|NC_006621.2|NC_006621 Canis familiaris file X, whole genome shotgun sequence'
    }]
  };
  genomes[8] = {
    name: 'Equus caballus (Domestic horse)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 2367053447,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 185838109,
      header: '>gi|194246357|ref|NC_009144.2|NC_009144 Equus caballus file 1, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 120857687,
      header: '>gi|194246371|ref|NC_009145.2|NC_009145 Equus caballus file 2, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 119479920,
      header: '>gi|194246382|ref|NC_009146.2|NC_009146 Equus caballus file 3, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 108569075,
      header: '>gi|194246385|ref|NC_009147.2|NC_009147 Equus caballus file 4, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 99680356,
      header: '>gi|194246386|ref|NC_009148.2|NC_009148 Equus caballus file 5, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 84719076,
      header: '>gi|194246387|ref|NC_009149.2|NC_009149 Equus caballus file 6, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 98542428,
      header: '>gi|194246388|ref|NC_009150.2|NC_009150 Equus caballus file 7, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 94057673,
      header: '>gi|194246389|ref|NC_009151.2|NC_009151 Equus caballus file 8, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 83561422,
      header: '>gi|194246401|ref|NC_009152.2|NC_009152 Equus caballus file 9, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 83980604,
      header: '>gi|194246358|ref|NC_009153.2|NC_009153 Equus caballus file 10, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 61308211,
      header: '>gi|194246359|ref|NC_009154.2|NC_009154 Equus caballus file 11, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 33091231,
      header: '>gi|194246360|ref|NC_009155.2|NC_009155 Equus caballus file 12, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 42578167,
      header: '>gi|194246361|ref|NC_009156.2|NC_009156 Equus caballus file 13, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 93904894,
      header: '>gi|194246362|ref|NC_009157.2|NC_009157 Equus caballus file 14, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 91571448,
      header: '>gi|194246363|ref|NC_009158.2|NC_009158 Equus caballus file 15, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 87365405,
      header: '>gi|194246364|ref|NC_009159.2|NC_009159 Equus caballus file 16, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 80757907,
      header: '>gi|194246365|ref|NC_009160.2|NC_009160 Equus caballus file 17, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 82527541,
      header: '>gi|194246366|ref|NC_009161.2|NC_009161 Equus caballus file 18, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 59975221,
      header: '>gi|194246370|ref|NC_009162.2|NC_009162 Equus caballus file 19, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 64166202,
      header: '>gi|194246372|ref|NC_009163.2|NC_009163 Equus caballus file 20, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 57723302,
      header: '>gi|194246373|ref|NC_009164.2|NC_009164 Equus caballus file 21, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr22.fa',
      nucleotides: 49946797,
      header: '>gi|194246374|ref|NC_009165.2|NC_009165 Equus caballus file 22, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr23.fa',
      nucleotides: 55726280,
      header: '>gi|194246375|ref|NC_009166.2|NC_009166 Equus caballus file 23, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr24.fa',
      nucleotides: 46749900,
      header: '>gi|194246376|ref|NC_009167.2|NC_009167 Equus caballus file 24, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr25.fa',
      nucleotides: 39536964,
      header: '>gi|194246377|ref|NC_009168.2|NC_009168 Equus caballus file 25, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr26.fa',
      nucleotides: 41866177,
      header: '>gi|194246378|ref|NC_009169.2|NC_009169 Equus caballus file 26, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr27.fa',
      nucleotides: 39960074,
      header: '>gi|194246379|ref|NC_009170.2|NC_009170 Equus caballus file 27, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr28.fa',
      nucleotides: 46177339,
      header: '>gi|194246380|ref|NC_009171.2|NC_009171 Equus caballus file 28, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr29.fa',
      nucleotides: 33672925,
      header: '>gi|194246381|ref|NC_009172.2|NC_009172 Equus caballus file 29, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr30.fa',
      nucleotides: 30062385,
      header: '>gi|194246383|ref|NC_009173.2|NC_009173 Equus caballus file 30, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chr31.fa',
      nucleotides: 24984650,
      header: '>gi|194246384|ref|NC_009174.2|NC_009174 Equus caballus file 31, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 124114077,
      header: '>gi|194246402|ref|NC_009175.2|NC_009175 Equus caballus file X, reference assembly (based on EquCab2), whole genome shotgun sequence'
    }]
  };
  genomes[9] = {
    name: 'Danio rerio (Zebrafish)',
    version: 1,
    ncbiBuild: 3,
    nucleotides: 1277075233,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 56204684,
      header: '>gi|189908150|ref|NC_007112.3|NC_007112 Danio rerio file 1, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 54366722,
      header: '>gi|189908161|ref|NC_007113.3|NC_007113 Danio rerio file 2, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 62931207,
      header: '>gi|189908168|ref|NC_007114.3|NC_007114 Danio rerio file 3, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 42602441,
      header: '>gi|189908169|ref|NC_007115.3|NC_007115 Danio rerio file 4, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 70371393,
      header: '>gi|189908170|ref|NC_007116.3|NC_007116 Danio rerio file 5, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 59200669,
      header: '>gi|189908171|ref|NC_007117.3|NC_007117 Danio rerio file 6, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 70262009,
      header: '>gi|189908172|ref|NC_007118.3|NC_007118 Danio rerio file 7, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 56456705,
      header: '>gi|189908173|ref|NC_007119.3|NC_007119 Danio rerio file 8, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 51490918,
      header: '>gi|189908174|ref|NC_007120.3|NC_007120 Danio rerio file 9, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 42379582,
      header: '>gi|189908151|ref|NC_007121.3|NC_007121 Danio rerio file 10, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 44616367,
      header: '>gi|189908152|ref|NC_007122.3|NC_007122 Danio rerio file 11, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 47523734,
      header: '>gi|189908153|ref|NC_007123.3|NC_007123 Danio rerio file 12, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 53547397,
      header: '>gi|189908154|ref|NC_007124.3|NC_007124 Danio rerio file 13, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 56522864,
      header: '>gi|189908155|ref|NC_007125.3|NC_007125 Danio rerio file 14, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 46629432,
      header: '>gi|189908156|ref|NC_007126.3|NC_007126 Danio rerio file 15, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 53070661,
      header: '>gi|189908157|ref|NC_007127.3|NC_007127 Danio rerio file 16, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 52310423,
      header: '>gi|189908158|ref|NC_007128.3|NC_007128 Danio rerio file 17, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 49281368,
      header: '>gi|189908159|ref|NC_007129.3|NC_007129 Danio rerio file 18, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 46181231,
      header: '>gi|189908160|ref|NC_007130.3|NC_007130 Danio rerio file 19, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 56528676,
      header: '>gi|189908162|ref|NC_007131.3|NC_007131 Danio rerio file 20, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 46057314,
      header: '>gi|189908163|ref|NC_007132.3|NC_007132 Danio rerio file 21, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr22.fa',
      nucleotides: 38981829,
      header: '>gi|189908164|ref|NC_007133.3|NC_007133 Danio rerio file 22, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr23.fa',
      nucleotides: 46388020,
      header: '>gi|189908165|ref|NC_007134.3|NC_007134 Danio rerio file 23, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr24.fa',
      nucleotides: 40293347,
      header: '>gi|189908166|ref|NC_007135.3|NC_007135 Danio rerio file 24, reference assembly (based on Zv7)'
    }, {
      file: 'ref_chr25.fa',
      nucleotides: 32876240,
      header: '>gi|189908167|ref|NC_007136.3|NC_007136 Danio rerio file 25, reference assembly (based on Zv7)'
    }]
  };
  genomes[10] = {
    name: 'Gallus gallus (Chicken)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 1031883471,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 200994015,
      header: '>gi|118135635|ref|NC_006088.2|NC_006088 Gallus gallus file 1, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 154873767,
      header: '>gi|118135651|ref|NC_006089.2|NC_006089 Gallus gallus file 2, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 113657789,
      header: '>gi|118136266|ref|NC_006090.2|NC_006090 Gallus gallus file 3, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 94230402,
      header: '>gi|118136300|ref|NC_006091.2|NC_006091 Gallus gallus file 4, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 62238931,
      header: '>gi|118136304|ref|NC_006092.2|NC_006092 Gallus gallus file 5, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 37400442,
      header: '>gi|118136307|ref|NC_006093.2|NC_006093 Gallus gallus file 6, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 38384769,
      header: '>gi|118136308|ref|NC_006094.2|NC_006094 Gallus gallus file 7, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 30671729,
      header: '>gi|118136309|ref|NC_006095.2|NC_006095 Gallus gallus file 8, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 25554352,
      header: '>gi|118136310|ref|NC_006096.2|NC_006096 Gallus gallus file 9, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 22556432,
      header: '>gi|118135636|ref|NC_006097.2|NC_006097 Gallus gallus file 10, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 21928095,
      header: '>gi|118135637|ref|NC_006098.2|NC_006098 Gallus gallus file 11, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 20536687,
      header: '>gi|118135638|ref|NC_006099.2|NC_006099 Gallus gallus file 12, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 18911934,
      header: '>gi|118135639|ref|NC_006100.2|NC_006100 Gallus gallus file 13, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 15819469,
      header: '>gi|118135640|ref|NC_006101.2|NC_006101 Gallus gallus file 14, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 12968165,
      header: '>gi|118135641|ref|NC_006102.2|NC_006102 Gallus gallus file 15, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 432983,
      header: '>gi|118135642|ref|NC_006103.2|NC_006103 Gallus gallus file 16, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 11182526,
      header: '>gi|118135643|ref|NC_006104.2|NC_006104 Gallus gallus file 17, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 10925261,
      header: '>gi|118135644|ref|NC_006105.2|NC_006105 Gallus gallus file 18, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 9939723,
      header: '>gi|118135645|ref|NC_006106.2|NC_006106 Gallus gallus file 19, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 13986235,
      header: '>gi|118135652|ref|NC_006107.2|NC_006107 Gallus gallus file 20, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 6959642,
      header: '>gi|118135653|ref|NC_006108.2|NC_006108 Gallus gallus file 21, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr22.fa',
      nucleotides: 3936574,
      header: '>gi|118135654|ref|NC_006109.2|NC_006109 Gallus gallus file 22, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr23.fa',
      nucleotides: 6042217,
      header: '>gi|118135655|ref|NC_006110.2|NC_006110 Gallus gallus file 23, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr24.fa',
      nucleotides: 6400109,
      header: '>gi|118135656|ref|NC_006111.2|NC_006111 Gallus gallus file 24, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr25.fa',
      nucleotides: 2031799,
      header: '>gi|118135657|ref|NC_006112.1|NC_006112 Gallus gallus file 25, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr26.fa',
      nucleotides: 5102438,
      header: '>gi|118135660|ref|NC_006113.2|NC_006113 Gallus gallus file 26, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr27.fa',
      nucleotides: 4841970,
      header: '>gi|118135661|ref|NC_006114.2|NC_006114 Gallus gallus file 27, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr28.fa',
      nucleotides: 4512026,
      header: '>gi|118135662|ref|NC_006115.2|NC_006115 Gallus gallus file 28, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chr32.fa',
      nucleotides: 1028,
      header: '>gi|118136271|ref|NC_006119.2|NC_006119 Gallus gallus file 32, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chrW.fa',
      nucleotides: 259642,
      header: '>gi|118136311|ref|NC_006126.2|NC_006126 Gallus gallus file W, reference assembly (based on Gallus_gallus-2.1)'
    }, {
      file: 'ref_chrZ.fa',
      nucleotides: 74602320,
      header: '>gi|118136399|ref|NC_006127.2|NC_006127 Gallus gallus file Z, reference assembly (based on Gallus_gallus-2.1)'
    }]
  };
  genomes[11] = {
    name: 'Taeniopygia guttata (Zebra finch)',
    version: 1,
    ncbiBuild: 1,
    nucleotides: 1018092713,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 118548696,
      header: '>gi|224381666|ref|NC_011462.1|NC_011462 Taeniopygia guttata file 1, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr1A.fa',
      nucleotides: 73657157,
      header: '>gi|224381677|ref|NC_011463.1|NC_011463 Taeniopygia guttata file 1A, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr1B.fa',
      nucleotides: 1083483,
      header: '>gi|224381678|ref|NC_011464.1|NC_011464 Taeniopygia guttata file 1B, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 156412533,
      header: '>gi|224381679|ref|NC_011465.1|NC_011465 Taeniopygia guttata file 2, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 112617285,
      header: '>gi|224381689|ref|NC_011466.1|NC_011466 Taeniopygia guttata file 3, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 69780378,
      header: '>gi|224381690|ref|NC_011467.1|NC_011467 Taeniopygia guttata file 4, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4A.fa',
      nucleotides: 20704505,
      header: '>gi|224381691|ref|NC_011468.1|NC_011468 Taeniopygia guttata file 4A, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 62374962,
      header: '>gi|224381692|ref|NC_011469.1|NC_011469 Taeniopygia guttata file 5, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 36305782,
      header: '>gi|224381693|ref|NC_011470.1|NC_011470 Taeniopygia guttata file 6, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 39844632,
      header: '>gi|224381694|ref|NC_011471.1|NC_011471 Taeniopygia guttata file 7, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 27993427,
      header: '>gi|224381695|ref|NC_011472.1|NC_011472 Taeniopygia guttata file 8, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 27241186,
      header: '>gi|224381696|ref|NC_011473.1|NC_011473 Taeniopygia guttata file 9, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 20806668,
      header: '>gi|224381667|ref|NC_011474.1|NC_011474 Taeniopygia guttata file 10, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 21403021,
      header: '>gi|224381668|ref|NC_011475.1|NC_011475 Taeniopygia guttata file 11, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 21576510,
      header: '>gi|224381669|ref|NC_011476.1|NC_011476 Taeniopygia guttata file 12, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 16962381,
      header: '>gi|224381670|ref|NC_011477.1|NC_011477 Taeniopygia guttata file 13, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 16419078,
      header: '>gi|224381671|ref|NC_011478.1|NC_011478 Taeniopygia guttata file 14, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 14428146,
      header: '>gi|224381672|ref|NC_011479.1|NC_011479 Taeniopygia guttata file 15, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 9909,
      header: '>gi|224381673|ref|NC_011480.1|NC_011480 Taeniopygia guttata file 16, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 11648728,
      header: '>gi|224381674|ref|NC_011481.1|NC_011481 Taeniopygia guttata file 17, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 11201131,
      header: '>gi|224381675|ref|NC_011482.1|NC_011482 Taeniopygia guttata file 18, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 11587733,
      header: '>gi|224381676|ref|NC_011483.1|NC_011483 Taeniopygia guttata file 19, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 15652063,
      header: '>gi|224381680|ref|NC_011484.1|NC_011484 Taeniopygia guttata file 20, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr21.fa',
      nucleotides: 5979137,
      header: '>gi|224381681|ref|NC_011485.1|NC_011485 Taeniopygia guttata file 21, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr23.fa',
      nucleotides: 6196912,
      header: '>gi|224381683|ref|NC_011487.1|NC_011487 Taeniopygia guttata file 23, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr24.fa',
      nucleotides: 8021379,
      header: '>gi|224381684|ref|NC_011488.1|NC_011488 Taeniopygia guttata file 24, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr25.fa',
      nucleotides: 1275379,
      header: '>gi|224381685|ref|NC_011489.1|NC_011489 Taeniopygia guttata file 25, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr26.fa',
      nucleotides: 4907541,
      header: '>gi|224381686|ref|NC_011490.1|NC_011490 Taeniopygia guttata file 26, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr27.fa',
      nucleotides: 4618897,
      header: '>gi|224381687|ref|NC_011491.1|NC_011491 Taeniopygia guttata file 27, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chr28.fa',
      nucleotides: 4963201,
      header: '>gi|224381688|ref|NC_011492.1|NC_011492 Taeniopygia guttata file 28, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG2.fa',
      nucleotides: 109741,
      header: '>gi|224381697|ref|NC_011494.1|NC_011494 Taeniopygia guttata linkage group 2, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG5.fa',
      nucleotides: 16416,
      header: '>gi|224381698|ref|NC_011495.1|NC_011495 Taeniopygia guttata linkage group 5, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLGE22.fa',
      nucleotides: 883365,
      header: '>gi|224381699|ref|NC_011496.1|NC_011496 Taeniopygia guttata linkage group E22, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }, {
      file: 'ref_chrZ.fa',
      nucleotides: 72861351,
      header: '>gi|224381700|ref|NC_011493.1|NC_011493 Taeniopygia guttata file Z, reference assembly (based on Taeniopygia_guttata-3.2.4), whole genome shotgun sequence'
    }]
  };
  genomes[12] = {
    name: 'Sus scrofa (Pig)',
    version: 1,
    ncbiBuild: 1,
    nucleotides: 813033904,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 177460299,
      header: '>gi|194205400|ref|NC_010443.1|NC_010443 Sus scrofa file 1, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 111786804,
      header: '>gi|194205409|ref|NC_010446.1|NC_010446 Sus scrofa file 4, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 38802061,
      header: '>gi|194205410|ref|NC_010447.1|NC_010447 Sus scrofa file 5, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 122252946,
      header: '>gi|194205411|ref|NC_010449.1|NC_010449 Sus scrofa file 7, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 46391861,
      header: '>gi|194205401|ref|NC_010453.1|NC_010453 Sus scrofa file 11, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 46930118,
      header: '>gi|194205402|ref|NC_010455.1|NC_010455 Sus scrofa file 13, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 138397758,
      header: '>gi|194205403|ref|NC_010456.1|NC_010456 Sus scrofa file 14, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 47414199,
      header: '>gi|194205407|ref|NC_010457.1|NC_010457 Sus scrofa file 15, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 41100826,
      header: '>gi|194205408|ref|NC_010459.1|NC_010459 Sus scrofa file 17, reference assembly (based on Sscrofa5), complete sequence'
    }, {
      file: 'ref_chrX.fa',
      nucleotides: 42497032,
      header: '>gi|194205412|ref|NC_010461.1|NC_010461 Sus scrofa file X, reference assembly (based on Sscrofa5), complete sequence'
    }]
  };
  genomes[13] = {
    name: 'Ornithorhynchus anatinus (Platypus)',
    version: 1,
    ncbiBuild: 1,
    nucleotides: 437080024,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 47594283,
      header: '>gi|149712631|ref|NC_009094.1|NC_009094 Ornithorhynchus anatinus file 1, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 54797317,
      header: '>gi|149721824|ref|NC_009095.1|NC_009095 Ornithorhynchus anatinus file 2, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 59581953,
      header: '>gi|149725021|ref|NC_009096.1|NC_009096 Ornithorhynchus anatinus file 3, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 58987262,
      header: '>gi|149727112|ref|NC_009097.1|NC_009097 Ornithorhynchus anatinus file 4, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 24609220,
      header: '>gi|149728214|ref|NC_009098.1|NC_009098 Ornithorhynchus anatinus file 5, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 16302927,
      header: '>gi|149729612|ref|NC_009099.1|NC_009099 Ornithorhynchus anatinus file 6, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 40039088,
      header: '>gi|149731469|ref|NC_009100.1|NC_009100 Ornithorhynchus anatinus file 7, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 11243762,
      header: '>gi|149714148|ref|NC_009103.1|NC_009103 Ornithorhynchus anatinus file 10, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 6809224,
      header: '>gi|149715145|ref|NC_009104.1|NC_009104 Ornithorhynchus anatinus file 11, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 15872666,
      header: '>gi|149716377|ref|NC_009105.1|NC_009105 Ornithorhynchus anatinus file 12, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 2696122,
      header: '>gi|149716935|ref|NC_009107.1|NC_009107 Ornithorhynchus anatinus file 14, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 3786880,
      header: '>gi|149717714|ref|NC_009108.1|NC_009108 Ornithorhynchus anatinus file 15, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 1399469,
      header: '>gi|149717939|ref|NC_009110.1|NC_009110 Ornithorhynchus anatinus file 17, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 6611290,
      header: '>gi|149719225|ref|NC_009111.1|NC_009111 Ornithorhynchus anatinus file 18, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chr20.fa',
      nucleotides: 1816412,
      header: '>gi|149722085|ref|NC_009112.1|NC_009112 Ornithorhynchus anatinus file 20, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX1.fa',
      nucleotides: 45541551,
      header: '>gi|149737093|ref|NC_009114.1|NC_009114 Ornithorhynchus anatinus file X1, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX2.fa',
      nucleotides: 5652501,
      header: '>gi|149737330|ref|NC_009115.1|NC_009115 Ornithorhynchus anatinus file X2, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX3.fa',
      nucleotides: 5951358,
      header: '>gi|149737646|ref|NC_009116.1|NC_009116 Ornithorhynchus anatinus file X3, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }, {
      file: 'ref_chrX5.fa',
      nucleotides: 27786739,
      header: '>gi|149742078|ref|NC_009118.1|NC_009118 Ornithorhynchus anatinus file X5, reference assembly (based on Ornithorhynchus_anatinus-5.0.1), whole genome shotgun sequence'
    }]
  };
  genomes[14] = {
    name: 'Vitis vinifera (Grape)',
    version: 1,
    ncbiBuild: 1,
    nucleotides: 303085820,
    files: [{
      file: 'ref_chr1.fa',
      nucleotides: 15630816,
      header: '>gi|225570623|ref|NC_012007.2|NC_012007 Vitis vinifera file 1, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr2.fa',
      nucleotides: 17603400,
      header: '>gi|225571691|ref|NC_012008.2|NC_012008 Vitis vinifera file 2, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr3.fa',
      nucleotides: 10186927,
      header: '>gi|225571692|ref|NC_012009.2|NC_012009 Vitis vinifera file 3, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr4.fa',
      nucleotides: 19293076,
      header: '>gi|225571701|ref|NC_012010.2|NC_012010 Vitis vinifera file 4, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr5.fa',
      nucleotides: 23428299,
      header: '>gi|225571790|ref|NC_012011.2|NC_012011 Vitis vinifera file 5, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr6.fa',
      nucleotides: 24148918,
      header: '>gi|225571805|ref|NC_012012.2|NC_012012 Vitis vinifera file 6, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr7.fa',
      nucleotides: 15233747,
      header: '>gi|225571812|ref|NC_012013.2|NC_012013 Vitis vinifera file 7, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr8.fa',
      nucleotides: 21557227,
      header: '>gi|225571813|ref|NC_012014.2|NC_012014 Vitis vinifera file 8, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr9.fa',
      nucleotides: 16532244,
      header: '>gi|225571814|ref|NC_012015.2|NC_012015 Vitis vinifera file 9, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr10.fa',
      nucleotides: 9647040,
      header: '>gi|225570624|ref|NC_012016.2|NC_012016 Vitis vinifera file 10, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr11.fa',
      nucleotides: 13936303,
      header: '>gi|225570997|ref|NC_012017.2|NC_012017 Vitis vinifera file 11, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr12.fa',
      nucleotides: 18540817,
      header: '>gi|225570998|ref|NC_012018.2|NC_012018 Vitis vinifera file 12, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr13.fa',
      nucleotides: 15191948,
      header: '>gi|225570999|ref|NC_012019.2|NC_012019 Vitis vinifera file 13, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr14.fa',
      nucleotides: 19480434,
      header: '>gi|225571000|ref|NC_012020.2|NC_012020 Vitis vinifera file 14, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr15.fa',
      nucleotides: 7693613,
      header: '>gi|225571001|ref|NC_012021.2|NC_012021 Vitis vinifera file 15, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr16.fa',
      nucleotides: 8158851,
      header: '>gi|225571002|ref|NC_012022.2|NC_012022 Vitis vinifera file 16, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr17.fa',
      nucleotides: 13059092,
      header: '>gi|225571114|ref|NC_012023.2|NC_012023 Vitis vinifera file 17, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr18.fa',
      nucleotides: 19691255,
      header: '>gi|225571115|ref|NC_012024.2|NC_012024 Vitis vinifera file 18, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }, {
      file: 'ref_chr19.fa',
      nucleotides: 14071813,
      header: '>gi|225571116|ref|NC_012025.2|NC_012025 Vitis vinifera file 19, reference assembly (based on 8x_WGS), whole genome shotgun sequence'
    }]
  };
  genomes[15] = {
    name: 'Apis mellifera (Honey bee)',
    version: 1,
    ncbiBuild: 4,
    nucleotides: 217194876,
    files: [{
      file: 'ref_chrLG1.fa',
      nucleotides: 29934090,
      header: '>gi|110825701|ref|NC_007070.2|NC_007070 Apis mellifera linkage group 1, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG2.fa',
      nucleotides: 16072177,
      header: '>gi|110825766|ref|NC_007071.2|NC_007071 Apis mellifera linkage group 2, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG3.fa',
      nucleotides: 13621520,
      header: '>gi|110825767|ref|NC_007072.2|NC_007072 Apis mellifera linkage group 3, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG4.fa',
      nucleotides: 12256690,
      header: '>gi|110825768|ref|NC_007073.2|NC_007073 Apis mellifera linkage group 4, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG5.fa',
      nucleotides: 14500692,
      header: '>gi|110825769|ref|NC_007074.2|NC_007074 Apis mellifera linkage group 5, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG6.fa',
      nucleotides: 17739083,
      header: '>gi|110825770|ref|NC_007075.2|NC_007075 Apis mellifera linkage group 6, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG7.fa',
      nucleotides: 12848973,
      header: '>gi|110825771|ref|NC_007076.2|NC_007076 Apis mellifera linkage group 7, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG8.fa',
      nucleotides: 13189223,
      header: '>gi|110825772|ref|NC_007077.2|NC_007077 Apis mellifera linkage group 8, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG9.fa',
      nucleotides: 11082907,
      header: '>gi|110825774|ref|NC_007078.2|NC_007078 Apis mellifera linkage group 9, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG10.fa',
      nucleotides: 12642577,
      header: '>gi|110825711|ref|NC_007079.2|NC_007079 Apis mellifera linkage group 10, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG11.fa',
      nucleotides: 14521977,
      header: '>gi|110825732|ref|NC_007080.2|NC_007080 Apis mellifera linkage group 11, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG12.fa',
      nucleotides: 11309010,
      header: '>gi|110825756|ref|NC_007081.2|NC_007081 Apis mellifera linkage group 12, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG13.fa',
      nucleotides: 10266737,
      header: '>gi|110825762|ref|NC_007082.2|NC_007082 Apis mellifera linkage group 13, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG14.fa',
      nucleotides: 9976661,
      header: '>gi|110825763|ref|NC_007083.2|NC_007083 Apis mellifera linkage group 14, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG15.fa',
      nucleotides: 10159687,
      header: '>gi|110825764|ref|NC_007084.2|NC_007084 Apis mellifera linkage group 15, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG16.fa',
      nucleotides: 7072872,
      header: '>gi|110825765|ref|NC_007085.2|NC_007085 Apis mellifera linkage group 16, reference assembly (based on Amel_4.0), whole genome shotgun sequence'
    }]
  };
  genomes[16] = {
    name: 'Tribolium castaneum (Red flour beetle)',
    version: 1,
    ncbiBuild: 2,
    nucleotides: 187494969,
    files: [{
      file: 'ref_chrLG1=X.fa',
      nucleotides: 10877635,
      header: '>gi|189313712|ref|NC_007416.2|NC_007416 Tribolium castaneum linkage group 1=X, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG2.fa',
      nucleotides: 20218415,
      header: '>gi|189313713|ref|NC_007417.2|NC_007417 Tribolium castaneum linkage group 2, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG3.fa',
      nucleotides: 38791480,
      header: '>gi|189313714|ref|NC_007418.2|NC_007418 Tribolium castaneum linkage group 3, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG4.fa',
      nucleotides: 13894384,
      header: '>gi|91192192|ref|NC_007419.1|NC_007419 Tribolium castaneum linkage group 4, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG5.fa',
      nucleotides: 19135781,
      header: '>gi|189313715|ref|NC_007420.2|NC_007420 Tribolium castaneum linkage group 5, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG6.fa',
      nucleotides: 13176827,
      header: '>gi|189313716|ref|NC_007421.2|NC_007421 Tribolium castaneum linkage group 6, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG7.fa',
      nucleotides: 20532854,
      header: '>gi|189313717|ref|NC_007422.2|NC_007422 Tribolium castaneum linkage group 7, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG8.fa',
      nucleotides: 18021898,
      header: '>gi|189313718|ref|NC_007423.2|NC_007423 Tribolium castaneum linkage group 8, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG9.fa',
      nucleotides: 21459655,
      header: '>gi|189313719|ref|NC_007424.2|NC_007424 Tribolium castaneum linkage group 9, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }, {
      file: 'ref_chrLG10.fa',
      nucleotides: 11386040,
      header: '>gi|189313711|ref|NC_007425.2|NC_007425 Tribolium castaneum linkage group 10, reference assembly (based on Tcas_3.0), whole genome shotgun sequence'
    }]
  };

  // Add a comma every 3 digits, e.g. turn 11386040 into 11,386,040.
  var d3 = /(\d+)(\d{3})/;
  function addCommas(n)
  {
    var s = n.toString();
    while (d3.test(s)) s = s.replace(d3, '$1' + ',' + '$2');
    return s;
  }

  // Construct the accordion section of a genome
  function section(g) {
    var trs = new Array(g.files.length);
    g.files.forEach(function(f, i) {
      trs[i] = '<tr><td>' + i + '</td><td><a href="genomes/' + g.name + '/' + f.file + '">' + f.file + '</a></td><td>' + f.header + '</td><td style="text-align: right">' + addCommas(f.nucleotides) + '</td></tr>';
    });
    return '<h3><a href="#">' + g.name + ' v' + g.version + '.' + g.ncbiBuild + ' : ' + addCommas(g.nucleotides) + ' nucleotides in ' + g.files.length + ' files</a></h3><div><table class="table"><thead><tr><th>Index</th><th>File</th><th>Header</th><th>Nucleotides</th></tr></thead><tbody>' + trs.join('') + '</tbody></table></div>';
  }

  // Apply accordion to genomes
  var sections = new Array(genomes.length);
  genomes.forEach(function(g, i) {
    sections[i] = section(g);
  });
  $('#genomes').html(sections.join('')).accordion({
    collapsible: true,
    active: false,
    autoHeight: false
  });
});
