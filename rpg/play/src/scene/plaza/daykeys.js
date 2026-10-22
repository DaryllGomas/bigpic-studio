// The City's light through the day. Golden hour is home (the plaza's default); T walks golden -> dusk -> night -> dawn -> day.
// Same keyframe shape as the engine's day cycle (sky, sun, haze, grade, emissive roles) plus the plaza's own: the beacon,
// the string lights, the water. Dusk, night and dawn start from the gate road's keys so the two places share one sky.
import * as THREE from 'three';
import { KEYS as ROAD } from '../../engine/lighting/daycycle.js';

const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
const dirAzEl = (az, el) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize(); };
const clone = (k) => { const o = {}; for (const [a, v] of Object.entries(k)) o[a] = v && v.clone ? v.clone() : v; return o; };

const golden = {
  zenith: C('#3462aa'), upper: C('#a6a4cc'), horizon: C('#f8c690'), glow: C('#ffb05c', 1.8), below: C('#8a7078'),
  skySun: dirAzEl(24, 3.5), sunColor: C('#ffd090', 1.35), sunDisc: 0.9,
  moonDir: dirAzEl(-40, 30), moonColor: C('#f2f0ff', 0.4), moonGlow: 0.05, stars: 0,
  cloudLit: C('#ffd6a0', 1.45), cloudDark: C('#9a86a8'), cloudCover: 0.5,
  lightDir: dirAzEl(108, 23), lightColor: C('#ffcf98'), lightInt: 5.8,
  hemiSky: C('#b8b4d4'), hemiGround: C('#9a7650'), hemiInt: 1.1,
  haze: 0.0015, fogA: 0.03, fogB: 0.07, fogBase: -30, hazeMax: 0.5,
  exposure: 0.8, bloom: 0.2, sat: 1.12, contrast: 1.17, vignette: 0.42,
  shadowTint: C('#d4d0f0'), highTint: C('#fff0d8'), lift: C('#140f12'),
  shaft: 0.1, shaftColor: C('#ffcc8a'),
  rim: C('#ffcf8e', 1.0),
  windows: 1.2, lanterns: 2.1, glyphs: 1.8, seams: 0.3, colossus: 1, banners: 0.3, lanternLight: 0.55, oraLight: 0.8,
  fireflies: 0.3, motes: 1.4, mist: 0.35, beacon: 1.35, strings: 1.0, water: C('#1a3440'), shade: 1,
};

const day = {
  ...clone(golden),
  zenith: C('#2558a8'), upper: C('#6a98d4'), horizon: C('#d6e4ee'), glow: C('#fff2d6', 0.5), below: C('#606878'),
  skySun: dirAzEl(28, 46), sunColor: C('#fff6e2', 0.7), sunDisc: 0,
  cloudLit: C('#ffffff', 1.25), cloudDark: C('#a8b2c8'), cloudCover: 0.42,
  lightDir: dirAzEl(150, 52), lightColor: C('#fff1dc'), lightInt: 4.0,
  hemiSky: C('#b2c8f0'), hemiGround: C('#7c6c58'), hemiInt: 1.7,
  haze: 0.0018, hazeMax: 0.55, exposure: 0.66, bloom: 0.11, sat: 1.08, contrast: 1.06, vignette: 0.3,
  shadowTint: C('#c6d2ff'), highTint: C('#fff6ea'), lift: C('#0c0e1c'), shaft: 0.08, shaftColor: C('#fff0d0'), rim: C('#ffffff', 0.55),
  windows: 0.25, lanterns: 0.7, glyphs: 1.2, seams: 0.1, banners: 0.1, lanternLight: 0.0, motes: 0.9, beacon: 0.75, strings: 0.25, water: C('#1d3c4c'),
};

const dusk = {
  ...clone(ROAD.dusk),
  skySun: dirAzEl(30, -1.5),
  lightDir: dirAzEl(60, 15), lightInt: 4.2, hemiInt: 2.7,
  exposure: 1.0, shaft: 0.12, windows: 2.2, lanterns: 3.6, lanternLight: 1.0,
  fireflies: 0.5, motes: 1.0, beacon: 1.6, strings: 2.4, water: C('#1a2440'), shade: 1,
};
const night = {
  ...clone(ROAD.night),
  moonDir: dirAzEl(18, 13), exposure: 1.05, hemiInt: 1.6, shaft: 0.06,
  windows: 2.6, lanterns: 5.0, lanternLight: 1.2, glyphs: 4.0, seams: 0.8,
  fireflies: 1.2, motes: 0.6, beacon: 2.6, strings: 4.0, water: C('#0c1428'), shade: 1,
};
const dawn = {
  ...clone(ROAD.dawn),
  skySun: dirAzEl(-48, 0.5), lightDir: dirAzEl(-80, 14),
  exposure: 0.85, shaft: 0.14, windows: 0.7, lanterns: 1.8, lanternLight: 0.5, beacon: 1.3, strings: 1.0, water: C('#1c2c44'), shade: 1,
};

export const PLAZA_KEYS = { golden, dusk, night, dawn, day };
export const PLAZA_ORDER = ['golden', 'dusk', 'night', 'dawn', 'day'];

function lerpKey(a, b, t) {
  const o = {};
  for (const k in b) {
    const x = a[k] ?? b[k], y = b[k];
    if (typeof y === 'number') o[k] = x + (y - x) * t;
    else if (y.isColor) o[k] = x.clone().lerp(y, t);
    else if (y.isVector3) o[k] = x.clone().lerp(y, t).normalize();
  }
  return o;
}

export class PlazaDay {
  constructor({ start = 'golden', duration = 3.5 } = {}) {
    if (!PLAZA_KEYS[start]) start = 'golden';
    this.index = PLAZA_ORDER.indexOf(start);
    this.current = lerpKey(PLAZA_KEYS[start], PLAZA_KEYS[start], 1);
    this.from = this.current; this.to = PLAZA_KEYS[start]; this.t = 1; this.duration = duration;
    this.listeners = [];
  }
  get name() { return PLAZA_ORDER[this.index]; }
  next() { this.set(PLAZA_ORDER[(this.index + 1) % PLAZA_ORDER.length]); }
  set(name, instant = false) {
    if (!PLAZA_KEYS[name]) return;
    this.index = PLAZA_ORDER.indexOf(name);
    this.from = this.current; this.to = PLAZA_KEYS[name]; this.t = instant ? 1 : 0;
    if (instant) this.current = lerpKey(this.to, this.to, 1);
  }
  onApply(f) { this.listeners.push(f); }
  update(dt) {
    const moving = this.t < 1;
    if (moving) { this.t = Math.min(1, this.t + dt / this.duration); const e = this.t * this.t * (3 - 2 * this.t); this.current = lerpKey(this.from, this.to, e); }
    for (const f of this.listeners) f(this.current, moving);
    return moving;
  }
}
