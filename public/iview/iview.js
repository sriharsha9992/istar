/*
	Copyright (c) 2012, The Chinese University of Hong Kong

	This program is free software: you can redistribute it and/or mody
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var iview = (function() {

	COVALENT = {};
	COVALENT['H '] = 0.407;
	COVALENT['HD'] = 0.407;
	COVALENT['C '] = 0.847;
	COVALENT['A '] = 0.847;
	COVALENT['N '] = 0.825;
	COVALENT['NA'] = 0.825;
	COVALENT['OA'] = 0.803;
	COVALENT['S '] = 1.122;
	COVALENT['SA'] = 1.122;
	COVALENT['Se'] = 1.276;
	COVALENT['P '] = 1.166;
	COVALENT['F '] = 0.781;
	COVALENT['Cl'] = 1.089;
	COVALENT['Br'] = 1.254;
	COVALENT['I '] = 1.463;
	COVALENT['Zn'] = 1.441;
	COVALENT['Fe'] = 1.375;
	COVALENT['Mg'] = 1.430;
	COVALENT['Ca'] = 1.914;
	COVALENT['Mn'] = 1.529;
	COVALENT['Cu'] = 1.518;
	COVALENT['Na'] = 1.694;
	COVALENT['K '] = 2.156;
	COVALENT['Hg'] = 1.639;
	COVALENT['Ni'] = 1.331;
	COVALENT['Co'] = 1.386;
	COVALENT['Cd'] = 1.628;
	COVALENT['As'] = 1.309;
	COVALENT['Sr'] = 2.112;

	AD2XS = {};
	AD2XS['C '] =   'C_H';
	AD2XS['A '] =   'C_H';
	AD2XS['N '] =   'N_P';
	AD2XS['NA'] =   'N_A';
	AD2XS['OA'] =   'O_A';
	AD2XS['S '] =   'S_P';
	AD2XS['SA'] =   'S_P';
	AD2XS['Se'] =   'S_P';
	AD2XS['P '] =   'P_P';
	AD2XS['F '] =   'F_H';
	AD2XS['Cl'] =  'Cl_H';
	AD2XS['Br'] =  'Br_H';
	AD2XS['I '] =   'I_H';
	AD2XS['Zn'] = 'Met_D';
	AD2XS['Fe'] = 'Met_D';
	AD2XS['Mg'] = 'Met_D';
	AD2XS['Ca'] = 'Met_D';
	AD2XS['Mn'] = 'Met_D';
	AD2XS['Cu'] = 'Met_D';
	AD2XS['Na'] = 'Met_D';
	AD2XS['K '] = 'Met_D';
	AD2XS['Hg'] = 'Met_D';
	AD2XS['Ni'] = 'Met_D';
	AD2XS['Co'] = 'Met_D';
	AD2XS['Cd'] = 'Met_D';
	AD2XS['As'] = 'Met_D';
	AD2XS['Sr'] = 'Met_D';

	VDW = {};
	VDW[  'C_H' ] = 1.9;
	VDW[  'C_P' ] = 1.9;
	VDW[  'N_P' ] = 1.8;
	VDW[  'N_D' ] = 1.8;
	VDW[  'N_A' ] = 1.8;
	VDW[  'N_DA'] = 1.8;
	VDW[  'O_A' ] = 1.7;
	VDW[  'O_DA'] = 1.7;
	VDW[  'S_P' ] = 2.0;
	VDW[  'P_P' ] = 2.1;
	VDW[  'F_H' ] = 1.5;
	VDW[ 'Cl_H' ] = 1.8;
	VDW[ 'Br_H' ] = 2.0;
	VDW[  'I_H' ] = 2.2;
	VDW['Met_D' ] = 1.2;

	function pad(len, str) {
		return Array(len + 1 - str.length).join(' ') + str;
	}

	Atom = function(id, coord, ad) {
		this.id = id;
		vec3.set(coord, this);
		this.ad = ad;
		this.xs = AD2XS[ad];
		this.isHydrogen = function() {
			return (this.ad === 'H ') || (this.ad === 'HD');
		}
		this.isHBD = function() {
			return (this.ad === 'HD') || (this.xs === 'Met_D');
		}
		this.isHBA = function() {
			return (this.ad === 'NA') || (this.ad === 'OA') || (this.ad === 'SA');
		}
		this.isHetero = function() {
			return !((this.ad === 'H ') || (this.ad === 'HD') || (this.ad === 'C ') || (this.ad === 'A '));
		}
		this.donorize = function() {
			switch (this.xs) {
				case 'N_P' : this.xs = 'N_D';  break;
				case 'N_A' : this.xs = 'N_DA'; break;
				case 'O_A' : this.xs = 'O_DA'; break;
			}
		}
		this.isNeighbor = function(a) {
			var c = COVALENT[this.ad] + COVALENT[a.ad];
			return (vec3.squaredLength(vec3.subtract(this, a, [])) < c * c);
		}
		this.toPDBQT = function(center) {
			var c = vec3.add(this, center, []);
			return 'ATOM  ' + this.serial + ' ' + this.name + pad(14, '') + pad(8, c[0].toFixed(3)) + pad(8, c[1].toFixed(3)) + pad(8, c[2].toFixed(3)) + pad(16, '') + pad(6, this.fe.toFixed(3)) + ' ' + this.ad;
		}
		this.render = function(gl, COLOR) {
			var e = COLOR[this.ad];
			gl.uniform3f(gl.dUL, e.r, e.g, e.b);
			gl.setModelViewMatrix(mat4.scale(mat4.translate(gl.modelViewMatrix, this, []), [0.3, 0.3, 0.3], []));
			gl.drawElements(gl.TRIANGLES, gl.sphere.vertexIndexBuffer.size, gl.UNSIGNED_SHORT, 0);
		};
	};

	Bond = function(a1, a2) {
		this.a1 = a1;
		this.a2 = a2;
		this.render = function(gl, COLOR) {
			var ang = 0;
			var axis = [0, 0, 1];
			if (this.a1[0] == this.a2[0] && this.a1[2] == this.a2[2]) {
				if (this.a2[1] < this.a1[1]) {
					ang = Math.PI;
				}
			} else {
				var y = [0, 1, 0];
				var a1m = vec3.scale(vec3.subtract(this.a2, this.a1, []), 0.5, []);
				ang = Math.acos(vec3.dot(y, a1m) / vec3.length(a1m));
				axis = vec3.cross(y, a1m, []);
			}
			var scaleVector = [0.3, vec3.dist(this.a1, this.a2) * 0.5, 0.3];
			// Draw one half.
			var e1 = COLOR[this.a1.ad];
			gl.uniform3f(gl.dUL, e1.r, e1.g, e1.b);
			gl.setModelViewMatrix(mat4.scale(mat4.rotate(mat4.translate(gl.modelViewMatrix, this.a1, []), ang, axis, []), scaleVector, []));
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinder.vertexPositionBuffer.size);
			// Draw the other half.
			var e2 = COLOR[this.a2.ad];
			gl.uniform3f(gl.dUL, e2.r, e2.g, e2.b);
			gl.setModelViewMatrix(mat4.scale(mat4.rotate(mat4.translate(gl.modelViewMatrix, this.a2, []), ang + Math.PI, axis, []), scaleVector, []));
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinder.vertexPositionBuffer.size);
		};
	};

	HBond = function(a1, a2) {
		this.a1 = a1;
		this.a2 = a2;
		this.render = function(gl) {
			var ang = 0;
			var axis = [0, 0, 1];
			if (this.a1[0] == this.a2[0] && this.a1[2] == this.a2[2]) {
				if (this.a2[1] < this.a1[1]) {
					ang = Math.PI;
				}
			} else {
				var y = [0, 1, 0];
				var a1a2 = vec3.subtract(this.a2, this.a1, []);
				ang = Math.acos(vec3.dot(y, a1a2) / vec3.length(a1a2));
				axis = vec3.cross(y, a1a2, []);
			}
			gl.setModelViewMatrix(mat4.scale(mat4.rotate(mat4.translate(gl.modelViewMatrix, this.a1, []), ang, axis, []), [0.05, vec3.dist(this.a1, this.a2), 0.05], []));
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinder.vertexPositionBuffer.size);
		};
	};

	Molecule = function() {
		this.atoms = [];
		this.bonds = [];
		this.hbds = [];
		this.hbas = [];
	};
	Molecule.prototype.renderAtoms = function(gl) {
		for (var i = 0, ii = this.atoms.length; i < ii; ++i) {
			var a = this.atoms[i];
			if (a.hidden) continue;
			a.render(gl, this.COLOR);
		}
	};
	Molecule.prototype.renderBonds = function(gl) {
		for (var i = 0, ii = this.bonds.length; i < ii; ++i) {
			var b = this.bonds[i];
			if (b.a1.hidden || b.a2.hidden) continue;
			b.render(gl, this.COLOR);
		}
	};
	Molecule.prototype.centerize = function(center) {
		for (var i = 0, ii = this.atoms.length; i < ii; ++i) {
			var a = this.atoms[i];
			vec3.subtract(a, center);
			if (a.hidden) continue;
			if (a.isHBD()) this.hbds.push(a);
			else if (a.isHBA()) this.hbas.push(a);
		}
	};

	function Color(color) {
		this.r = parseInt(color.substring(1, 3), 16) / 255.0;
		this.g = parseInt(color.substring(3, 5), 16) / 255.0;
		this.b = parseInt(color.substring(5, 7), 16) / 255.0;
	}

	Receptor = function(content, hideNonPolarHydrogens, corner1, corner2) {
		this.COLOR = {};
		this.COLOR['H '] = new Color('#FFFFFF');
		this.COLOR['HD'] = new Color('#FFFFFF');
		this.COLOR['C '] = new Color('#909090');
		this.COLOR['A '] = new Color('#909090');
		this.COLOR['N '] = new Color('#3050F8');
		this.COLOR['NA'] = new Color('#3050F8');
		this.COLOR['OA'] = new Color('#FF0D0D');
		this.COLOR['S '] = new Color('#FFFF30');
		this.COLOR['SA'] = new Color('#FFFF30');
		this.COLOR['Se'] = new Color('#FFA100');
		this.COLOR['P '] = new Color('#FF8000');
		this.COLOR['F '] = new Color('#90E050');
		this.COLOR['Cl'] = new Color('#1FF01F');
		this.COLOR['Br'] = new Color('#A62929');
		this.COLOR['I '] = new Color('#940094');
		this.COLOR['Zn'] = new Color('#7D80B0');
		this.COLOR['Fe'] = new Color('#E06633');
		this.COLOR['Mg'] = new Color('#8AFF00');
		this.COLOR['Ca'] = new Color('#3DFF00');
		this.COLOR['Mn'] = new Color('#9C7AC7');
		this.COLOR['Cu'] = new Color('#C88033');
		this.COLOR['Na'] = new Color('#AB5CF2');
		this.COLOR['K '] = new Color('#8F40D4');
		this.COLOR['Hg'] = new Color('#B8B8D0');
		this.COLOR['Ni'] = new Color('#50D050');
		this.COLOR['Co'] = new Color('#F090A0');
		this.COLOR['Cd'] = new Color('#FFD98F');
		this.COLOR['As'] = new Color('#BD80E3');
		this.COLOR['Sr'] = new Color('#00FF00');
		var residues = [];
		for (var residue = 'XXXX', lines = content.split('\n'), kk = lines.length, k = 0; k < kk; ++k) {
			var line = lines[k];
			if (line.match('^ATOM|HETATM')) {
				if (!((line[25] === residue[3]) && (line[24] === residue[2]) && (line[23] === residue[1]) && (line[22] === residue[0]))) {
					residue = line.substring(22, 26);
					residues.push(this.atoms.length);
				}
				var a = new Atom(line[21] + ':' + line.substring(17, 20) + $.trim(line.substring(22, 26)) + ':' + $.trim(line.substring(12, 16)), [parseFloat(line.substring(30, 38)), parseFloat(line.substring(38, 46)), parseFloat(line.substring(46, 54))], line.substring(77, 79));
				if (a.ad === 'H ') {
					if (hideNonPolarHydrogens) continue;
				} else if (a.ad === 'HD') {
					for (var i = this.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.atoms[--i];
						if (b.isNeighbor(a)) {
							b.donorize();
							break;
						}
					}
				} else if (a.ad === 'C ' || a.ad === 'A ') {
					for (var i = this.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.atoms[--i];
						if ((!(b.ad === 'C ' || b.ad === 'A ')) && b.isNeighbor(a)) {
							a.xs = 'C_P';
							break;
						}
					}
				} else {
					for (var i = this.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.atoms[--i];
						if ((b.ad === 'C ' || b.ad === 'A ') && b.isNeighbor(a)) {
							b.xs = 'C_P';
						}
					}
				}
				this.atoms.push(a);
			} else if (line.match('^TER')) {
				residue = 'XXXX';
			}
		}
		residues.push(this.atoms.length);
		for (var r = 0, rr = residues.length - 1; r < rr; ++r) {
			var hidden = true;
			for (var i = residues[r], ii = residues[r + 1]; i < ii; ++i) {
				var a = this.atoms[i];
				if ((corner1[0] <= a[0]) && (a[0] < corner2[0]) && (corner1[1] <= a[1]) && (a[1] < corner2[1]) && (corner1[2] <= a[2]) && (a[2] < corner2[2])) {
					hidden = false;
					break;
				}
			}
			for (var i = residues[r], ii = residues[r + 1]; i < ii; ++i) {
				var a1 = this.atoms[i];
				if (hidden) {
					a1.hidden = true;
					continue;
				}
				for (var j = i + 1; j < ii; ++j) {
					var a2 = this.atoms[j];
					if (a2.isNeighbor(a1)) {
						this.bonds.push(new Bond(a1, a2));
					}
				}
			}
		}
	};
	Receptor.prototype = new Molecule();

	Ligand = function(content, hideNonPolarHydrogens) {
		this.COLOR = {};
		this.COLOR['H '] = new Color('#E6E6E6');
		this.COLOR['HD'] = new Color('#E6E6E6');
		this.COLOR['C '] = new Color('#33FF33');
		this.COLOR['A '] = new Color('#33FF33');
		this.COLOR['N '] = new Color('#3333FF');
		this.COLOR['NA'] = new Color('#3333FF');
		this.COLOR['OA'] = new Color('#FF4D4D');
		this.COLOR['S '] = new Color('#E6C640');
		this.COLOR['SA'] = new Color('#E6C640');
		this.COLOR['Se'] = new Color('#FFA100');
		this.COLOR['P '] = new Color('#FF8000');
		this.COLOR['F '] = new Color('#B3FFFF');
		this.COLOR['Cl'] = new Color('#1FF01F');
		this.COLOR['Br'] = new Color('#A62929');
		this.COLOR['I '] = new Color('#940094');
		this.WEIGHT = {};
		this.WEIGHT['HD'] =   1.008;
		this.WEIGHT['H '] =   1.008;
		this.WEIGHT['C '] =  12.01;
		this.WEIGHT['A '] =  12.01;
		this.WEIGHT['N '] =  14.01;
		this.WEIGHT['NA'] =  14.01;
		this.WEIGHT['OA'] =  16.00;
		this.WEIGHT['SA'] =  32.07;
		this.WEIGHT['S '] =  32.07;
		this.WEIGHT['Se'] =  78.96;
		this.WEIGHT['P '] =  30.97;
		this.WEIGHT['F '] =  19.00;
		this.WEIGHT['Cl'] =  35.45;
		this.WEIGHT['Br'] =  79.90;
		this.WEIGHT['I '] = 126.90;
		var current = {
			begin: 0,
			branches: []
		};
		this.frames = [current];
		this.nHeavyAtoms = 0;
		this.mwt = 0;
		var serials = [];
		for (var lines = content.split('\n'), kk = lines.length, k = 0; k < kk; ++k) {
			var line = lines[k];
			if (line.match('^ATOM|HETATM')) {
				var a = new Atom($.trim(line.substring(12, 16)), [parseFloat(line.substring(30, 38)), parseFloat(line.substring(38, 46)), parseFloat(line.substring(46, 54))], line.substring(77, 79));
				a.serial = line.substring(6, 11);
				a.name = line.substring(12, 16);
				this.mwt += this.WEIGHT[a.ad];
				if (a.ad === 'H ') {
					if (hideNonPolarHydrogens) {
						a.hidden = true;
					}
					a.fe = 0;
				} else if (a.ad === 'HD') {
					for (var i = this.atoms.length, frame_begin = this.frames[this.frames.length - 1]; i > frame_begin;) {
						var b = this.atoms[--i];
						if (b.isNeighbor(a)) {
							b.donorize();
							break;
						}
					}
					a.fe = 0;
				} else if (a.ad === 'C ' || a.ad === 'A ') {
					for (var i = this.atoms.length, frame_begin = this.frames[this.frames.length - 1]; i > frame_begin;)
					{
						var b = this.atoms[--i];
						if ((!(b.ad === 'C ' || b.ad === 'A ')) && b.isNeighbor(a)) {
							a.xs = 'C_P';
							break;
						}
					}
					serials[parseInt(a.serial)] = a;
					++this.nHeavyAtoms;
				} else {
					for (var i = this.atoms.length, frame_begin = this.frames[this.frames.length - 1]; i > frame_begin;) {
						var b = this.atoms[--i];
						if ((b.ad === 'C ' || b.ad === 'A ') && b.isNeighbor(a)) {
							b.xs = 'C_P';
						}
					}
					serials[parseInt(a.serial)] = a;
					++this.nHeavyAtoms;
				}
				this.atoms.push(a);
			} else if (line.match('^BRANCH')) {
				this.frames[this.frames.length - 1].end = this.atoms.length;
				this.frames.push({
					parent: current,
					begin: this.atoms.length,
					rotorX: serials[parseInt(line.substring(6, 10))],
					branches: []
				});
				current.branches.push(this.frames[this.frames.length - 1]);
				current = this.frames[this.frames.length - 1];
			} else if (line.match('^ENDBRANCH')) {
				current.rotorY = serials[(parseInt(line.substring(13, 17)))];
				this.bonds.push(new Bond(current.rotorX, current.rotorY));
				if (!(current.rotorY.ad === 'C ' || current.rotorY.ad === 'A ') && (current.rotorX.ad === 'C ' || current.rotorX.ad === 'A ')) current.rotorX.xs = 'C_P';
				if (!(current.rotorX.ad === 'C ' || current.rotorX.ad === 'A ') && (current.rotorY.ad === 'C ' || current.rotorY.ad === 'A ')) current.rotorY.xs = 'C_P';
				current = current.parent;
			} else if (line.match('^TORSDOF')) break;
		}
		this.frames[this.frames.length - 1].end = this.atoms.length;
		for (var f = 0, ff = this.frames.length - 1; f < ff; ++f) {
			for (var i = this.frames[f].begin, ii = this.frames[f].end; i < ii; ++i) {
				var a1 = this.atoms[i];
				for (var j = i + 1; j < ii; ++j) {
					var a2 = this.atoms[j];
					if (a2.isNeighbor(a1)) {
						this.bonds.push(new Bond(a1, a2));
					}
				}
			}
		}
	};
	Ligand.prototype = new Molecule();
	Ligand.prototype.save = function(center) {
		var lines = [
			'ROOT'
		];
		var root = this.frames[0];
		for (var i = root.begin; i < root.end; ++i) {
			lines.push(this.atoms[i].toPDBQT(center));
		}
		lines.push('ENDROOT');
		var stack = [];
		for (var i = root.branches.length; i > 0;) {
			stack.push(root.branches[--i]);
		}
		for (var i = 1, ii = this.frames.length; i < ii; ++i) {
			this.frames[i].dumped = false;
		}
		while (stack.length) {
			var f = stack[stack.length - 1];
			if (!f.dumped) {
				lines.push('BRANCH' + f.rotorX.serial.substring(1, 5) + f.rotorY.serial.substring(1, 5));
				for (var i = f.begin; i < f.end; ++i) {
					lines.push(this.atoms[i].toPDBQT(center));
				}
				f.dumped = true;
				for (var i = f.branches.length; i > 0;) {
					stack.push(f.branches[--i]);
				}
			} else {
				lines.push('ENDBRANCH' + f.rotorX.serial.substring(1, 5) + f.rotorY.serial.substring(1, 5));
				stack.pop();
			}
		}
		lines.push('TORSDOF ' + (this.frames.length - 1));
		return lines.join('\n');
	}

	Mesh = function() {
	};
	Mesh.prototype.createBuffers = function(gl, positionData, normalData, indexData) {
		this.vertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);
		this.vertexPositionBuffer.size = positionData.length / 3;

		this.vertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
		this.vertexNormalBuffer.size = normalData.length / 3;
			
		if (indexData) {
			this.vertexIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
			this.vertexIndexBuffer.size = indexData.length;
		}
	};
	Mesh.prototype.bindBuffers = function(gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		gl.vertexAttribPointer(gl.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
		gl.vertexAttribPointer(gl.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
		if (this.vertexIndexBuffer) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		}
	};

	Sphere = function(gl, bands) {
		var positionData = [];
		var normalData = [];
		var latitudeAngle = Math.PI / bands;
		var longitudeAngle = 2 * latitudeAngle;
		for (var latNumber = 0; latNumber <= bands; ++latNumber) {
			var theta = latitudeAngle * latNumber;
			var sinTheta = Math.sin(theta);
			var y = Math.cos(theta);
			for (var longNumber = 0; longNumber <= bands; ++longNumber) {
				var phi = longitudeAngle * longNumber;
				var x = Math.cos(phi) * sinTheta;
				var z = Math.sin(phi) * sinTheta;
				normalData.push(x, y, z);
				positionData.push(x, y, z);
			}
		}
		var indexData = [];
		for (var latNumber = 0; latNumber < bands; ++latNumber) {
			var offset = latNumber * (bands + 1);
			for (var longNumber = 0; longNumber <= bands; ++longNumber) {
				var first = offset + longNumber;
				var second = first + (bands + 1);
				indexData.push(first, second, first + 1);
				if (longNumber < bands) {
					indexData.push(second, second + 1, first + 1);
				}
			}
		}
		this.createBuffers(gl, positionData, normalData, indexData);
	};
	Sphere.prototype = new Mesh();

	Cylinder = function(gl, bands) {
		var positionData = [];
		var normalData = [];
		var angle = 2 * Math.PI / bands;
		for (var i = 0; i <= bands; ++i) {
			var theta = angle * i;
			var cosTheta = Math.cos(theta);
			var sinTheta = Math.sin(theta);
			normalData.push(cosTheta, 0, sinTheta);
			positionData.push(cosTheta, 0, sinTheta);
			normalData.push(cosTheta, 0, sinTheta);
			positionData.push(cosTheta, 1, sinTheta);
		}
		this.createBuffers(gl, positionData, normalData);
	};
	Cylinder.prototype = new Mesh();

	var unitRadius = Math.PI / 180.0;
	var CTRL = false;
	var keydownup = function(e) {
		CTRL = e.ctrlKey;
	};
	$(document).keydown(keydownup).keyup(keydownup);

	function score(xs1, xs2, r) {
		var d = r - (VDW[xs1] + VDW[xs2]);
		return (-0.035579) * Math.exp(-4 * d * d)
			+  (-0.005156) * Math.exp(-0.25 * (d - 3.0) * (d - 3.0))
			+  ( 0.840245) * (d > 0 ? 0.0 : d * d)
			+  (-0.035069) * ((isHydrophobic(xs1) && isHydrophobic(xs2)) ? ((d >= 1.5) ? 0.0 : ((d <= 0.5) ? 1.0 : 1.5 - d)) : 0.0)
			+  (-0.587439) * (((isHBdonor(xs1) && isHBacceptor(xs2)) || (isHBdonor(xs2) && isHBacceptor(xs1))) ? ((d >= 0) ? 0.0 : ((d <= -0.7) ? 1 : d * (-1.428571))): 0.0);
		function isHydrophobic(xs) {
			return xs ===  'C_H' || xs ===  'F_H' || xs === 'Cl_H' || xs === 'Br_H' || xs ===  'I_H';
		}
		function isHBdonor(xs) {
			return xs === 'N_D' || xs === 'N_DA' || xs === 'O_DA' || xs === 'Met_D';
		}
		function isHBacceptor(xs) {
			return xs === 'N_A' || xs === 'N_DA' || xs === 'O_A' || xs === 'O_DA';
		}
	}

	var iview = function(options) {
		this.options = $.extend({
			hideNonPolarHydrogens: true
		}, options);
		this.canvas = $('#' + this.options.id);
		var gl = this.canvas.get(0).getContext('experimental-webgl', {
			preserveDrawingBuffer: true
		});
		this.disabled = !gl;
		if (this.disabled) return;
		gl.enable(gl.DEPTH_TEST);
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, [
			'attribute vec3 a_vertex_position;',
			'attribute vec3 a_vertex_normal;',
			'uniform vec3 u_diffuse_color;',
			'uniform mat4 u_projection_matrix;',
			'uniform mat4 u_model_view_matrix;',
			'uniform mat3 u_normal_matrix;',
			'varying vec3 v_normal;',
			'varying vec3 v_diffuse;',
			'void main() {',
				'v_normal = normalize(u_normal_matrix * a_vertex_normal);',
				'v_diffuse = u_diffuse_color;',
				'gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_vertex_position, 1.0);',
			'}'
		].join(''));
		gl.compileShader(vertexShader);
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, [
			'precision mediump float;',
			'varying vec3 v_normal;',
			'varying vec3 v_diffuse;',
			'void main() {',
				'float d = max(dot(v_normal, vec3(0.1, 0.1, 1)), 0.0);',
				'gl_FragColor = vec4(v_diffuse * d + vec3(0.3, 0.3, 0.3) * pow(d, 32.0), 1.0);',
			'}'
		].join(''));
		gl.compileShader(fragmentShader);
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.useProgram(program);
		gl.vertexPositionAttribute = gl.getAttribLocation(program, 'a_vertex_position');
		gl.vertexNormalAttribute = gl.getAttribLocation(program, 'a_vertex_normal');
		gl.enableVertexAttribArray(gl.vertexPositionAttribute);
		gl.enableVertexAttribArray(gl.vertexNormalAttribute);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_projection_matrix'), false, mat4.perspective(45, this.canvas.attr('width') / this.canvas.attr('height'), 0.1, 1000));
		gl.dUL = gl.getUniformLocation(program, 'u_diffuse_color');
		gl.mvUL = gl.getUniformLocation(program, 'u_model_view_matrix');
		gl.nUL = gl.getUniformLocation(program, 'u_normal_matrix');
		gl.setModelViewMatrix = function(mvMatrix) {
			this.uniformMatrix4fv(this.mvUL, false, mvMatrix);
			this.uniformMatrix3fv(this.nUL, false, mat3.transpose(mat4.toInverseMat3(mvMatrix, []), []));
		};
		gl.sphere = new Sphere(gl, 60);
		gl.cylinder = new Cylinder(gl, 60);
		this.gl = gl;
		var iv = this;
		this.mousebuttons = [];
		this.canvas.bind("contextmenu", function() {
			return false;
		});
		this.canvas.mousedown(function(e) {
			iv.ismousedown = true;
			iv.mousebuttons[e.which] = true;
			iv.pageX = e.pageX;
			iv.pageY = e.pageY;
		});
		this.canvas.mouseup(function(e) {
			iv.ismousedown = false;
			iv.mousebuttons[e.which] = false;
		});
		this.canvas.mousemove(function(e) {
			if (!iv.ismousedown) return;
			var dx = e.pageX - iv.pageX;
			var dy = e.pageY - iv.pageY;
			iv.pageX = e.pageX;
			iv.pageY = e.pageY;
			if (CTRL) {
				if (iv.mousebuttons[1] && !iv.mousebuttons[3]) {
					var rotation = mat4.rotate(mat4.rotate(mat4.identity(), dx * unitRadius, [0, 1, 0]), dy * unitRadius, [1, 0, 0], []);
					for (var i = 0, ii = iv.ligand.atoms.length; i < ii; ++i) {
						mat4.multiplyVec3(rotation, iv.ligand.atoms[i]);
					}
					iv.refresh();
				} else if (iv.mousebuttons[3] && !iv.mousebuttons[1]) {
					var translation = mat3.multiply(mat4.toInverseMat3(iv.gl.modelViewMatrix, []),  [dx * 0.05, -dy * 0.05, 0], []);
					for (var i = 0, ii = iv.ligand.atoms.length; i < ii; ++i) {
						vec3.add(iv.ligand.atoms[i], translation);
					}
					iv.refresh();
				}
			} else {
				if (iv.mousebuttons[1] && !iv.mousebuttons[3]) {
					mat4.multiply(mat4.rotate(mat4.rotate(mat4.identity(), dx * unitRadius, [0, 1, 0]), dy * unitRadius, [1, 0, 0], []), iv.rotationMatrix, iv.rotationMatrix);
				} else if (iv.mousebuttons[3] && !iv.mousebuttons[1]) {
					mat4.translate(iv.translationMatrix, [dx * 0.05, -dy * 0.05, 0]);
				}
			}
			iv.repaint();
		});
		this.canvas.mousewheel(function(e, delta) {
			e.preventDefault();
			mat4.translate(iv.translationMatrix, [0, 0, delta * 2.5]);
			iv.repaint();
		});
	};
	iview.prototype.setBox = function(center, size) {
		this.center = center;
		this.size = size;
		var half = vec3.scale(size, 0.5, []);
		this.corner1 = vec3.subtract(center, half, []);
		this.corner2 = vec3.add(center, half, []);
		this.translationMatrix = mat4.translate(mat4.identity(), [0, 0, -20]);
		this.rotationMatrix = mat4.identity();
	}
	iview.prototype.parseReceptor = function(content) {
		this.receptor = new Receptor(content, this.options.hideNonPolarHydrogens, this.corner1, this.corner2);
		this.receptor.centerize(this.center);
	}
	iview.prototype.parseLigand = function(content) {
		this.ligand = new Ligand(content, this.options.hideNonPolarHydrogens);
		this.ligand.centerize(this.center);
		this.refresh();
	}
	iview.prototype.refresh = function() {
		this.hbonds = [];
		for (var i = 0, ii = this.receptor.hbds.length; i < ii; ++i) {
			var r = this.receptor.hbds[i];
			for (var j = 0, jj = this.ligand.hbas.length; j < jj; ++j) {
				var l = this.ligand.hbas[j];
				if (vec3.dist(r, l) < 3.5) {
					this.hbonds.push(new HBond(r, l));
				}
			}
		}
		for (var i = 0, ii = this.receptor.hbas.length; i < ii; ++i) {
			var r = this.receptor.hbas[i];
			for (var j = 0, jj = this.ligand.hbds.length; j < jj; ++j) {
				var l = this.ligand.hbds[j];
				if (vec3.dist(r, l) < 3.5) {
					this.hbonds.push(new HBond(r, l));
				}
			}
		}
		this.ligand.fe = 0;
		for (var i = 0, ii = this.ligand.atoms.length; i < ii; ++i) {
			var l = this.ligand.atoms[i];
			if (l.isHydrogen()) continue;
			l.fe = 0;
			for (var j = 0, jj = this.receptor.atoms.length; j < jj; ++j) {
				var r = this.receptor.atoms[j];
				if (r.isHydrogen()) continue;
				var rr = vec3.dist(l, r);
				if (rr > 8) continue;
				l.fe += score(l.xs, r.xs, rr);
			}
			this.ligand.fe += l.fe;
		}
		this.ligand.le = this.ligand.fe / this.ligand.nHeavyAtoms;
		if (this.options.refresh) this.options.refresh();
	};
	iview.prototype.repaint = function() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.gl.modelViewMatrix = mat4.multiply(this.translationMatrix, this.rotationMatrix, []);
		// Draw atoms.
		this.gl.sphere.bindBuffers(this.gl);
		this.receptor.renderAtoms(this.gl);
		this.ligand.renderAtoms(this.gl);
		// Draw covalent bonds.
		this.gl.cylinder.bindBuffers(this.gl);
		this.receptor.renderBonds(this.gl);
		this.ligand.renderBonds(this.gl);
		// Draw hydrogen bonds.
		this.gl.uniform3f(this.gl.dUL, 0.2, 1.0, 0.2);
		for (var i = 0, ii = this.hbonds.length; i < ii; ++i) {
			this.hbonds[i].render(this.gl);
		}
	};
	iview.prototype.dock = function() {
		var n = 6 + this.ligand.frames.length - 1;
		var h = new Array(n * (n+1) >> 1);
		for (var i = 0, ii = h.length; i < ii; ++i) {
			h[i] = 0;
		}
		for (var i = 0; i < n; ++i) {
			h[i * (i + 3) >> 1] = 1;
		}
		while (true) {
			
			break;
		}
	}
	iview.prototype.save = function() {
		return this.ligand.save(this.center);
	}
	iview.prototype.export = function() {
		window.open(this.canvas.get(0).toDataURL('image/png'));
	};

	return iview;

})();
