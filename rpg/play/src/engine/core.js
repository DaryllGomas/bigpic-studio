// Engine core: renderer, scene, camera, the post chain and the frame loop. Scenes register systems with update(dt, t).
import * as THREE from 'three';
import { PostFX } from './postfx.js';

export class Engine {
  constructor(canvas, { maxPixelRatio = 1.5, samples = 4 } = {}) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;          // ACES + grade happen in our final pass
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;        // PCF honours shadow.radius: soft, not hard-edged
    this.maxPixelRatio = maxPixelRatio;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.8, 3000);
    this.post = new PostFX(r, { samples });
    this.time = 0;
    this.systems = [];
    this.frameTimes = [];
    this.paused = false;
    addEventListener('resize', () => this.resize());
    this.resize();
  }
  resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight;
    const pr = Math.min(devicePixelRatio || 1, this.maxPixelRatio);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post.setSize(Math.floor(w * pr), Math.floor(h * pr));
  }
  add(sys) { this.systems.push(sys); return sys; }
  step(dt) {
    this.time += dt;
    for (const s of this.systems) s.update && s.update(dt, this.time);
    this.post.render(this.scene, this.camera, this.time);
  }
  start() {
    let last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20));  // first frame after a long load can be negative
      this.frameTimes.push(now - last);
      if (this.frameTimes.length > 240) this.frameTimes.shift();
      last = now;
      if (!this.paused) this.step(dt);
    };
    requestAnimationFrame(loop);
  }
  /** Median and 95th percentile frame time over the last ~4 s (ms). */
  stats() {
    const a = [...this.frameTimes].sort((p, q) => p - q);
    if (!a.length) return null;
    return { median: a[a.length >> 1], p95: a[Math.floor(a.length * 0.95)], fps: 1000 / a[a.length >> 1] };
  }
}
