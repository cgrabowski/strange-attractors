function PointLight(pos, spec, diff, amb) {
  this.position = pos || new Vector([0, 0, 0]);
  this.specular = spec || new Vector([0, 0, 0]);
  this.diffuse = diff || new Vector([0, 0, 0]);
  this.ambient = amb || new Vector([0, 0, 0]);
}

function Geometry(program) {
  this.attributes = this.attributes || {};
  this.buffers = this.buffers || {};

  this.buffers.aPosition = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aPosition);
  gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.vertices), gl.STATIC_DRAW);
  this.attributes.aPosition = gl.getAttribLocation(this.program, 'aPosition');

  if (this.normals != null) {
    this.buffers.aNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aNormal);
    gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.normals), gl.STATIC_DRAW);
    this.attributes.aNormal = gl.getAttribLocation(this.program, 'aNormal');
  }

  if (this.uvs != null) {
    this.buffers.aUV = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aUV);
    gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.uvs), gl.STATIC_DRAW);
    this.attributes.aUV = gl.getAttribLocation(this.program, 'aUV');
  }

  if (this.colors != null) {
    this.buffers.aColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aColor);
    gl.bufferData(gl.ARRAY_BUFFER, Vector.flatten(this.colors), gl.STATIC_DRAW);
    this.attributes.aColor = gl.getAttribLocation(this.program, 'aColor');
  }
}
Geometry.prototype.bind = function() {
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aPosition);
  gl.vertexAttribPointer(this.attributes.aPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.attributes.aPosition);

  if (this.normals != null) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aNormal);
    gl.vertexAttribPointer(this.attributes.aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attributes.aNormal);
  }

  if (this.uvs != null) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aUV);
    gl.vertexAttribPointer(this.attributes.aUV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attributes.aUV);
  }

  if (this.colors != null) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.aColor);
    gl.vertexAttribPointer(this.attributes.aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attributes.aColor);
  }
};

function QuadraticBezier(p0, p1, p2, res) {
  this.vertices = [];
  for (var i = 0; i < res; ++i) {
    var t = i / res;
    this.vertices.push(new Vector([
      Math.pow(1 - t, 2) * p0[0] + (1 - t) * 2 * t * p1[0] + t * t * p2[0],
      Math.pow(1 - t, 2) * p0[1] + (1 - t) * 2 * t * p1[1] + t * t * p2[1],
      0.0,
      1.0
    ]));
  }
}



function CubicBezier(p0, p1, p2, p3, res) {
  this.vertices = this.vertices || [];
  var p = Math.pow;
  for (var i = 0; i < res; ++i) {
    var t = i / res;
    this.vertices.push(new Vector([
      p(1 - t, 3) * p0[0] +
      p(1 - t, 2) * 3 * t * p1[0] +
      (1 - t) * 3 * t * t * p2[0] +
      t * t * t * p3[0],

      p(1 - t, 3) * p0[1] +
      p(1 - t, 2) * 3 * t * p1[1] +
      (1 - t) * 3 * t * t * p2[1] +
      t * t * t * p3[1],

      0.0,
      1.0
    ]));
  }
}



function QuadGeometry(width, height, program) {
  width = width || 1.0;
  height = height || 1.0;
  var hw = width / 2;
  var hh = height / 2;

  this.model = new Matrix();

  this.vertices = [
    new Vector([-hw, hh, 0.0, 1.0]),
    new Vector([hw, hh, 0.0, 1.0]),
    new Vector([-hw, -hh, 0.0, 1.0]),
    new Vector([hw, -hh, 0.0, 1.0])
  ];
  this.normals = [
    new Vector([0.0, 0.0, 1.0]),
    new Vector([0.0, 0.0, 1.0]),
    new Vector([0.0, 0.0, 1.0]),
    new Vector([0.0, 0.0, 1.0])
  ];
  this.uvs = [
    new Vector([0.0, 0.0]),
    new Vector([1.0, 0.0]),
    new Vector([0.0, 1.0]),
    new Vector([1.0, 1.0])
  ];

  Geometry.call(this, program);
}
QuadGeometry.prototype = Object.create(Geometry.prototype);
QuadGeometry.prototype.constructor = QuadGeometry;



function PolygonGeometry(radius, sides, program) {
  this.program = program;
  this.model = new Matrix();

  this.vertices = [];
  this.normals = [];
  this.uvs = [];
  this.attributes = {};
  this.buffers = {};

  this.uniforms = this.uniforms || {};
  this.uniforms.uMVP = gl.getUniformLocation(this.program, 'uMVP');

  var s = Math.sin;
  var c = Math.cos;
  var pi = Math.PI;
  var t = 2 * pi / (sides - 1);

  this.vertices.push(new Vector([0.0, 0.0, 0.0, 1.0]));
  this.normals.push(new Vector([0.0, 0.0, 1.0]));
  this.uvs.push(new Vector([0.5, 0.5]));

  for (var i = 0; i < sides; ++i) {
    var x = radius * c(t * i);
    var y = radius * s(t * i);

    this.vertices.push(new Vector([x, y, 0.0, 1.0]));
    this.normals.push(new Vector([0.0, 0.0, 1.0]));
    this.uvs.push(new Vector([(x + 1) / 2, (y + 1) / 2]));
  }

  Geometry.call(this, program);
}
PolygonGeometry.prototype = Object.create(Geometry.prototype);
PolygonGeometry.prototype.constructor = PolygonGeometry;



function ColorMaterial() {
  var vertexShader = genShader('terp-color-vertex-shader', gl.VERTEX_SHADER);
  var fragmentShader = genShader('terp-color-fragment-shader', gl.FRAGMENT_SHADER);
  this.program = genProgram(vertexShader, fragmentShader);
  gl.useProgram(this.program);

  this.uniforms = {
    uMVP: gl.getUniformLocation(this.program, 'uMVP'),
    uMV: gl.getUniformLocation(this.program, 'uMV'),
    uText: gl.getUniformLocation(this.program, 'uText'),
    uCamPos: gl.getUniformLocation(this.program, 'uCamPos'),
    uNormal: gl.getUniformLocation(this.program, 'uNormal')
  };
}



function ReflectMaterial() {
  var vertexShader = genShader('reflect-vertex-shader', gl.VERTEX_SHADER);
  var fragmentShader = genShader('reflect-fragment-shader', gl.FRAGMENT_SHADER);
  this.program = genProgram(vertexShader, fragmentShader);
  gl.useProgram(this.program);

  this.uniforms = {
    uMVP: gl.getUniformLocation(this.program, 'uMVP'),
    uMV: gl.getUniformLocation(this.program, 'uMV'),
    uText: gl.getUniformLocation(this.program, 'uText'),
    uCamPos: gl.getUniformLocation(this.program, 'uCamPos'),
    uNormal: gl.getUniformLocation(this.program, 'uNormal')
  };
}


function TextureMaterial() {
  var vertexShader = genShader('texture-vertex-shader', gl.VERTEX_SHADER);
  var fragmentShader = genShader('texture-fragment-shader', gl.FRAGMENT_SHADER);
  this.program = genProgram(vertexShader, fragmentShader);
  gl.useProgram(this.program);

  this.uniforms = {
    uMVP: gl.getUniformLocation(this.program, 'uMVP'),
    uText: gl.getUniformLocation(this.program, 'uText'),
  };
}

function PhongMaterial() {
  var vertexShader = genShader('phong-vertex-shader', gl.VERTEX_SHADER);
  var fragmentShader = genShader('phong-fragment-shader', gl.FRAGMENT_SHADER);
  this.program = genProgram(vertexShader, fragmentShader);
  gl.useProgram(this.program);

  this.uniforms = {
    uNormalMat: gl.getUniformLocation(this.program, 'uNormalMat'),
    uMVP: gl.getUniformLocation(this.program, 'uMVP'),
    uLightPos: gl.getUniformLocation(this.program, 'uLightPos'),
    uLightColor: gl.getUniformLocation(this.program, 'uLightColor'),
    uCamPos: gl.getUniformLocation(this.program, 'uCamPos')
  };
}

function ReflectPolygonMesh(width, height) {
  ReflectMaterial.call(this);
  PolygonGeometry.call(this, width, height, this.program);
  this.normal = this.normals[0];
  this.normals = null;
  this.uvs = null;
}
ReflectPolygonMesh.prototype = Object.create(PolygonGeometry.prototype);
ReflectPolygonMesh.prototype.constructor = ReflectPolygonMesh;
ReflectPolygonMesh.prototype.render = function() {
  gl.useProgram(this.program);
  this.bind();
  gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length);
};



function TexturedQuadMesh(width, height) {
  TextureMaterial.call(this);
  QuadGeometry.call(this, width, height, this.program);
  this.normals = null;
}
TexturedQuadMesh.prototype = Object.create(QuadGeometry.prototype);
TexturedQuadMesh.prototype.constructor = TexturedQuadMesh;
TexturedQuadMesh.prototype.render = function() {
  gl.useProgram(this.program);
  this.bind();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};



var TextureManager = (function() {
  var _textures = [];
  var _gl;

  function _createTexture(image) {
    var texture = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, texture);
    //_gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    return texture;
  }

  return {
    setGL: function(gl) {
      _gl = gl;
    },
    create: function(imageOrArrayOfImages) {
      // one parameter: one image or an array of images
      if (arguments[0] instanceof Array) {
        var firstHandle = _textures.length;

        for (var i = 0; i < imageArg.length; i++) {
          _textures.push(_createTexture(arguments[0][i]));
        }
        return firstHandle;
      } else {
        _textures.push(_createTexture(arguments[0]));
        return _textures.length - 1;
      }
    },
    bind: function(index) {

      _gl.bindTexture(_gl.TEXTURE_2D, _textures[index]);
    },
    replace: function(image, index) {
      var oldTexture = _textures[index];

      _textures[index] = createTexture(image);
      _gl.deleteTexture(oldTexture);
      return _textures[index];
    },
    dispose: function(index) {
      _gl.deleteTexture(_textures[index]);
      _textures.splice(index, 1);
    },
    disposeAll: function() {
      for (var i = 0; i < _textures.length; i++) {;
        _gl.deleteTexture(_textures[i]);
      }
      _textures = [];
    },
  };

}());

function genProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) === 0) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  return program;
}

function genShader(gl, id, type) {
  var shader = gl.createShader(type);
  var source = document.getElementById(id).innerHTML;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === 0) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}
