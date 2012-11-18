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

	COVALENT = [];
	COVALENT['H' ] = 0.407;
	COVALENT['HD'] = 0.407;
	COVALENT['C' ] = 0.847;
	COVALENT['A' ] = 0.847;
	COVALENT['N' ] = 0.825;
	COVALENT['NA'] = 0.825;
	COVALENT['OA'] = 0.803;
	COVALENT['S' ] = 1.122;
	COVALENT['SA'] = 1.122;
	COVALENT['Se'] = 1.276;
	COVALENT['P' ] = 1.166;
	COVALENT['F' ] = 0.781;
	COVALENT['Cl'] = 1.089;
	COVALENT['Br'] = 1.254;
	COVALENT['I' ] = 1.463;
	COVALENT['Zn'] = 1.441;
	COVALENT['Fe'] = 1.375;
	COVALENT['Mg'] = 1.430;
	COVALENT['Ca'] = 1.914;
	COVALENT['Mn'] = 1.529;
	COVALENT['Cu'] = 1.518;
	COVALENT['Na'] = 1.694;
	COVALENT['K' ] = 2.156;
	COVALENT['Hg'] = 1.639;
	COVALENT['Ni'] = 1.331;
	COVALENT['Co'] = 1.386;
	COVALENT['Cd'] = 1.628;
	COVALENT['As'] = 1.309;
	COVALENT['Sr'] = 2.112;

	AD2XS = [];
	AD2XS['C' ] =   'C_H';
	AD2XS['A' ] =   'C_H';
	AD2XS['N' ] =   'N_P';
	AD2XS['NA'] =   'N_A';
	AD2XS['OA'] =   'O_A';
	AD2XS['S' ] =   'S_P';
	AD2XS['SA'] =   'S_P';
	AD2XS['Se'] =   'S_P';
	AD2XS['P' ] =   'P_P';
	AD2XS['F' ] =   'F_H';
	AD2XS['Cl'] =  'Cl_H';
	AD2XS['Br'] =  'Br_H';
	AD2XS['I' ] =   'I_H';
	AD2XS['Zn'] = 'Met_D';
	AD2XS['Fe'] = 'Met_D';
	AD2XS['Mg'] = 'Met_D';
	AD2XS['Ca'] = 'Met_D';
	AD2XS['Mn'] = 'Met_D';
	AD2XS['Cu'] = 'Met_D';
	AD2XS['Na'] = 'Met_D';
	AD2XS['K' ] = 'Met_D';
	AD2XS['Hg'] = 'Met_D';
	AD2XS['Ni'] = 'Met_D';
	AD2XS['Co'] = 'Met_D';
	AD2XS['Cd'] = 'Met_D';
	AD2XS['As'] = 'Met_D';
	AD2XS['Sr'] = 'Met_D';

	VDW = [];
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

	function Color(color) {
		this.r = parseInt(color.substring(1, 3), 16) / 255.0;
		this.g = parseInt(color.substring(3, 5), 16) / 255.0;
		this.b = parseInt(color.substring(5, 7), 16) / 255.0;
	}

	R = [];
	R['H' ] = new Color('#FFFFFF');
	R['HD'] = new Color('#FFFFFF');
	R['C' ] = new Color('#909090');
	R['A' ] = new Color('#909090');
	R['N' ] = new Color('#3050F8');
	R['NA'] = new Color('#3050F8');
	R['OA'] = new Color('#FF0D0D');
	R['S' ] = new Color('#FFFF30');
	R['SA'] = new Color('#FFFF30');
	R['Se'] = new Color('#FFA100');
	R['P' ] = new Color('#FF8000');
	R['F' ] = new Color('#90E050');
	R['Cl'] = new Color('#1FF01F');
	R['Br'] = new Color('#A62929');
	R['I' ] = new Color('#940094');
	R['Zn'] = new Color('#7D80B0');
	R['Fe'] = new Color('#E06633');
	R['Mg'] = new Color('#8AFF00');
	R['Ca'] = new Color('#3DFF00');
	R['Mn'] = new Color('#9C7AC7');
	R['Cu'] = new Color('#C88033');
	R['Na'] = new Color('#AB5CF2');
	R['K' ] = new Color('#8F40D4');
	R['Hg'] = new Color('#B8B8D0');
	R['Ni'] = new Color('#50D050');
	R['Co'] = new Color('#F090A0');
	R['Cd'] = new Color('#FFD98F');
	R['As'] = new Color('#BD80E3');
	R['Sr'] = new Color('#00FF00');
	
	L = [];
	L['H' ] = new Color('#E6E6E6');
	L['HD'] = new Color('#E6E6E6');
	L['C' ] = new Color('#33FF33');
	L['A' ] = new Color('#33FF33');
	L['N' ] = new Color('#3333FF');
	L['NA'] = new Color('#3333FF');
	L['OA'] = new Color('#FF4D4D');
	L['S' ] = new Color('#E6C640');
	L['SA'] = new Color('#E6C640');
	L['Se'] = new Color('#FFA100');
	L['P' ] = new Color('#FF8000');
	L['F' ] = new Color('#B3FFFF');
	L['Cl'] = new Color('#1FF01F');
	L['Br'] = new Color('#A62929');
	L['I' ] = new Color('#940094');

	Atom = function(id, coord, ad) {
		this.id = id;
		vec3.set(coord, this);
		this.ad = ad;
		this.xs = AD2XS[ad];
		this.isHydrogen = function() {
			return (this.ad === 'H') || (this.ad === 'HD');
		}
		this.isHBD = function() {
			return (this.ad === 'HD') || (this.xs === 'Met_D');
		}
		this.isHBA = function() {
			return (this.ad === 'NA') || (this.ad === 'OA') || (this.ad === 'SA');
		}
		this.isHetero = function() {
			return !((this.ad === 'H') || (this.ad === 'HD') || (this.ad === 'C') || (this.ad === 'A'));
		}
		this.donorize = function() {
			switch (this.xs) {
				case 'N_P' : this.xs = 'N_D';  break;
				case 'N_A' : this.xs = 'N_DA'; break;
				case 'O_A' : this.xs = 'O_DA'; break;
			}
		}
		this.isNeighbor = function(a) {
			return (vec3.dist(this, a) < COVALENT[this.ad] + COVALENT[a.ad]);
		}
		this.render = function(gl, C) {
			var e = C[this.ad];
			gl.uniform3f(gl.dUL, e.r, e.g, e.b);
			gl.setModelViewMatrix(mat4.scale(mat4.translate(gl.modelViewMatrix, this, []), [0.3, 0.3, 0.3], []));
			gl.drawElements(gl.TRIANGLES, gl.sphere.vertexIndexBuffer.size, gl.UNSIGNED_SHORT, 0);
		};
	};

	Bond = function(a1, a2) {
		this.a1 = a1;
		this.a2 = a2;
		this.render = function(gl, C) {
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
			var e1 = C[this.a1.ad];
			gl.uniform3f(gl.dUL, e1.r, e1.g, e1.b);
			gl.setModelViewMatrix(mat4.scale(mat4.rotate(mat4.translate(gl.modelViewMatrix, this.a1, []), ang, axis, []), scaleVector, []));
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinder.vertexPositionBuffer.size);
			// Draw the other half.
			var e2 = C[this.a2.ad];
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

	Molecule = function(C) {
		this.atoms = [];
		this.bonds = [];
		this.hbds = [];
		this.hbas = [];
		this.C = C;
	};
	Molecule.prototype.renderAtoms = function(gl) {
		for (var i = 0, ii = this.atoms.length; i < ii; ++i) {
			var a = this.atoms[i];
			if (a.hidden) continue;
			a.render(gl, this.C);
		}
	};
	Molecule.prototype.renderBonds = function(gl) {
		for (var i = 0, ii = this.bonds.length; i < ii; ++i) {
			var b = this.bonds[i];
			if (b.a1.hidden || b.a2.hidden) continue;
			b.render(gl, this.C);
		}
	};

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

	function hydrophobicXS(xs) {
		return     xs ===  'C_H'
			|| xs ===  'F_H'
			|| xs === 'Cl_H'
			|| xs === 'Br_H'
			|| xs ===  'I_H';
	}
	function hbdonorXS(xs) {
		return     xs === 'N_D'
			|| xs === 'N_DA'
			|| xs === 'O_DA'
			|| xs === 'Met_D';
	}
	function hbacceptorXS(xs) {
		return     xs === 'N_A'
			|| xs === 'N_DA'
			|| xs === 'O_A'
			|| xs === 'O_DA';
	}
	function score(xs1, xs2, r) {
		var d = r - (VDW[xs1] + VDW[xs2]);
		return (-0.035579) * Math.exp(-4 * d * d)
			+  (-0.005156) * Math.exp(-0.25 * (d - 3.0) * (d - 3.0))
			+  ( 0.840245) * (d > 0 ? 0.0 : d * d)
			+  (-0.035069) * ((hydrophobicXS(xs1) && hydrophobicXS(xs2)) ? ((d >= 1.5) ? 0.0 : ((d <= 0.5) ? 1.0 : 1.5 - d)) : 0.0)
			+  (-0.587439) * (((hbdonorXS(xs1) && hbacceptorXS(xs2)) || (hbdonorXS(xs2) && hbacceptorXS(xs1))) ? ((d >= 0) ? 0.0 : ((d <= -0.7) ? 1 : d * (-1.428571))): 0.0);
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
		this.receptor = new Molecule(R);
		var residues = [];
		for (var residue = 'XXXX', lines = content.split('\n'), kk = lines.length, k = 0; k < kk; ++k) {
			var line = lines[k];
			if (line.match('^ATOM|HETATM')) {
				if (!((line[25] === residue[3]) && (line[24] === residue[2]) && (line[23] === residue[1]) && (line[22] === residue[0]))) {
					residue = line.substring(22, 26);
					residues.push(this.receptor.atoms.length);
				}
				var a = new Atom(line[21] + ':' + line.substring(17, 20) + $.trim(line.substring(22, 26)) + ':' + $.trim(line.substring(12, 16)), [parseFloat(line.substring(30, 38)), parseFloat(line.substring(38, 46)), parseFloat(line.substring(46, 54))], $.trim(line.substring(77, 79)));
				if (a.ad === 'H') {
					if (this.options.hideNonPolarHydrogens) continue;
				} else if (a.ad === 'HD') {
					for (var i = this.receptor.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.receptor.atoms[--i];
						if (b.isNeighbor(a)) {
							b.donorize();
							break;
						}
					}
				} else if (a.ad === 'C' || a.ad === 'A') {
					for (var i = this.receptor.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.receptor.atoms[--i];
						if ((!(b.ad === 'C' || b.ad === 'A')) && b.isNeighbor(a))
						{
							a.xs = 'C_P';
							break;
						}
					}
				} else {
					for (var i = this.receptor.atoms.length, residue_start = residues[residues.length - 1]; i > residue_start;) {
						var b = this.receptor.atoms[--i];
						if ((b.ad === 'C' || b.ad === 'A') && b.isNeighbor(a))
						{
							b.xs = 'C_P';
						}
					}
				}
				this.receptor.atoms.push(a);
			} else if (line.match('^TER')) {
				residue = 'XXXX';
			}
		}
		residues.push(this.receptor.atoms.length);
		for (var r = 0, rr = residues.length - 1; r < rr; ++r) {
			var hidden = true;
			for (var i = residues[r], ii = residues[r + 1]; i < ii; ++i) {
				var a = this.receptor.atoms[i];
				if ((this.corner1[0] <= a[0]) && (a[0] < this.corner2[0]) && (this.corner1[1] <= a[1]) && (a[1] < this.corner2[1]) && (this.corner1[2] <= a[2]) && (a[2] < this.corner2[2])) {
					hidden = false;
					break;
				}
			}
			for (var i = residues[r], ii = residues[r + 1]; i < ii; ++i) {
				var a1 = this.receptor.atoms[i];
				if (hidden) {
					a1.hidden = true;
					continue;
				}
				for (var j = i + 1; j < ii; ++j) {
					var a2 = this.receptor.atoms[j];
					if (a2.isNeighbor(a1)) {
						this.receptor.bonds.push(new Bond(a1, a2));
					}
				}
			}
		}
		for (var i = 0, ii = this.receptor.atoms.length; i < ii; ++i) {
			var a = this.receptor.atoms[i];
			vec3.subtract(a, this.center);
			if (a.hidden) continue;
			if (a.isHBD()) this.receptor.hbds.push(a);
			else if (a.isHBA()) this.receptor.hbas.push(a);
		}
	};
	iview.prototype.parseLigand = function(content) {
		this.ligand = new Molecule(L);
		var current = {
			begin: 0
		};
		this.ligand.frames = [current];
		var serials = [];
		for (var lines = content.split('\n'), kk = lines.length, k = 0; k < kk; ++k) {
			var line = lines[k];
			if (line.match('^ATOM|HETATM')) {
				var a = new Atom($.trim(line.substring(12, 16)), [parseFloat(line.substring(30, 38)), parseFloat(line.substring(38, 46)), parseFloat(line.substring(46, 54))], $.trim(line.substring(77, 79)));
				a.serial = line.substring(6, 11);
				if (a.ad === 'H') {
					if (this.options.hideNonPolarHydrogens) {
						a.hidden = true;
					}
				} else if (a.ad === 'HD') {
					for (var i = this.ligand.atoms.length, frame_begin = this.ligand.frames[this.ligand.frames.length - 1]; i > frame_begin;) {
						var b = this.ligand.atoms[--i];
						if (b.isNeighbor(a)) {
							b.donorize();
							break;
						}
					}
				} else if (a.ad === 'C' || a.ad === 'A') {
					for (var i = this.ligand.atoms.length, frame_begin = this.ligand.frames[this.ligand.frames.length - 1]; i > frame_begin;)
					{
						var b = this.ligand.atoms[--i];
						if ((!(b.ad === 'C' || b.ad === 'A')) && b.isNeighbor(a))
						{
							a.xs = 'C_P';
							break;
						}
					}
					serials[parseInt(a.serial)] = a;
				} else {
					for (var i = this.ligand.atoms.length, frame_begin = this.ligand.frames[this.ligand.frames.length - 1]; i > frame_begin;) {
						var b = this.ligand.atoms[--i];
						if ((b.ad === 'C' || b.ad === 'A') && b.isNeighbor(a))
						{
							b.xs = 'C_P';
						}
					}
					serials[parseInt(a.serial)] = a;
				}
				this.ligand.atoms.push(a);
			} else if (line.match('^BRANCH')) {
				this.ligand.frames[this.ligand.frames.length - 1].end = this.ligand.atoms.length;
				this.ligand.frames.push({
					parent: current,
					begin: this.ligand.atoms.length,
					rotorX: serials[parseInt(line.substring(6, 10))]
				});
				current = this.ligand.frames[this.ligand.frames.length - 1];
			} else if (line.match('^ENDBRANCH')) {
				current.rotorY = serials[(parseInt(line.substring(13, 17)))];
				this.ligand.bonds.push(new Bond(current.rotorX, current.rotorY));
				if (!(current.rotorY.ad === 'C' || current.rotorY.ad === 'A') && (current.rotorX.ad === 'C' || current.rotorX.ad === 'A')) current.rotorX.xs = 'C_P';
				if (!(current.rotorX.ad === 'C' || current.rotorX.ad === 'A') && (current.rotorY.ad === 'C' || current.rotorY.ad === 'A')) current.rotorY.xs = 'C_P';
				current = current.parent;
			} else if (line.match('^ENDMDL')) break;
		}
		this.ligand.frames[this.ligand.frames.length - 1].end = this.ligand.atoms.length;
		for (var f = 0, ff = this.ligand.frames.length - 1; f < ff; ++f) {
			for (var i = this.ligand.frames[f].begin, ii = this.ligand.frames[f].end; i < ii; ++i) {
				var a1 = this.ligand.atoms[i];
				for (var j = i + 1; j < ii; ++j) {
					var a2 = this.ligand.atoms[j];
					if (a2.isNeighbor(a1)) {
						this.ligand.bonds.push(new Bond(a1, a2));
					}
				}
			}
		}
		for (var i = 0, ii = this.ligand.atoms.length; i < ii; ++i) {
			var a = this.ligand.atoms[i];
			vec3.subtract(a, this.center);
			if (a.isHBD()) this.ligand.hbds.push(a);
			else if (a.isHBA()) this.ligand.hbas.push(a);
		}
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
			if (l.ad === 'H' || l.ad === 'HD') continue;
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
	iview.prototype.png = function() {
		window.open(this.canvas.get(0).toDataURL('image/png'));
	};

	return iview;

})();
