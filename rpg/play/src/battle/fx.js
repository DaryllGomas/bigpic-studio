// Juice: particles, debris, camera rig (shots, shake, kick), and the post chain (bloom + impact pass).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

export class PointPool {
  constructor(scene, max, { additive = true, tex, maxPx = 90 }) {
    this.max = max; this.n = 0; this.i = 0; this.cap = additive ? 1 : .28;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max).fill(1); this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.grow = new Float32Array(max); this.size0 = new Float32Array(max);
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); g.setAttribute('size', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 800 }, uMaxPx: { value: maxPx }, map: { value: tex } }, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float uScale, uMaxPx; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); float px = size*uScale/max(0.1,-mv.z); gl_PointSize = min(px, uMaxPx); vA = alpha * min(1., uMaxPx / max(px, 1.)); gl_Position = projectionMatrix*mv; vC = color; }',
      fragmentShader: 'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC*t.rgb, t.a*vA); }',
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = additive ? 5 : 4; scene.add(this.points);
    for (let k = 0; k < max; k++) this.life[k] = 0;
  }
  spawn(p) {
    const k = this.i = (this.i + 1) % this.max, c = p.color || [1, 1, 1];
    this.pos.set([p.x, p.y, p.z], k * 3); this.vel.set([p.vx || 0, p.vy || 0, p.vz || 0], k * 3); this.col.set(c, k * 3);
    this.life[k] = this.maxLife[k] = p.life || 1; this.size0[k] = p.size || .2; this.grav[k] = p.grav || 0; this.drag[k] = p.drag || 0; this.grow[k] = p.grow || 0;
  }
  update(dt) {
    for (let k = 0; k < this.max; k++) {
      if (this.life[k] <= 0) { this.alpha[k] = 0; continue; }
      this.life[k] -= dt; const f = Math.max(0, this.life[k] / this.maxLife[k]), j = k * 3;
      this.vel[j + 1] -= this.grav[k] * dt; const dr = Math.max(0, 1 - this.drag[k] * dt);
      this.vel[j] *= dr; this.vel[j + 1] *= dr; this.vel[j + 2] *= dr;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      if (this.pos[j + 1] < .05 && this.grav[k] > 0) { this.pos[j + 1] = .05; this.vel[j + 1] *= -.35; this.vel[j] *= .6; this.vel[j + 2] *= .6; }
      this.alpha[k] = Math.min(this.cap, f * 2.2); this.size[k] = this.size0[k] * (1 + this.grow[k] * (1 - f));
    }
    for (const a of ['position', 'color', 'size', 'alpha']) this.geo.attributes[a].needsUpdate = true;
  }
}

function softTex(hard = false) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (hard) { r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(.5, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); }
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
export const glowTexture = () => softTex(false);

export class Fx {
  constructor(scene) {
    this.glow = new PointPool(scene, 1400, { additive: true, tex: softTex(true), maxPx: 48 });
    this.dust = new PointPool(scene, 600, { additive: false, tex: softTex(false), maxPx: 130 });
    // debris: instanced rocks
    this.D = 90; this.dg = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x7a736a, roughness: 1, flatShading: true }), this.D);
    this.dg.castShadow = true; this.dg.frustumCulled = false; scene.add(this.dg);
    this.d = Array.from({ length: this.D }, () => ({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: .2 }));
    this.scene = scene; this.dm = new THREE.Object3D(); this.di = 0; this.rings = [];
    this.ringGeo = new THREE.RingGeometry(.92, 1, 64);
  }
  // expanding flat ring on the ground / facing
  shock(pos, { color = 0xffffff, size = 6, dur = .5, ground = true, opacity = .8, scene }) {
    const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(pos); if (ground) m.rotation.x = -Math.PI / 2; m.userData = { t: 0, dur, size, op: opacity, ground };
    (scene || this.scene).add(m); this.rings.push(m);
  }
  burstSparks(pos, n, { speed = 8, color = [2.5, 1.8, .8], size = .12, life = .6, grav = 14, up = 0 } = {}) {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), e = rand(-.3, 1), s = rand(.3, 1) * speed; this.glow.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: Math.cos(a) * Math.cos(e) * s, vy: Math.sin(e) * s + up, vz: Math.sin(a) * Math.cos(e) * s, life: life * rand(.5, 1.2), size: size * rand(.5, 1.4), color, grav, drag: 1.2 }); }
  }
  burstDust(pos, n, { speed = 5, spread = 1, size = 1.4, life = 1.6, color = [.3, .26, .24] } = {}) {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(.3, 1) * speed; this.dust.spawn({ x: pos.x + Math.cos(a) * spread * .3, y: pos.y + rand(0, .3), z: pos.z + Math.sin(a) * spread * .3, vx: Math.cos(a) * s, vy: rand(.2, 1.4), vz: Math.sin(a) * s, life: life * rand(.6, 1.2), size: size * rand(.6, 1.3), color, drag: 1.8, grow: 2.2 }); }
  }
  debris(pos, n, speed = 7) {
    for (let i = 0; i < n; i++) { const o = this.d[this.di = (this.di + 1) % this.D], a = rand(0, 6.28); o.life = rand(1.4, 2.6); o.p.copy(pos).add(new THREE.Vector3(rand(-.5, .5), rand(0, .4), rand(-.5, .5))); const s = rand(.3, 1) * speed; o.v.set(Math.cos(a) * s, rand(3, 9) * speed / 7, Math.sin(a) * s); o.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); o.s = rand(.08, .32); o.r.set(rand(0, 3), rand(0, 3), rand(0, 3)); }
  }
  update(dt) {
    this.glow.update(dt); this.dust.update(dt);
    const dm = this.dm;
    this.d.forEach((o, i) => {
      if (o.life > 0) { o.life -= dt; o.v.y -= 22 * dt; o.p.addScaledVector(o.v, dt); o.r.x += o.w.x * dt; o.r.y += o.w.y * dt; o.r.z += o.w.z * dt; if (o.p.y < o.s * .5) { o.p.y = o.s * .5; o.v.y *= -.32; o.v.x *= .6; o.v.z *= .6; o.w.multiplyScalar(.6); } }
      const sc = o.life > 0 ? o.s * Math.min(1, o.life * 2) : 0; dm.position.copy(o.p); dm.rotation.copy(o.r); dm.scale.setScalar(sc); dm.updateMatrix(); this.dg.setMatrixAt(i, dm.matrix);
    });
    this.dg.instanceMatrix.needsUpdate = true;
    this.rings = this.rings.filter(m => { const u = m.userData; u.t += dt; const k = u.t / u.dur; if (k >= 1) { m.parent.remove(m); m.material.dispose(); return false; } m.scale.setScalar(.2 + u.size * (1 - Math.pow(1 - k, 3))); m.material.opacity = u.op * (1 - k); return true; });
  }
}

// ----------------------------------------------------------------- camera
export const SHOTS = {
  main:   { p: [-14.5, 3.4, 10.5], l: [.8, 3.9, .6],   fov: 42 },
  menu:   { p: [-12.5, 3.0, 9.0],  l: [.4, 3.7, .6],   fov: 41 },
  wide:   { p: [-19, 6.5, 14],    l: [1, 6.0, .6],    fov: 52 },
  tele:   { p: [-9.5, 2.8, 6.8],   l: [.6, 4.4, .6],   fov: 44 },
  parry:  { p: [-8.6, 1.8, 5.6],   l: [-.3, 4.0, .7],  fov: 46 },
  parry2: { p: [-5.6, 1.3, 8.4],   l: [.6, 2.9, .4],   fov: 46 }, // the clash: side-on, low, both fighters and the contact
  run:    { p: [-2.5, 2.3, 9.2],   l: [.6, 2.4, .8],   fov: 40 },
  sloth:  { p: [-8.5, 3.6, 8.0],   l: [1.8, 4.4, .8],  fov: 42 },
  brk:    { p: [-8.8, 1.7, 9.6],   l: [1.8, 4.0, .4],  fov: 44 }, // Sloth slumps, Atlas in frame
  heal:   { p: [-7.0, 1.7, 5.6],   l: [-1.7, 1.8, .8], fov: 38 },
  victory:{ p: [-15, 3.6, 12],     l: [2.6, 5.0, .8],  fov: 46 },
  // duel framing for Sloth's slam: over Atlas's shoulder, both fighters and the raised hand in frame (the mock-ups' composition)
  duel:   { p: [-8.8, 2.0, 7.8],   l: [1.4, 5.2, -.2], fov: 57 },
  duelIn: { p: [-7.9, 1.9, 7.1],   l: [1.2, 5.0, -.2], fov: 56 },
  duel2:  { p: [-7.4, 1.9, 6.8],   l: [1.2, 4.2, -.2], fov: 50 },
};
export class Rig {
  constructor(cam) {
    this.cam = cam; this.p = new THREE.Vector3(); this.l = new THREE.Vector3(); this.fov = 41; this.tp = new THREE.Vector3(); this.tl = new THREE.Vector3(); this.tfov = 41; this.k = 3;
    this.trauma = 0; this.kick = 0; this.drift = 0; this.t = 0; this.roll = 0; this.shot('main', true);
  }
  shot(name, cut = false, k = 3, off) {
    const s = SHOTS[name]; this.tp.set(...s.p); this.tl.set(...s.l); this.tfov = s.fov; this.k = k; this.name = name;
    if (off) { this.tp.add(off); }
    if (cut) { this.p.copy(this.tp); this.l.copy(this.tl); this.fov = this.tfov; }
  }
  shake(a) { this.trauma = Math.min(1, this.trauma + a); }
  dolly(a) { this.kick = Math.max(this.kick, a); }
  update(dtReal) {
    this.t += dtReal; const a = 1 - Math.exp(-this.k * dtReal);
    this.p.lerp(this.tp, a); this.l.lerp(this.tl, a); this.fov += (this.tfov - this.fov) * a;
    this.trauma = Math.max(0, this.trauma - dtReal * 1.15); this.kick = Math.max(0, this.kick - dtReal * 2.2);
    const s = this.trauma * this.trauma, t = this.t * 40, n = (f) => Math.sin(t * f) * .6 + Math.sin(t * f * 2.3 + 1.7) * .4;
    const d = this.drift, tt = this.t;
    this.cam.position.copy(this.p).add(new THREE.Vector3(Math.sin(tt * .31) * .12 * (1 + d), Math.sin(tt * .43) * .07, Math.sin(tt * .23) * .1));
    this.cam.position.x += n(1.1) * s * .55; this.cam.position.y += n(1.7) * s * .55; this.cam.position.z += n(1.3) * s * .35;
    this.cam.lookAt(this.l); this.cam.rotateZ(n(2.1) * s * .06);
    this.cam.fov = this.fov - this.kick * 6; this.cam.updateProjectionMatrix();
    return s;
  }
}

// ----------------------------------------------------------------- post
const IMPACT = {
  uniforms: { tDiffuse: { value: null }, uFlash: { value: 0 }, uFlashPos: { value: new THREE.Vector2(.5, .5) }, uAspect: { value: 16 / 9 }, uInk: { value: 0 }, uInkCol: { value: new THREE.Vector3(1, .85, .45) }, uRed: { value: 0 },
    uAb: { value: 0 }, uVig: { value: .5 }, uZoom: { value: 0 }, uDesat: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uTime: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  // impact pass: zoom blur + aberration on hits, a LOCAL flash at the contact point (never full-screen white),
  // an "ink" impact frame (2-4 frames of hard two-tone, anime-style) for the big beats, a red edge on damage, and the dusk grade.
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFlash,uAb,uVig,uZoom,uDesat,uTime,uAspect,uInk,uRed; uniform vec2 uFlashPos; uniform vec3 uTint,uInkCol; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec2 c = vUv - .5; vec3 col = vec3(0.);
    for(int i=0;i<6;i++){ float s = 1. - uZoom*float(i)/6.; vec2 p = c*s + .5; col.r += texture2D(tDiffuse, p + c*uAb).r; col.g += texture2D(tDiffuse, p).g; col.b += texture2D(tDiffuse, p - c*uAb).b; }
    col /= 6.;
    // dusk grade (gate-road look): cool shadows, warm highlights, a touch more contrast
    float l = dot(col, vec3(.3,.59,.11));
    col = mix(col, vec3(l), uDesat) * uTint;
    col = mix(col * vec3(.86,.9,1.12), col * vec3(1.06,1.,.9), smoothstep(.15,.7,l));
    col = (col - .5) * 1.08 + .5; col = max(col, 0.);
    float d = length(c); col *= 1. - uVig * smoothstep(.3, .9, d);
    // local flash: a hot bloom at the contact point, falling off fast
    vec2 fp = (vUv - uFlashPos) * vec2(uAspect, 1.); float fd = length(fp);
    col += uFlash * vec3(1.,.93,.8) * (exp(-fd * 5.) * 1.1 + exp(-fd * 1.6) * .12);
    // red edge on damage
    col = mix(col, vec3(.55,.05,.03), uRed * smoothstep(.35, .85, d));
    // ink impact frame: hard two-tone, dark ground + the tint where it is bright
    float L = dot(col, vec3(.3,.59,.11)); float ink = smoothstep(.32, .42, L);
    col = mix(col, mix(vec3(.02,.015,.04), uInkCol, ink), uInk);
    col += (h(vUv*vec2(1920.,1080.) + uTime) - .5) * .012;
    gl_FragColor = vec4(col, 1.);
  }`,
};
export function makePost(renderer, scene, camera, w, h) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const comp = new EffectComposer(renderer, rt); comp.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), .32, .45, .95); comp.addPass(bloom);
  const imp = new ShaderPass(IMPACT); comp.addPass(imp); comp.addPass(new OutputPass());
  return { comp, bloom, imp, u: imp.uniforms };
}
