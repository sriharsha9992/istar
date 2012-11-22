$(function() {
	var iv = new iview({
		id: 'iview',
		refresh: function() {
			$('#conformation').html(iv.save());
			$('#nhbonds').html(iv.hbonds.length);
			var hblis = [];
			for (var i = 0, ii = iv.hbonds.length; i < ii; ++i) {
				var hb = iv.hbonds[i];
				hblis.push('<li>' + hb.a1.id + ' - ' + hb.a2.id + '</li>');
			}
			$('#hbonds').html(hblis.join(''));
			$('#eNormalized').html(iv.ligand.eNormalized.toFixed(3));
			$('#eInter').html(iv.ligand.eInter.toFixed(3));
			$('#efficiency').html(iv.ligand.efficiency.toFixed(3));
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
			$('#atoms').html(iv.ligand.atoms.length);
			$('#hatoms').html(iv.ligand.nHeavyAtoms);
			$('#mwt').html(iv.ligand.mwt);
			$('#nrb').html(iv.ligand.frames.length - 1);
			$('#hbds').html(iv.ligand.hbds.length);
			$('#hbas').html(iv.ligand.hbas.length);
			$('#flexPenalty').html(iv.ligand.flexPenalty.toFixed(3));
			iv.repaint();
			$('#export').click(function(e) {
				e.preventDefault();
				iv.export();
			});
			$('#dock').click(function(e) {
				e.preventDefault();
				iv.dock();
			});
		});
	});
});
