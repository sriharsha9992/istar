$(function () {
	var iv = new iview('iview');
	$.get('4TMN_protein.pdbqt', function (p) {
	$.get('4TMN_ligand.pdbqt', function (l) {
	    iv.parseProtein(p);
		iv.parseLigand(l);
		iv.rebuildScene();
		iv.resetView();
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

	['resetView', 'exportView'].forEach(function (func) {
		$('#' + func).click(function (e) {
			e.preventDefault();
			iv[func]();
		})
	});
});
