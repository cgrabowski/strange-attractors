(function(window, undefined) {

  var canvas;
  var gl;
  var numPoints;

  window.addEventListener('load', function() {
    xform.usingNamespace(this);

    Object.getOwnPropertyNames(Math).forEach(function(name, i, arr) {
      window[name] = Math[name];
    });

    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas) || (function() {
      throw new Error('Failed to get WebGL context.');
    }());
    window.dispatchEvent(new Event('resize'));

    var colors = [];
    var verts = [];
    var theta = 0
    for (var radius = 60.0; radius > 1.0; radius -= 0.3) {
      colors.push(radius / 60.0, 0.3, 1 - (radius / 60.0));
      verts.push(200 + radius * Math.cos(theta), 200 + radius * Math.sin(theta));
      theta += 0.1;
    }
    numPoints = colors.length / 3;

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    var vertexShader = genShader(gl, 'vertex-shader', gl.VERTEX_SHADER);
    var fragmentShader = genShader(gl, 'fragment-shader', gl.FRAGMENT_SHADER)
    var program = genProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // look up the locations for the inputs to our shaders.
    var u_matLoc = gl.getUniformLocation(program, 'u_matrix');
    var colorLoc = gl.getAttribLocation(program, 'a_color');
    var vertLoc = gl.getAttribLocation(program, 'a_vertex');

    // Set the matrix to some that makes 1 unit 1 pixel.
    gl.uniformMatrix4fv(u_matLoc, false, [
      2 / window.innerWidth, 0, 0, 0,
      0, 2 / window.innerHeight, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    // Tell the shader how to get data out of the buffers.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertLoc);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);

    render(0);
  });

  function render(time) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, numPoints);

    window.requestAnimFrame(render);
  }

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(canvas.left, canvas.top, canvas.width, canvas.height);
    //projection.asPerspective(1, 200, canvas.width / canvas.height, Math.PI / 6);
  });

}(window));
