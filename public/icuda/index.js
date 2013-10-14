$(function() {
	$('img').lazyload({
//		event: 'expand',
		effect: 'fadeIn',
	});
	$('pre.sh').snippet('sh', {
		style: 'typical',
		showNum: false,
		menu: false,
	});
	$('pre.makefile').snippet('makefile', {
		style: 'typical',
		showNum: true,
		menu: false,
	});
	$('pre.cpp').snippet('cpp', {
		style: 'typical',
		showNum: true,
		menu: false,
	});
});
