$(function() {
	var iv = new iview({
		id: 'iview',
		refresh: function() {
			$('#conformation').html(iv.save());
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
