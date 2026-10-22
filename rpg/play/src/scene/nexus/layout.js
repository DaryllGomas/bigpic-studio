// The Nexus floor plan. A round hall (radius R) with nine bays on the visible arc: the great doors to the City straight
// ahead (north, -Z), seven gates to past lives fanning out on either side, and a window onto the cosmos at the right end.
// The near (south) side is the diorama's open side: the wall there is cut down to a low plinth so the lens can see in.
// Angles are degrees from north, clockwise seen from above (positive toward +X). 1 unit ~ 1 m. Floor y = 0.
import * as THREE from 'three';

export const R = 20;            // inner face of the wall
export const WALL_T = 2.4;      // wall thickness
export const WALL_H = 13.5;     // to the cornice
export const CORNICE_H = 0.9;
export const CUT = 128;         // |deg| beyond this the wall is cut low (the open side)
export const GATE = { w: 4.4, spring: 6.0, jamb: 1.1 };
export const DOOR = { w: 7.4, spring: 7.6, jamb: 1.4 };
export const WINDOW = { w: 6.0, spring: 7.4, jamb: 1.2, sill: 1.3 };
export const MEDALLION = { y: 10.75, r: 1.32 };
export const DOME = { top: 27.5, oculus: 4.2 };
export const ORRERY_Y = 13.4;
// dais tiers, outermost first: [radius, top height]
export const DAIS = [[6.2, 0.25], [4.8, 0.5], [3.4, 0.75]];
export const DAIS_TOP = 0.75;

// THE PATH's world ids (the past-lives contract: thepath.bigpicsolutions.com/play/?world=<id>&return=<url>).
// Left of the doors the road runs out from 1982; right of them it comes home from Atlantis to the City.
export const BAYS = [
  { kind: 'gate', world: 'east', deg: -104 },
  { kind: 'gate', world: 'egypt', deg: -78 },
  { kind: 'gate', world: 'gobekli', deg: -52 },
  { kind: 'gate', world: '80s', deg: -26, alive: true },
  { kind: 'doors', deg: 0 },
  { kind: 'gate', world: 'atlantis', deg: 26 },
  { kind: 'gate', world: 'signal', deg: 52 },
  { kind: 'gate', world: 'vale', deg: 78 },
  { kind: 'window', deg: 104 },
];
export const GATES = BAYS.filter((b) => b.kind === 'gate');
export const ALIVE = BAYS.find((b) => b.alive);

export const rad = (d) => (d * Math.PI) / 180;
/** World position at angle `deg`, radius r, height y. */
export const polar = (deg, r, y = 0) => new THREE.Vector3(r * Math.sin(rad(deg)), y, -r * Math.cos(rad(deg)));
/** Angle (deg) of a point from north, clockwise. */
export const angleOf = (x, z) => (Math.atan2(x, -z) * 180) / Math.PI;
/** Smallest signed difference between two angles in degrees. */
export const dAng = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;
/** Where a bay's flat portal panel sits: its inner face is pulled in so the panel's corners meet the curved wall. */
export function bayFrame(b) {
  const spec = b.kind === 'doors' ? DOOR : b.kind === 'window' ? WINDOW : GATE;
  const W = spec.w + spec.jamb * 2;
  const Rp = Math.sqrt(R * R - (W / 2) * (W / 2));
  const halfDeg = (Math.atan2(W / 2, Rp) * 180) / Math.PI;
  return { spec, W, Rp, halfDeg, apex: spec.spring + spec.w / 2 };
}
/** Floor height under (x, z): the dais tiers, else 0. */
export function groundY(x, z) {
  const r = Math.hypot(x, z);
  for (let i = DAIS.length - 1; i >= 0; i--) if (r <= DAIS[i][0]) return DAIS[i][1];
  return 0;
}
