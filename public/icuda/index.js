$(function() {
	$('img').lazyload({
//		event: 'expand',
		effect: 'fadeIn',
	});
	var style = function (lang) {
		return $.extend({
			style: 'typical',
			menu: false,
		}, lang === 'sh' ? {showNum: false} : undefined);
	};
	$('pre[id]').each(function (index, pre) {
		$.get('cudart/' + pre.id, function (src) {
			var lang = pre.id.match(/.(cu|h)$/) ? 'cpp' : pre.id.match(/Makefile$/) ? 'makefile' : 'sh';
			$(pre).append($('<div/>').text(src).html()).snippet(lang, style(lang));
		});
	});;
	$('pre[class]').each(function () {
		var me = $(this);
		var lang = me.attr('class');
		me.snippet(lang, style(lang));
	});
});
