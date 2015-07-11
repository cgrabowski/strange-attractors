(function() {
  var A_MAX, A_MIN, A_MORPH, B_MAX, B_MIN, B_MORPH, C_MAX, C_MIN, C_MORPH, D_MAX, D_MIN, D_MORPH, E_MAX, E_MIN, E_MORPH, F_MAX, F_MIN, F_MORPH, NUM_VERTS, REDRAWS_PER_TICK, a, b, c, canvas, d, e, f, genProgram, genShader, gl, mat, program, render, vertBuffer, verts;

  NUM_VERTS = 50000;

  REDRAWS_PER_TICK = 500;

  A_MORPH = 0.001;

  B_MORPH = 0.001;

  C_MORPH = 0.003;

  D_MORPH = 0.003;

  E_MORPH = 0;

  F_MORPH = 0;

  A_MAX = 1.55;

  B_MAX = 1.55;

  C_MAX = 1.4;

  D_MAX = 1.4;

  E_MAX = 1.4;

  F_MAX = 1.1;

  A_MIN = 1.3;

  B_MIN = 1.3;

  C_MIN = 1.35;

  D_MIN = 1.35;

  E_MIN = 1.0;

  F_MIN = 1.0;

  a = A_MIN;

  b = B_MIN;

  c = C_MIN;

  d = D_MIN;

  e = E_MIN;

  f = F_MIN;

  canvas = null;

  gl = null;

  verts = [];

  vertBuffer = null;

  program = null;

  mat = null;

  window.addEventListener('load', function() {
    var fragmentShader, i, u_matLoc, vertLoc, vertexShader, _i, _ref;
    xform.usingNamespace(this);
    Object.getOwnPropertyNames(Math).forEach(function(name, i, arr) {
      return window[name] = Math[name];
    });
    canvas = document.getElementById('gl-canvas');
    if (!(gl = canvas.getContext('experimental-webgl', {
      preserveDrawingBuffer: true
    }))) {
      throw new Error('Failed to get WebGL context');
    }
    window.dispatchEvent(new Event('resize'));
    verts.push(0);
    verts.push(0);
    verts.push(0);
    for (i = _i = 3, _ref = NUM_VERTS * 3; _i <= _ref; i = _i += 3) {
      verts.push(sin(a * verts[i - 1]) - cos(b * verts[i - 3]));
      verts.push(sin(c * verts[i - 3]) - cos(d * verts[i - 2]));
      verts.push(sin(e * verts[i - 2]) - cos(f * verts[i - 1]));
    }
    vertexShader = genShader(gl, 'vertex-shader', gl.VERTEX_SHADER);
    fragmentShader = genShader(gl, 'fragment-shader', gl.FRAGMENT_SHADER);
    program = genProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);
    vertLoc = gl.getAttribLocation(program, 'a_vertex');
    vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(vertLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertLoc);
    u_matLoc = gl.getUniformLocation(program, 'u_matrix');
    mat = new Matrix();
    mat[0] = 1 / 2;
    mat[5] = 1 / 2;
    console.log(mat);
    gl.uniformMatrix4fv(u_matLoc, false, new Float32Array(mat.transpose()));
    gl.clearColor(0, 0, 0, 0);
    return render(0);
  });

  render = (function(window) {
    var offset;
    offset = 0;
    return function(time) {
      var i, oldx, oldy, oldz, rotVec, u_matLoc, _i, _ref;
      if (time == null) {
        time = 0;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      a += A_MORPH;
      if (a >= A_MAX) {
        a = A_MIN + a - A_MAX;
      }
      b += B_MORPH;
      if (b >= B_MAX) {
        b = B_MIN + b - B_MAX;
      }
      c += C_MORPH;
      if (c >= C_MAX) {
        c = C_MIN + c - C_MAX;
      }
      d += D_MORPH;
      if (d >= D_MAX) {
        d = D_MIN + d - D_MAX;
      }
      e += E_MORPH;
      if (e >= E_MAX) {
        e = E_MIN + e - E_MAX;
      }
      f += F_MORPH;
      if (f >= F_MAX) {
        f = F_MIN + f - F_MAX;
      }
      for (i = _i = offset, _ref = offset + REDRAWS_PER_TICK * 3; _i <= _ref; i = _i += 3) {
        oldx = offset === 0 ? verts[verts.length - 3] : verts[i - 3];
        oldy = offset === 0 ? verts[verts.length - 2] : verts[i - 2];
        oldz = offset === 0 ? verts[verts.length - 1] : verts[i - 1];
        verts[i] = sin(a * oldz) - cos(b * oldx);
        verts[i + 1] = sin(c * oldx) - cos(d * oldy);
        verts[i + 2] = sin(e * oldy) - cos(f * oldz);
      }
      offset += REDRAWS_PER_TICK * 3;
      if (offset === NUM_VERTS * 3) {
        offset = 0;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
      rotVec = new Vector([1, 5, 3]).normalize();
      mat.identity().asRotation(rotVec.normalize(), time / 10000 % (2 * PI)).scale([1 / 2, 1 / 2, 1 / 2]).translate([1, 0, 0]);
      u_matLoc = gl.getUniformLocation(program, 'u_matrix');
      gl.uniformMatrix4fv(u_matLoc, false, new Float32Array(mat.transpose()));
      gl.uniform1f(gl.getUniformLocation(program, 'u_elapsed'), time);
      gl.drawArrays(gl.POINTS, 0, NUM_VERTS);
      return window.requestAnimationFrame(render);
    };
  })(window);

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return gl.viewport(canvas.left, canvas.top, canvas.width, canvas.height);
  });

  genProgram = function(gl, vertexShader, fragmentShader) {
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) === 0) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
  };

  genShader = function(gl, id, type) {
    var shader, source;
    shader = gl.createShader(type);
    source = document.getElementById(id).innerHTML;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === 0) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };

}).call(this);
