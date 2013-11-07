$(function() {

	// Initialize pager
	var pager = $('#pager');
	pager.pager('init', [ 'Description', 'Ligands', 'Submitted on', 'Status', 'Progress', 'Result' ], function(job) {
		var status, progress, result = '<a href="iview/?' + job._id + '"><img src="/iview/logo.png" alt="iview"></a>';
		if (!job.scheduled) {
			status = 'Queued for execution';
			progress = 0;
		} else if (!job.done) {
			status = 'Execution in progress';
			var num_completed_ligands = 0;
			for (var i = 0; i < job.scheduled; ++i) {
				num_completed_ligands += parseInt(job[i.toString()]);
			}
			progress = num_completed_ligands / job.ligands;
		} else {
			status = 'Done on ' + $.format.date(new Date(job.done), 'yyyy/MM/dd HH:mm:ss');
			progress = 1;
			result += '<a href="jobs/' + job._id + '/log.csv.gz"><img src="/excel.png" alt="log.csv.gz"></a><a href="jobs/' + job._id + '/ligands.pdbqt.gz"><img src="/molecule.png" alt="ligands.pdbqt.gz"></a>';
		}
		return [
			job.description,
			job.ligands.comma(),
			$.format.date(new Date(job.submitted), 'yyyy/MM/dd HH:mm:ss'),
			status,
			(100 * progress).toFixed(5) + '%',
			result
		];
	});

	// Refresh the table of jobs and its pager every second
	var jobs = [], skip = 0;
	var tick = function() {
		$.get('jobs', { skip: skip, count: jobs.length }, function(res) {
			if (res.length) {
				for (var i = skip; i < jobs.length; ++i) {
					var job = res[i - skip];
					jobs[i].scheduled = job.scheduled;
					jobs[i].done = job.done;
					for (var s = 0; s < job.scheduled; ++s) {
						jobs[i][s.toString()] = job[s.toString()];
					}
				}
				pager.pager('refresh', skip, jobs.length, 3, 6, false);
				if (res.length > jobs.length - skip) {
					var len = jobs.length;
					jobs = jobs.concat(res.slice(jobs.length - skip));
					pager.pager('source', jobs);
					pager.pager('refresh', len, jobs.length, 0, 6, true);
				}
				for (skip = jobs.length; skip && !jobs[skip - 1].done; --skip);
			}
			setTimeout(tick, 1000);
		});
	};
	tick();

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
	var defaultBoxColor  = new THREE.Color(0x1FF01F);
	var defaultBondColor = new THREE.Color(0x2194D6);
	var defaultBackgroundColor = new THREE.Color(0x000000);
	var sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
	var cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 64, 1);
	var sphereRadius = 0.45;
	var cylinderRadius = 0.3;
	var linewidth = 2;

	var canvas = $('canvas');
	canvas.bind('contextmenu', function (e) {
		e.preventDefault();
	});
	var renderer = new THREE.WebGLRenderer({
		canvas: canvas.get(0),
		antialias: true,
	});
	renderer.setSize(canvas.width(), canvas.height());
	renderer.setClearColor(defaultBackgroundColor);
	var scene = new THREE.Scene();
	var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
	directionalLight.position = new THREE.Vector3(0.2, 0.2, -1).normalize();
	var ambientLight = new THREE.AmbientLight(0x202020);
	var rot = new THREE.Object3D(), mdl, box;
	scene.add(directionalLight);
	scene.add(ambientLight);
	scene.add(rot);
	scene.fog = new THREE.Fog(defaultBackgroundColor, 100, 200);
	var camera = new THREE.PerspectiveCamera(20, canvas.width() / canvas.height(), 1, 800), sn, sf;
	camera.position = new THREE.Vector3(0, 0, -150);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	var surfacejs = new Worker('surface.min.js');

	var hasCovalentBond = function (atom0, atom1) {
		var r = covalentRadii[atom0.elem] + covalentRadii[atom1.elem];
		return atom0.coord.distanceToSquared(atom1.coord) < 1.3 * r * r;
	};
	var createSphere = function (atom, defaultRadius) {
		var mesh = new THREE.Mesh(sphereGeometry, new THREE.MeshLambertMaterial({ color: atom.color }));
		mesh.scale.x = mesh.scale.y = mesh.scale.z = defaultRadius;
		mesh.position = atom.coord;
		return mesh;
	};
	var createCylinder = function (p0, p1, radius, color) {
		var mesh = new THREE.Mesh(cylinderGeometry, new THREE.MeshLambertMaterial({ color: color }));
		mesh.position = p0.clone().add(p1).multiplyScalar(0.5);
		mesh.matrixAutoUpdate = false;
		mesh.lookAt(p0);
		mesh.updateMatrix();
		mesh.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p0.distanceTo(p1))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
		return mesh;
	};
	var refreshBox = function () {
		mdl.remove(box);
		var bctr = new THREE.Vector3();
		var bsiz = new THREE.Vector3();
		['x', 'y', 'z'].forEach(function(d) {
			bctr[d] = parseFloat($('#center_' + d).val());
			bsiz[d] = parseFloat($('#size_'   + d).val());
		});
		var bhlf = bsiz.multiplyScalar(0.5);
		var b000 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3(-1, -1, -1)));
		var b100 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3( 1, -1, -1)));
		var b010 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3(-1,  1, -1)));
		var b110 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3( 1,  1, -1)));
		var b001 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3(-1, -1,  1)));
		var b101 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3( 1, -1,  1)));
		var b011 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3(-1,  1,  1)));
		var b111 = bctr.clone().add(bhlf.clone().multiply(new THREE.Vector3( 1,  1,  1)));
		var bgeo = new THREE.Geometry();
		bgeo.vertices.push(b000);
		bgeo.vertices.push(b100);
		bgeo.vertices.push(b010);
		bgeo.vertices.push(b110);
		bgeo.vertices.push(b001);
		bgeo.vertices.push(b101);
		bgeo.vertices.push(b011);
		bgeo.vertices.push(b111);
		bgeo.vertices.push(b000);
		bgeo.vertices.push(b010);
		bgeo.vertices.push(b100);
		bgeo.vertices.push(b110);
		bgeo.vertices.push(b001);
		bgeo.vertices.push(b011);
		bgeo.vertices.push(b101);
		bgeo.vertices.push(b111);
		bgeo.vertices.push(b000);
		bgeo.vertices.push(b001);
		bgeo.vertices.push(b100);
		bgeo.vertices.push(b101);
		bgeo.vertices.push(b010);
		bgeo.vertices.push(b011);
		bgeo.vertices.push(b110);
		bgeo.vertices.push(b111);
		bgeo.computeLineDistances();
		box = new THREE.Line(bgeo, new THREE.LineDashedMaterial({ linewidth: 4, color: defaultBoxColor, dashSize: 0.25, gapSize: 0.125 }), THREE.LinePieces);
		mdl.add(box);
	};
	var render = function () {
		var center = rot.position.z - camera.position.z;
		if (center < 1) center = 1;
		camera.near = center + sn;
		if (camera.near < 1) camera.near = 1;
		camera.far = center + sf;
		if (camera.near + 1 > camera.far) camera.far = camera.near + 1;
		camera.updateProjectionMatrix();
		scene.fog.near = camera.near + 0.4 * (camera.far - camera.near);
		scene.fog.far = camera.far;
		renderer.render(scene, camera);
	};
	render();

	// Load receptor locally
	var status = $('#status');
	status.hide();
	var bsizmin = new THREE.Vector3();
	var bsizmax = new THREE.Vector3();
	['x', 'y', 'z'].forEach(function(d) {
		var bsiz = $('#size_' + d);
		bsizmin[d] = parseFloat(bsiz.attr('min'));
		bsizmax[d] = parseFloat(bsiz.attr('max'));
	});
	var psrc;
	$('input[type="file"]').change(function() {
		var file = this.files[0];
		if (file === undefined) return;
		var reader = new FileReader();
		reader.onload = function () {
			rot.remove(mdl);
			mdl = new THREE.Object3D();
			rot.add(mdl);
			var lines = reader.result.split('\n'), atoms = {}, lastTerSerial, alines = [], clines = [], plines = {};
			for (var i in lines) {
				var line = lines[i];
				var record = line.substr(0, 6);
				if (record === 'ATOM  ' || record === 'HETATM') {
					alines.push(line);
					var atom = {
						het: record[0] === 'H',
						serial: parseInt(line.substr(6, 5)),
						name: line.substr(12, 4).replace(/ /g, ''),
						alt: line.substr(16, 1),
						chain: line.substr(21, 1),
						resi: parseInt(line.substr(22, 4)),
						insc: line.substr(26, 1),
						coord: new THREE.Vector3(parseFloat(line.substr(30, 8)), parseFloat(line.substr(38, 8)), parseFloat(line.substr(46, 8))),
						elem: line.substr(76, 2).replace(/ /g, ''),
						bonds: [],
					};
					if (atom.elem === 'H') continue;
					atom.color = atomColors[atom.elem] || defaultAtomColor;
					atoms[atom.serial] = atom;
				} else if (record === 'CONECT') {
					clines.push(line);
					var from = parseInt(line.substr(6, 5));
					for (var j = 0; j < 4; ++j) {
						var to = parseInt(line.substr([11, 16, 21, 26][j], 5));
						if (isNaN(to)) continue;
						atoms[from].bonds.push(atoms[to]);
					}
				} else if (record === 'TER   ') {
					alines.push(line);
					plines[line.substr(21, 1)] = alines;
					alines = [];
					lastTerSerial = parseInt(line.substr(6, 5));
				} else if (record === 'HEADER') {
					$('#description').val(line.substr(62, 4));
				}
			}
			var peptides = {}, patoms = {};
			var ligands = {}, resi = {};
			var ions = {}, aidx = 0, ilines = {};
			var waters = {};
			var curChain, curResi, curInsc, curResAtoms = [];
			var refreshBonds = function (f) {
				var n = curResAtoms.length;
				for (var j = 0; j < n; ++j) {
					var atom0 = curResAtoms[j];
					for (var k = j + 1; k < n; ++k) {
						var atom1 = curResAtoms[k];
						if (atom0.alt === atom1.alt && hasCovalentBond(atom0, atom1)) {
							atom0.bonds.push(atom1);
							atom1.bonds.push(atom0);
						}
					}
					f && f(atom0);
				}
			};
			var pmin = new THREE.Vector3( 9999, 9999, 9999);
			var pmax = new THREE.Vector3(-9999,-9999,-9999);
			var psum = new THREE.Vector3();
			var cnt = 0;
			for (var i in atoms) {
				var atom = atoms[i];
				var coord = atom.coord;
				psum.add(coord);
				pmin.min(coord);
				pmax.max(coord);
				++cnt;
				if (atom.serial <= lastTerSerial) {
					peptides[atom.serial] = atom;
					patoms[atom.serial] = {
						serial: atom.serial,
						name: atom.name,
						coord: atom.coord,
						elem: atom.elem,
					};
					if (atom.het) continue;
					if (!(curChain == atom.chain && curResi == atom.resi && curInsc == atom.insc)) {
						refreshBonds(function (atom0) {
							if (((atom0.name === 'C' && atom.name === 'N') || (atom0.name === 'O3\'' && atom.name === 'P')) && hasCovalentBond(atom0, atom)) {
								atom0.bonds.push(atom);
								atom.bonds.push(atom0);
							}
						});
						curChain = atom.chain;
						curResi = atom.resi;
						curInsc = atom.insc;
						curResAtoms.length = 0;
					}
					curResAtoms.push(atom);
				} else if ((atoms[atom.serial - 1] === undefined || atoms[atom.serial - 1].resi !== atom.resi) && (atoms[atom.serial + 1] === undefined || atoms[atom.serial + 1].resi !== atom.resi)) {
					if (atom.elem === 'O') {
						waters[atom.serial] = atom;
					} else {
						ions[atom.serial] = atom;
						while (parseInt(alines[aidx].substr(6, 5)) != atom.serial) ++aidx;
						var line = alines[aidx++];
						var chain = line.substr(21, 1);
						if (ilines[chain] === undefined) {
							ilines[chain] = [];
						}
						ilines[chain].push(line);
					}
				} else {
					ligands[atom.serial] = atom;
					var key = atom.chain + atom.resi;
					if (resi[key] === undefined) {
						resi[key] = {
							beg: atom.serial,
						}
					} else {
						resi[key].end = atom.serial;
					}
				}
			}
			refreshBonds();
			surfacejs.onmessage = function (e) {
				var verts = e.data.verts;
				var faces = e.data.faces;
				var geo = new THREE.Geometry();
				geo.vertices = verts.map(function (v) {
					return new THREE.Vector3(v.x, v.y, v.z);
				});
				geo.faces = faces.map(function (f) {
					return new THREE.Face3(f.a, f.b, f.c, undefined, Object.keys(f).map(function (d) {
						return peptides[verts[f[d]].atomid].color;
					}));
				});
				geo.computeFaceNormals();
				geo.computeVertexNormals(false);
				mdl.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
					vertexColors: THREE.VertexColors,
					opacity: 0.9,
					transparent: true,
				})));
				render();
				status.hide();
			};
			status.show();
			surfacejs.postMessage({
				min: pmin,
				max: pmax,
				atoms: patoms,
			});
			var concat = function (lines) {
				return lines.map(function (line) {
					return line + '\n';
				}).join('');
			};
			var concat2 = function (lines) {
				return Object.keys(lines).map(function (chain) {
					return concat(lines[chain]);
				}).join('');
			};
			psrc = concat2(plines) + concat2(ilines) + concat(clines);
			var pavg = psum.clone().multiplyScalar(1 / cnt);
			var maxD = pmax.distanceTo(pmin);
			sn = -maxD / 2;
			sf =  maxD / 4;
			rot.position.z = maxD * 0.35 / Math.tan(Math.PI / 180.0 * 10) - 150;
			rot.quaternion = new THREE.Quaternion(1, 0, 0, 0);
			mdl.position = pavg.clone().multiplyScalar(-1);
			var ged = new THREE.Geometry();
			var model = function (atoms, f0, f01) {
				for (var i in atoms) {
					var atom0 = atoms[i];
					f0 && f0(atom0);
					for (var j in atom0.bonds) {
						var atom1 = atom0.bonds[j];
						if (atom1.serial < atom0.serial) continue;
						if (atom1.chain === atom0.chain && ((atom1.resi === atom0.resi) || (atom0.name === 'C' && atom1.name === 'N') || (atom0.name === 'O3\'' && atom1.name === 'P'))) {
							f01 && f01(atom0, atom1);
						} else {
							ged.vertices.push(atom0.coord);
							ged.vertices.push(atom1.coord);
						}
					}
				}
			};
			var geo = new THREE.Geometry();
			model(peptides, undefined, function (atom0, atom1) {
				var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
				geo.vertices.push(atom0.coord);
				geo.vertices.push(mp);
				geo.vertices.push(atom1.coord);
				geo.vertices.push(mp);
				geo.colors.push(atom0.color);
				geo.colors.push(atom0.color);
				geo.colors.push(atom1.color);
				geo.colors.push(atom1.color);
			});
			mdl.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: linewidth, vertexColors: true }), THREE.LinePieces));
			model(ligands, function (atom0) {
				mdl.add(createSphere(atom0, cylinderRadius));
			}, function (atom0, atom1) {
				var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
				mdl.add(createCylinder(atom0.coord, mp, cylinderRadius, atom0.color));
				mdl.add(createCylinder(atom1.coord, mp, cylinderRadius, atom1.color));
			});
			model(ions, function (atom0) {
				mdl.add(createSphere(atom0, sphereRadius));
			});
			for (var i in waters) {
				mdl.add(createSphere(waters[i], sphereRadius));
			}
			if (ged.vertices.length) {
				ged.computeLineDistances();
				mdl.add(new THREE.Line(ged, new THREE.LineDashedMaterial({ linewidth: linewidth, color: defaultBondColor, dashSize: 0.25, gapSize: 0.125 }), THREE.LinePieces));
			}
			var lidx, lcnt = 0;
			for (var i in resi) {
				var r = resi[i];
				var c = r.end - r.beg;
				if (lcnt < c) {
					lcnt = c;
					lidx = i;
				}
			}
			var bctr, bsiz;
			if (lidx === undefined) {
				bctr = pavg;
				bsiz = pmax.clone().sub(pmin).multiplyScalar(0.2);
			} else {
				var bmin = new THREE.Vector3( 9999, 9999, 9999);
				var bmax = new THREE.Vector3(-9999,-9999,-9999);
				for (var i = resi[lidx].beg; i <= resi[lidx].end; ++i) {
					var coord = ligands[i].coord;
					bmin.min(coord);
					bmax.max(coord);
				}
				bctr = bmax.clone().add(bmin).multiplyScalar(0.5);
				bsiz = bmax.clone().sub(bmin).multiplyScalar(1.5);
			}
			bsiz.clamp(bsizmin, bsizmax);
			var r = function () {
				refreshBox();
				render();
			};
			['x', 'y', 'z'].forEach(function(d) {
				$('#center_' + d).change(r).val(bctr[d] = Math.round(bctr[d]));
				$('#size_'   + d).change(r).val(bsiz[d] = Math.round(bsiz[d]));
			});
			mdl.position = bctr.clone().multiplyScalar(-1);
			r();
			var dg, wh, cx, cy, cq, cz, cp, cn, cf;
			canvas.bind('mouseup touchend', function (e) {
				dg = false;
			});
			canvas.bind('mousedown touchstart', function (e) {
				var x = e.pageX;
				var y = e.pageY;
				if (e.originalEvent.targetTouches && e.originalEvent.targetTouches[0]) {
					x = e.originalEvent.targetTouches[0].pageX;
					y = e.originalEvent.targetTouches[0].pageY;
				}
				dg = true;
				wh = e.which;
				cx = x;
				cy = y;
				cq = rot.quaternion;
				cz = rot.position.z;
				cp = mdl.position.clone();
				cn = sn;
				cf = sf;
			});
			canvas.bind('mousemove touchmove', function (e) {
				if (!dg) return;
				var x = e.pageX;
				var y = e.pageY;
				if (e.originalEvent.targetTouches && e.originalEvent.targetTouches[0]) {
					x = e.originalEvent.targetTouches[0].pageX;
					y = e.originalEvent.targetTouches[0].pageY;
				}
				var dx = (x - cx) / canvas.width();
				var dy = (y - cy) / canvas.height();
				if (e.ctrlKey && e.shiftKey) { // Slab
					sn = cn + dx * 100;
					sf = cf + dy * 100;
				} else if (e.ctrlKey || wh == 3) { // Translate
					var scaleFactor = Math.max((rot.position.z - camera.position.z) * 0.85, 20);
					mdl.position = cp.clone().add(new THREE.Vector3(-dx * scaleFactor, -dy * scaleFactor, 0).applyQuaternion(rot.quaternion.clone().inverse().normalize()));
				} else if (e.shiftKey || wh == 2) { // Zoom
					var scaleFactor = Math.max((rot.position.z - camera.position.z) * 0.85, 80);
					rot.position.z = cz - dy * scaleFactor;
				} else { // Rotate
					var r = Math.sqrt(dx * dx + dy * dy);
					var rs = Math.sin(r * Math.PI) / r;
					rot.quaternion = new THREE.Quaternion(1, 0, 0, 0).multiply(new THREE.Quaternion(Math.cos(r * Math.PI), 0, rs * dx, rs * dy)).multiply(cq);
				}
				render();
			});
			canvas.bind('mousewheel', function (e) {
				e.preventDefault();
				var scaleFactor = (rot.position.z - camera.position.z) * 0.85;
				rot.position.z -= scaleFactor * e.originalEvent.wheelDelta * 0.0025;
				render();
			});
			canvas.bind('DOMMouseScroll', function (e) {
				e.preventDefault();
				var scaleFactor = (rot.position.z - camera.position.z) * 0.85;
				rot.position.z += scaleFactor * e.originalEvent.detail * 0.1;
				render();
			});
		};
		reader.readAsText(file);
	});

	// Initialize sliders
	$('#mwt').slider({
		range: true,
		min: 55,
		max: 567,
		values: [ 400, 420 ]
	});
	$('#lgp').slider({
		range: true,
		min: -6,
		max: 12,
		values: [ 0, 2 ]
	});
	$('#ads').slider({
		range: true,
		min: -25,
		max: 29,
		values: [ 0, 5 ]
	});
	$('#pds').slider({
		range: true,
		min: -504,
		max: 1,
		values: [ -20, 0 ]
	});
	$('#hbd').slider({
		range: true,
		min: 0,
		max: 20,
		values: [ 2, 4 ]
	});
	$('#hba').slider({
		range: true,
		min: 0,
		max: 18,
		values: [ 4, 6 ]
	});
	$('#psa').slider({
		range: true,
		min: 0,
		max: 317,
		values: [ 60, 80 ]
	});
	$('#chg').slider({
		range: true,
		min: -5,
		max: 5,
		values: [ 0, 0 ]
	});
	$('#nrb').slider({
		range: true,
		min: 0,
		max: 35,
		values: [ 4, 6 ]
	});
	$('.slider').slider({
		slide: function(event, ui) {
			$('#' + this.id + '_lb').text(ui.values[0]);
			$('#' + this.id + '_ub').text(ui.values[1]);
		},
		change: function(event, ui) {
			$.get('ligands', {
				mwt_lb: $('#mwt_lb').text(),
				mwt_ub: $('#mwt_ub').text(),
				lgp_lb: $('#lgp_lb').text(),
				lgp_ub: $('#lgp_ub').text(),
				ads_lb: $('#ads_lb').text(),
				ads_ub: $('#ads_ub').text(),
				pds_lb: $('#pds_lb').text(),
				pds_ub: $('#pds_ub').text(),
				hbd_lb: $('#hbd_lb').text(),
				hbd_ub: $('#hbd_ub').text(),
				hba_lb: $('#hba_lb').text(),
				hba_ub: $('#hba_ub').text(),
				psa_lb: $('#psa_lb').text(),
				psa_ub: $('#psa_ub').text(),
				chg_lb: $('#chg_lb').text(),
				chg_ub: $('#chg_ub').text(),
				nrb_lb: $('#nrb_lb').text(),
				nrb_ub: $('#nrb_ub').text()
			}, function(res) {
				$('#ligands').text(res.comma());
			});
		}
	});

	// Initialize tooltips
	$('.form-group a').tooltip();

	// Process submission
	var submit = $('#submit');
	submit.click(function() {
		// Disable the submit button for a while
		submit.prop('disabled', true);
		// Hide tooltips
		$('.form-group a').tooltip('hide');
		// Post a new job without client side validation
		$.post('jobs', {
			receptor: psrc,
			center_x: $('#center_x').val(),
			center_y: $('#center_y').val(),
			center_z: $('#center_z').val(),
			size_x: $('#size_x').val(),
			size_y: $('#size_y').val(),
			size_z: $('#size_z').val(),
			description: $('#description').val(),
			email: $('#email').val(),
			mwt_lb: $('#mwt_lb').text(),
			mwt_ub: $('#mwt_ub').text(),
			lgp_lb: $('#lgp_lb').text(),
			lgp_ub: $('#lgp_ub').text(),
			ads_lb: $('#ads_lb').text(),
			ads_ub: $('#ads_ub').text(),
			pds_lb: $('#pds_lb').text(),
			pds_ub: $('#pds_ub').text(),
			hbd_lb: $('#hbd_lb').text(),
			hbd_ub: $('#hbd_ub').text(),
			hba_lb: $('#hba_lb').text(),
			hba_ub: $('#hba_ub').text(),
			psa_lb: $('#psa_lb').text(),
			psa_ub: $('#psa_ub').text(),
			chg_lb: $('#chg_lb').text(),
			chg_ub: $('#chg_ub').text(),
			nrb_lb: $('#nrb_lb').text(),
			nrb_ub: $('#nrb_ub').text()
		}, function(res) {
			var keys = Object.keys(res);
			// If server side validation fails, show the tooltips
			if (keys.length) {
				keys.forEach(function(key) {
					$('#' + key + '_label').tooltip('show');
				});
			} else {
				$('html, body').animate({ scrollTop: pager.offset().top });
//				window.scrollTo(pager.offset().left, pager.offset().top);
			}
		}, 'json').always(function() {
			submit.prop('disabled', false);
		});
	});

	// Apply accordion to tutorials
	$('.ui-accordion').accordion({
		collapsible: true,
		active: false,
		heightStyle: 'content',
		activate: function(event, ui) {
			$('img', this).trigger('expand');
		}
	});
	$('.ui-accordion img').lazyload({
		event: 'expand',
		effect: 'fadeIn',
	});
});
