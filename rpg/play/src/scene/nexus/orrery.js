// The golden orrery: an armillary of tilted gold rings around a burning core on an axis of stars, floating over the dais.
// Every ring precesses slowly; planets (violet glass, gold, a Signal-teal spark, a pale moon) ride their orbits; a ticked
// band turns against them. Engraved emissive lines make the rings read as light at a distance. It casts real shadows.
import * as THREE from 'three';
import { ORRERY_Y } from './layout.js';

function starGeometry(r, k = 0.13, depth = 0.08) {
  const s = new THREE.Shape(), w = r * k;
  s.moveTo(0, r); s.lineTo(w, w); s.lineTo(r * 0.5, 0); s.lineTo(w, -w); s.lineTo(0, -r * 0.8); s.lineTo(-w, -w); s.lineTo(-r * 0.5, 0); s.lineTo(-w, w); s.lineTo(0, r);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  const g2 = g.clone(); g2.rotateY(Math.PI / 2);
  return [g, g2];
}

export function buildOrrery({ glow, flare, band, env = 1 }) {
  const group = new THREE.Group();
  group.position.set(0, ORRERY_Y, 0);
  const M = {
    gold: new THREE.MeshStandardMaterial({ color: '#caa45c', metalness: 1, roughness: 0.26, envMapIntensity: 1.7 * env, emissive: '#5a3f16', emissiveIntensity: 0.6 }),
    line: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd590').multiplyScalar(3.2) }),
    violet: new THREE.MeshStandardMaterial({ color: '#241a52', emissive: '#6a4ee0', emissiveIntensity: 1.1, roughness: 0.1, metalness: 0.3, envMapIntensity: 2.2 }),
    goldPlanet: new THREE.MeshStandardMaterial({ color: '#d8b46a', metalness: 1, roughness: 0.35, emissive: '#7a5520', emissiveIntensity: 0.7, envMapIntensity: 1.8 }),
    pale: new THREE.MeshStandardMaterial({ color: '#d8d6ea', roughness: 0.55, emissive: '#7c7cb0', emissiveIntensity: 0.35 }),
    teal: new THREE.MeshStandardMaterial({ color: '#0d3333', emissive: '#3fd3c8', emissiveIntensity: 2.6, roughness: 0.4 }),
    band: new THREE.MeshStandardMaterial({ map: band.map, emissiveMap: band.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.2, metalness: 1, roughness: 0.32, envMapIntensity: 1.6 * env, side: THREE.DoubleSide }),
    core: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0cc').multiplyScalar(7) }),
  };
  band.map.wrapS = band.emissiveMap.wrapS = THREE.RepeatWrapping; band.map.repeat.x = band.emissiveMap.repeat.x = 6;
  const shadow = (m) => { m.castShadow = true; m.receiveShadow = false; return m; };

  // the axis of stars
  const axis = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 10.6, 8), M.gold));
  axis.position.y = 1.9; group.add(axis);
  for (const [y, r] of [[7.6, 1.15], [-3.75, 0.6]]) for (const g of starGeometry(r)) { const m = new THREE.Mesh(g, M.line); m.position.y = y; group.add(m); }
  for (const y of [6.3, -2.9]) { const s = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), M.gold)); s.position.y = y; group.add(s); }
  for (const y of [2.4, -2.0, 4.4]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 24), M.line); r.rotation.x = Math.PI / 2; r.position.y = y; group.add(r); }

  // the core and its cage
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), M.core);
  group.add(core);
  const add = THREE.AdditiveBlending;
  const sprite = (tex, color, k, scale) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(k), blending: add, depthWrite: false, transparent: true, toneMapped: false })); s.scale.setScalar(scale); s.renderOrder = 15; return s; };
  const halo = sprite(glow, '#ffc878', 1.4, 7.5), corona = sprite(flare, '#fff0d0', 3.2, 3.6);
  group.add(halo, corona);
  const cage = [];
  for (const [r, tilt] of [[1.05, [0.9, 0, 0.3]], [1.3, [-0.4, 0.6, 1.1]], [1.55, [0.2, 1.2, -0.7]]]) {
    const p = new THREE.Group(); p.rotation.set(...tilt);
    const t = shadow(new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 64), M.gold)); t.rotation.x = Math.PI / 2; p.add(t);
    const l = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 4, 64), M.line); l.rotation.x = Math.PI / 2; l.position.y = 0.04; p.add(l);
    group.add(p); cage.push(p);
  }

  // rings, each in a tilt frame that precesses, with planets riding them
  const RINGS = [
    { r: 2.3, tube: 0.05, tilt: [0.62, 0, 0.3], pre: 0.11, planets: [{ s: 0.15, m: M.teal, ph: 0.4, sp: 0.8 }] },
    { r: 3.2, tube: 0.07, tilt: [-0.5, 0, -0.2], pre: -0.07, ticks: 36, planets: [{ s: 0.32, m: M.violet, ph: 2.0, sp: 0.36 }] },
    { r: 4.2, tube: 0.09, tilt: [0.22, 0, -0.42], pre: 0.05, ticks: 72, planets: [{ s: 0.46, m: M.goldPlanet, ph: 4.1, sp: 0.22, moon: true }] },
    { r: 5.0, tube: 0.06, tilt: [0.82, 0, 0.12], pre: -0.035, planets: [{ s: 0.24, m: M.pale, ph: 1.0, sp: 0.16 }] },
    { r: 6.0, tube: 0.045, tilt: [0.1, 0, 0.06], pre: 0.02, ticks: 96, planets: [{ s: 0.2, m: M.violet, ph: 5.2, sp: 0.1 }] },
  ];
  const rings = [];
  for (const d of RINGS) {
    const frame = new THREE.Group(); frame.rotation.set(...d.tilt);
    const spin = new THREE.Group(); frame.add(spin);
    const t = shadow(new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 8, 180), M.gold)); t.rotation.x = Math.PI / 2; spin.add(t);
    // two engraved light lines either side of the ring (they read as luminous orbits from afar)
    for (const sgn of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(d.r + sgn * d.tube * 0.55, d.tube * 0.22, 4, 180), M.line); l.rotation.x = Math.PI / 2; l.position.y = d.tube * 0.55; spin.add(l); }
    if (d.ticks) {
      const gs = [];
      for (let k = 0; k < d.ticks; k++) { const a = (k / d.ticks) * Math.PI * 2, big = k % 6 === 0; const g = new THREE.BoxGeometry(0.04, big ? 0.34 : 0.18, 0.04); g.translate(0, (big ? 0.17 : 0.09) + d.tube, 0); g.rotateY(-a); g.translate(Math.cos(a) * d.r, 0, Math.sin(a) * d.r); gs.push(g); }
      const merged = new THREE.Mesh(mergeBoxes(gs), M.line); spin.add(merged);
    }
    const planets = d.planets.map((p) => {
      const holder = new THREE.Group(); spin.add(holder);
      const m = shadow(new THREE.Mesh(new THREE.SphereGeometry(p.s, 24, 16), p.m)); m.position.x = d.r; holder.add(m);
      let moon = null;
      if (p.moon) {
        const mo = new THREE.Group(); mo.position.x = d.r; holder.add(mo);
        const mr = new THREE.Mesh(new THREE.TorusGeometry(p.s * 1.9, 0.018, 4, 48), M.line); mr.rotation.x = Math.PI / 2 - 0.3; mo.add(mr);
        const mm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), M.pale); mm.position.x = p.s * 1.9; mo.add(mm);
        moon = mo;
      }
      holder.rotation.y = p.ph;
      return { holder, sp: p.sp, moon };
    });
    group.add(frame);
    rings.push({ frame, spin, d, planets, base: frame.rotation.clone() });
  }
  // the broad band, turning against the rings
  const bandFrame = new THREE.Group(); bandFrame.rotation.set(0.3, 0, 0.14);
  const bandMesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.32, 160, 1, true), M.band));
  bandFrame.add(bandMesh); group.add(bandFrame);

  let energy = 1;
  const api = {
    group, core, halo, corona, materials: M,
    coreWorld: () => new THREE.Vector3(0, ORRERY_Y, 0),
    setEnergy(e) {
      energy = e;
      M.line.color.set('#ffd590').multiplyScalar(1.2 + 2.6 * e);
      M.core.color.set('#fff0cc').multiplyScalar(2 + 6 * e);
      M.gold.emissiveIntensity = 0.35 + 0.4 * e;
      M.band.emissiveIntensity = 0.5 + 1.0 * e;
      halo.material.color.set('#ffc878').multiplyScalar(0.5 + 1.2 * e);
      corona.material.color.set('#fff0d0').multiplyScalar(1 + 2.8 * e);
    },
    update(dt, t, speed = 1) {
      group.rotation.y += dt * 0.025 * speed;
      for (const R of rings) {
        R.frame.rotation.y = R.base.y + t * R.d.pre * speed;
        R.frame.rotation.x = R.base.x + Math.sin(t * 0.07 + R.d.r) * 0.05;
        for (const p of R.planets) { p.holder.rotation.y += dt * p.sp * speed; if (p.moon) p.moon.rotation.y += dt * 1.4; }
      }
      bandMesh.rotation.y -= dt * 0.04 * speed;
      cage.forEach((c, i) => { c.rotation.y += dt * (0.5 + i * 0.3) * speed; c.rotation.z += dt * 0.2 * (i - 1); });
      const pulse = 1 + Math.sin(t * 1.9) * 0.04;
      halo.scale.setScalar(7.5 * pulse * (0.7 + 0.3 * energy));
      corona.material.rotation = Math.sin(t * 0.3) * 0.1;
    },
  };
  api.setEnergy(1);
  return api;
}

function mergeBoxes(list) {
  let n = 0; for (const g of list) n += g.toNonIndexed().attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g0 of list) { const g = g0.toNonIndexed(); pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}
