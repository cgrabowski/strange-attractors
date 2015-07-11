NUM_VERTS = 750000
REDRAWS_PER_TICK = 25000

A_MORPH = 0.001
B_MORPH = 0.001
C_MORPH = 0.003
D_MORPH = 0.003
E_MORPH = 0
F_MORPH = 0

A_MAX = 1.55
B_MAX = 1.55
C_MAX = 1.4
D_MAX = 1.4
E_MAX = 1.4
F_MAX = 1.1

A_MIN = 1.3
B_MIN = 1.3
C_MIN = 1.35
D_MIN = 1.35
E_MIN = 1.0
F_MIN = 1.0

a = A_MIN
b = B_MIN
c = C_MIN
d = D_MIN
e = E_MIN
f = F_MIN

canvas = null
gl = null
verts = []
vertBuffer = null
program = null
mat = null

window.addEventListener 'load', () ->
  xform.usingNamespace(this)
  Object.getOwnPropertyNames(Math).forEach (name, i, arr) -> window[name] = Math[name]

  canvas = document.getElementById 'gl-canvas'
  unless gl = canvas.getContext 'experimental-webgl', {preserveDrawingBuffer: true}
    throw new Error 'Failed to get WebGL context'
  window.dispatchEvent new Event 'resize'

  verts.push 0
  verts.push 0
  verts.push 0
  for i in [3..NUM_VERTS * 3] by 3
    verts.push(sin(a * verts[i - 1]) - cos(b * verts[i - 3]))
    verts.push(sin(c * verts[i - 3]) - cos(d * verts[i - 2]))
    verts.push(sin(e * verts[i - 2]) - cos(f * verts[i - 1]))

  vertexShader = genShader gl, 'vertex-shader', gl.VERTEX_SHADER
  fragmentShader = genShader gl, 'fragment-shader', gl.FRAGMENT_SHADER
  program = genProgram gl, vertexShader, fragmentShader
  gl.useProgram program

  vertLoc = gl.getAttribLocation program, 'a_vertex'
  vertBuffer = gl.createBuffer()
  gl.bindBuffer gl.ARRAY_BUFFER, vertBuffer
  gl.bufferData gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW
  gl.vertexAttribPointer vertLoc, 3, gl.FLOAT, false, 0, 0
  gl.enableVertexAttribArray vertLoc

  u_matLoc = gl.getUniformLocation program, 'u_matrix'
  mat = new Matrix()
  mat[0] = 1/2
  mat[5] = 1/2
  console.log mat
  gl.uniformMatrix4fv(u_matLoc, false, new Float32Array(mat.transpose()))

  gl.clearColor 0, 0, 0, 0

  render(0)

render = do (window = window) ->
  offset = 0
  (time = 0) ->
    gl.clear gl.COLOR_BUFFER_BIT

    a += A_MORPH
    a = A_MIN + a - A_MAX if a >= A_MAX
    b += B_MORPH
    b = B_MIN + b - B_MAX if b >= B_MAX
    c += C_MORPH
    c = C_MIN + c - C_MAX if c >= C_MAX
    d += D_MORPH
    d = D_MIN + d - D_MAX if d >= D_MAX
    e += E_MORPH
    e = E_MIN + e - E_MAX if e >= E_MAX
    f += F_MORPH
    f = F_MIN + f - F_MAX if f >= F_MAX

    for i in [offset..offset + REDRAWS_PER_TICK * 3] by 3
      oldx = if offset is 0 then verts[verts.length - 3] else verts[i - 3]
      oldy = if offset is 0 then verts[verts.length - 2] else verts[i - 2]
      oldz = if offset is 0 then verts[verts.length - 1] else verts[i - 1]
      verts[i] = (sin(a * oldz) - cos(b * oldx))
      verts[i + 1] = (sin(c * oldx) - cos(d * oldy))
      verts[i + 2] = (sin(e * oldy) - cos(f * oldz))

    offset += REDRAWS_PER_TICK * 3
    offset = 0 if offset is NUM_VERTS * 3

    gl.bindBuffer gl.ARRAY_BUFFER, vertBuffer
    gl.bufferData gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW

    rotVec = new Vector([1,5,3]).normalize()
    mat.identity()
      .asRotation(rotVec.normalize(), time / 10000 % (2 * PI))
      .scale([1/2, 1/2, 1/2])
      .translate([1, 0, 0])

    u_matLoc = gl.getUniformLocation program, 'u_matrix'
    gl.uniformMatrix4fv(u_matLoc, false, new Float32Array(mat.transpose()));
    gl.uniform1f gl.getUniformLocation(program, 'u_elapsed'), time
    gl.drawArrays gl.POINTS, 0, NUM_VERTS
    window.requestAnimationFrame render

window.addEventListener 'resize', () ->
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  gl.viewport canvas.left, canvas.top, canvas.width, canvas.height

genProgram = (gl, vertexShader, fragmentShader) ->
  program = gl.createProgram()
  gl.attachShader program, vertexShader
  gl.attachShader program, fragmentShader
  gl.linkProgram program
  if gl.getProgramParameter(program, gl.LINK_STATUS) is 0
    throw new Error(gl.getProgramInfoLog program)
  program

genShader = (gl, id, type) ->
  shader = gl.createShader type
  source = document.getElementById(id).innerHTML
  gl.shaderSource shader, source
  gl.compileShader shader
  if gl.getShaderParameter(shader, gl.COMPILE_STATUS) is 0
    throw new Error(gl.getShaderInfoLog shader)
  shader
