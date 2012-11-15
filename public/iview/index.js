$(function() {
	var iv = new iview({
		id: 'iview',
		ligandmove: function(hbonds) {
			$('#nhbonds').html(hbonds.length);
			var lis = [];
			for (var i = 0, ii = hbonds.length; i < ii; ++i) {
				var hb = hbonds[i];
				lis.push('<li>' + hb.a1.id + ' - ' + hb.a2.id + '</li>');
			}
			$('#hbonds').html(lis.join(''));
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
				iv.png();
			});
		});
	});
});
