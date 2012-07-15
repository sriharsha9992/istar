$(function () {
  $('#submit').click(function () {
    // Post a new job without client side validation
    $.post('jobs', {
	  genome: $('#genome').val(),
	  query: $('#query').val()
	}, function (res) {
      // If server side validation fails, show the tooltips
      if (res != undefined) {
        return;
      }
      // Save email into cookie
      $.cookie('email', $('#email').val(), { expires: 7 });
    }, 'json');
    return false;  // Prevent default postback.
  });
});
