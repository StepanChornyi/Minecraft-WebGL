import { Black, ColorHelper, HSV, MathEx } from 'black-engine';
import Mesh from './mesh';
import WEBGL_UTILS from '../../utils/webgl-utils';
import Vector3 from '../../utils/vector3';

let gl = null;
let program = null;
let texture = null;

const vs = `
precision mediump float;

attribute vec3 vertPosition;
attribute float pointSize;
attribute float pointLight;

uniform mat4 mView;
uniform mat4 mProj;

varying float fragLight;

void main() {
  fragLight = pointLight;

  gl_Position =  mProj * mView * vec4(vertPosition, 1.0);
  gl_PointSize = pointSize / gl_Position.z;

  if(gl_Position.z < 0.1){
    gl_PointSize = 0.0; 
  }
}
`;

const fs = `
precision mediump float;

varying float fragLight;

void main() {
  vec3 color = vec3(1.00, 0.26, 0.58);

  gl_FragColor = vec4(color*fragLight, 1.0);
}
`;

// let matWorldUniformLocation;
let matViewUniformLocation;
let matProjUniformLocation;

class Particle {
  constructor() {
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.size = 0;
  }
}

export default class ParticlesMesh extends Mesh {
  constructor(gl_context, world) {
    gl = gl_context;

    if (!program) {
      program = WEBGL_UTILS.createProgram(gl, vs, fs);

      // matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
      matViewUniformLocation = gl.getUniformLocation(program, 'mView');
      matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    }

    super(gl, program);

    this.world = world;

    this._particles = [];
  }

  emit(x, y, z) {
    const p = new Particle();

    p.position.set(x, y, z);
    p.velocity.set(range(0.01), 0.02 + Math.random() * 0.08, range(0.01));
    p.size = btw(30, 50);

    this._particles.push(p);
  }

  _update() {
    const particles = [];

    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];

      p.size -= 0.3;

      if (p.size <= 1) {
        continue;
      }

      p.velocity.addXYZ(0, -0.006, 0);
      p.velocity.multiplyScalar(0.99);

      p.position.add(p.velocity);

      particles.push(p);
    }

    this._particles = particles;

    this.vertices.splice(0);

    for (let i = 0, p; i < particles.length; i++) {
      p = particles[i];

      this.vertices.push(
        p.position.x,
        p.position.y,
        p.position.z,
        p.size,
        0.1 + (this.world.getLight(Math.floor(p.position.x), Math.floor(p.position.y), Math.floor(p.position.z)) / 15) * 0.9
      );
    }

    if (particles.length)
      this.drawBuffersData();
  }

  drawBuffersData() {
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);

    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.DYNAMIC_DRAW);
  }

  render(camera, blockIndex = null) {
    this._update();

    if (!this.vertices.length)
      return;

    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    gl.disable(gl.BLEND);
    gl.colorMask(true, true, true, false);

    this.updateAttribPointers();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, camera.projectionMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, camera.viewMatrix);
    // gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, this.transformMatrix);

    gl.drawArrays(gl.POINTS, 0, this.vertices.length / 5);
  }

  updateAttribPointers() {
    super.updateAttribPointers();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const sizeAttribLocation = gl.getAttribLocation(program, 'pointSize');
    const lightAttribLocation = gl.getAttribLocation(program, 'pointLight');

    gl.vertexAttribPointer(
      positionAttribLocation,
      3,
      gl.FLOAT,
      gl.FALSE,
      5 * Float32Array.BYTES_PER_ELEMENT,
      0
    );

    gl.vertexAttribPointer(
      sizeAttribLocation,
      1,
      gl.FLOAT,
      gl.FALSE,
      5 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.vertexAttribPointer(
      lightAttribLocation,
      1,
      gl.FLOAT,
      gl.FALSE,
      5 * Float32Array.BYTES_PER_ELEMENT,
      4 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(sizeAttribLocation);
    gl.enableVertexAttribArray(lightAttribLocation);
  }
}

function btw(min, max) {
  return min + Math.random() * (max - min);
}

function range(val) {
  return (Math.random() * 2 - 1) * val;
}