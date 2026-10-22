// The City plaza, laid out. One unit ~ one metre, plaza floor at y = 0. The camera looks north (-Z).
//   South (+Z, nearest the lens): the Nexus temple's portico, its landing (y = LAND_Y) and wide steps down to the plaza.
//   Centre: the old stone circle (the people's first sacred place), ringed by water, the processional way running through it.
//   North (-Z): the City gate onto the gate road, the white-gold City rising in terraces beyond, the Nexus beacon over its crown.
//   NE corner: THE HOUSE (gold and brass, an orrery over its doors). NW corner: the Ashford arch. West / east walls: the
//   Brambleholt and Stonemere arches. Market bays east and west, twin reflecting pools below the steps.
import * as THREE from 'three';

export const P = {
  X: 24, ZN: -44, ZS: 30, CHAMFER: 56,           // plaza octagon: |x| <= 24, -44 <= z <= 30, corners cut where |x| - z > 56
  LAND_Y: 3.6, STEP_Z0: 31, STEP_Z1: 40, LAND_Z1: 62, LAND_X: 12, DOOR_Z: 49.2,
  CIRCLE: { x: 0, z: -8, rStones: 5.4, rIn: 7.3, rOut: 9.3, causeway: 1.55 },
  POOLS: [[-11, -5, 8, 24], [5, 11, 8, 24]],     // x0, x1, z0, z1
  FOUNTAINS: [[-17, -6, 2.3], [17, -6, 2.3]],    // x, z, r
  GATE: { z: -44, half: 4.2, exitZ: -46.8 },
  HOUSE: { x: 18.4, z: -38.4, face: [-1, 1] },    // front faces south-west
  ASHFORD: { x: -18.4, z: -38.4, face: [1, 1] },
  BRAMBLE: { x: -23.2, z: 4, face: [1, 0.55] },
  STONEMERE: { x: 23.2, z: 4, face: [-1, 0.55] },
};

/** Rotation (about +Y) that turns a local +Z front toward a world direction. */
export const faceRot = (f) => Math.atan2(f[0], f[1]);

/** A placed local frame: world = T(x, z) * Ry(rot). */
export function frame(x, z, rot, y = 0) {
  const m = new THREE.Matrix4().makeRotationY(rot); m.setPosition(x, y, z);
  return { m, x, z, rot, toWorld: (lx, lz) => [x + Math.cos(rot) * lx + Math.sin(rot) * lz, z - Math.sin(rot) * lx + Math.cos(rot) * lz],
    toLocal: (wx, wz) => { const dx = wx - x, dz = wz - z; return [Math.cos(rot) * dx - Math.sin(rot) * dz, Math.sin(rot) * dx + Math.cos(rot) * dz]; } };
}

/** Occupancy grid: 0 = walkable, 1 = blocked. Painted with shapes, read in O(1). */
export class WalkGrid {
  constructor(x0 = -32, z0 = -60, x1 = 32, z1 = 64, cell = 0.25) {
    this.x0 = x0; this.z0 = z0; this.cell = cell;
    this.nx = Math.ceil((x1 - x0) / cell); this.nz = Math.ceil((z1 - z0) / cell);
    this.g = new Uint8Array(this.nx * this.nz).fill(1);
  }
  paint(test, v) {
    for (let j = 0; j < this.nz; j++) {
      const z = this.z0 + (j + 0.5) * this.cell;
      for (let i = 0; i < this.nx; i++) { const x = this.x0 + (i + 0.5) * this.cell; if (test(x, z)) this.g[j * this.nx + i] = v; }
    }
  }
  open(test) { this.paint(test, 0); }
  block(test) { this.paint(test, 1); }
  circle(x, z, r, v = 1) { this.paint((px, pz) => (px - x) ** 2 + (pz - z) ** 2 < r * r, v); }
  rect(x0, z0, x1, z1, v = 1) { this.paint((px, pz) => px >= x0 && px <= x1 && pz >= z0 && pz <= z1, v); }
  /** A rotated rectangle in a local frame (half sizes hx, hz around local cx, cz). */
  orect(fr, cx, cz, hx, hz, v = 1) { this.paint((px, pz) => { const [lx, lz] = fr.toLocal(px, pz); return Math.abs(lx - cx) <= hx && Math.abs(lz - cz) <= hz; }, v); }
  ok(x, z) {
    const i = Math.floor((x - this.x0) / this.cell), j = Math.floor((z - this.z0) / this.cell);
    if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return false;
    return this.g[j * this.nx + i] === 0;
  }
}

/** Ground height under (x, z): the steps up to the temple landing, the House steps, the circle's raised old floor. */
export function makeHeightAt(houseFrame) {
  const { LAND_Y, STEP_Z0, STEP_Z1, LAND_X, CIRCLE } = P;
  return (x, z) => {
    if (Math.abs(x) <= LAND_X + 1 && z > STEP_Z0) return z >= STEP_Z1 ? LAND_Y : LAND_Y * (z - STEP_Z0) / (STEP_Z1 - STEP_Z0);
    if (houseFrame) {
      const [lx, lz] = houseFrame.toLocal(x, z);
      if (Math.abs(lx) < 3.2 && lz > -1 && lz < 2.4) return lz < 0 ? 0.9 : 0.9 * (1 - lz / 2.4);
    }
    const dc = Math.hypot(x - CIRCLE.x, z - CIRCLE.z);
    if (dc < CIRCLE.rOut + 0.2) return 0.12;
    return 0;
  };
}
