// The City: ancient-future stone. Pale ashlar walls with arched, warm-lit windows, navy slate roofs, slender spires with gold
// finials, a few towers carrying thin cyan Signal lines. Built into a Batch so the whole skyline is a handful of draw calls.
import * as THREE from 'three';

const FLOOR = 4;

/** A block building. (x, z) = centre of the footprint; w along x, d along z. */
export function building(B, R, { x, z, w, d, floors, base = 0, roof = 'hip', win }) {
  const wallH = floors * FLOOR;
  B.box('dark', w + 0.5, 1.2, d + 0.5, x, base + 0.6, z);
  B.box(win, w, wallH, d, x, base + 1.2 + wallH / 2, z, { offset: [R() * 4, -(base + 1.2) / FLOOR] });
  // string course between floors is in the texture; a heavier cornice on top
  B.box('pale', w + 0.6, 0.45, d + 0.6, x, base + 1.2 + wallH + 0.22, z);
  const top = base + 1.2 + wallH + 0.45;
  if (roof === 'hip') {
    B.pyramid('roof', w + 0.8, d + 0.8, Math.min(w, d) * 0.55, x, top, z);
    B.cone('gold', 0.12, 0.9, x, top + Math.min(w, d) * 0.55 - 0.1, z, 6);
  } else if (roof === 'dome') {
    B.box('pale', w, 0.8, d, x, top + 0.4, z);
    const g = new THREE.SphereGeometry(Math.min(w, d) * 0.36, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.translate(x, top + 0.8, z);
    B.add('roof', g);
    B.cone('gold', 0.15, 1.6, x, top + 0.8 + Math.min(w, d) * 0.36 - 0.1, z, 6);
  } else {
    B.box('pale', w, 0.9, d, x, top + 0.45, z);
  }
  return top;
}

/** A slender spire: octagonal shaft, belfry ring, tall cone, gold finial, optional cyan signal lines. */
export function spire(B, R, { x, z, r = 2.4, h = 28, base = 0, win, signal = false, cyanKey = 'cyan' }) {
  B.cyl('dark', r + 0.5, 1.4, x, base, z, 8);
  B.cyl(win, r, h, x, base + 1.4, z, 8, r * 0.92, { offset: [R() * 4, -(base + 1.4) / FLOOR], tile: [8, 4] });
  const top = base + 1.4 + h;
  B.cyl('pale', r * 1.05, 0.6, x, top, z, 8);
  B.cyl('pale', r * 0.8, 3, x, top + 0.6, z, 8, r * 0.8);
  const coneH = r * 4.2;
  B.cone('roof', r * 0.98, coneH, x, top + 3.6, z, 8);
  B.cone('gold', 0.18, 2.2, x, top + 3.6 + coneH - 0.2, z, 6);
  const orb = new THREE.SphereGeometry(0.28, 8, 6); orb.translate(x, top + 3.6 + coneH + 0.6, z); B.add('gold', orb);
  if (signal) {
    // a fine Signal inlay: dashed lines up two faces, like light travelling engraved channels
    for (let k = 0; k < 2; k++) {
      const a = (k / 2) * Math.PI * 2 + Math.PI / 8;
      for (let y = base + 3; y < base + 1.4 + h - 2; y += 2.2)
        B.box(cyanKey, 0.07, 1.3, 0.07, x + Math.cos(a) * r * 0.985, y, z + Math.sin(a) * r * 0.985, { uv: false });
    }
  }
  return top + 3.6 + coneH;
}
