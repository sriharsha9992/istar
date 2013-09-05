$(function () {
	var iv = new iview('iview');
	var path = '/idock/jobs/' + location.search.substr(1) + '/';
	$.get(path + 'box.conf', function (b) {
	$.get(path + 'protein.pdbqt', function (p) {
	$.get(path + 'ligands.pdbqt', function (l) {
		iv.parseBox(b);
		iv.parseProtein(p);
		iv.parseLigand(l);
		iv.rebuildScene();
		iv.resetView();
	});
	});
	});

	['camera', 'background', 'effect', 'colorProteinBy', 'protein', 'ligand', 'surface', 'opacity', 'wireframe'].forEach(function (opt) {
		$('#' + opt).click(function (e) {
			var options = {};
			options[opt] = e.target.innerText;
			iv.rebuildScene(options);
			iv.render();
		})
	});

	$('#exportView').click(function (e) {
		e.preventDefault();
		iv.exportView();
	})
});
