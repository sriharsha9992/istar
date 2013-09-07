$(function () {
	var iv = new iview('iview');
	var path = '/idock/jobs/' + location.search.substr(1) + '/';
	$.get(path + 'box.conf', function (b) {
		iv.parseBox(b);
		$.get(path + 'receptor.pdbqt', function (p) {
			iv.parseProtein(p);
			$.ajax({
				url: path + 'hits.pdbqt.gz',
				mimeType: 'application/octet-stream; charset=x-user-defined',
			}).done(function (data) {
				var uint = new Uint8Array(data.length);
				for (var i = 0, j = data.length; i < j; ++i) {
					uint[i] = data.charCodeAt(i);
				}
				iv.parseLigand(String.fromCharCode.apply(null, new Zlib.Gunzip(uint).decompress()));
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

	$('#exportCanvas').click(function (e) {
		e.preventDefault();
		iv.exportCanvas();
	})
});
