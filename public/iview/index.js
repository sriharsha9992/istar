$(function () {
	var iv = new iview('iview');
	$.get('4TMN_protein.pdbqt', function (p) {
	$.get('4TMN_ligand.pdbqt', function (l) {
		iv.loadProteinInPDBQT(p);
		iv.loadLigandInPDBQT(l);
		iv.rebuildScene();
		iv.resetView();
	});
	});

	['camera', 'background', 'colorBy', 'solvents', 'protein', 'surface', 'opacity', 'wireframe', 'ligand', 'effect'].forEach(function (opt) {
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
