$(function () {
	var vdwRadii = { // Hu, S.Z.; Zhou, Z.H.; Tsai, K.R. Acta Phys.-Chim. Sin., 2003, 19:1073.
		 H: 1.08,
		HE: 1.34,
		LI: 1.75,
		BE: 2.05,
		 B: 1.47,
		 C: 1.49,
		 N: 1.41,
		 O: 1.40,
		 F: 1.39,
		NE: 1.68,
		NA: 1.84,
		MG: 2.05,
		AL: 2.11,
		SI: 2.07,
		 P: 1.92,
		 S: 1.82,
		CL: 1.83,
		AR: 1.93,
		 K: 2.05,
		CA: 2.21,
		SC: 2.16,
		TI: 1.87,
		 V: 1.79,
		CR: 1.89,
		MN: 1.97,
		FE: 1.94,
		CO: 1.92,
		NI: 1.84,
		CU: 1.86,
		ZN: 2.10,
		GA: 2.08,
		GE: 2.15,
		AS: 2.06,
		SE: 1.93,
		BR: 1.98,
		KR: 2.12,
		RB: 2.16,
		SR: 2.24,
		 Y: 2.19,
		ZR: 1.86,
		NB: 2.07,
		MO: 2.09,
		TC: 2.09,
		RU: 2.07,
		RH: 1.95,
		PD: 2.02,
		AG: 2.03,
		CD: 2.30,
		IN: 2.36,
		SN: 2.33,
		SB: 2.25,
		TE: 2.23,
		 I: 2.23,
		XE: 2.21,
		CS: 2.22,
		BA: 2.51,
		LA: 2.40,
		CE: 2.35,
		PR: 2.39,
		ND: 2.29,
		PM: 2.36,
		SM: 2.29,
		EU: 2.33,
		GD: 2.37,
		TB: 2.21,
		DY: 2.29,
		HO: 2.16,
		ER: 2.35,
		TM: 2.27,
		YB: 2.42,
		LU: 2.21,
		HF: 2.12,
		TA: 2.17,
		 W: 2.10,
		RE: 2.17,
		OS: 2.16,
		IR: 2.02,
		PT: 2.09,
		AU: 2.17,
		HG: 2.09,
		TL: 2.35,
		PB: 2.32,
		BI: 2.43,
		PO: 2.29,
		AT: 2.36,
		RN: 2.43,
		FR: 2.56,
		RA: 2.43,
		AC: 2.60,
		TH: 2.37,
		PA: 2.43,
		 U: 2.40,
		NP: 2.21,
		PU: 2.56,
		AM: 2.56,
		CM: 2.56,
		BK: 2.56,
		CF: 2.56,
		ES: 2.56,
		FM: 2.56,
	};
	var covalentRadii = { // http://en.wikipedia.org/wiki/Covalent_radius
		 H: 0.31,
		HE: 0.28,
		LI: 1.28,
		BE: 0.96,
		 B: 0.84,
		 C: 0.76,
		 N: 0.71,
		 O: 0.66,
		 F: 0.57,
		NE: 0.58,
		NA: 1.66,
		MG: 1.41,
		AL: 1.21,
		SI: 1.11,
		 P: 1.07,
		 S: 1.05,
		CL: 1.02,
		AR: 1.06,
		 K: 2.03,
		CA: 1.76,
		SC: 1.70,
		TI: 1.60,
		 V: 1.53,
		CR: 1.39,
		MN: 1.39,
		FE: 1.32,
		CO: 1.26,
		NI: 1.24,
		CU: 1.32,
		ZN: 1.22,
		GA: 1.22,
		GE: 1.20,
		AS: 1.19,
		SE: 1.20,
		BR: 1.20,
		KR: 1.16,
		RB: 2.20,
		SR: 1.95,
		 Y: 1.90,
		ZR: 1.75,
		NB: 1.64,
		MO: 1.54,
		TC: 1.47,
		RU: 1.46,
		RH: 1.42,
		PD: 1.39,
		AG: 1.45,
		CD: 1.44,
		IN: 1.42,
		SN: 1.39,
		SB: 1.39,
		TE: 1.38,
		 I: 1.39,
		XE: 1.40,
		CS: 2.44,
		BA: 2.15,
		LA: 2.07,
		CE: 2.04,
		PR: 2.03,
		ND: 2.01,
		PM: 1.99,
		SM: 1.98,
		EU: 1.98,
		GD: 1.96,
		TB: 1.94,
		DY: 1.92,
		HO: 1.92,
		ER: 1.89,
		TM: 1.90,
		YB: 1.87,
		LU: 1.87,
		HF: 1.75,
		TA: 1.70,
		 W: 1.62,
		RE: 1.51,
		OS: 1.44,
		IR: 1.41,
		PT: 1.36,
		AU: 1.36,
		HG: 1.32,
		TL: 1.45,
		PB: 1.46,
		BI: 1.48,
		PO: 1.40,
		AT: 1.50,
		RN: 1.50,
		FR: 2.60,
		RA: 2.21,
		AC: 2.15,
		TH: 2.06,
		PA: 2.00,
		 U: 1.96,
		NP: 1.90,
		PU: 1.87,
		AM: 1.80,
		CM: 1.69,
	};
	var atomColors = { // http://jmol.sourceforge.net/jscolors
		 H: new THREE.Color(0xFFFFFF),
		HE: new THREE.Color(0xD9FFFF),
		LI: new THREE.Color(0xCC80FF),
		BE: new THREE.Color(0xC2FF00),
		 B: new THREE.Color(0xFFB5B5),
		 C: new THREE.Color(0x909090),
		 N: new THREE.Color(0x3050F8),
		 O: new THREE.Color(0xFF0D0D),
		 F: new THREE.Color(0x90E050),
		NE: new THREE.Color(0xB3E3F5),
		NA: new THREE.Color(0xAB5CF2),
		MG: new THREE.Color(0x8AFF00),
		AL: new THREE.Color(0xBFA6A6),
		SI: new THREE.Color(0xF0C8A0),
		 P: new THREE.Color(0xFF8000),
		 S: new THREE.Color(0xFFFF30),
		CL: new THREE.Color(0x1FF01F),
		AR: new THREE.Color(0x80D1E3),
		 K: new THREE.Color(0x8F40D4),
		CA: new THREE.Color(0x3DFF00),
		SC: new THREE.Color(0xE6E6E6),
		TI: new THREE.Color(0xBFC2C7),
		 V: new THREE.Color(0xA6A6AB),
		CR: new THREE.Color(0x8A99C7),
		MN: new THREE.Color(0x9C7AC7),
		FE: new THREE.Color(0xE06633),
		CO: new THREE.Color(0xF090A0),
		NI: new THREE.Color(0x50D050),
		CU: new THREE.Color(0xC88033),
		ZN: new THREE.Color(0x7D80B0),
		GA: new THREE.Color(0xC28F8F),
		GE: new THREE.Color(0x668F8F),
		AS: new THREE.Color(0xBD80E3),
		SE: new THREE.Color(0xFFA100),
		BR: new THREE.Color(0xA62929),
		KR: new THREE.Color(0x5CB8D1),
		RB: new THREE.Color(0x702EB0),
		SR: new THREE.Color(0x00FF00),
		 Y: new THREE.Color(0x94FFFF),
		ZR: new THREE.Color(0x94E0E0),
		NB: new THREE.Color(0x73C2C9),
		MO: new THREE.Color(0x54B5B5),
		TC: new THREE.Color(0x3B9E9E),
		RU: new THREE.Color(0x248F8F),
		RH: new THREE.Color(0x0A7D8C),
		PD: new THREE.Color(0x006985),
		AG: new THREE.Color(0xC0C0C0),
		CD: new THREE.Color(0xFFD98F),
		IN: new THREE.Color(0xA67573),
		SN: new THREE.Color(0x668080),
		SB: new THREE.Color(0x9E63B5),
		TE: new THREE.Color(0xD47A00),
		 I: new THREE.Color(0x940094),
		XE: new THREE.Color(0x429EB0),
		CS: new THREE.Color(0x57178F),
		BA: new THREE.Color(0x00C900),
		LA: new THREE.Color(0x70D4FF),
		CE: new THREE.Color(0xFFFFC7),
		PR: new THREE.Color(0xD9FFC7),
		ND: new THREE.Color(0xC7FFC7),
		PM: new THREE.Color(0xA3FFC7),
		SM: new THREE.Color(0x8FFFC7),
		EU: new THREE.Color(0x61FFC7),
		GD: new THREE.Color(0x45FFC7),
		TB: new THREE.Color(0x30FFC7),
		DY: new THREE.Color(0x1FFFC7),
		HO: new THREE.Color(0x00FF9C),
		ER: new THREE.Color(0x00E675),
		TM: new THREE.Color(0x00D452),
		YB: new THREE.Color(0x00BF38),
		LU: new THREE.Color(0x00AB24),
		HF: new THREE.Color(0x4DC2FF),
		TA: new THREE.Color(0x4DA6FF),
		 W: new THREE.Color(0x2194D6),
		RE: new THREE.Color(0x267DAB),
		OS: new THREE.Color(0x266696),
		IR: new THREE.Color(0x175487),
		PT: new THREE.Color(0xD0D0E0),
		AU: new THREE.Color(0xFFD123),
		HG: new THREE.Color(0xB8B8D0),
		TL: new THREE.Color(0xA6544D),
		PB: new THREE.Color(0x575961),
		BI: new THREE.Color(0x9E4FB5),
		PO: new THREE.Color(0xAB5C00),
		AT: new THREE.Color(0x754F45),
		RN: new THREE.Color(0x428296),
		FR: new THREE.Color(0x420066),
		RA: new THREE.Color(0x007D00),
		AC: new THREE.Color(0x70ABFA),
		TH: new THREE.Color(0x00BAFF),
		PA: new THREE.Color(0x00A1FF),
		 U: new THREE.Color(0x008FFF),
		NP: new THREE.Color(0x0080FF),
		PU: new THREE.Color(0x006BFF),
		AM: new THREE.Color(0x545CF2),
		CM: new THREE.Color(0x785CE3),
		BK: new THREE.Color(0x8A4FE3),
		CF: new THREE.Color(0xA136D4),
		ES: new THREE.Color(0xB31FD4),
		FM: new THREE.Color(0xB31FBA),
	};
	var defaultAtomColor = new THREE.Color(0xCCCCCC);
	var stdChainColors = {
		A: new THREE.Color(0xC0D0FF),
		B: new THREE.Color(0xB0FFB0),
		C: new THREE.Color(0xFFC0C8),
		D: new THREE.Color(0xFFFF80),
		E: new THREE.Color(0xFFC0FF),
		F: new THREE.Color(0xB0F0F0),
		G: new THREE.Color(0xFFD070),
		H: new THREE.Color(0xF08080),
		I: new THREE.Color(0xF5DEB3),
		J: new THREE.Color(0x00BFFF),
		K: new THREE.Color(0xCD5C5C),
		L: new THREE.Color(0x66CDAA),
		M: new THREE.Color(0x9ACD32),
		N: new THREE.Color(0xEE82EE),
		O: new THREE.Color(0x00CED1),
		P: new THREE.Color(0x00FF7F),
		Q: new THREE.Color(0x3CB371),
		R: new THREE.Color(0x00008B),
		S: new THREE.Color(0xBDB76B),
		T: new THREE.Color(0x006400),
		U: new THREE.Color(0x800000),
		V: new THREE.Color(0x808000),
		W: new THREE.Color(0x800080),
		X: new THREE.Color(0x008080),
		Y: new THREE.Color(0xB8860B),
		Z: new THREE.Color(0xB22222),
	};
	var hetChainColors = {
		A: new THREE.Color(0x90A0CF),
		B: new THREE.Color(0x80CF98),
		C: new THREE.Color(0xCF90B0),
		D: new THREE.Color(0xCFCF70),
		E: new THREE.Color(0xCF90CF),
		F: new THREE.Color(0x80C0C0),
		G: new THREE.Color(0xCFA060),
		H: new THREE.Color(0xC05070),
		I: new THREE.Color(0xC5AE83),
		J: new THREE.Color(0x00A7CF),
		K: new THREE.Color(0xB54C4C),
		L: new THREE.Color(0x56B592),
		M: new THREE.Color(0x8AB52A),
		N: new THREE.Color(0xBE72BE),
		O: new THREE.Color(0x00B6A1),
		P: new THREE.Color(0x00CF6F),
		Q: new THREE.Color(0x349B61),
		R: new THREE.Color(0x0000BB),
		S: new THREE.Color(0xA59F5B),
		T: new THREE.Color(0x009400),
		U: new THREE.Color(0xB00000),
		V: new THREE.Color(0xB0B000),
		W: new THREE.Color(0xB000B0),
		X: new THREE.Color(0x00B0B0),
		Y: new THREE.Color(0xE8B613),
		Z: new THREE.Color(0xC23232),
	};
	var container = $('#iview');
	var renderer = new THREE.WebGLRenderer({
		canvas: container.get(0),
		antialias: true,
	});
	var effects = {
		'anaglyph': new THREE.AnaglyphEffect(renderer),
		'parallax barrier': new THREE.ParallaxBarrierEffect(renderer),
		'none': renderer,
	};
	var effect;

	var CAMERA_Z = -150;
	var perspectiveCamera = new THREE.PerspectiveCamera(20, container.width() / container.height(), 1, 800);
	perspectiveCamera.position = new THREE.Vector3(0, 0, CAMERA_Z);
	perspectiveCamera.lookAt(new THREE.Vector3(0, 0, 0));
	var orthographicCamera = new THREE.OrthographicCamera();
	orthographicCamera.position = new THREE.Vector3(0, 0, CAMERA_Z);
	orthographicCamera.lookAt(new THREE.Vector3(0, 0, 0));
	var cameras = {
		 perspective: perspectiveCamera,
		orthographic: orthographicCamera,
	};
	var camera = perspectiveCamera;
	var slabNear = -50; // relative to the center of rotationGroup
	var slabFar  = +50;

	// Default values
	var sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
	var cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 64, 1);
	var sphereRadius = 1.5;
	var cylinderRadius = 0.4;
	var lineWidth = 1.5;
	var fov = 20;
	var backgroundColors = {
		black: new THREE.Color(0x000000),
		 grey: new THREE.Color(0xCCCCCC),
		white: new THREE.Color(0xFFFFFF),
	};
	var residueColors = {
		ALA: new THREE.Color(0xC8C8C8),
		ARG: new THREE.Color(0x145AFF),
		ASN: new THREE.Color(0x00DCDC),
		ASP: new THREE.Color(0xE60A0A),
		CYS: new THREE.Color(0xE6E600),
		GLN: new THREE.Color(0x00DCDC),
		GLU: new THREE.Color(0xE60A0A),
		GLY: new THREE.Color(0xEBEBEB),
		HIS: new THREE.Color(0x8282D2),
		ILE: new THREE.Color(0x0F820F),
		LEU: new THREE.Color(0x0F820F),
		LYS: new THREE.Color(0x145AFF),
		MET: new THREE.Color(0xE6E600),
		PHE: new THREE.Color(0x3232AA),
		PRO: new THREE.Color(0xDC9682),
		SER: new THREE.Color(0xFA9600),
		THR: new THREE.Color(0xFA9600),
		TRP: new THREE.Color(0xB45AB4),
		TYR: new THREE.Color(0x3232AA),
		VAL: new THREE.Color(0x0F820F),
		ASX: new THREE.Color(0xFF69B4),
		GLX: new THREE.Color(0xFF69B4),
	};
	var defaultResidueColor = new THREE.Color(0xBEA06E);
	var polarColor = new THREE.Color(0xCC0000);
	var nonpolarColor = new THREE.Color(0x00CCCC);
	var polarityColors = {
		ARG: polarColor,
		HIS: polarColor,
		LYS: polarColor,
		ASP: polarColor,
		GLU: polarColor,
		SER: polarColor,
		THR: polarColor,
		ASN: polarColor,
		GLN: polarColor,
		TYR: polarColor,
		GLY: nonpolarColor,
		PRO: nonpolarColor,
		ALA: nonpolarColor,
		VAL: nonpolarColor,
		LEU: nonpolarColor,
		ILE: nonpolarColor,
		MET: nonpolarColor,
		PHE: nonpolarColor,
		CYS: nonpolarColor,
		TRP: nonpolarColor,
	};
	var proteinObjects = {}, ligandObjects = {};
	['line', 'stick', 'ball and stick', 'sphere'].forEach(function(key) {
		proteinObjects[key] = new THREE.Object3D();
		ligandObjects[key] = new THREE.Object3D();
	});
	var surfaces = {
		1: undefined,
		2: undefined,
		3: undefined,
		4: undefined,
	};
	var options = {};
	['camera', 'background', 'effect', 'colorProteinBy', 'protein', 'ligand', 'surface', 'opacity', 'wireframe'].forEach(function(key) {
		options[key] = $('#' + key + ' .active')[0].innerText;
	});
	var elemMapInPDBQT = {
		HD: 'H',
		A : 'C',
		NA: 'N',
		OA: 'O',
		SA: 'S',
	};
	var isDragging, mouseButton, mouseStartX, mouseStartY, cq, cz, cp, cslabNear, cslabFar;
	var scene, modelGroup, rotationGroup, options;
	var protein, ligand, stdAtoms, hetAtoms;
	var middB, spanB, spanBinv;

	$('body').bind('mouseup touchend', function (ev) {
		isDragging = false;
	});
	container.bind('contextmenu', function (ev) {
		ev.preventDefault();
	});
	container.bind('mousedown touchstart', function (ev) {
		ev.preventDefault();
		if (!scene) return;
		var x = ev.pageX, y = ev.pageY;
		if (ev.originalEvent.targetTouches && ev.originalEvent.targetTouches[0]) {
			x = ev.originalEvent.targetTouches[0].pageX;
			y = ev.originalEvent.targetTouches[0].pageY;
		}
		if (x === undefined) return;
		isDragging = true;
		mouseButton = ev.which;
		mouseStartX = x;
		mouseStartY = y;
		cq = rotationGroup.quaternion;
		cz = rotationGroup.position.z;
		cp = modelGroup.position.clone();
		cslabNear = slabNear;
		cslabFar = slabFar;
	});
	container.bind('DOMMouseScroll mousewheel', function (e) { // Zoom
		e.preventDefault();
		if (!scene) return;
		var scaleFactor = (rotationGroup.position.z - CAMERA_Z) * 0.85;
		if (e.originalEvent.detail) { // Webkit
			rotationGroup.position.z += scaleFactor * e.originalEvent.detail * 0.1;
		} else if (e.originalEvent.wheelDelta) { // Firefox
			rotationGroup.position.z -= scaleFactor * e.originalEvent.wheelDelta * 0.0025;
		}
		render();
	});
	container.bind('mousemove touchmove', function (e) {
		e.preventDefault();
		if (!scene) return;
		if (!isDragging) return;
		var x = e.pageX, y = e.pageY;
		if (e.originalEvent.targetTouches && e.originalEvent.targetTouches[0]) {
			x = e.originalEvent.targetTouches[0].pageX;
			y = e.originalEvent.targetTouches[0].pageY;
		}
		if (x === undefined) return;
		var dx = (x - mouseStartX) / container.width();
		var dy = (y - mouseStartY) / container.height();
		if (!dx && !dy) return;
		if (mouseButton == 3 && e.shiftKey) { // Slab
			slabNear = cslabNear + dx * 100;
			slabFar = cslabFar + dy * 100;
		} else if (mouseButton == 3) { // Translate
			var scaleFactor = (rotationGroup.position.z - CAMERA_Z) * 0.85;
			if (scaleFactor < 20) scaleFactor = 20;
			modelGroup.position = cp.clone().add(new THREE.Vector3(-dx * scaleFactor, -dy * scaleFactor, 0).applyQuaternion(rotationGroup.quaternion.clone().inverse().normalize()));
		} else if (mouseButton == 2) { // Zoom
			var scaleFactor = (rotationGroup.position.z - CAMERA_Z) * 0.85;
			if (scaleFactor < 80) scaleFactor = 80;
			rotationGroup.position.z = cz - dy * scaleFactor;
		} else if (mouseButton == 1) { // Rotate
			var r = Math.sqrt(dx * dx + dy * dy);
			var rs = Math.sin(r * Math.PI) / r;
			rotationGroup.quaternion = new THREE.Quaternion(1, 0, 0, 0).multiply(new THREE.Quaternion(Math.cos(r * Math.PI), 0, rs * dx, rs * dy)).multiply(cq);
		}
		render();
	});

	hasCovalentBond = function (atom1, atom2) {
		var r = covalentRadii[atom1.elem] + covalentRadii[atom2.elem];
		return atom1.coord.distanceToSquared(atom2.coord) < 1.2 * r * r;
	}

	drawSphere = function (obj, atom, defaultRadius, forceDefault, scale) {
		var sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshLambertMaterial({ color: atom.color }));
		sphere.scale.x = sphere.scale.y = sphere.scale.z = forceDefault ? defaultRadius : (vdwRadii[atom.elem] || defaultRadius) * (scale ? scale : 1);
		sphere.position = atom.coord;
		obj.add(sphere);
	};

	drawAtomsAsSphere = function (obj, atoms, defaultRadius, forceDefault, scale) {
		if (obj.children.length) {
			var o = 0;
			for (var i in atoms) {
				var sphere = obj.children[o++];
				sphere.__webglActive = undefined;
				sphere.material.color = atoms[i].color;
			}
		} else {
			for (var i in atoms) {
				drawSphere(obj, atoms[i], defaultRadius, forceDefault, scale);
			}
		}
	};

	drawCylinder = function (obj, p1, p2, radius, color) {
		var cylinder = new THREE.Mesh(cylinderGeometry, new THREE.MeshLambertMaterial({ color: color }));
		cylinder.position = p1.clone().add(p2).multiplyScalar(0.5);
		cylinder.matrixAutoUpdate = false;
		cylinder.lookAt(p1);
		cylinder.updateMatrix();
		cylinder.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p1.distanceTo(p2))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
		obj.add(cylinder);
	};

	drawBondsAsStick = function (obj, atoms, bondR, atomR, scale) {
		if (obj.children.length) {
			var o = 0;
			for (var i in atoms) {
				var atom1 = atoms[i];
				for (var j in atom1.bonds) {
					var atom2 = atoms[atom1.bonds[j]];
					if (atom2.serial < atom1.serial) continue;
					obj.children[o].__webglActive = undefined;
					obj.children[o++].material.color = atom1.color;
					obj.children[o].__webglActive = undefined;
					obj.children[o++].material.color = atom2.color;
				}
				obj.children[o].__webglActive = undefined;
				obj.children[o++].material.color = atom1.color;
			}
		} else {
			for (var i in atoms) {
				var atom1 = atoms[i];
				for (var j in atom1.bonds) {
					var atom2 = atoms[atom1.bonds[j]];
					if (atom2.serial < atom1.serial) continue;
					var mp = atom1.coord.clone().add(atom2.coord).multiplyScalar(0.5);
					drawCylinder(obj, atom1.coord, mp, bondR, atom1.color);
					drawCylinder(obj, atom2.coord, mp, bondR, atom2.color);
				}
				drawSphere(obj, atom1, atomR, !scale, scale);
			}
		}
	};

	drawBondsAsLine = function (obj, atoms) {
		if (obj.children.length) {
			obj.children[0].__webglActive = undefined;
			obj.children[0].geometry.colorsNeedUpdate = true;
			var colors = obj.children[0].geometry.colors;
			var ib = 0, ia = 1;
			for (var i in atoms) {
				var atom1 = atoms[i];
				for (var j in atom1.bonds) {
					var atom2 = atoms[atom1.bonds[j]];
					if (atom2.serial < atom1.serial) continue;
					colors[ib++] = atom1.color;
					colors[ib++] = atom1.color;
					colors[ib++] = atom2.color;
					colors[ib++] = atom2.color;
				}
				if (atom1.solvent) {
					var mesh = obj.children[ia++];
					mesh.__webglActive = undefined;
					mesh.material.color = atom1.color;
				}
			}
		}
		else {
			obj.add(new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({ linewidth: lineWidth, vertexColors: true }), THREE.LinePieces));
			var geo = obj.children[0].geometry;
			for (var i in atoms) {
				var atom1 = atoms[i];
				for (var j in atom1.bonds) {
					var atom2 = atoms[atom1.bonds[j]];
					if (atom2.serial < atom1.serial) continue;
					var mp = atom1.coord.clone().add(atom2.coord).multiplyScalar(0.5);
					geo.vertices.push(atom1.coord);
					geo.vertices.push(mp);
					geo.vertices.push(atom2.coord);
					geo.vertices.push(mp);
					geo.colors.push(atom1.color);
					geo.colors.push(atom1.color);
					geo.colors.push(atom2.color);
					geo.colors.push(atom2.color);
				}
				if (atom1.solvent) {
					drawSphere(obj, atom1, sphereRadius, false, 0.2);
				}
			}
		}
	};

	drawDashedLine = function (obj, p1, p2, color) {
		var geo = new THREE.Geometry();
		geo.vertices.push(p1);
		geo.vertices.push(p2);
		geo.computeLineDistances();
		obj.add(new THREE.Line(geo, new THREE.LineDashedMaterial({ 'color': color, dashSize: 0.25, gapSize: 0.125 })));
	};

	colorByElement = function (atoms) {
		for (var i in atoms) {
			var atom = atoms[i];
			atom.color = atomColors[atom.elem] || defaultAtomColor;
		}
	}

	rebuildScene = function (new_options) {
		scene = new THREE.Scene();

		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
		directionalLight.position = new THREE.Vector3(0.2, 0.2, -1).normalize();
		var ambientLight = new THREE.AmbientLight(0x202020);
		scene.add(directionalLight);
		scene.add(ambientLight);

		var mp = modelGroup ? modelGroup.position : new THREE.Vector3();
		var rz = rotationGroup ? rotationGroup.position.z : 0;
		var rq = rotationGroup ? rotationGroup.quaternion : new THREE.Quaternion();
		modelGroup = new THREE.Object3D();
		modelGroup.position = mp;
		rotationGroup = new THREE.Object3D();
		rotationGroup.position.z = rz;
		rotationGroup.quaternion = rq;
		rotationGroup.add(modelGroup);
		scene.add(rotationGroup);

		$.extend(options, new_options);
		camera = cameras[options.camera];

		var background = backgroundColors[options.background];
		renderer.setClearColor(background);
		scene.fog = new THREE.Fog(background, 100, 200);

		switch (options.colorProteinBy) {
			case 'spectrum':
				var idx = 0;
				for (var i in stdAtoms) {
					var atom = stdAtoms[i];
					atom.color = new THREE.Color().setHSL(2 / 3 * (1 - idx++ / stdAtoms.length), 1, 0.45);
				}
				colorByElement(hetAtoms);
				break;
			case 'chain':
				for (var i in stdAtoms) {
					var atom = stdAtoms[i];
					atom.color = stdChainColors[atom.chain];
				}
				for (var i in hetAtoms) {
					var atom = hetAtoms[i];
					atom.color = hetChainColors[atom.chain];
				}
				break;
			case 'B factor':
				if (!middB) {
					var minB = 1000, maxB = -1000;
					for (var i in protein) {
						var atom = protein[i];
						if (minB > atom.b) minB = atom.b;
						if (maxB < atom.b) maxB = atom.b;
					}
					middB = (maxB + minB) * 0.5;
					spanB = (maxB - minB) * 0.5;
					spanBinv = 1.0 / spanB;
				}
				for (var i in protein) {
					var atom = protein[i];
					atom.color = atom.b < middB ? new THREE.Color().setRGB(1 - (s = (middB - atom.b) * spanBinv), 1 - s, 1) : new THREE.Color().setRGB(1, 1 - (s = (atom.b - middB) * spanBinv), 1 - s);
				}
				break;
			case 'residue':
				for (var i in stdAtoms) {
					var atom = stdAtoms[i];
					atom.color = residueColors[atom.resn] || defaultResidueColor;
				}
				colorByElement(hetAtoms);
				break;
			case 'polarity':
				for (var i in stdAtoms) {
					var atom = stdAtoms[i];
					atom.color = polarityColors[atom.resn] || defaultResidueColor;
				}
				colorByElement(hetAtoms);
				break;
			case 'atom':
				colorByElement(protein);
				break;
		}

		colorByElement(ligand);

		var proteinObj = proteinObjects[options.protein];
		switch (options.protein) {
			case 'line':
				drawBondsAsLine(proteinObj, protein);
				break;
			case 'stick':
				drawBondsAsStick(proteinObj, protein, cylinderRadius, cylinderRadius);
				break;
			case 'ball and stick':
				drawBondsAsStick(proteinObj, protein, cylinderRadius * 0.5, cylinderRadius);
				break;
			case 'sphere':
				drawAtomsAsSphere(proteinObj, protein, sphereRadius);
				break;
		}
		modelGroup.add(proteinObj);

		var ligandObj = ligandObjects[options.ligand];
		switch (options.ligand) {
			case 'line':
				drawBondsAsLine(ligandObj, ligand);
				break;
			case 'stick':
				drawBondsAsStick(ligandObj, ligand, cylinderRadius, cylinderRadius);
				break;
			case 'ball and stick':
				drawBondsAsStick(ligandObj, ligand, cylinderRadius * 0.5, cylinderRadius);
				break;
			case 'sphere':
				drawAtomsAsSphere(ligandObj, ligand, sphereRadius);
				break;
		}
		modelGroup.add(ligandObj);

		options.opacity = parseFloat(options.opacity);

		switch (options.wireframe) {
			case 'yes':
				options.wireframe = true;
				break;
			case 'no':
				options.wireframe = false;
				break;
		}

		switch (options.surface) {
			case 'vdw surface':
				drawSurface(stdAtoms, 1, options.wireframe, options.opacity);
				break;
			case 'solvent excluded surface':
				drawSurface(stdAtoms, 2, options.wireframe, options.opacity);
				break;
			case 'solvent accessible surface':
				drawSurface(stdAtoms, 3, options.wireframe, options.opacity);
				break;
			case 'molecular surface':
				drawSurface(stdAtoms, 4, options.wireframe, options.opacity);
				break;
		}

		effect = effects[options.effect];
		effect.setSize(container.width(), container.height());
	};

	parseBox = function (src) {
	};

	parseProtein = function (src) {
		protein = [];
		var lines = src.split('\n');
		for (var i in lines) {
			var line = lines[i];
			var record = line.substr(0, 6);
			if (record === 'ATOM  ' || record === 'HETATM') {
				if (!(line[16] === ' ' || line[16] === 'A')) continue;
				var atom = {
					het: record[0] === 'H',
					serial: parseInt(line.substr(6, 5)),
					name: line.substr(12, 4).replace(/ /g, ''),
					resn: line.substr(17, 3),
					chain: line.substr(21, 1),
					resi: parseInt(line.substr(22, 4)),
					insc: line.substr(26, 1),
					coord: new THREE.Vector3(parseFloat(line.substr(30, 8)), parseFloat(line.substr(38, 8)), parseFloat(line.substr(46, 8))),
					b: parseFloat(line.substr(60, 8)),
					elem: line.substr(76, 2).replace(/ /g, '').toUpperCase(),
					bonds: [],
				};
				var elem = elemMapInPDBQT[atom.elem];
				if (elem) atom.elem = elem;
				if (atom.elem === 'H') continue;
				protein[atom.serial] = atom;
			}
		}
		var curChain, curResi, curInsc, curResAtoms = [];
		for (var i in protein) {
			var atom = protein[i];
			if (!(curChain == atom.chain && curResi == atom.resi && curInsc == atom.insc)) {
				for (var j in curResAtoms) {
					var from = protein[curResAtoms[j]];
					for (var k in curResAtoms) {
						if (j == k) continue;
						var to = protein[curResAtoms[k]];
						if (hasCovalentBond(from, to)) {
							from.bonds.push(to.serial);
						}
					}
					if (from.name === 'C' && atom.name === 'N' && hasCovalentBond(from, atom)) {
						from.bonds.push(atom.serial);
						atom.bonds.push(from.serial);
					}
				}
				curChain = atom.chain;
				curResi = atom.resi;
				curInsc = atom.insc;
				curResAtoms.length = 0;
			}
			curResAtoms.push(atom.serial);
		}
		for (var j in curResAtoms) {
			var from = protein[curResAtoms[j]];
			for (var k in curResAtoms) {
				if (j == k) continue;
				var to = protein[curResAtoms[k]];
				if (hasCovalentBond(from, to)) {
					from.bonds.push(to.serial);
				}
			}
		}
		var serials = Object.keys(protein), std = serials.length;
		while (--std >= 0) {
			if (!protein[serials[std]].het) break;
		}
		stdAtoms = [];
		for (var i = 0; i <= std; ++i) {
			var serial = serials[i];
			var atom = protein[serial];
			stdAtoms[serial] = atom;
		}
		hetAtoms = [];
		for (var i = std + 1; i < serials.length; ++i) {
			var serial = serials[i];
			var atom = protein[serial];
			hetAtoms[atom.serial] = atom;
			if ((protein[serial - 1] === undefined || protein[serial - 1].resi !== atom.resi) && (protein[serial + 1] === undefined || protein[serial + 1].resi !== atom.resi)) {
				atom.solvent = true;
			}
		}
	};

	parseLigand = function (src) {
		ligand = [];
		var lines = src.split('\n'), rotors = [], start_ligand = true, start_frame;
		for (var i in lines) {
			var line = lines[i];
			var record = line.substr(0, 6);
			if (start_ligand)
			{
				if (record === 'REMARK') {
					start_ligand = false;
				}
				continue;
			}
			if (record === 'ATOM  ' || record === 'HETATM') {
				var atom = {
					serial: parseInt(line.substr(6, 5)),
					coord: new THREE.Vector3(parseFloat(line.substr(30, 8)), parseFloat(line.substr(38, 8)), parseFloat(line.substr(46, 8))),
					elem: line.substr(77, 2).replace(/ /g, '').toUpperCase(),
					bonds: [],
				};
				var elem = elemMapInPDBQT[atom.elem];
				if (elem) atom.elem = elem;
				if (start_frame === undefined) start_frame = atom.serial;
				for (var j = start_frame; j < atom.serial; ++j) {
					var a = ligand[j];
					if (a && hasCovalentBond(a, atom)) {
						a.bonds.push(atom.serial);
						atom.bonds.push(a.serial);
					}
				}
				ligand[atom.serial] = atom;
			} else if (record === 'BRANCH') {
				rotors.push({
					x: parseInt(line.substr( 6, 4)),
					y: parseInt(line.substr(10, 4)),
				});
				start_frame = undefined;
			} else if (record === 'TORSDO') {
				start_ligand = true;
				break;
			}
		}
		for (var i in rotors) {
			var r = rotors[i];
			ligand[r.x].bonds.push(r.y);
			ligand[r.y].bonds.push(r.x);
		}
	};

	render = function () {
		var center = rotationGroup.position.z - camera.position.z;
		if (center < 1) center = 1;
		camera.near = center + slabNear;
		if (camera.near < 1) camera.near = 1;
		camera.far = center + slabFar;
		if (camera.near + 1 > camera.far) camera.far = camera.near + 1;
		if (camera instanceof THREE.PerspectiveCamera) {
			camera.fov = fov;
		} else {
			camera.right = center * Math.tan(Math.PI / 180 * fov);
			camera.left = -camera.right;
			camera.top = camera.right / (container.width() / container.height());
			camera.bottom = -camera.top;
		}
		camera.updateProjectionMatrix();
		scene.fog.near = camera.near + 0.4 * (camera.far - camera.near);
//		if (scene.fog.near > center) scene.fog.near = center;
		scene.fog.far = camera.far;
		effect.render(scene, camera);
		if (!effect.init) {
			effect.render(scene, camera);
			effect.init = true;
		}
	};

	resetView = function () {
		var xmin = ymin = zmin =  9999;
		var xmax = ymax = zmax = -9999;
		for (var i in protein) {
			var atom = protein[i];
			if (atom.coord.x < xmin) xmin = atom.coord.x;
			if (atom.coord.y < ymin) ymin = atom.coord.y;
			if (atom.coord.z < zmin) zmin = atom.coord.z;
			if (atom.coord.x > xmax) xmax = atom.coord.x;
			if (atom.coord.y > ymax) ymax = atom.coord.y;
			if (atom.coord.z > zmax) zmax = atom.coord.z;
		}
		var maxD = new THREE.Vector3(xmax, ymax, zmax).distanceTo(new THREE.Vector3(xmin, ymin, zmin));
		slabNear = -maxD / 1.9;
		slabFar = maxD / 3;
		rotationGroup.position.z = maxD * 0.08 / Math.tan(Math.PI / 180.0 * camera.fov * 0.5) - 150;
		rotationGroup.quaternion = new THREE.Quaternion(1, 0, 0, 0);
		var xsum = ysum = zsum = cnt = 0;
		for (var i in ligand) {
			var atom = ligand[i];
			xsum += atom.coord.x;
			ysum += atom.coord.y;
			zsum += atom.coord.z;
			++cnt;
		}
		modelGroup.position = new THREE.Vector3(xsum, ysum, zsum).multiplyScalar(-1 / cnt);
		render();
	};

	drawSurface = function (atoms, type, wireframe, opacity) {
		if (!surfaces[type]) {
			var ps = new ProteinSurface();
			ps.initparm(getExtent(atoms), (type == 1) ? false : true);
			ps.fillvoxels(atoms);
			ps.buildboundary();
			if (type == 4 || type == 2) ps.fastdistancemap();
			if (type == 2) { ps.boundingatom(false); ps.fillvoxelswaals(atoms); }
			ps.marchingcube(type);
			ps.laplaciansmooth(1);
			ps.transformVertices();
			surfaces[type] = ps;
		}
		var mesh = new THREE.Mesh(surfaces[type].getModel(atoms), new THREE.MeshLambertMaterial({
			vertexColors: THREE.VertexColors,
			wireframe: wireframe,
			opacity: opacity,
			transparent: true,
		}));
		mesh.doubleSided = true;
		modelGroup.add(mesh);
	};

	getExtent = function (atoms) {
		var xmin = ymin = zmin = 9999;
		var xmax = ymax = zmax = -9999;
		var xsum = ysum = zsum = cnt = 0;
		for (var i in atoms) {
			var atom = atoms[i];
			cnt++;
			xsum += atom.coord.x;
			ysum += atom.coord.y;
			zsum += atom.coord.z;
			xmin = (xmin < atom.coord.x) ? xmin : atom.coord.x;
			ymin = (ymin < atom.coord.y) ? ymin : atom.coord.y;
			zmin = (zmin < atom.coord.z) ? zmin : atom.coord.z;
			xmax = (xmax > atom.coord.x) ? xmax : atom.coord.x;
			ymax = (ymax > atom.coord.y) ? ymax : atom.coord.y;
			zmax = (zmax > atom.coord.z) ? zmax : atom.coord.z;
		}
		return [[xmin, ymin, zmin], [xmax, ymax, zmax], [xsum / cnt, ysum / cnt, zsum / cnt]];
	};

	var hits = $('#hits');
	hits.html(['ZINC01234568', 'ZINC01234569', 'ZINC01234566', 'ZINC01234567'].map(function(id) {
		return '<label class="btn btn-primary"><input type="radio">' + id + '</label>';
	}).join(''));
	$(':first', hits).addClass('active');
	$('> .btn', hits).click(function(e) {
		alert(e.currentTarget.innerText);
	});
	var path = '/idock/jobs/' + location.search.substr(1) + '/';
	$.get(path + 'box.conf', function (box) {
		parseBox(box);
		$.get(path + 'receptor.pdbqt', function (protein) {
			parseProtein(protein);
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
				parseLigand(hits_str);
				rebuildScene();
				resetView();
			});
		});
	});

	['camera', 'background', 'effect', 'colorProteinBy', 'protein', 'ligand', 'surface', 'opacity', 'wireframe'].forEach(function (opt) {
		$('#' + opt).click(function (e) {
			var options = {};
			options[opt] = e.target.innerText;
			rebuildScene(options);
			render();
		})
	});

	$('#exportCanvas').click(function (e) {
		e.preventDefault();
		render();
		window.open(renderer.domElement.toDataURL('image/png'));
	})
});
