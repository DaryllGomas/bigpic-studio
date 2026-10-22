// The Nexus, built: a curved wall of night-stone with flat portal panels at every bay (arched openings, gold archivolts,
// keystone stars), pilasters with gold line-glow between the bays, a cornice, an open dome of ribs to the oculus, the
// tiered dais, lamp stands, the great bronze doors standing open onto the City (a landing, a stair, spires below) and a
// window onto the cosmos. Geometry goes into the shared Batch (few draw calls); live pieces (veils, medallions) are meshes.
import * as THREE from 'three';
import { building, spire } from '../../engine/world/city.js';
import { R, WALL_T, WALL_H, CORNICE_H, CUT, MEDALLION, DOME, DAIS, BAYS, polar, rad, bayFrame } from './layout.js';
import { archShape, veilMaterial, cosmosMaterial } from './fx.js';

// ---------- geometry helpers ----------
/** UVs by box projection in the geometry's own (local) frame, before it is placed in the world. */
export function bakeLocalUV(geo, tile = 4) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** A curved block: the wall between radii r0..r1, angles d0..d1 (deg), heights y0..y1, with cylindrical UVs. */
export function curvedBox(r0, r1, d0, d1, y0, y1, { tile = 4, faces = { inner: 1, outer: 1, top: 1, bottom: 0, caps: 1 } } = {}) {
  const a0 = rad(d0), a1 = rad(d1), seg = Math.max(2, Math.ceil(Math.abs(d1 - d0) / 2));
  const P = (r, a, y) => new THREE.Vector3(r * Math.sin(a), y, -r * Math.cos(a));
  const pos = [], nor = [], uv = [];
  const quad = (p0, p1, p2, p3, n, u0, u1) => {
    // u0/u1: [u, v] pairs for p0..p3 as [[u,v]x4]
    const e1 = p1.clone().sub(p0), e2 = p2.clone().sub(p0);
    const flip = e1.cross(e2).dot(n) < 0;
    const tri = flip ? [[0, 2, 1], [0, 3, 2]] : [[0, 1, 2], [0, 2, 3]];
    const P4 = [p0, p1, p2, p3];
    for (const t of tri) for (const k of t) { pos.push(P4[k].x, P4[k].y, P4[k].z); nor.push(n.x, n.y, n.z); uv.push(u0[k][0], u0[k][1]); }
  };
  for (let i = 0; i < seg; i++) {
    const aa = a0 + ((a1 - a0) * i) / seg, ab = a0 + ((a1 - a0) * (i + 1)) / seg, am = (aa + ab) / 2;
    const out = (a) => new THREE.Vector3(Math.sin(a), 0, -Math.cos(a));
    if (faces.inner) { const n = out(am).negate(); quad(P(r0, aa, y0), P(r0, ab, y0), P(r0, ab, y1), P(r0, aa, y1), n, [[r0 * aa / tile, y0 / tile], [r0 * ab / tile, y0 / tile], [r0 * ab / tile, y1 / tile], [r0 * aa / tile, y1 / tile]]); }
    if (faces.outer) { const n = out(am); quad(P(r1, aa, y0), P(r1, ab, y0), P(r1, ab, y1), P(r1, aa, y1), n, [[r1 * aa / tile, y0 / tile], [r1 * ab / tile, y0 / tile], [r1 * ab / tile, y1 / tile], [r1 * aa / tile, y1 / tile]]); }
    if (faces.top) { const n = new THREE.Vector3(0, 1, 0); quad(P(r0, aa, y1), P(r0, ab, y1), P(r1, ab, y1), P(r1, aa, y1), n, [[r0 * aa / tile, r0 / tile], [r0 * ab / tile, r0 / tile], [r1 * ab / tile, r1 / tile], [r1 * aa / tile, r1 / tile]]); }
    if (faces.bottom) { const n = new THREE.Vector3(0, -1, 0); quad(P(r0, aa, y0), P(r0, ab, y0), P(r1, ab, y0), P(r1, aa, y0), n, [[r0 * aa / tile, r0 / tile], [r0 * ab / tile, r0 / tile], [r1 * ab / tile, r1 / tile], [r1 * aa / tile, r1 / tile]]); }
  }
  if (faces.caps) for (const [a, s] of [[a0, -1], [a1, 1]]) {
    const n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(s * Math.sign(a1 - a0));
    quad(P(r0, a, y0), P(r1, a, y0), P(r1, a, y1), P(r0, a, y1), n, [[r0 / tile, y0 / tile], [r1 / tile, y0 / tile], [r1 / tile, y1 / tile], [r0 / tile, y1 / tile]]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Place a local-frame geometry (x across, y up, +z outward) at angle deg, radius r: its local origin lands there. */
export function placeRadial(geo, deg, r, y = 0) {
  geo.rotateY(Math.PI - rad(deg));
  const p = polar(deg, r, y);
  geo.translate(p.x, p.y, p.z);
  return geo;
}

/** Sweep a w x d rectangle along points (each with a side vector) into a closed tube. */
function sweepRect(pts, sides, w, d) {
  const pos = [], nor = [];
  const ring = [];
  for (let i = 0; i < pts.length; i++) {
    const t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
    const s = sides[i].clone().normalize(), n = new THREE.Vector3().crossVectors(t, s).normalize();
    const c = pts[i];
    ring.push([c.clone().addScaledVector(s, -w / 2).addScaledVector(n, -d / 2), c.clone().addScaledVector(s, w / 2).addScaledVector(n, -d / 2),
      c.clone().addScaledVector(s, w / 2).addScaledVector(n, d / 2), c.clone().addScaledVector(s, -w / 2).addScaledVector(n, d / 2)]);
  }
  for (let i = 0; i < ring.length - 1; i++) for (let k = 0; k < 4; k++) {
    const a = ring[i][k], b = ring[i][(k + 1) % 4], c = ring[i + 1][(k + 1) % 4], e = ring[i + 1][k];
    const n = b.clone().sub(a).cross(e.clone().sub(a)).normalize();
    for (const p of [a, b, c, a, c, e]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

function portalOutline(W, H, w, spring) {
  // one simple outline around the arched opening (no hole touching the edge): CCW
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0); s.lineTo(-w / 2, 0); s.lineTo(-w / 2, spring);
  s.absarc(0, spring, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0);
  return s;
}

/** A flame: a teardrop of light (fat at the base, a thin tip), lathed. Base at y = 0. */
function flameGeo(r, h) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, y = t * h, w = r * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.35); pts.push(new THREE.Vector2(Math.max(0.001, w), y)); }
  return new THREE.LatheGeometry(pts, 10);
}

function star4Shape(r, k = 0.16) {
  const s = new THREE.Shape(), w = r * k;
  s.moveTo(0, r); s.lineTo(w, w); s.lineTo(r * 0.62, 0); s.lineTo(w, -w); s.lineTo(0, -r); s.lineTo(-w, -w); s.lineTo(-r * 0.62, 0); s.lineTo(-w, w); s.lineTo(0, r);
  return s;
}

/**
 * Build the hall into Batch B (materials M). Returns the live parts and the points the scene needs for lights and logic.
 */
export function buildHall({ scene, B, M, A }) {
  const out = { gates: [], lamps: [], flames: [], doorsInfo: null, windowInfo: null, cityLights: [], braziers: [] };
  const frames = BAYS.map((b) => ({ b, ...bayFrame(b) }));

  // ---------- floor surround (beyond the 48 m inlaid floor) and the plinth the hall stands on ----------
  B.box('stoneDark', 140, 2, 110, 0, -1.02, 10, { uv: true });

  // ---------- the wall: curved segments between portal panels ----------
  const edges = [];   // [leftDeg, rightDeg] of each panel
  for (const f of frames) edges.push([f.b.deg - f.halfDeg, f.b.deg + f.halfDeg]);
  const spans = [[-CUT, edges[0][0]]];
  for (let i = 0; i < edges.length - 1; i++) spans.push([edges[i][1], edges[i + 1][0]]);
  spans.push([edges[edges.length - 1][1], CUT]);
  for (const [d0, d1] of spans) B.add('stone', curvedBox(R, R + WALL_T, d0, d1, 0, WALL_H, { faces: { inner: 1, outer: 1, top: 0, caps: 0 } }), { uv: false });
  // plinth course and string course along the inner face (dark, with a gold line)
  for (const [d0, d1] of spans) {
    B.add('stoneDark', curvedBox(R - 0.35, R, d0, d1, 0, 1.1, { faces: { inner: 1, outer: 0, top: 1, caps: 1 } }), { uv: false });
    B.add('goldGlow', curvedBox(R - 0.38, R - 0.34, d0, d1, 1.02, 1.08, { faces: { inner: 1, outer: 0, top: 0, caps: 0 } }), { uv: false });
  }
  // cornice over the whole visible arc, with a gold line under its lip
  B.add('stoneDark', curvedBox(R - 0.75, R + WALL_T + 0.3, -CUT, CUT, WALL_H, WALL_H + CORNICE_H, { faces: { inner: 1, outer: 1, top: 1, bottom: 1, caps: 1 } }), { uv: false });
  B.add('goldGlow', curvedBox(R - 0.8, R - 0.74, -CUT, CUT, WALL_H + 0.18, WALL_H + 0.3, { faces: { inner: 1, outer: 0, top: 0, caps: 0 } }), { uv: false });
  B.add('stone', curvedBox(R - 0.5, R + WALL_T, -CUT, CUT, WALL_H + CORNICE_H, WALL_H + CORNICE_H + 1.4, { faces: { inner: 1, outer: 1, top: 1, caps: 1 } }), { uv: false });
  // the open side: the wall cut down to a low plinth (the diorama's missing fourth wall)
  B.add('stoneDark', curvedBox(R - 0.2, R + WALL_T, CUT, 360 - CUT, 0, 1.15), { uv: false });
  B.add('gold', curvedBox(R - 0.25, R + WALL_T + 0.05, CUT, 360 - CUT, 1.15, 1.24), { uv: false });
  // the end piers where the wall is cut: massive, with gold lines
  for (const s of [-1, 1]) {
    const d = s * CUT;
    B.add('stoneDark', placeRadial(bakeLocalUV(new THREE.BoxGeometry(3.2, WALL_H + CORNICE_H + 1.4, WALL_T + 1.0).translate(0, (WALL_H + CORNICE_H + 1.4) / 2, (WALL_T + 1.0) / 2)), d, R - 0.5), { uv: false });
    for (const x of [-0.9, 0.9]) B.add('goldGlow', placeRadial(new THREE.BoxGeometry(0.07, WALL_H - 1.6, 0.04).translate(x, (WALL_H - 1.6) / 2 + 1.2, -0.02), d, R - 0.5), { uv: false });
    // the cut faces toward the lens: twin gold lines, a star, a gold band under the cornice
    for (const sx of [-1, 1]) {
      for (const z of [0.7, 2.6]) B.add('goldGlow', placeRadial(new THREE.BoxGeometry(0.04, WALL_H - 2.4, 0.07).translate(sx * 1.62, (WALL_H - 2.4) / 2 + 1.4, z), d, R - 0.5), { uv: false });
      const st = new THREE.ShapeGeometry(star4Shape(0.5)); st.rotateY(sx * Math.PI / 2); st.translate(sx * 1.63, WALL_H - 2.6, 1.65); B.add('goldGlow', placeRadial(st, d, R - 0.5), { uv: false });
      B.add('gold', placeRadial(new THREE.BoxGeometry(0.06, 0.16, WALL_T + 1.04).translate(sx * 1.62, WALL_H - 0.4, (WALL_T + 1.0) / 2), d, R - 0.5), { uv: false });
    }
  }

  // ---------- pilasters between the bays ----------
  const pilasterAt = [];
  for (let i = 0; i < edges.length - 1; i++) pilasterAt.push((edges[i][1] + edges[i + 1][0]) / 2);
  pilasterAt.push((edges[0][0] - CUT) / 2, (edges[edges.length - 1][1] + CUT) / 2);
  for (const d of pilasterAt) {
    const g = (w, h, dd, y, z = 0) => bakeLocalUV(new THREE.BoxGeometry(w, h, dd).translate(0, y + h / 2, z - dd / 2));
    B.add('trim', placeRadial(g(1.5, WALL_H - 2.0, 0.85, 1.1), d, R), { uv: false });
    B.add('stoneDark', placeRadial(g(2.1, 1.4, 1.25, 0), d, R), { uv: false });
    B.add('stoneDark', placeRadial(g(2.0, 0.7, 1.2, WALL_H - 0.9), d, R), { uv: false });
    B.add('gold', placeRadial(g(2.04, 0.12, 1.24, WALL_H - 0.95), d, R), { uv: false });
    for (const x of [-0.45, 0.45]) B.add('goldGlow', placeRadial(new THREE.BoxGeometry(0.06, WALL_H - 3.4, 0.03).translate(x, 1.7 + (WALL_H - 3.4) / 2, -0.86), d, R), { uv: false });
    // a four-point star set into each pilaster, high up
    const st = new THREE.ShapeGeometry(star4Shape(0.42)); st.rotateY(Math.PI); st.translate(0, WALL_H - 2.3, -0.87);
    B.add('goldGlow', placeRadial(st, d, R), { uv: false });
  }

  // ---------- the dome: ribs rising from every pilaster to the oculus, two latitude rings, the oculus ring ----------
  const y0 = WALL_H + CORNICE_H + 1.4, rTop = DOME.oculus;
  const ribPts = (d, inset = 0) => {
    const pts = [], sides = [];
    for (let k = 0; k <= 24; k++) {
      const s = k / 24, rr = rTop + (R - 0.6 - rTop) * Math.cos((s * Math.PI) / 2) - inset, yy = y0 + (DOME.top - y0) * Math.sin((s * Math.PI) / 2) - inset * 0.3;
      pts.push(polar(d, rr, yy)); sides.push(new THREE.Vector3(Math.cos(rad(d)), 0, Math.sin(rad(d))));
    }
    return [pts, sides];
  };
  for (const d of [...pilasterAt, -CUT + 1.5, CUT - 1.5]) {
    const [p, s] = ribPts(d); B.add('stoneDark', sweepRect(p, s, 0.7, 0.9), { uv: false });
    const [p2, s2] = ribPts(d, 0.47); B.add('goldGlow', sweepRect(p2, s2, 0.08, 0.05), { uv: false });
  }
  for (const s of [0.42, 0.74]) {
    const rr = rTop + (R - 0.6 - rTop) * Math.cos((s * Math.PI) / 2), yy = y0 + (DOME.top - y0) * Math.sin((s * Math.PI) / 2);
    B.add('stoneDark', curvedBox(rr - 0.3, rr + 0.3, -CUT, CUT, yy - 0.25, yy + 0.25), { uv: false });
    B.add('goldGlow', curvedBox(rr - 0.34, rr - 0.3, -CUT, CUT, yy - 0.05, yy + 0.05, { faces: { inner: 1 } }), { uv: false });
  }
  B.add('stoneDark', curvedBox(rTop - 0.1, rTop + 0.9, 0, 360, DOME.top - 0.5, DOME.top + 0.5, { faces: { inner: 1, outer: 1, top: 1, bottom: 1, caps: 0 } }), { uv: false });
  B.add('goldGlow', curvedBox(rTop - 0.14, rTop - 0.1, 0, 360, DOME.top - 0.1, DOME.top + 0.1, { faces: { inner: 1 } }), { uv: false });

  // ---------- bays: portal panels, archivolts, then what fills each opening ----------
  for (const f of frames) {
    const { b, spec, W, Rp, apex } = f;
    const depth = WALL_T + (R - Rp) + 0.02;
    let panel;
    if (b.kind === 'window') {
      // the sill block, then the open portal above it
      const sillG = new THREE.BoxGeometry(W, spec.sill, depth); sillG.translate(0, spec.sill / 2, depth / 2);
      B.add('stone', placeRadial(bakeLocalUV(sillG), b.deg, Rp), { uv: false });
      panel = new THREE.ExtrudeGeometry(portalOutline(W, WALL_H - spec.sill, spec.w, spec.spring - spec.sill), { depth, bevelEnabled: false, curveSegments: 28 });
      panel.translate(0, spec.sill, 0);
    } else panel = new THREE.ExtrudeGeometry(portalOutline(W, WALL_H, spec.w, spec.spring), { depth, bevelEnabled: false, curveSegments: 28 });
    B.add('stone', placeRadial(bakeLocalUV(panel), b.deg, Rp), { uv: false });
    // archivolt: an outer stone moulding and an inner gold one, following the arch and down the jambs
    const sill = b.kind === 'window' ? spec.sill : 0;
    for (const [rr, tube, key, z] of [[spec.w / 2 + 0.55, 0.32, 'trim', -0.12], [spec.w / 2 + 0.12, 0.1, 'gold', -0.2], [spec.w / 2 + 0.95, 0.05, 'goldGlow', -0.06]]) {
      const arc = new THREE.TorusGeometry(rr, tube, 6, 40, Math.PI); arc.translate(0, spec.spring, z);
      B.add(key, placeRadial(arc, b.deg, Rp), { uv: key === 'trim' });
      for (const sx of [-1, 1]) {
        const jamb = new THREE.CylinderGeometry(tube, tube, spec.spring - sill, 6); jamb.translate(sx * rr, sill + (spec.spring - sill) / 2, z);
        B.add(key, placeRadial(jamb, b.deg, Rp), { uv: key === 'trim' });
      }
      const foot = new THREE.BoxGeometry(tube * 3.2, 0.6, tube * 3.2);
      for (const sx of [-1, 1]) { const g = foot.clone(); g.translate(sx * rr, sill + 0.3, z); B.add(key === 'goldGlow' ? 'gold' : key, placeRadial(g, b.deg, Rp), { uv: false }); }
    }
    // the keystone: a gold four-point star at the apex
    const ks = new THREE.ExtrudeGeometry(star4Shape(b.kind === 'doors' ? 1.1 : 0.75), { depth: 0.18, bevelEnabled: false }); ks.translate(0, apex + 0.75, -0.32);
    B.add('goldGlow', placeRadial(ks, b.deg, Rp), { uv: false });

    if (b.kind === 'gate') {
      const group = new THREE.Group();
      group.position.copy(polar(b.deg, Rp)); group.rotation.y = Math.PI - rad(b.deg);
      scene.add(group);
      // the veil, set back in the reveal
      const vm = veilMaterial({ w: spec.w, spring: spec.spring, alive: !!b.alive });
      vm.side = THREE.DoubleSide;
      const veil = new THREE.Mesh(new THREE.ShapeGeometry(archShape(spec.w, spec.spring), 28), vm);
      veil.position.z = 0.9; group.add(veil);
      // threshold: two shallow gold-lipped steps under the veil
      const step = new THREE.BoxGeometry(spec.w + 0.6, 0.14, 1.2); step.translate(0, 0.07, 0.3);
      B.add('stoneDark', placeRadial(bakeLocalUV(step), b.deg, Rp), { uv: false });
      const lip = new THREE.BoxGeometry(spec.w + 0.62, 0.03, 0.06); lip.translate(0, 0.14, -0.29);
      B.add(b.alive ? 'goldGlow' : 'gold', placeRadial(lip, b.deg, Rp), { uv: false });
      // the medallion with the world's mark, in a gold ring
      const mm = new THREE.MeshStandardMaterial({ map: A.marks[b.world].map, emissiveMap: A.marks[b.world].emissiveMap, emissive: 0xffffff, emissiveIntensity: b.alive ? 3.2 : 0.9, roughness: 0.42, metalness: 0.55, envMapIntensity: 0.8 });
      mm.map.magFilter = THREE.NearestFilter; mm.emissiveMap.magFilter = THREE.NearestFilter;
      const med = new THREE.Mesh(new THREE.CircleGeometry(MEDALLION.r, 64), mm);
      med.position.set(0, MEDALLION.y, -0.14); med.rotation.y = Math.PI; group.add(med);
      const ringG = new THREE.TorusGeometry(MEDALLION.r + 0.1, 0.11, 8, 64); ringG.translate(0, MEDALLION.y, -0.16);
      B.add('gold', placeRadial(ringG, b.deg, Rp), { uv: false });
      const ringL = new THREE.TorusGeometry(MEDALLION.r + 0.32, 0.03, 4, 64); ringL.translate(0, MEDALLION.y, -0.1);
      B.add('goldGlow', placeRadial(ringL, b.deg, Rp), { uv: false });
      const inward = polar(b.deg, 1).negate();
      out.gates.push({
        bay: b, world: b.world, alive: !!b.alive, veil, veilMat: vm, medMat: mm, group,
        front: polar(b.deg, Rp - 1.6, 0), markPos: polar(b.deg, Rp - 0.3, MEDALLION.y), lightPos: polar(b.deg, Rp - 1.4, 3.2), inward,
      });
    }

    if (b.kind === 'doors') {
      const group = new THREE.Group();
      group.position.copy(polar(b.deg, Rp)); group.rotation.y = Math.PI - rad(b.deg);
      scene.add(group);
      const leafW = spec.w / 2, leafH = spec.spring, leafT = 0.32;
      const lm = new THREE.MeshStandardMaterial({ map: A.door.map, emissiveMap: A.door.emissiveMap, normalMap: A.door.normalMap, emissive: 0xffffff, emissiveIntensity: 0.7, metalness: 0.85, roughness: 0.42, envMapIntensity: 1.2 });
      for (const t of [A.door.map, A.door.emissiveMap, A.door.normalMap]) t.magFilter = THREE.NearestFilter;
      M.doorLeaf = lm;
      const leaves = [];
      for (const sx of [-1, 1]) {
        const pivot = new THREE.Group(); pivot.position.set(sx * spec.w / 2, 0, -0.1);
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafT), lm);
        leaf.position.set(-sx * leafW / 2, leafH / 2, -leafT / 2); leaf.castShadow = leaf.receiveShadow = true;
        pivot.add(leaf); pivot.rotation.y = sx * -rad(72);
        group.add(pivot); leaves.push(pivot);
        // a gold edge on the leaf's free side
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.08, leafH, leafT + 0.04), M.gold); edge.position.set(-sx * leafW, leafH / 2, -leafT / 2); pivot.add(edge);
      }
      // the tympanum: a gold sunburst grille in the arch above the leaves (light comes through it)
      for (let k = 0; k <= 10; k++) {
        const a = (k / 10) * Math.PI, bar = new THREE.BoxGeometry(0.09, spec.w / 2 - 0.5, 0.12);
        bar.translate(0, (spec.w / 2 - 0.5) / 2 + 0.45, 0); bar.rotateZ(a - Math.PI / 2); bar.translate(0, spec.spring, WALL_T * 0.5);
        B.add('gold', placeRadial(bar, b.deg, Rp), { uv: false });
      }
      for (const rr of [0.42, 1.7, spec.w / 2 - 0.05]) { const arc = new THREE.TorusGeometry(rr, 0.07, 4, 32, Math.PI); arc.translate(0, spec.spring, WALL_T * 0.5); B.add('gold', placeRadial(arc, b.deg, Rp), { uv: false }); }
      const lintel = new THREE.BoxGeometry(spec.w, 0.35, 0.5); lintel.translate(0, spec.spring - 0.1, WALL_T * 0.5); B.add('gold', placeRadial(lintel, b.deg, Rp), { uv: false });
      // outside: a landing, a broad stair falling away toward the City
      const doorDir = polar(b.deg, 1);
      const landing = new THREE.BoxGeometry(spec.w + 4, 1.0, 9); landing.translate(0, -0.5, depth + 4.5);
      B.add('stoneDark', placeRadial(bakeLocalUV(landing), b.deg, Rp), { uv: false });
      for (let k = 0; k < 14; k++) {
        const st = new THREE.BoxGeometry(spec.w + 4 + k * 0.6, 0.5, 1.0); st.translate(0, -0.75 - k * 0.5, depth + 9.5 + k * 0.95);
        B.add('stoneDark', placeRadial(bakeLocalUV(st), b.deg, Rp), { uv: false });
      }
      for (const sx of [-1, 1]) {
        // two pylons at the head of the stair, each with a flame
        const py = new THREE.BoxGeometry(1.2, 3.2, 1.2); py.translate(sx * (spec.w / 2 + 1.4), 1.6, depth + 8.2);
        B.add('stoneDark', placeRadial(bakeLocalUV(py), b.deg, Rp), { uv: false });
        const fp = placeRadial(flameGeo(0.3, 0.95).translate(sx * (spec.w / 2 + 1.4), 3.25, depth + 8.2), b.deg, Rp);
        B.add('flame', fp, { uv: false });
        const fpos = new THREE.Vector3(); fp.computeBoundingBox(); fp.boundingBox.getCenter(fpos);
        out.flames.push(fpos);
      }
      out.doorsInfo = { bay: b, group, leaves, Rp, depth, dir: doorDir, threshold: polar(b.deg, R + 0.6), outside: polar(b.deg, R + WALL_T + 6, 3), lightPos: polar(b.deg, Rp - 1.2, 5.5) };
    }

    if (b.kind === 'window') {
      // a balustrade across the sill, a gold mullion and a ring in the arch
      const outward = polar(b.deg, 1), right = new THREE.Vector3(Math.cos(rad(b.deg)), 0, Math.sin(rad(b.deg)));
      const pm = cosmosMaterial({ outward, right, up: new THREE.Vector3(0, 1, 0) });
      const pane = new THREE.Mesh(new THREE.ShapeGeometry(archShape(spec.w, spec.spring - spec.sill), 28), pm);
      pane.geometry.translate(0, spec.sill, 0.75);
      pane.position.copy(polar(b.deg, Rp)); pane.rotation.y = Math.PI - rad(b.deg);
      scene.add(pane);
      const bal = new THREE.BoxGeometry(spec.w, 0.18, 0.5); bal.translate(0, spec.sill + 0.09, 0.3); B.add('gold', placeRadial(bal, b.deg, Rp), { uv: false });
      const mul = new THREE.BoxGeometry(0.1, spec.spring + spec.w / 2 - spec.sill - 0.4, 0.14); mul.translate(0, spec.sill + (spec.spring + spec.w / 2 - spec.sill - 0.4) / 2, 0.45); B.add('gold', placeRadial(mul, b.deg, Rp), { uv: false });
      const ring = new THREE.TorusGeometry(1.25, 0.07, 6, 48); ring.translate(0, spec.spring + 0.4, 0.45); B.add('gold', placeRadial(ring, b.deg, Rp), { uv: false });
      const tr = new THREE.BoxGeometry(spec.w, 0.1, 0.14); tr.translate(0, spec.spring, 0.45);
      for (const sx of [-1, 1]) { const m2 = new THREE.BoxGeometry(0.07, spec.spring - spec.sill - 0.2, 0.1); m2.translate(sx * spec.w / 4, spec.sill + (spec.spring - spec.sill) / 2, 0.45); B.add('gold', placeRadial(m2, b.deg, Rp), { uv: false }); }
      const st = new THREE.ShapeGeometry(star4Shape(0.55)); st.rotateY(Math.PI); st.translate(0, spec.spring + 0.4, 0.4); B.add('goldGlow', placeRadial(st, b.deg, Rp), { uv: false }); B.add('gold', placeRadial(tr, b.deg, Rp), { uv: false });
      out.windowInfo = { paneMat: pm, bay: b, center: polar(b.deg, Rp, spec.sill + (spec.spring + spec.w / 2 - spec.sill) / 2), lightPos: polar(b.deg, Rp - 1, 5) };
    }
  }

  // ---------- the dais: three tiers, gold-edged, the compass on top ----------
  for (let i = 0; i < DAIS.length; i++) {
    const [r, top] = DAIS[i];
    B.add('stoneDark', new THREE.CylinderGeometry(r, r, top, 96, 1, true).translate(0, top / 2, 0), { uv: true });
    const next = DAIS[i + 1] ? DAIS[i + 1][0] : 0;
    if (next) B.add('daisRing', new THREE.RingGeometry(next, r, 96, 1).rotateX(-Math.PI / 2).translate(0, top, 0), { uv: true, tile: 6 });
    B.add('goldGlow', new THREE.TorusGeometry(r - 0.06, 0.035, 4, 128).rotateX(Math.PI / 2).translate(0, top + 0.005, 0), { uv: false });
  }
  B.add('gold', new THREE.TorusGeometry(DAIS[0][0] + 0.04, 0.06, 4, 128).rotateX(Math.PI / 2).translate(0, 0.02, 0), { uv: false });

  // ---------- lamp stands: two behind the dais, two in front (amber accents) ----------
  for (const d of [-38, 38, -142, 142]) {
    const p = polar(d, 8.6);
    B.add('stoneDark', new THREE.CylinderGeometry(0.55, 0.7, 0.5, 8).translate(p.x, 0.25, p.z), { uv: true });
    B.add('iron', new THREE.CylinderGeometry(0.09, 0.12, 3.0, 8).translate(p.x, 0.5 + 1.5, p.z), { uv: false });
    B.add('gold', new THREE.CylinderGeometry(0.62, 0.22, 0.42, 12, 1, true).translate(p.x, 3.5 + 0.21, p.z), { uv: false });
    B.add('gold', new THREE.TorusGeometry(0.62, 0.04, 4, 24).rotateX(Math.PI / 2).translate(p.x, 3.92, p.z), { uv: false });
    const fl = flameGeo(0.26, 0.82).translate(p.x, 3.78, p.z);
    B.add('flame', fl, { uv: false });
    out.lamps.push(new THREE.Vector3(p.x, 4.15, p.z));
  }
  // great braziers flanking the doors (inside)
  for (const d of [-19, 19]) {
    const p = polar(d, R - 2.8);
    B.add('stoneDark', new THREE.BoxGeometry(1.7, 0.9, 1.7).translate(p.x, 0.45, p.z), { uv: true });
    B.add('gold', new THREE.BoxGeometry(1.74, 0.08, 1.74).translate(p.x, 0.92, p.z), { uv: false });
    B.add('gold', new THREE.CylinderGeometry(0.95, 0.35, 0.8, 12, 1, true).translate(p.x, 0.95 + 0.4, p.z), { uv: false });
    const fl = flameGeo(0.55, 1.5).translate(p.x, 1.3, p.z);
    B.add('flame', fl, { uv: false });
    out.braziers.push(new THREE.Vector3(p.x, 2.1, p.z));
  }

  // ---------- the City below the stair (a glimpse through the doors) ----------
  {
    let s = 77; const Rn = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const WIN = ['win0', 'win1', 'win2'];
    const doorDeg = BAYS.find((b) => b.kind === 'doors').deg;
    for (let k = 0; k < 46; k++) {
      const along = 40 + Rn() * 220, across = (Rn() - 0.5) * (30 + along * 1.5);
      const base = -44;
      const c = polar(doorDeg, R + along); const side = polar(doorDeg + 90, across);
      const x = c.x + side.x, z = c.z + side.z;
      if (Math.abs(across) < 9 && along < 70) continue;
      if (Rn() < 0.5) {
        const r = 2.4 + Rn() * 2, h = 16 + Rn() * 34;
        spire(B, Rn, { x, z, base, r, h, win: WIN[(Rn() * 3) | 0], signal: Rn() < 0.35, cyanKey: 'signal' });
        out.cityLights.push([x, z + r, r, base + 1.4, h]);
      } else {
        const w = 8 + Rn() * 10, d = 8 + Rn() * 10, fl = 3 + ((Rn() * 5) | 0);
        building(B, Rn, { x, z, base, w, d, floors: fl, roof: Rn() < 0.6 ? 'hip' : 'dome', win: WIN[(Rn() * 3) | 0] });
        out.cityLights.push([x, z + d / 2, w / 2, base + 1.2, fl * 4]);
      }
    }
    // the plaza far below, and the cliffs it stands on
    const pc = polar(doorDeg, R + 130);
    B.box('pave', 340, 2, 260, pc.x, -45, pc.z, { uv: true });
    // the cliff the Nexus stands on, falling away under the stair
    const cl = polar(doorDeg, R + 16); B.box('stoneDark', 60, 44, 10, cl.x, -22.5, cl.z, { uv: true });
  }
  return out;
}
