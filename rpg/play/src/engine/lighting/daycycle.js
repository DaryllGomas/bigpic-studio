// Time of day: dusk -> night -> dawn keyframes. One key (T) eases to the next over a few seconds.
// A keyframe drives the sky, the sun/moon light, ambient, haze, the grade, and every emissive role (windows, lanterns, glyphs...).
import * as THREE from 'three';

const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
const dirAzEl = (az, el) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize(); };

export const KEYS = {
  dusk: {
    zenith: C('#0a1236'), upper: C('#45428e'), horizon: C('#d8907a'), glow: C('#ffa64e', 1.7), below: C('#3a3058'),
    skySun: dirAzEl(-30, -1.5), sunColor: C('#ffb36a', 1.2), sunDisc: 0,
    moonDir: dirAzEl(17, 12.5), moonColor: C('#e9eeff'), moonGlow: 0.6, stars: 0.45,
    cloudLit: C('#ffc286', 1.5), cloudDark: C('#3c3468'), cloudCover: 0.62,
    lightDir: dirAzEl(-40, 19), lightColor: C('#ffb468'), lightInt: 4.6,
    hemiSky: C('#6f78d8'), hemiGround: C('#33283a'), hemiInt: 3.0,
    haze: 0.0012, fogA: 0.05, fogB: 0.075, fogBase: -75, hazeMax: 0.75,
    exposure: 1.62, bloom: 0.2, sat: 1.12, contrast: 1.16, vignette: 0.45,
    shadowTint: C('#a9bcff'), highTint: C('#ffe6c4').multiplyScalar(1.06), lift: C('#03051a'),
    shaft: 0.22, shaftColor: C('#ffb66a'),
    rim: C('#ffb877', 1.1),
    windows: 2.3, lanterns: 3.8, glyphs: 2.4, seams: 0.35, colossus: 2.2, banners: 0.35, lanternLight: 1.45, oraLight: 1.0,
    fireflies: 0.75, motes: 1.0, mist: 0.5,
  },
  night: {
    zenith: C('#02040c'), upper: C('#081030'), horizon: C('#1e2a52'), glow: C('#2f4a8a', 0.6), below: C('#0a0d1e'),
    skySun: dirAzEl(-40, -14), sunColor: C('#203060', 0.2), sunDisc: 0,
    moonDir: dirAzEl(12, 14), moonColor: C('#eef3ff', 1.15), moonGlow: 1.1, stars: 1.0,
    cloudLit: C('#5a6aa0'), cloudDark: C('#0c1028'), cloudCover: 0.42,
    lightDir: dirAzEl(18, 32), lightColor: C('#9fb6ff'), lightInt: 0.9,
    hemiSky: C('#2c3c86'), hemiGround: C('#10101e'), hemiInt: 1.8,
    haze: 0.0012, fogA: 0.045, fogB: 0.075, fogBase: -70, hazeMax: 0.8,
    exposure: 1.6, bloom: 0.24, sat: 1.12, contrast: 1.06, vignette: 0.5,
    shadowTint: C('#c4d2ff'), highTint: C('#fff2df').multiplyScalar(1.02), lift: C('#040820'),
    shaft: 0.12, shaftColor: C('#9fc0ff'),
    rim: C('#9fc0ff', 0.6),
    windows: 2.6, lanterns: 5.0, glyphs: 4.2, seams: 0.75, colossus: 2.2, banners: 0.55, lanternLight: 1.45, oraLight: 1.5,
    fireflies: 1.3, motes: 0.8, mist: 0.45,
  },
  dawn: {
    zenith: C('#1d2a55'), upper: C('#6a6a9e'), horizon: C('#e6a894'), glow: C('#ffc89a', 1.1), below: C('#3a3450'),
    skySun: dirAzEl(62, -0.5), sunColor: C('#ffd2a8', 1.2), sunDisc: 0.6,
    moonDir: dirAzEl(-20, 15), moonColor: C('#f2f0ff', 0.8), moonGlow: 0.3, stars: 0.08,
    cloudLit: C('#ffcfb0', 1.05), cloudDark: C('#5a5480'), cloudCover: 0.55,
    lightDir: dirAzEl(70, 18), lightColor: C('#ffd0a8'), lightInt: 3.4,
    hemiSky: C('#9aa6e0'), hemiGround: C('#40363a'), hemiInt: 3.2,
    haze: 0.0019, fogA: 0.06, fogB: 0.07, fogBase: -60, hazeMax: 0.85,
    exposure: 1.3, bloom: 0.14, sat: 1.06, contrast: 1.03, vignette: 0.4,
    shadowTint: C('#e2e6ff'), highTint: C('#fff0e4'), lift: C('#0c0c1c'),
    shaft: 0.3, shaftColor: C('#ffd8b0'),
    rim: C('#ffd0a8', 1.0),
    windows: 0.55, lanterns: 1.6, glyphs: 1.8, seams: 0.15, colossus: 1.1, banners: 0.25, lanternLight: 0.55, oraLight: 0.9,
    fireflies: 0.15, motes: 1.2, mist: 0.9,
  },
};
export const ORDER = ['dusk', 'night', 'dawn'];

function lerpKey(a, b, t) {
  const o = {};
  for (const k in b) {
    const x = a[k], y = b[k];
    if (typeof y === 'number') o[k] = x + (y - x) * t;
    else if (y.isColor) o[k] = x.clone().lerp(y, t);
    else if (y.isVector3) o[k] = x.clone().lerp(y, t).normalize();
  }
  return o;
}

export class DayCycle {
  constructor({ start = 'dusk', duration = 3.5 } = {}) {
    this.index = ORDER.indexOf(start);
    this.current = lerpKey(KEYS[start], KEYS[start], 1);
    this.from = this.current; this.to = KEYS[start]; this.t = 1; this.duration = duration;
    this.listeners = [];
  }
  get name() { return ORDER[this.index]; }
  next() { this.set(ORDER[(this.index + 1) % ORDER.length]); }
  set(name, instant = false) {
    this.index = ORDER.indexOf(name);
    this.from = this.current; this.to = KEYS[name]; this.t = instant ? 1 : 0;
    if (instant) this.current = lerpKey(this.to, this.to, 1);
  }
  onApply(f) { this.listeners.push(f); }
  update(dt) {
    const moving = this.t < 1;
    if (moving) {
      this.t = Math.min(1, this.t + dt / this.duration);
      const e = this.t * this.t * (3 - 2 * this.t);
      this.current = lerpKey(this.from, this.to, e);
    }
    for (const f of this.listeners) f(this.current, moving);
    return moving;
  }
}
