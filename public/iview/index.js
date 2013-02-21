$(function () {
	var iv = new iview('iview');
	$.get('2ZD1.pdb', function (src) {
		iv.loadReceptor(src);
	});
	$('#loadPDB').change(function () {
		$.get('http://www.pdb.org/pdb/files/' + $(this).val() + '.pdb', function (src) {
			iv.loadReceptor(src);
		});
	});

	['camera', 'background', 'colorBy', 'primaryStructure', 'secondaryStructure', 'surface', 'opacity', 'wireframe', 'ligands', 'waters', 'ions', 'effect'].forEach(function (opt) {
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
