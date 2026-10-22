// Pixel fire: a four-frame flame painted in code (white-gold heart, amber body, ember tips; no saturated red), drawn as
// billboarded instances that flicker through their frames on the GPU, each with its own phase. Unlit and over-bright, so
// the bloom carries them.
import * as THREE from 'three';
import { PixelCanvas, hash2, bayer } from '../../engine/pixel/paint.js';

const FW = 16, FH = 28, N = 4;
const RAMP = ['#7a3a1c', '#c9773c', '#f0a048', '#ffc860', '#ffe6a0', '#fff8e0'];

function paintFlameSheet(seed = 5) {
  const pc = new PixelCanvas(FW * N, FH);
  for (let f = 0; f < N; f++) {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const v = 1 - y / (FH - 1);                       // 0 at the base, 1 at the tip
      const sway = Math.sin(v * 4.2 + f * 1.6) * v * 2.2 + (hash2(f, y >> 2, seed) - 0.5) * v * 1.6;
      const half = (1 - Math.pow(v, 0.8)) * 6.4 + 0.6;
      const dx = (x + 0.5 - 8 - sway) / half;
      const tongue = (hash2(x >> 1, (y + f * 3) >> 2, seed + f) - 0.5) * 0.5 * v;
      const d = Math.abs(dx) + tongue;
      if (d > 1 || y > FH - 2) continue;
      const heat = (1 - d) * (1 - v * 0.75) + (y > FH - 6 ? 0.25 : 0);
      const t = Math.max(0, Math.min(1, heat * 1.35));
      const i = Math.min(RAMP.length - 1, Math.floor(t * (RAMP.length - 1) + bayer(x, y) * 0.9));
      pc.set(f * FW + x, y, RAMP[i]);
    }
  }
  return pc;
}

export class Flames {
  constructor(scene, max = 24) {
    const tex = paintFlameSheet().texture({ repeat: false, mips: false });
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    const geo = new THREE.PlaneGeometry(1, FH / FW); geo.translate(0, FH / FW / 2, 0);
    this.phase = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    for (let i = 0; i < max; i++) this.phase.setX(i, Math.random() * 10);
    geo.setAttribute('aPhase', this.phase);
    this.uniforms = { uTime: { value: 0 }, uI: { value: 2.6 } };
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aPhase; uniform float uTime;')
        .replace('#include <uv_vertex>', `#include <uv_vertex>
          #ifdef USE_MAP
          float fr = mod(floor(uTime * 9.0 + aPhase * 7.0), ${N}.0);
          vMapUv = vec2((uv.x + fr) / ${N}.0, uv.y);
          #endif`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uI;')
        .replace('#include <opaque_fragment>', 'outgoingLight *= uI;\n#include <opaque_fragment>');
    };
    mat.customProgramCacheKey = () => 'plaza-flames';
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 4;
    scene.add(this.mesh);
    this.list = [];
  }
  add(x, y, z, size = 1) { this.list.push({ x, y, z, size }); this.mesh.count = this.list.length; }
  update(t, camera) {
    this.uniforms.uTime.value = t;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3();
    this.list.forEach((f, i) => {
      q.setFromAxisAngle(up, Math.atan2(camera.position.x - f.x, camera.position.z - f.z));
      const k = 1 + Math.sin(t * 13 + i * 2.1) * 0.05;
      m.compose(p.set(f.x, f.y, f.z), q, s.set(f.size, f.size * k, f.size));
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
