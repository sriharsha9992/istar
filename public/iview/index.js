$(function () {
	var hits = $('#hits');
	hits.html(['ZINC01234568', 'ZINC01234569', 'ZINC01234566', 'ZINC01234567'].map(function(id) {
		return '<label class="btn btn-primary"><input type="radio">' + id + '</label>';
	}).join(''));
	$(':first', hits).addClass('active');
	$('> .btn', hits).click(function(e) {
		alert(e.currentTarget.innerText);
	});
	var iv = new iview('iview');
	var path = '/idock/jobs/' + location.search.substr(1) + '/';
	$.get(path + 'box.conf', function (box) {
		iv.parseBox(box);
		$.get(path + 'receptor.pdbqt', function (protein) {
			iv.parseProtein(protein);
			$.ajax({
				url: path + 'hits.pdbqt.gz',
				mimeType: 'application/octet-stream; charset=x-user-defined',
			}).done(function (hits_gz_str) {
				// Convert hits_gz_str to hits_gz_raw
				var hits_gz_raw = new Uint8Array(hits_gz_str.length);
				for (var i = 0, l = hits_gz_str.length; i < l; ++i) {
					hits_gz_raw[i] = hits_gz_str.charCodeAt(i);
				}
				// Gunzip hits_gz_raw to hits_raw
				var hits_raw = new Zlib.Gunzip(hits_gz_raw).decompress();
				// Convert hits_raw to hits_str
				var hits_str = '';
				for (var i = 0, l = hits_raw.length; i < l; ++i) {
					hits_str += String.fromCharCode(hits_raw[i]);
				}
				iv.parseLigand(hits_str);
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
