// "Atlas Takes Form" (storyboard frame 7). The temple is assembled from the seven marks (CANON ruling 12: the marks are the
// Nexus's blueprint): around the dark hall they wake one by one, in THE PATH's order, and each sends its light inward,
// down its gate and along its engraved lane to the dais, and up in an arc to the orrery; the hall's gold lights with them.
// The core flares and light runs down the axis to the dais; a swarm of motes spirals in and fills his silhouette from the
// feet up with pure light; the light cools to the man; a ripple runs out through the gold of the floor; the gauntlet
// flickers cyan awake; Ora drifts down to his open hand. Then the player has him. No words. About nine seconds (any key hurries it).
import * as THREE from 'three';
import { createSwarm, threadMaterial } from './fx.js';
import { ORRERY_Y, DAIS_TOP, GATES } from './layout.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (x) => x * x * (3 - 2 * x);

// (seconds from arrival; the page's fade from black takes the first ~2 s, so the first mark wakes as it lifts)
export const FORM = { marks: 1.2, markStep: 0.33, lane: 1.1, flare: 4.25, axis: 4.55, fill0: 4.85, fill1: 6.5, cool: 7.3, ripple: 6.5, gaunt: 7.1, ora: 7.5, oraArrive: 8.7, control: 8.8, end: 10.0 };

/** Patch the sprite's material: uShape fills the silhouette from the feet up (pixel by pixel), uLight turns it to light. */
export function patchSpriteForming(hero, sheet) {
  const sp = sheet.sprite;
  const U = { uShape: { value: 1 }, uLight: { value: 0 }, uFormOn: { value: 0 }, uFormTexel: { value: new THREE.Vector2(1 / (sp.frameW * sp.cols), 1 / (sp.frameH * sp.rows)) }, uFormH: { value: hero.height } };
  const mat = hero.material, prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vFormY; uniform float uFormH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFormY = position.y / uFormH;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFormY; uniform float uShape, uLight, uFormOn; uniform vec2 uFormTexel;')
      .replace('#include <opaque_fragment>', `
      if (uFormOn > 0.5) {
        vec2 fpx = floor(vMapUv / uFormTexel);
        float fn = fract(sin(dot(fpx, vec2(12.9898, 78.233))) * 43758.5453);
        float front = uShape * 1.32 - 0.16;
        float fd = front - (vFormY + fn * 0.16);
        if (fd < 0.0) discard;
        float fedge = 1.0 - smoothstep(0.0, 0.15, fd);
        float fk = clamp(max(uLight, fedge), 0.0, 1.0);
        outgoingLight = mix(outgoingLight, mix(vec3(1.0, 0.84, 0.56), vec3(0.85, 0.95, 1.0), fedge) * (4.5 + 4.0 * fedge), fk);
      }
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => prevKey() + '|form';
  mat.needsUpdate = true;
  return U;
}

/** Opaque pixels of one sprite frame, as [u, v] metres in the sprite plane (u right of centre, v up from the feet). */
function silhouette(sheet, row = 0, col = 0) {
  const sp = sheet.sprite;
  let data, W;
  if (sheet.raw && sheet.raw.map && sheet.raw.map.data) { data = sheet.raw.map.data; W = sheet.raw.map.w; }
  else {
    const img = sheet.map.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); data = g.getImageData(0, 0, c.width, c.height).data; W = c.width;
  }
  const pts = [], x0 = col * sp.frameW, y0 = row * sp.frameH;
  for (let y = 0; y < sp.frameH; y++) for (let x = 0; x < sp.frameW; x++) {
    if (data[((y0 + y) * W + x0 + x) * 4 + 3] < 128) continue;
    pts.push([((x + 0.5) / sp.frameW - 0.5) * (sp.frameW / sp.ppu), (1 - (y + 0.5) / sp.frameH) * (sp.frameH / sp.ppu)]);
  }
  return pts;
}

export function createForming({ scene, hero, sheet, ora, orrery, gates, glow, sfx, floorU, beams, base, assemble }) {
  const U = patchSpriteForming(hero, sheet);
  const contact = hero.group.children.find((c) => c !== hero.mesh);
  // ---- threads: every mark to the orrery's core, and the axis down to the dais ----
  const core = new THREE.Vector3(0, ORRERY_Y, 0);
  const order = ['80s', 'gobekli', 'egypt', 'east', 'vale', 'signal', 'atlantis'];
  const threads = [];
  for (const g of gates) {
    const a = g.markPos.clone().addScaledVector(g.inward, 0.5);
    const mid = a.clone().lerp(core, 0.45); mid.y += 3.5 + Math.random();
    const mid2 = a.clone().lerp(core, 0.8); mid2.y += 1.6;
    const curve = new THREE.CatmullRomCurve3([a, mid, mid2, core.clone().addScaledVector(a.clone().sub(core).normalize(), 0.7)]);
    const m = threadMaterial(g.alive ? '#ffe2a8' : '#e8c27a');
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, g.alive ? 0.075 : 0.05, 5, false), m);
    mesh.renderOrder = 13; mesh.frustumCulled = false;
    scene.add(mesh);
    threads.push({ g, mesh, m, i: order.indexOf(g.world) });
  }
  const axisCurve = new THREE.LineCurve3(core.clone().add(new THREE.Vector3(0, -0.7, 0)), base.clone().setY(DAIS_TOP + 0.05));
  const axisM = threadMaterial('#fff0cc');
  const axisMesh = new THREE.Mesh(new THREE.TubeGeometry(axisCurve, 64, 0.09, 6, false), axisM);
  axisMesh.renderOrder = 13; scene.add(axisMesh);

  // ---- the swarm that becomes him ----
  const sil = silhouette(sheet);
  const starts = [], ends = [], delays = [], durs = [];
  const axis = base.clone();
  for (const [u, v] of sil) {
    const h = v / hero.height;
    const fromCore = Math.random() < 0.5;
    if (fromCore) starts.push(core.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2.2 - 1.2, (Math.random() - 0.5) * 3)));
    else { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 6; starts.push(new THREE.Vector3(base.x + Math.cos(a) * r, 0.6 + Math.random() * 6, base.z + Math.sin(a) * r)); }
    const arrive = FORM.fill0 + 0.1 + h * (FORM.fill1 - FORM.fill0 - 0.25) + (Math.random() - 0.5) * 0.25;
    const dur = fromCore ? 1.1 + Math.random() * 0.6 : 1.4 + Math.random() * 0.8;
    ends.push([u, v]); delays.push(arrive - dur); durs.push(dur);
  }
  const swarm = createSwarm({ starts, ends, delays, durs, axis, texture: glow });
  scene.add(swarm);

  const st = { t: 0, done: false, controlled: false, skipped: false };
  const handAnchor = new THREE.Vector3();
  const api = {
    state: st, threads, swarm, U,
    get running() { return !st.done; },
    get control() { return st.t >= FORM.control; },
    restart() { st.t = 0; st.done = false; st.skipped = false; st.oraPlaced = false; st.chimed = false; api.apply(0); },
    skip() { st.t = FORM.end + 1; st.skipped = true; api.apply(st.t); st.done = true; },
    /** Settle everything into the after-state (used when arriving from elsewhere). */
    settle() { api.skip(); },
    apply(T, cam = null, oraAnchor = null) {
      // marks wake in order; each sends its light inward along its lane, and its thread up to the orrery
      let built = 0;
      for (const th of threads) {
        const tw = FORM.marks + th.i * FORM.markStep;
        built += ramp(T, tw, tw + 0.7) / threads.length;
        if (floorU) {
          const k = gates.indexOf(th.g);
          floorU.uLaneHead.value[k] = T < tw ? -100 : 20.4 - 13.8 * ease(ramp(T, tw + 0.05, tw + 0.05 + FORM.lane));
          floorU.uLaneLit.value[k] = ramp(T, tw, tw + 0.3) * (1 - ramp(T, FORM.cool, FORM.end + 0.6)) * (th.g.alive ? 1.4 : 1);
        }
        const t0 = FORM.marks + th.i * FORM.markStep;
        const w = ramp(T, t0, t0 + 0.25), flash = Math.exp(-Math.max(0, T - t0 - 0.25) * 2.2) * ramp(T, t0, t0 + 0.25);
        const base = th.g.alive ? 3.2 : 0.9;
        th.g.medMat.emissiveIntensity = 0.12 + (base - 0.12) * w + flash * 2.4;
        th.g.veilMat.uniforms.uWake.value = 0.25 + 0.75 * w;
        th.m.uniforms.uHead.value = T < t0 + 0.1 ? -1 : Math.min(1.6, (T - t0 - 0.1) / 1.2);
        th.m.uniforms.uPersist.value = ramp(T, t0 + 0.9, t0 + 1.4) * (1.1 - 0.75 * ramp(T, FORM.cool, FORM.end)) * (th.g.alive ? 1.5 : 1);
        th.m.uniforms.uI.value = 1 - 0.45 * ramp(T, FORM.cool, FORM.end) * (th.g.alive ? 0.3 : 1);
        th.m.uniforms.uPulse.value = ramp(T, FORM.end - 0.5, FORM.end) * (th.g.alive ? 1.6 : 0.5);
      }
      if (assemble) assemble(Math.min(1, built), T);
      // the core flares, light runs down the axis
      const flare = ramp(T, FORM.flare, FORM.flare + 1.0);
      orrery.setEnergy(0.25 + 1.35 * flare - 0.6 * ramp(T, FORM.cool, FORM.end));
      axisM.uniforms.uHead.value = T < FORM.axis ? -1 : Math.min(1.6, (T - FORM.axis) / 0.8);
      axisM.uniforms.uPersist.value = 0.6 * ramp(T, FORM.axis + 0.6, FORM.axis + 1.0) * (1 - ramp(T, FORM.cool, FORM.end));
      axisM.uniforms.uI.value = 1 - ramp(T, FORM.cool, FORM.end);
      if (beams) beams.material.uniforms.uI.value = 0.7 + 1.1 * ramp(T, FORM.axis - 0.2, FORM.axis + 0.6) - 0.8 * ramp(T, FORM.cool, FORM.end + 0.5);
      // the swarm and the silhouette filling with light
      swarm.material.uniforms.uT.value = T;
      swarm.visible = T > 2.0 && T < FORM.fill1 + 1.0;
      U.uFormOn.value = T < FORM.cool + 0.05 ? 1 : 0;
      U.uShape.value = ramp(T, FORM.fill0, FORM.fill1);
      U.uLight.value = 1 - ease(ramp(T, FORM.fill1, FORM.cool));
      hero.mesh.visible = T > FORM.fill0;
      hero.mesh.castShadow = T > FORM.fill1 - 0.4;
      if (contact) contact.visible = T > FORM.fill1 - 0.6;
      // the ripple through the floor's gold
      if (floorU) {
        if (T < FORM.ripple) {
          // as the last light arrives, a ring closes in on the dais
          const c0 = FORM.marks + 6 * FORM.markStep + 0.2, k = ramp(T, c0, c0 + 1.2);
          floorU.uRippleR.value = 20 - 13.5 * ease(k); floorU.uRippleA.value = 1.6 * ramp(T, c0 - 0.2, c0 + 0.2) * (1 - ramp(T, c0 + 1.1, c0 + 1.5));
        } else { const k = ramp(T, FORM.ripple, FORM.ripple + 2.2); floorU.uRippleR.value = 0.5 + k * 24; floorU.uRippleA.value = (1 - k) * 3.0; }
      }
      // the gauntlet wakes: flicker, then steady
      const g0 = FORM.gaunt;
      let ge = 0;
      if (T >= g0) {
        const q = T - g0;
        ge = q < 0.06 ? 1 : q < 0.16 ? 0.05 : q < 0.24 ? 0.8 : q < 0.42 ? 0.1 : q < 0.48 ? 0.6 : Math.min(1, 0.2 + (q - 0.48) * 2.2);
      }
      hero.material.emissiveIntensity = (T < g0 ? 0 : ge) * 2.5;
      // Ora: a spark leaves the core and drifts down to his open hand
      const ov = T >= FORM.ora;
      ora.group.visible = ov; ora.trail.visible = ov;
      if (oraAnchor && ov) {
        const k = ease(ramp(T, FORM.ora, FORM.oraArrive));
        const from = core.clone().add(new THREE.Vector3(0, -1.0, 0));
        handAnchor.copy(from).lerp(oraAnchor, k);
        const swirl = (1 - k) * k * 4.0;
        handAnchor.x += Math.cos(T * 2.4) * swirl; handAnchor.z += Math.sin(T * 2.4) * swirl;
        if (!st.oraPlaced) { ora.place(from); st.oraPlaced = true; }
      }
      ora.lightScale = ov ? ramp(T, FORM.ora, FORM.ora + 0.6) : 0;
      if (T >= FORM.end) { swarm.visible = false; axisMesh.visible = false; }
      else axisMesh.visible = true;
      return handAnchor;
    },
    /** Advance; returns where Ora should be (or null after it reaches the hand). */
    update(dt, oraAnchor) {
      if (st.done) return null;
      st.t += dt;
      if (st.t >= FORM.ora && !st.oraPlaced) { /* placed in apply */ }
      const a = api.apply(st.t, null, oraAnchor);
      if (sfx && !st.chimed && st.t >= FORM.ripple) { st.chimed = true; sfx.formChord(); }
      if (st.t >= FORM.end) st.done = true;
      return st.t < FORM.oraArrive ? a : null;
    },
  };
  api.apply(0);
  return api;
}
