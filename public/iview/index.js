$(function() {
	var iv = new iview({
		id: 'iview',
		refresh: function() {
			$('#nhbonds').html(iv.hbonds.length);
			var hblis = [];
			for (var i = 0, ii = iv.hbonds.length; i < ii; ++i) {
				var hb = iv.hbonds[i];
				hblis.push('<li>' + hb.a1.id + ' - ' + hb.a2.id + '</li>');
			}
			$('#hbonds').html(hblis.join(''));
			$('#fe').html(iv.ligand.fe.toFixed(3));
			var felis = [];
			for (var i = 0, ii = iv.ligand.atoms.length; i < ii; ++i) {
				var a = iv.ligand.atoms[i];
				if (a.isHydrogen()) continue;
				felis.push('<li>' + a.id + ': ' + a.fe.toFixed(3) + '</li>');
			}
			$('#fes').html(felis.join(''));
		}
	});
	if (iv.disabled) {
		$('#demo').html('Your browser does not support HTML5 canvas.');
		return;
	}
	$.get('receptor.pdbqt', function(receptor) {
		iv.setBox([49.712, -28.923, 36.824], [18, 18, 20]);
		iv.parseReceptor(receptor);
		$.get('ligand.pdbqt', function(ligand) {
			iv.parseLigand(ligand);
			iv.repaint();
			$('#export').click(function() {
				iv.export();
			});
			$('#save').click(function() {
				var conf = iv.save();
				alert(conf);
			});
			$('#dock').click(function() {
				iv.dock();
			});
		});
	});
});
