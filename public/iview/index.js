$(function() {
	var iv = new iview('iview');
	iv.defineRepresentation = function () {
		var all = this.getAllAtoms();
		this.colorByAtom(all, {});
		//this.colorChainbow(all); // Color by spectrum
		//this.colorByStructure(all, 0xcc00cc, 0x00cccc); // Color by secondary structure
		this.colorByChain(all);
		//this.colorByBFactor(all);
		//this.colorByPolarity(all, 0xcc0000, 0xcccccc);

		var asu = new THREE.Object3D();
		var doNotSmoothen = false; // Don't smoothen beta-sheets in ribbons
		this.drawCartoon(asu, all, doNotSmoothen, this.thickness); // thick ribbon			
		//this.drawCartoon(asu, all, doNotSmoothen); // thin ribbon			
		//this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen); // strand			
		//this.drawMainchainCurve(asu, all, this.curveWidth, 'CA', 1); // C alpha trace
		//this.drawMainchainCurve(asu, all, this.curveWidth, 'O3\'', 1);			
		//this.drawHelixAsCylinder(asu, all, 1.6); // cylinder & plate			
		//this.drawMainchainTube(asu, all, 'CA'); // B factor Tube
		//this.drawMainchainTube(asu, all, 'O3\''); // FIXME: 5' end problem!			
		//this.drawBondsAsLine(asu, all, this.lineWidth); // bonds (everything)

		//this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);

		var target = this.modelGroup;
		var allHet = this.getHetatms(all);
		var hetatm = this.removeSolvents(allHet);
		this.drawBondsAsStick(target, hetatm, this.cylinderRadius, this.cylinderRadius, true);
		//this.drawAtomsAsSphere(target, hetatm, this.sphereRadius);
		//this.drawBondsAsLine(target, hetatm, this.curveWidth);
		//this.drawAtomsAsIcosahedron(target, hetatm, this.sphereRadius);
		//this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, false, 0.3); // ballAndStick
		//this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, true, 0.3); // ballAndStick (multiple bond)

		// Show non-bonded atoms (solvent/ions) as spheres
		var nonBonded = this.getNonbonded(allHet);
		this.drawAtomsAsIcosahedron(target, nonBonded, 0.3, true);

		this.setBackground(parseInt('0xffffff')); // white
		//this.setBackground(parseInt('0x000000')); // black
		//this.setBackground(parseInt('0x888888')); // grey

		this.modelGroup.add(asu);
	};
	$.get('http://www.pdb.org/pdb/files/3g71.pdb', function (pdb) {
		iv.loadMolecule(pdb);
	});

	function loadFile() {
		var file = $('#file').get(0);
		if (file) file = file.files;
		if (!file || !window.FileReader || !file[0]) {
			alert("No file is selected. Or File API is not supported in your browser. Please try Firefox or Chrome.");
			return;
		}
		var reader = new FileReader();
		reader.onload = function () {
			iv.loadMolecule(reader.result);
		};
		reader.readAsText(file[0]);
	}
		
	function resetView() {
		iv.resetView();
	}

	function saveImage() {
		iv.show();
		window.open(iv.renderer.domElement.toDataURL('image/png'));
	}

	function reload() { // Apply new settings
		iv.rebuildScene();
		iv.show();
	}
});
