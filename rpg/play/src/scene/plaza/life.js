// The City at ease: the small scenes the eye catches while it looks at something else. No text, no markers.
//   - a street musician by the east fountain with a few listeners swaying, notes of light rising
//   - the west fountain: an elder scattering crumbs for doves that lift off when Atlas walks near, circle, and come back
//   - kids chasing each other in loops, a sweeper at his broom (dust in the low sun), friends talking, two sitting on the steps
//   - a cat on a planter, tail flicking; a standing flock of doves wheeling over the square
// The people are the shared Crowd (one draw call); the birds and the cat are one more instanced sprite mesh and its shadows.
import * as THREE from 'three';
import { MUSICIAN_VARIANT, SWEEPER_VARIANT, CHILD_VARIANTS } from './citizens-art.js';
import { P } from './layout.js';
import { createParticles } from '../../engine/fx/particles.js';

// ---------- the birds' pixel sheet: 16 x 16 cells [perched, wings up, wings down, pecking, cat tail low, cat tail up] ----------
const PAL = { W: '#f6f2e8', w: '#aeaac2', k: '#1a1418', o: '#d89a48', K: '#c98a4a', c: '#8a5a2c', e: '#f1dcaa', n: '#e8a0a0' };
const CELLS = [
  ['................', '................', '................', '..........WW....', '.........WWWWo..', '.........WkWWoo.', '..w.....WWWWW...', '.wWW..WWWWWWW...', 'wWWWWWWWWWWWW...', '.wWWWWWWWWWW....', '..wwWWWWWWWw....', '....wwWWWWw.....', '......o..o......', '................', '................', '................'],
  ['................', '.......WW.......', '......WWWW......', '.....WWWWW......', '....wWWWW...WW..', '...wWWWWWW.WWWo.', '..wwWWWWWWWWkWoo', '.wwWWWWWWWWWWW..', 'wwWWWWWWWWWWw...', '.wWWWWWWWWWw....', '..wwWWWWWww.....', '....wwWWw.......', '................', '................', '................', '................'],
  ['................', '................', '..........WW....', '.........WWWWo..', '.........WkWWoo.', '.wwWWWWWWWWWW...', 'wWWWWWWWWWWWw...', '.wWWWWWWWWww....', '..wwWWWWWww.....', '...wWWWWWWw.....', '...wWWWWWW......', '...wWWWW........', '....wWW.........', '................', '................', '................'],
  ['................', '................', '................', '................', '................', '................', '..w.......WW....', '.wWW...WWWWWW...', 'wWWWWWWWWWWWWo..', '.wWWWWWWWWWkWo..', '..wwWWWWWWWW....', '....wwWWWWw.....', '......o..o......', '................', '................', '................'],
  ['................', '................', '..........K.K...', '..........KKKK..', '.........KKeKKn.', '.........KKKKK..', '..........KKKK..', '.........KKKKK..', '........KKKKKKK.', '.......KKKKKKKK.', '......KKKKKKKKK.', '.....KKKKKKKKKK.', '.....KKKKKKKKKc.', '.KK..KKKKKKKKKc.', '..KK.KKKKKKKKcc.', '...KKKKKKKKKKcc.'],
  ['................', '................', '..........K.K...', '..........KKKK..', '.........KKeKKn.', '.........KKKKK..', '..........KKKK..', '.........KKKKK..', '........KKKKKKK.', '.......KKKKKKKK.', '.K....KKKKKKKKK.', '.K...KKKKKKKKKK.', '.KK..KKKKKKKKKc.', '..KK.KKKKKKKKKc.', '...KKKKKKKKKKKc.', '...KKKKKKKKKKcc.'],
];
function paintBirdSheet() {
  const cv = document.createElement('canvas'); cv.width = 16 * CELLS.length; cv.height = 16;
  const g = cv.getContext('2d');
  CELLS.forEach((rows, f) => rows.forEach((row, y) => { for (let x = 0; x < 16; x++) { const c = PAL[row[x]]; if (c) { g.fillStyle = c; g.fillRect(f * 16 + x, y, 1, 1); } } }));
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const VS = `attribute vec2 aInfo; uniform vec2 uCell; varying vec2 vUv; varying float vTint;
void main(){ vUv = uv * uCell + vec2(aInfo.x * uCell.x, 0.0); vTint = aInfo.y; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`;
const FS = `uniform sampler2D uTex; uniform vec3 uLight; uniform vec3 uGrey; varying vec2 vUv; varying float vTint;
void main(){ vec4 t = texture2D(uTex, vUv); if (t.a < 0.5) discard; vec3 c = t.rgb * mix(vec3(1.0), uGrey, vTint) * uLight; gl_FragColor = vec4(c, 1.0); }`;

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _y = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export class Life {
  constructor({ scene, glow, crowd, walk, heightAt, R }) {
    Object.assign(this, { scene, crowd, walk, heightAt, R });
    this.birds = []; this.flocks = []; this.t = 0; this.camRight = new THREE.Vector3(1, 0, 0);
    this.tex = paintBirdSheet();
    this.max = 48;
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
    this.info = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 2), 2); this.info.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.info);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide,
      uniforms: { uTex: { value: this.tex }, uCell: { value: new THREE.Vector2(1 / CELLS.length, 1) }, uLight: { value: new THREE.Color(1, 1, 1) }, uGrey: { value: new THREE.Color(0.62, 0.66, 0.78) } },
    });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, this.max); this.mesh.frustumCulled = false; this.mesh.count = 0;
    const sg = new THREE.PlaneGeometry(1, 0.6); sg.rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ map: glow, color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }), this.max);
    this.shadows.frustumCulled = false; this.shadows.renderOrder = 2; this.shadows.count = 0;
    scene.add(this.mesh, this.shadows);
    this.fx = [];
    this.glow = glow;
  }

  /** Light the birds like the crowd: a warm key and the sky's fill. */
  setLight(k) {
    const c = this.mat.uniforms.uLight.value;
    const w = 0.13 * k.lightInt * (k.shade ?? 1), h = 0.34 * k.hemiInt;
    c.setRGB(k.hemiSky.r * h + k.lightColor.r * w, k.hemiSky.g * h + k.lightColor.g * w, k.hemiSky.b * h + k.lightColor.b * w);
    c.r = Math.min(c.r, 2.2); c.g = Math.min(c.g, 2.2); c.b = Math.min(c.b, 2.2);
  }

  // ---------- doves ----------
  flock(cx, cz, n, { spread = 1.1, grey = 0.25, perm = false, y = 0 } = {}) {
    const f = { cx, cz, scare: 0, perm };
    this.flocks.push(f);
    const R = this.R;
    for (let i = 0; i < n && this.birds.length < this.max - 2; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * spread, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      const b = {
        f, x, z, y: perm ? 8 + R() * 5 : (y || this.heightAt(x, z)), hx: x, hz: z, hy: y || this.heightAt(x, z), state: perm ? 'fly' : 'ground', ph: R() * 20,
        tint: R() < grey ? 1 : 0, vx: 0, vy: 0, vz: 0, dly: R() * 0.5, frame: 0, face: R() < 0.5 ? -1 : 1, size: 0.85 + R() * 0.15, fly: 0,
        ox: cx + (R() - 0.5) * 14, oz: cz + (R() - 0.5) * 14, oR: 5 + R() * 5, oa: R() * 6.283, ow: (0.32 + R() * 0.25) * (R() < 0.5 ? -1 : 1), oh: 6 + R() * 5,
      };
      if (perm) { b.ox = (R() - 0.5) * 20; b.oz = -8 + (R() - 0.5) * 20; b.oR = 8 + R() * 8; b.oh = 10 + R() * 6; b.ow = 0.2 + R() * 0.1; }
      this.birds.push(b);
    }
    return f;
  }

  cat(x, y, z, face = -1) { this.catData = { x, y, z, face, ph: this.R() * 9 }; }

  /** A little rising puff of light notes / dust / sparkle. */
  emitter(preset, box, count, overrides) {
    const p = createParticles({ preset, count, min: new THREE.Vector3(...box[0]), max: new THREE.Vector3(...box[1]), texture: this.glow, seed: 70 + this.fx.length * 3, overrides });
    this.scene.add(p); this.fx.push(p); return p;
  }

  update(dt, t, camera, camRight, hero, h = 1000) {
    this.t = t; this.camRight.copy(camRight);
    const B = this.birds; let n = 0;
    for (const f of this.flocks) if (f.scare > 0) f.scare -= dt;
    for (const b of B) {
      const dh = Math.hypot(hero.x - b.hx, hero.z - b.hz), dhere = Math.hypot(hero.x - b.x, hero.z - b.z);
      if (b.state === 'ground') {
        if (dhere < 4.4 || b.f.scare > 0) {
          if (dhere < 4.4 && b.f.scare <= 0) b.f.scare = 0.7;       // one startles, the flock goes
          b.dly -= dt;
          if (b.dly <= 0) {
            b.state = 'fly'; b.fly = 8 + this.R() * 6; b.oa = Math.atan2(b.z - b.oz, b.x - b.ox);
            const ax = b.x - hero.x, az = b.z - hero.z, d = Math.hypot(ax, az) || 1;
            b.vx = (ax / d) * 2.6 + (this.R() - 0.5); b.vz = (az / d) * 2.6 + (this.R() - 0.5); b.vy = 4 + this.R() * 1.5;
          }
        } else {
          b.dly = this.R() * 0.35;
          b.frame = Math.sin(t * 2.3 + b.ph) > 0.35 ? 3 : 0;                 // peck, look up, peck
          b.y = b.hy;
        }
      } else {
        let tx, ty, tz, sp = 6.4;
        if (b.state === 'fly') {
          b.oa += b.ow * dt;
          tx = b.ox + Math.cos(b.oa) * b.oR; tz = b.oz + Math.sin(b.oa) * b.oR; ty = b.oh + Math.sin(t * 0.8 + b.ph) * 0.6;
          if (!b.f.perm) {
            b.fly -= dt;
            if (dh < 5.5) b.fly = Math.max(b.fly, 2.5);
            if (b.fly <= 0) b.state = 'land';
          }
        } else {
          tx = b.hx; tz = b.hz; ty = b.hy + Math.min(6, Math.hypot(b.x - b.hx, b.z - b.hz) * 0.55); sp = 4.4;
          const d = Math.hypot(b.x - b.hx, b.z - b.hz);
          if (dh < 4.4 && d > 2) { b.state = 'fly'; b.fly = 3; }
          else if (d < 0.35 && b.y - b.hy < 0.4) { b.state = 'ground'; b.x = b.hx; b.z = b.hz; b.y = b.hy; b.vx = b.vy = b.vz = 0; b.dly = 0.3; }
        }
        if (b.state !== 'ground') {
          let dx = tx - b.x, dy = ty - b.y, dz = tz - b.z; const d = Math.hypot(dx, dy, dz) || 1, v = Math.min(sp, d * 1.6);
          const k = 1 - Math.exp(-dt * 2.4);
          b.vx += (dx / d * v - b.vx) * k; b.vy += (dy / d * v - b.vy) * k; b.vz += (dz / d * v - b.vz) * k;
          b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
          if (b.state === 'land' && Math.hypot(b.x - b.hx, b.z - b.hz) < 0.5) { b.y = Math.max(b.hy, b.y - dt * 2.2); b.vy = -1; }
          const glide = Math.sin(t * 0.55 + b.ph) > 0.55 || (b.state === 'land' && b.y - b.hy < 1.2);
          b.frame = glide ? 1 : (Math.floor(t * 9 + b.ph) & 1) ? 1 : 2;
          if (Math.abs(b.vx * this.camRight.x + b.vz * this.camRight.z) > 0.3) b.face = (b.vx * this.camRight.x + b.vz * this.camRight.z) > 0 ? 1 : -1;
        }
      }
      this.put(n++, b.x, b.y, b.z, b.size, b.face, b.frame, b.tint, camera, b.hy, b.y - b.hy);
    }
    if (this.catData) {
      const c = this.catData, flick = Math.sin(t * 1.7 + c.ph) > 0.25 ? 5 : 4;
      this.put(n++, c.x, c.y, c.z, 0.72, c.face, flick, 0, camera, c.y, 0);
    }
    this.mesh.count = this.shadows.count = n;
    this.info.needsUpdate = true; this.mesh.instanceMatrix.needsUpdate = true; this.shadows.instanceMatrix.needsUpdate = true;
    for (const p of this.fx) p.update(dt, t, camera, h);
  }

  put(i, x, y, z, size, face, frame, tint, camera, gy, height) {
    _q.setFromAxisAngle(_y, Math.atan2(camera.position.x - x, camera.position.z - z));
    _p.set(x, y, z); _s.set(size * face, size, 1);
    _m.compose(_p, _q, _s); this.mesh.setMatrixAt(i, _m);
    this.info.setXY(i, frame, tint);
    const sc = Math.max(0.25, 1 - height * 0.08) * size * 1.5;
    _m.makeScale(sc, 1, sc); _m.setPosition(x, gy + 0.03, z); this.shadows.setMatrixAt(i, _m);
  }
}

/** Stage the City's small scenes. Returns the Life object (add to the frame loop) so plaza.js can light it and tick it. */
export function stageLife({ scene, glow, crowd, walk, heightAt, R }) {
  const life = new Life({ scene, glow, crowd, walk, heightAt, R });
  const ok = (x, z) => walk.ok(x, z);
  const face = (ax, az, bx, bz) => [bx - ax, bz - az];

  // --- the musician at the east fountain, his listeners swaying a little to it ---
  {
    const [fx, fz] = P.FOUNTAINS[1], mx = fx - 0.4, mz = fz + 3.5;   // just south of the rim, facing the lens
    crowd.add({ x: mx, z: mz, kind: 'attendant', variant: MUSICIAN_VARIANT, face: [0, 1], bob: 0.045, bobF: 3.2 });
    const spots = [[-2.0, 1.5], [2.2, 1.7], [-3.1, 0.2], [3.4, 0.4], [-0.9, 2.5], [1.4, 2.7]];
    spots.forEach(([dx, dz], i) => {
      const x = mx + dx, z = mz + dz; if (!ok(x, z)) return;
      crowd.add({ x, z, kind: 'attendant', face: face(x, z, mx, mz), bob: i % 2 ? 0.03 : 0.0, bobF: 3.2, variant: i === 4 ? 6 : i === 2 ? 14 : undefined });
    });
    life.emitter('embers', [[mx - 0.5, 1.6, mz - 0.3], [mx + 0.5, 1.6, mz + 0.3]], 14, { size: 0.42, color: '#fff0c8', color2: '#ffd690', intensity: 4.5, speed: 0.55 });
    life.flock(mx + 2.4, mz + 3.2, 4, { spread: 1.2 });
  }
  // --- the west fountain: an elder with crumbs, doves round his feet ---
  {
    const [fx, fz] = P.FOUNTAINS[0], ex = fx + 0.6, ez = fz + 3.3;
    crowd.add({ x: ex, z: ez, kind: 'attendant', variant: 5, face: [0.2, 1] });
    life.flock(ex + 0.2, ez + 1.4, 8, { spread: 1.5, grey: 0.4 });
    life.flock(fx - 2, fz + 3.2, 4, { spread: 1.0 });
    life.emitter('motes', [[ex - 0.8, 0.5, ez + 0.4], [ex + 0.8, 1.3, ez + 1.5]], 10, { size: 0.09, color: '#f6e6c0', color2: '#d8c8a0', intensity: 2.2 });
  }
  // --- kids chasing each other: a loop round a pool, then the strip beside the stair ---
  {
    const loops = [
      [[-3.6, 6.5], [-3.6, 25.5], [-1.2, 25.5], [-1.2, 6.5]],
      [[3.6, 25.5], [3.6, 6.5], [1.2, 6.5], [1.2, 25.5]],
      [[-14.5, -21], [-14.5, -10], [-19.5, -10], [-19.5, -21]],
    ];
    loops.forEach((loop, li) => {
      const pts = loop.filter(([x, z]) => ok(x, z));
      if (pts.length < 3) return;
      for (let k = 0; k < 2; k++) crowd.add({ x: pts[k * 2 % pts.length][0], z: pts[k * 2 % pts.length][1], kind: 'path', path: pts, pi: (k * 2 + 1) % pts.length, speed: 3.0 + k * 0.15, pause: 0.25, variant: CHILD_VARIANTS[(li * 2 + k) % CHILD_VARIANTS.length] });
    });
  }
  // --- the sweeper, and friends talking ---
  {
    const sw = [[-7.5, -28], [-3.2, -27.4]];
    if (sw.every(([x, z]) => ok(x, z))) { crowd.add({ x: sw[0][0], z: sw[0][1], kind: 'path', path: sw, ping: true, speed: 0.55, pause: 0.6, variant: SWEEPER_VARIANT }); life.emitter('motes', [[-7.5, 0.05, -28.4], [-3.0, 0.5, -27]], 12, { size: 0.12, color: '#d8c8a8', color2: '#b8a888', intensity: 1.6, speed: 0.6 }); }
    for (const [x, z, fx, fz] of [[-8.6, -14.6, 1, 0.2], [8.4, -15, -1, 0.1], [5.4, 3.2, -1, 0.2]]) {
      if (!ok(x, z) || !ok(x + fx * 1.1, z)) continue;
      crowd.add({ x, z, kind: 'attendant', face: [fx, fz], talk: true, bob: 0.02, bobF: 5 });
      crowd.add({ x: x + fx * 1.1, z: z + fz * 0.2, kind: 'attendant', face: [-fx, -fz], talk: true, bob: 0.02, bobF: 4.3 });
    }
  }
  // --- sitting on the steps: two friends, a reader (the lower half sinks into the tread) ---
  {
    const sit = (x, z, f, variant) => {
      const k = Math.floor(z - P.STEP_Z0), top = (k + 1) * 0.4, base = heightAt(x, z);
      crowd.add({ x, z, kind: 'attendant', face: f, sy: 0.84, lift: top - base - 0.42, variant, talk: true });
    };
    sit(-9.3, 33.5, [1, -0.1], 4); sit(-8.2, 33.5, [-1, 0.1], 11);
    sit(8.8, 36.5, [0, 1], 9); sit(10.4, 34.5, [-1, 0.2], 14);
  }
  // --- the cat, on a planter by the east pool ---
  life.cat(4.4, 0.62, 7.0, -1);
  // --- doves wheeling over the square, always ---
  life.flock(0, -6, 7, { perm: true, grey: 0.1 });
  // --- sparkle where the fountains throw ---
  for (const [fx, fz] of P.FOUNTAINS) life.emitter('motes', [[fx - 1.5, 0.4, fz - 1.5], [fx + 1.5, 3.2, fz + 1.5]], 26, { size: 0.1, color: '#e6f6ff', color2: '#ffffff', intensity: 5, speed: 1.6 });
  return life;
}
