// The plaza's furniture and landmarks: lanterns, banners, garden sprites, string lights over the market, the market
// stalls, THE HOUSE (gold and brass, a great orrery over its doors), and the three old villages' arches: Ashford (a round
// pale arch under a great ash), Brambleholt (a timber lychgate drowned in flowering vines), Stonemere (a megalithic gate
// with water falling from its lintel and a line of Signal light carved across it).
import * as THREE from 'three';
import { addSpriteRim } from '../../engine/actors/character.js';
import { plazaOccluderFade as addOccluderFade } from '../../engine/world/telor-occlusion.js';
import { brightFallMaterial } from './falls.js';
import * as PT from './textures.js';
import { P, frame, faceRot } from './layout.js';
import { addLocal, lbox, lcyl, archSlab, archRing, mergeAll } from './build.js';

const tagKey = (m, tag) => { const k = m.customProgramCacheKey.bind(m); m.customProgramCacheKey = () => k() + '|' + tag; };

/** Pixel sprites that turn to the camera, instanced per kind (one draw call and one shadow pass each). */
export class Billboards {
  constructor(scene, rim) { this.scene = scene; this.rim = rim; this.types = {}; }
  type(name, painted, ppu, { rimK = 1, max = 64, shadow = true } = {}) {
    const s = PT.bakeSprite(painted), w = s.w / ppu, h = s.h / ppu;
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const mat = new THREE.MeshStandardMaterial({ map: s.map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
    addSpriteRim(mat, new THREE.Vector2(1 / s.w, 1 / s.h), this.rim, rimK);
    addOccluderFade(mat); tagKey(mat, 'bb-' + name + rimK);
    const mesh = new THREE.InstancedMesh(g, mat, max);
    mesh.count = 0; mesh.castShadow = shadow; mesh.frustumCulled = false;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: s.map, alphaTest: 0.5 });
    this.scene.add(mesh);
    this.types[name] = { mesh, list: [], w, h, max, tex: s.map };
    return this.types[name];
  }
  add(name, x, y, z, scale = 1) { const t = this.types[name]; if (t.list.length < t.max) { t.list.push({ x, y, z, scale }); t.mesh.count = t.list.length; } }
  update(camera) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
    for (const t of Object.values(this.types)) {
      t.list.forEach((b, i) => {
        q.setFromAxisAngle(up, Math.atan2(camera.position.x - b.x, camera.position.z - b.z));
        m.compose(p.set(b.x, b.y, b.z), q, sc.setScalar(b.scale));
        t.mesh.setMatrixAt(i, m);
      });
      t.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/** Banner cloth that moves in the wind (the gate road's banner, shared look). */
export function bannerMaterial(map, emissiveMap, windT) {
  const mat = new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.2, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = windT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float hang = 1.0 - uv.y;
        float ph = modelMatrix[3][2] * 0.13 + modelMatrix[3][0] * 0.7;
        transformed.z += (sin(uWind * 1.7 + ph + hang * 2.2) * 0.2 + sin(uWind * 3.1 + ph * 1.3 + hang * 4.0) * 0.05) * hang;
        transformed.x += sin(uWind * 1.1 + ph) * 0.05 * hang;`);
  };
  addOccluderFade(mat);
  return mat;
}

export function makeHelpers(scene, B, M, ctx, bb) {
  const { lights, lanternPos, walk } = ctx;
  /** A lantern head at (x, y, z); on an iron post when post = true; hanging on a short chain when hang = true. */
  ctx.lantern = (x, y, z, scale = 1, post = false, hang = false) => {
    if (post) {
      B.box('iron', 0.55, 0.3, 0.55, x, y + 0.15, z);
      B.cyl('iron', 0.08, 3.3, x, y + 0.3, z, 6);
      B.cyl('gold', 0.12, 0.12, x, y + 3.5, z, 8);
      y += 3.62;
      if (walk) walk.circle(x, z, 0.45);
    }
    if (hang) B.box('iron', 0.03, 0.7, 0.03, x, y + 0.08 + 0.44 * scale + 0.55, z, { uv: false });
    B.box('iron', 0.44 * scale, 0.08, 0.44 * scale, x, y + 0.04, z);
    const g = new THREE.BoxGeometry(0.3 * scale, 0.44 * scale, 0.3 * scale); g.translate(x, y + 0.08 + 0.22 * scale, z);
    B.add('glass', g, { uv: false });
    B.pyramid('iron', 0.48 * scale, 0.48 * scale, 0.22 * scale, x, y + 0.08 + 0.44 * scale, z);
    B.cone('gold', 0.05, 0.22, x, y + 0.08 + 0.44 * scale + 0.2 * scale, z, 4);
    const p = new THREE.Vector3(x, y + 0.08 + 0.22 * scale, z);
    lanternPos.push(p);
    lights.add({ pos: p, color: '#ffa04a', intensity: 24 * scale, distance: 12, flicker: 0.12, role: 'lantern' });
  };
  /** A flowering shrub sprite, optionally in a gold-rimmed white planter. */
  ctx.flowerAt = (x, y, z, scale = 1, kind = 'white') => bb.add('bush_' + kind, x, y, z, scale);
  ctx.planter = (x, z, w = 1.6, d = 1.6, h = 0.7) => {
    B.box('ashlar2', w, h, d, x, h / 2, z);
    B.box('gold', w + 0.06, 0.06, d + 0.06, x, h, z, { uv: false });
    if (walk) walk.rect(x - w / 2 - 0.35, z - d / 2 - 0.35, x + w / 2 + 0.35, z + d / 2 + 0.35, 1);
    return h;
  };
}

export function buildProps(scene, B, Bn, M, ctx, bb, { windT, banners, glow }) {
  const { R, walk, lights, crowdSeeds, lanternPos } = ctx;
  const L = P.LAND_Y;
  const bannerGeo = (w, h) => new THREE.PlaneGeometry(w, h, 1, 10);
  const bannerDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: banners.navy.map, alphaTest: 0.5 });
  const banner = (kind, w, h, x, y, z, rotY = 0) => {
    const m = new THREE.Mesh(bannerGeo(w, h), banners[kind].mat);
    m.position.set(x, y - h / 2, z); m.rotation.y = rotY; m.castShadow = true; m.customDepthMaterial = bannerDepth;
    scene.add(m); return m;
  };
  const vineGeo = [];
  const vine = (x, y, z, rotY, w = 2.4, h = 3.6) => { const g = new THREE.PlaneGeometry(w, h); g.translate(0, -h / 2, 0.06); g.rotateY(rotY); g.translate(x, y, z); vineGeo.push(g); };

  // ---------- temple banners, great and navy ----------
  for (const s of [-1, 1]) banner('navy', 2.9, 10, s * 10, L + 16.3, 46.3);

  // ---------- the processional way: lamps and banner poles ----------
  for (const z of [27.2, 20, 12]) for (const s of [-1, 1]) ctx.lantern(s * 4.1, 0, z, 1.0, true);
  for (const [z, i] of [[-21, 0], [-29, 1], [-37, 0]]) for (const s of [-1, 1]) {
    const px = s * 4.6;
    B.cyl('iron', 0.09, 7.4, px, 0, z, 6);
    B.box('iron', 2.1, 0.1, 0.1, px - s * 0.95, 7.15, z);
    const star = new THREE.OctahedronGeometry(0.28); star.scale(0.7, 1.4, 0.7); star.translate(px, 7.65, z); B.add('gold', star, { uv: false });
    banner(i ? 'ivory' : 'navy', 1.7, 4.25, px - s * 0.95, 7.1, z);
    walk.circle(px, z, 0.4);
    ctx.lantern(s * 4.3, 0, z - 4, 1.0, true);
  }

  // ---------- market stalls in the bays ----------
  const stall = (x, z, f, awn) => {
    const fr = frame(x, z, faceRot(f));
    lbox(B, 'wood', fr, 3.0, 1.0, 0.9, 0, 0.5, 0);
    lbox(B, 'wood', fr, 3.2, 0.08, 1.05, 0, 1.04, 0.05);
    for (const sx of [-1, 1]) { lbox(B, 'wood', fr, 0.14, 2.95, 0.14, sx * 1.5, 1.47, -0.5); lbox(B, 'wood', fr, 0.14, 2.3, 0.14, sx * 1.5, 1.15, 1.05); }
    // awning: a sloped striped canvas and its valance
    const aw = new THREE.PlaneGeometry(3.5, 2.05, 1, 1); aw.rotateX(-Math.PI / 2 + 0.36); aw.translate(0, 2.62, 0.38);
    addLocal(B, awn, aw, fr, { tile: 2 });
    const va = new THREE.PlaneGeometry(3.5, 0.34); va.translate(0, 2.08, 1.36); addLocal(B, awn, va, fr, { tile: 2 });
    // goods: crates, a basket of fruit, cloth bolts, pots
    const kinds = [(R() * 4) | 0, (R() * 4) | 0, (R() * 4) | 0];
    kinds.forEach((k, i) => {
      const gx = -0.95 + i * 0.95;
      if (k === 0) { lbox(B, 'wood', fr, 0.7, 0.32, 0.5, gx, 1.24, 0.05); for (let n = 0; n < 5; n++) { const sp = new THREE.SphereGeometry(0.1, 6, 4); sp.translate(gx - 0.24 + (n % 3) * 0.24, 1.45, 0.05 + (n > 2 ? 0.12 : -0.1)); addLocal(B, 'fruit' + ((R() * 5) | 0), sp, fr, { uv: false }); } }
      if (k === 1) { const c = new THREE.CylinderGeometry(0.32, 0.25, 0.28, 10); c.translate(gx, 1.22, 0.05); addLocal(B, 'wood', c, fr); for (let n = 0; n < 6; n++) { const sp = new THREE.SphereGeometry(0.09, 6, 4); sp.translate(gx + Math.cos(n) * 0.18, 1.4, 0.05 + Math.sin(n) * 0.18); addLocal(B, 'fruit' + (n % 5), sp, fr, { uv: false }); } }
      if (k === 2) for (let n = 0; n < 3; n++) { const c = new THREE.CylinderGeometry(0.13, 0.13, 0.75, 8); c.rotateZ(Math.PI / 2); c.translate(gx, 1.2 + (n === 2 ? 0.22 : 0), -0.1 + n * 0.22 - (n === 2 ? 0.33 : 0)); addLocal(B, 'cloth' + ((R() * 6) | 0), c, fr, { uv: false }); }
      if (k === 3) for (let n = 0; n < 2; n++) { const c = new THREE.CylinderGeometry(0.12, 0.2, 0.42 + n * 0.12, 8); c.translate(gx - 0.18 + n * 0.36, 1.08 + (0.42 + n * 0.12) / 2, 0.05); addLocal(B, 'pot', c, fr, { uv: false }); }
    });
    // goods hung under the awning: a string of lanterns or cloth
    const [hx, hz] = fr.toWorld(0, 1.25);
    ctx.lantern(hx, 1.6, hz, 0.62, false, true);
    walk.orect(fr, 0, 0.25, 1.75, 0.95, 1);
    const [mx, mz] = fr.toWorld(0, -1.05);
    crowdSeeds.push({ x: mx, z: mz, kind: 'merchant', face: [Math.sin(fr.rot), Math.cos(fr.rot)] });
    for (const sx of [-0.85, 0.85]) { const [cx, cz] = fr.toWorld(sx, 1.65); ctx.stallSlots.push([cx, cz, -Math.sin(fr.rot), -Math.cos(fr.rot)]); }
  };
  let ai = 0;
  for (const s of [-1, 1]) {
    for (const z of [22.5, 15.5, -14.5, -21.5, -28.5]) stall(s * 19.2, z, [-s, 0.42], 'awn' + (ai++ % 5));
    for (const z of [-15.5, -23]) stall(s * 13.3, z, [s, 0.42], 'awn' + (ai++ % 5));
  }

  // ---------- string lights over the bays ----------
  const bulbs = [], wires = [];
  const string = (a, b, sag, n) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * sag;
      if (i > 0 && i < n) bulbs.push(x, y - 0.12, z);
      if (i < n) { const t2 = (i + 1) / n; wires.push(x, y, z, a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2 - Math.sin(t2 * Math.PI) * sag, a.z + (b.z - a.z) * t2); }
    }
  };
  for (const s of [-1, 1]) {
    const poles = [25.2, 7.5, -10.5, -19, -26];
    for (const pz of poles) {
      const px = s * 12.6;
      B.cyl('iron', 0.1, 5.6, px, 0, pz, 6); B.cone('gold', 0.12, 0.5, px, 5.6, pz, 6);
      walk.circle(px, pz, 0.4);
      for (const dz of [-4, 3]) string(new THREE.Vector3(px, 5.5, pz), new THREE.Vector3(s * 24.4, 7.2, pz + dz), 0.9, 16);
    }
    for (let k = 0; k < poles.length - 1; k++) if (Math.abs(poles[k] - poles[k + 1]) < 12) string(new THREE.Vector3(s * 12.6, 5.5, poles[k]), new THREE.Vector3(s * 12.6, 5.5, poles[k + 1]), 0.7, 12);
  }
  // across the processional way, between the lamp rows below the steps
  for (const z of [27.2, 20, 12]) string(new THREE.Vector3(-4.1, 3.95, z), new THREE.Vector3(4.1, 3.95, z), 0.5, 9);
  const stringMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 }, uTime: { value: 0 } },
    vertexShader: `uniform float uScale; uniform float uTime; varying float vT; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453); vT = 0.85 + 0.15 * sin(uTime * (1.0 + h * 2.0) + h * 30.0); gl_PointSize = max(2.0, 0.55 * uScale / -mv.z); }`,
    fragmentShader: `uniform sampler2D uTex; uniform float uI; varying float vT; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vec3(1.0, 0.72, 0.4) * a * uI * vT, 1.0); }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bulbs, 3));
  const bulbPts = new THREE.Points(bg, stringMat); bulbPts.frustumCulled = false; bulbPts.renderOrder = 9; scene.add(bulbPts);
  bulbPts.update = (dt, t, camera, h) => { stringMat.uniforms.uTime.value = t; stringMat.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
  ctx.particles.push(bulbPts);
  // a solid bulb you can see by day (small warm glass beads)
  {
    const bead = new THREE.SphereGeometry(0.07, 5, 4), list = [];
    for (let i = 0; i < bulbs.length; i += 3) { const g = bead.clone(); g.translate(bulbs[i], bulbs[i + 1], bulbs[i + 2]); list.push(g); }
    const m = new THREE.Mesh(mergeAll(list), M.candle); scene.add(m);
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
  scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#1a1410' })));
  ctx.roles.strings = stringMat;

  // ---------- facade dressing: banners, vines, flower boxes ----------
  for (const f of ctx.facades) {
    if (R() < 0.75) banner(R() < 0.5 ? 'navy' : 'ivory', 1.5, 4.6, f.x + f.s * 0.08, Math.min(f.top - 0.6, 11.4), f.z + (R() - 0.5) * 2, f.s > 0 ? Math.PI / 2 : -Math.PI / 2);
    if (R() < 0.8) vine(f.x + f.s * 0.05, 9 + ((R() * 2) | 0) * 4, f.z + (R() - 0.5) * f.w * 0.6, f.s > 0 ? Math.PI / 2 : -Math.PI / 2, 2.6, 3.4 + R() * 2);
    if (R() < 0.7) { const bz = f.z + (R() - 0.5) * f.w * 0.5; bb.add('bush_' + ['white', 'gold', 'lilac'][(R() * 3) | 0], f.x + f.s * 0.9, 0, bz, 0.8 + R() * 0.3); }
  }

  // ---------- gardens: cypress rows, palms in planters, flowering shrubs ----------
  for (const s of [-1, 1]) {
    for (const z of [9.5, 13.2, 16.9, 20.6]) { ctx.planter(s * 12.3, z, 1.1, 1.1, 0.55); bb.add('cypress', s * 12.3, 0.55, z, 1.05 + R() * 0.2); }
    bb.add('cypress', s * 10.6, 0.6, -41.5, 1.35); ctx.planter(s * 10.6, -41.5, 1.3, 1.3, 0.6);
    bb.add('cypress', s * 15.4, 0.6, 28.6, 1.3); ctx.planter(s * 15.4, 28.6, 1.3, 1.3, 0.6);
    bb.add('cypress', s * 19.6, 0.6, 28.6, 1.15); ctx.planter(s * 19.6, 28.6, 1.3, 1.3, 0.6);
    for (const [x, z] of [[s * 7.2, 27.6], [s * 4.6, 6.4]]) { ctx.planter(x, z, 1.4, 1.4, 0.6); bb.add('bush_white', x, 0.6, z, 0.9); }
    for (const z of [8.2, 24.8]) bb.add('bush_' + (z > 20 ? 'gold' : 'lilac'), s * 8, 0.42, z + (z > 20 ? 0.55 : -0.55), 1.2);
  }
  // palms on the diagonals around the circle
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = P.CIRCLE.x + dx * 10.2, z = P.CIRCLE.z + dz * 10.2;
    ctx.planter(x, z, 2.0, 2.0, 0.65);
    bb.add('palm', x, 0.65, z, 1.0 + R() * 0.15);
    bb.add('bush_' + (dz > 0 ? 'white' : 'gold'), x + 0.2, 0.65, z + 0.6, 0.75);
  }

  // ---------- THE HOUSE: gold and brass, an orrery over its doors ----------
  const H = P.HOUSE, hf = frame(H.x, H.z, faceRot(H.face));
  const house = { frame: hf, orrery: null, door: null };
  {
    lbox(B, 'ashlar2', hf, 18, 0.9, 13.4, 0, 0.45, -6.7);
    lbox(B, 'gold', hf, 18.1, 0.06, 13.5, 0, 0.9, -6.7, { uv: false });
    for (let k = 0; k < 3; k++) { const d = (3 - k) * 0.8; lbox(B, 'ashlar2', hf, 8.4 - k * 0.6, (k + 1) * 0.3, d, 0, (k + 1) * 0.15, d / 2); lbox(B, 'gold', hf, 8.4 - k * 0.6, 0.04, 0.08, 0, (k + 1) * 0.3 - 0.02, d - 0.04, { uv: false }); }
    // body: white walls with warm windows, gold pilasters at the corners, a gold and brass cornice
    lbox(B, 'win2', hf, 15, 10, 10.8, 0, 0.9 + 5, -6.6, { tile: [8, 4] });
    lbox(B, 'brass', hf, 15.6, 0.5, 11.4, 0, 11.15, -6.6);
    lbox(B, 'gold', hf, 15.8, 0.16, 11.6, 0, 11.48, -6.6, { uv: false });
    for (const sx of [-7.5, 7.5]) for (const sz of [-1.2, -12]) lbox(B, 'gold', hf, 0.9, 10, 0.9, sx, 5.9, sz);
    // portico: four gold columns on brass drums, a gold-banded entablature
    for (const sx of [-6.0, -2.6, 2.6, 6.0]) {
      lcyl(B, 'brass', hf, 0.74, 0.55, sx, 0.9, 0.4, 16);
      lcyl(B, 'skyglass', hf, 0.48, 6.4, sx, 1.45, 0.4, 16, 0.42);
      for(const dx of [-.32,.32]) lbox(B,'gold',hf,.055,6.4,.055,sx+dx,4.65,.78,{uv:false});
      lcyl(B, 'brass', hf, 0.66, 0.5, sx, 7.85, 0.4, 16, 0.5);
    }
    lbox(B, 'ashlar', hf, 15.4, 1.2, 2.4, 0, 8.95, -0.1);
    lbox(B, 'gold', hf, 15.5, 0.14, 2.5, 0, 8.4, -0.1, { uv: false });
    lbox(B, 'gold', hf, 15.5, 0.14, 2.5, 0, 9.5, -0.1, { uv: false });
    for (let k = -7; k <= 7; k++) lbox(B, 'brass', hf, 0.2, 0.5, 0.1, k * 1.0, 8.95, 1.12, { uv: false });
    for(const sx of [-6,-4,4,6]) lbox(B,'signal',hf,.08,4.8,.06,sx,4.4,-1.15,{uv:false});
    // the door: brass leaves, a warm gap of light, a gold frame and a glowing fanlight
    lbox(B, 'gold', hf, 4.0, 5.6, 0.3, 0, 0.9 + 2.8, -1.05);
    lbox(B, 'brass', hf, 1.5, 4.7, 0.2, -0.8, 0.9 + 2.35, -0.85);
    lbox(B, 'brass', hf, 1.5, 4.7, 0.2, 0.8, 0.9 + 2.35, -0.85);
    lbox(B, 'doorGlow', hf, 0.12, 4.6, 0.12, 0, 0.9 + 2.3, -0.82, { uv: false });
    const fan = new THREE.CircleGeometry(1.5, 18, 0, Math.PI); fan.translate(0, 5.6, -0.88); addLocal(B, 'warm', fan, hf, { uv: false });
    const fanR = new THREE.TorusGeometry(1.55, 0.1, 5, 20, Math.PI); fanR.translate(0, 5.6, -0.8); addLocal(B, 'gold', fanR, hf, { uv: false });
    for (let k = 1; k < 6; k++) { const a = Math.PI * k / 6; const g = new THREE.BoxGeometry(0.05, 1.5, 0.05); g.translate(0, 0.75, 0); g.rotateZ(a - Math.PI / 2); g.translate(0, 5.6, -0.78); addLocal(B, 'gold', g, hf, { uv: false }); }
    // the attic: a raised round frame for the orrery, flanked by gold scrolls
    lbox(B, 'ashlar', hf, 8.6, 5.6, 1.4, 0, 11.6, -0.9);
    lbox(B, 'gold', hf, 8.7, 0.14, 1.5, 0, 14.4, -0.9, { uv: false });
    const disc = new THREE.CircleGeometry(2.75, 40); disc.translate(0, 11.4, -0.18); addLocal(B, 'navy', disc, hf, { uv: false });
    { const med = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), M.compass); const [x, z] = hf.toWorld(0, -0.15); med.position.set(x, 11.4, z); med.rotation.y = hf.rot; scene.add(med); }
    for (const sx of [-1, 1]) { const sc = new THREE.TorusGeometry(0.8, 0.14, 6, 16, Math.PI * 1.4); sc.rotateZ(sx > 0 ? -0.3 : Math.PI + 0.3); sc.translate(sx * 3.6, 10.4, -0.1); addLocal(B, 'gold', sc, hf, { uv: false }); }
    // standing brass lamps at the foot of the steps
    for (const sx of [-4.6, 4.6]) { const [x, z] = hf.toWorld(sx, 2.6); B.box('brass', 0.6, 0.3, 0.6, x, 0.15, z); B.cyl('brass', 0.1, 2.6, x, 0.3, z, 8); B.cyl('brass', 0.36, 0.3, x, 2.9, z, 10, 0.5); ctx.flames.add(x, 3.12, z, 0.55); lanternPos.push(new THREE.Vector3(x, 3.4, z)); lights.add({ pos: new THREE.Vector3(x, 3.6, z), color: '#ffb060', intensity: 22, distance: 12, flicker: 0.2, role: 'lantern', priority: 1.2 }); walk.circle(x, z, 0.5); }
    // sconces either side of the door
    for (const sx of [-1.9, 1.9]) { const [x, z] = hf.toWorld(sx, -0.55); ctx.lantern(x, 3.8, z, 0.75); }
    // the gold dome, drum and lantern
    lcyl(B, 'brass', hf, 5.2, 2.0, 0, 11.6, -6.6, 24);
    lcyl(B, 'gold', hf, 5.4, 0.25, 0, 13.6, -6.6, 24);
    const dome = new THREE.SphereGeometry(5.0, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(0, 13.8, -6.6); addLocal(B, 'skyglass', dome, hf, { uv: false });
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const rib = new THREE.TorusGeometry(5.03, 0.06, 4, 16, Math.PI / 2); rib.rotateY(a); rib.translate(0, 13.8, -6.6); addLocal(B, 'goldBright', rib, hf, { uv: false }); }
    lcyl(B, 'warm', hf, 0.9, 1.6, 0, 18.7, -6.6, 10);
    lcyl(B, 'gold', hf, 1.1, 0.2, 0, 20.3, -6.6, 12);
    const fin = new THREE.ConeGeometry(0.5, 1.4, 10); fin.translate(0, 21.2, -6.6); addLocal(B, 'gold', fin, hf, { uv: false });
    // walkability: the plinth and body are solid, the steps lead up to the door
    walk.orect(hf, 0, -6.6, 9.3, 7.2, 1);
    walk.orect(hf, 0, 1.0, 4.0, 1.5, 0);
    walk.orect(hf, 0, -0.1, 1.9, 0.5, 0);
    for (const sx of [-6.0, -2.6, 2.6, 6.0]) { const [x, z] = hf.toWorld(sx, 0.4); walk.circle(x, z, 0.8); }
    house.door = { local: [0, -0.2], out: hf.toWorld(0, 3.4), face: [-Math.SQRT1_2, Math.SQRT1_2] };
    // the orrery (animated) in its round frame over the door: gold rim, brass orbits with planets, a burning heart
    const og = new THREE.Group(); const [ox, oz] = hf.toWorld(0, 0.2); og.position.set(ox, 11.4, oz); og.rotation.y = hf.rot; scene.add(og);
    const frameRing = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.2, 8, 64), M.gold); og.add(frameRing);
    const frameRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.08, 6, 64), M.brass); og.add(frameRing2);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, tk = new THREE.Mesh(new THREE.BoxGeometry(0.08, k % 4 ? 0.28 : 0.5, 0.08), M.gold); tk.position.set(Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0); tk.rotation.z = a - Math.PI / 2; og.add(tk); }
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 12), M.goldBright); sun.position.z = 0.5; og.add(sun);
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color('#ffcf80').multiplyScalar(1.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sunGlow.scale.setScalar(3.2); sunGlow.position.z = 0.6; og.add(sunGlow);
    const orbits = [];
    for (const [r, tilt, speed, pr, pm] of [[1.2, 0.35, 0.9, 0.15, M.cyan], [1.85, -0.45, 0.55, 0.2, M.goldBright], [2.5, 0.2, 0.32, 0.25, M.brass]]) {
      const piv = new THREE.Group(); piv.position.z = 0.5; piv.rotation.x = Math.PI / 2 + tilt; piv.rotation.y = tilt * 0.6; og.add(piv);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 5, 72), M.gold); piv.add(ring);
      const arm = new THREE.Group(); piv.add(arm);
      const planet = new THREE.Mesh(new THREE.SphereGeometry(pr, 12, 8), pm); planet.position.set(r, 0, 0); arm.add(planet);
      orbits.push({ arm, speed });
    }
    house.orrery = { group: og, orbits, glow: sunGlow };
    lights.add({ pos: new THREE.Vector3(...(() => { const [x, z] = hf.toWorld(0, 2.2); return [x, 11.5, z]; })()), color: '#ffc070', intensity: 26, distance: 13, flicker: 0.03, role: 'glyph', priority: 1.1 });
    // flowers at the House steps
    for (const sx of [-3.8, 3.8]) { const [x, z] = hf.toWorld(sx, 1.4); bb.add('bush_gold', x, 0, z, 0.9); }
  }

  // ---------- ASHFORD: a round arch of pale ash-grey stone under a great ash ----------
  {
    const A = P.ASHFORD, fr = frame(A.x, A.z, faceRot(A.face));
    const sl = archSlab(10.4, 9.6, 5.2, 5.0, 2.6); sl.translate(0, 0, -2.6); addLocal(B, 'ashlar', sl, fr);
    archRing(B, fr, 2.72, 5.0, 0.05, 0.16);
    lbox(B, 'ashlar2', fr, 11, 0.7, 3.0, 0, 9.95, -1.3);
    lbox(B, 'gold', fr, 11.1, 0.08, 3.1, 0, 9.62, -1.3, { uv: false });
    for (const sx of [-1, 1]) { lbox(B, 'ashlar2', fr, 1.2, 9.4, 0.5, sx * 4.2, 4.7, 0.25); const [x, z] = fr.toWorld(sx * 2.15, 0.35); ctx.lantern(x, 3.4, z, 0.85, false, true); }
    const [tx, tz] = fr.toWorld(0, -3.8); bb.add('ash', tx, 3.2, tz, 1.25);
    for (const sx of [-3.0, 3.0]) { const [x, z] = fr.toWorld(sx, -2.2); bb.add('cypress', x, 0, z, 1.1); }
    // the lane beyond: warm windows and lanterns leading in
    for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(5, 8, 12); g.translate(sx * 5.6, 4, -9); addLocal(B, sx > 0 ? 'win0' : 'win2', g, fr, { tile: [8, 4] }); }
    // The unfinished district has no lit trail beyond its closed doors.
    const lane = new THREE.PlaneGeometry(6.2, 16); lane.rotateX(-Math.PI / 2); lane.translate(0, 0.002, -9); addLocal(B, 'ashlar2', lane, fr);
    walk.orect(fr, 0, -1.3, 5.6, 1.6, 1); walk.orect(fr, 0, -1.6, 2.2, 2.5, 0);
    for (const sx of [-1, 1]) { const [x, z] = fr.toWorld(sx * 3.4, 1.4); bb.add('bush_white', x, 0, z, 0.95); }
  }

  // ---------- BRAMBLEHOLT: a timber lychgate drowned in flowering vines ----------
  {
    const A = P.BRAMBLE, fr = frame(A.x, A.z, faceRot(A.face));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { lbox(B, 'old', fr, 0.8, 0.6, 0.8, sx * 2.3, 0.3, sz * 1.0); lbox(B, 'wood', fr, 0.4, 4.4, 0.4, sx * 2.3, 2.8, sz * 1.0); }
    for (const sz of [-1, 1]) lbox(B, 'wood', fr, 5.4, 0.35, 0.35, 0, 4.9, sz * 1.0);
    for (const sx of [-1, 1]) lbox(B, 'wood', fr, 0.35, 0.35, 2.6, sx * 2.3, 4.9, 0);
    for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(3.7, 0.18, 4.4); g.rotateZ(sx * -0.62); g.translate(sx * 1.5, 6.15, 0); addLocal(B, 'roofNavy', g, fr); }
    lbox(B, 'gold', fr, 0.3, 0.3, 4.6, 0, 7.25, 0, { uv: false });
    // the gable ends: a carved timber truss with a gold star
    for (const sz of [-1.9, 1.9]) { const tri = new THREE.Shape(); tri.moveTo(-2.6, 0); tri.lineTo(2.6, 0); tri.lineTo(0, 2.0); tri.lineTo(-2.6, 0); const g = new THREE.ExtrudeGeometry(tri, { depth: 0.15, bevelEnabled: false }); g.translate(0, 5.1, sz); addLocal(B, 'wood', g, fr); }
    const st = new THREE.OctahedronGeometry(0.35); st.scale(0.6, 1.2, 0.3); st.translate(0, 5.9, 2.1); addLocal(B, 'goldBright', st, fr, { uv: false });
    // vines draped over the eaves and posts, flowers massed at its feet
    for (const sx of [-2.4, 0, 2.4]) { const [x, z] = fr.toWorld(sx, 2.15); vine(x, 5.2, z, fr.rot, 2.4, 3.4); }
    for (const sx of [-1, 1]) { const [x, z] = fr.toWorld(sx * 2.3, 1.25); vine(x, 4.6, z, fr.rot, 1.2, 4.2); }
    for (const sx of [-3.6, -2.6, 2.6, 3.6]) { const [x, z] = fr.toWorld(sx, 1.6); bb.add(Math.abs(sx) > 3 ? 'bush_lilac' : 'bush_white', x, 0, z, 1.0 + R() * 0.3); }
    for (const sx of [-1, 1]) { lbox(B, 'old', fr, 2.4, 1.2, 0.8, sx * 4.4, 0.6, 0); lbox(B, 'leafy', fr, 2.5, 0.5, 0.9, sx * 4.4, 1.4, 0); }
    // a garden lane beyond: hedges and trees
    for (const lz of [-4, -8, -12]) for (const sx of [-1, 1]) { const [x, z] = fr.toWorld(sx * 2.6, lz); bb.add(lz === -8 ? 'cypress' : 'bush_white', x, 0, z, 1.1); }
    const lane = new THREE.PlaneGeometry(5, 16); lane.rotateX(-Math.PI / 2); lane.translate(0, 0.002, -8); addLocal(B, 'oldflags', lane, fr);
    { const [x, z] = fr.toWorld(0, -14); ctx.lantern(x, 0, z, 0.9, true); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [x, z] = fr.toWorld(sx * 2.3, sz); walk.circle(x, z, 0.6); }
    for (const sx of [-1, 1]) walk.orect(fr, sx * 4.4, 0, 1.4, 0.6, 1);
    walk.orect(fr, 0, -2.4, 1.9, 3.0, 0);
  }

  // ---------- STONEMERE: a megalithic gate, water falling from its lintel, a line of Signal light across it ----------
  const stonemere = { falls: [] };
  {
    const A = P.STONEMERE, fr = frame(A.x, A.z, faceRot(A.face));
    const mega = (w, h, d, x, y, z, jit = 0.12) => {
      const g = new THREE.BoxGeometry(w, h, d, 2, 3, 2); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { p.setX(i, p.getX(i) + (R() - 0.5) * jit); p.setY(i, p.getY(i) + (R() - 0.5) * jit * 0.6); p.setZ(i, p.getZ(i) + (R() - 0.5) * jit); }
      g.computeVertexNormals(); g.translate(x, y, z); addLocal(B, 'old', g, fr);
    };
    for (const sx of [-1, 1]) mega(1.9, 7.6, 1.7, sx * 3.1, 3.8, 0);
    mega(9.4, 1.7, 2.0, 0, 8.45, 0, 0.2);
    mega(5.6, 1.0, 1.6, 0, 9.75, -0.1, 0.25);
    // the Signal line carved across the lintel, and its star
    for (let k = -8; k <= 8; k++) if (k % 3 !== 0) lbox(B, 'cyan', fr, 0.36, 0.07, 0.06, k * 0.45, 8.45, 1.03, { uv: false });
    const st = new THREE.OctahedronGeometry(0.45); st.scale(0.55, 1.3, 0.25); st.translate(0, 8.45, 1.05); addLocal(B, 'cyan', st, fr, { uv: false });
    const st2 = new THREE.OctahedronGeometry(0.45); st2.scale(1.3, 0.55, 0.25); st2.translate(0, 8.45, 1.05); addLocal(B, 'cyan', st2, fr, { uv: false });
    { const [x, z] = fr.toWorld(0, 1.6); lights.add({ pos: new THREE.Vector3(x, 8.4, z), color: '#3fd3c8', intensity: 16, distance: 10, flicker: 0.04, role: 'glyph', priority: 1.1 }); }
    // water from the lintel's ends into the meres either side
    for (const sx of [-1, 1]) {
      const fm = brightFallMaterial({ width: 1.1, height: 7.4, tpu: 14, speed: 5 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 7.4), fm);
      const [x, z] = fr.toWorld(sx * 4.6, 0.6); m.position.set(x, 7.4 / 2 + 0.25, z); m.rotation.y = fr.rot; scene.add(m);
      stonemere.falls.push(fm);
      mega(1.6, 0.5, 1.0, sx * 4.6, 7.65, 0.3, 0.15);
      const pool = new THREE.CircleGeometry(1.5, 24); pool.rotateX(-Math.PI / 2); pool.translate(sx * 4.8, 0.22, 1.6);
      pool.applyMatrix4(fr.m); const pm = new THREE.Mesh(pool, M.water); pm.layers.set(1); scene.add(pm);
      const ring = new THREE.TorusGeometry(1.6, 0.22, 6, 24); ring.rotateX(Math.PI / 2); ring.translate(sx * 4.8, 0.22, 1.6); addLocal(B, 'old', ring, fr, { uv: false });
      const [px, pz] = fr.toWorld(sx * 4.8, 1.6); ctx.mists.push([px, 0, pz, 1.4]); walk.circle(px, pz, 2.0);
    }
    // a misty lane beyond, lit by Signal-cyan and warm lanterns
    for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(5, 9, 12); g.translate(sx * 5.4, 4.5, -8.5); addLocal(B, 'win1', g, fr, { tile: [8, 4] }); }
    const lane = new THREE.PlaneGeometry(5.6, 16); lane.rotateX(-Math.PI / 2); lane.translate(0, 0.002, -8); addLocal(B, 'oldflags', lane, fr);
    // The way out to the Green: two lanterns lead the eye through the arch.
    for (const lz of [-2.2, -5.0]) for (const sx of [-1, 1]) { const [x, z] = fr.toWorld(sx * 2.5, lz); ctx.lantern(x, 0, z, 0.9, true); }
    for (const sx of [-1, 1]) { const [x, z] = fr.toWorld(sx * 3.1, 0); walk.circle(x, z, 1.4); }
    walk.orect(fr, 0, -2.5, 2.0, 3.2, 0);
  }

  const vines = new THREE.Mesh(mergeAll(vineGeo), ctx.vineMat); vines.castShadow = true; vines.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: ctx.vineMat.map, alphaTest: 0.5 }); scene.add(vines);
  return { house, stonemere };
}
