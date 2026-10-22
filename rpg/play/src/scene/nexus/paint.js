// Pixel painters for the Nexus. The floor: polished night-stone slabs laid in rings around the dais, with engraved gold
// inlays (orbits, a ticked ring, crossing ellipses, lanes running out to every bay, four-point stars). The seven marks
// (wordless gold glyphs on dark medallions; THE GATE is World 1's real mark, ported from THE PATH's marks.js).
// Bronze door leaves with gold reliefs. The orrery's ticked band.
import { PixelCanvas, rng, hash2, fbm, rampDither, normalFromHeight, ormCanvas, hex } from '../../engine/pixel/paint.js';
import { GOLD } from '../../engine/pixel/textures.js';
import { BAYS, R } from './layout.js';

const STONE = ['#06070c', '#0a0b12', '#0e1019', '#131622', '#191c2b', '#202436', '#292e44'];
const VEIN = [118, 104, 196];
const gold = (e, white = 0) => [255 * e, (214 + 30 * white) * e, (150 + 80 * white) * e];

/** The hall floor: a 48 x 48 m square at 16 texels per metre, centred on the dais. */
export function paintNexusFloor({ size = 48, ppm = 16, seed = 7 } = {}) {
  const N = size * ppm, half = size / 2, px = 1 / ppm;
  const alb = new PixelCanvas(N, N), emi = new PixelCanvas(N, N);
  const hgt = new Float32Array(N * N), rough = new Float32Array(N * N), metal = new Float32Array(N * N);
  const RINGS = [0, 6.4, 8.6, 11.4, 14.4, 17.4, R + 0.25, 40];
  const nSlab = RINGS.slice(0, -1).map((r0, k) => (k === 0 ? 1 : Math.max(10, Math.round((2 * Math.PI * (r0 + RINGS[k + 1]) * 0.5) / (k === RINGS.length - 2 ? 4 : 2.7)))));
  const lanes = BAYS.map((b) => ({
    dx: Math.sin((b.deg * Math.PI) / 180), dz: -Math.cos((b.deg * Math.PI) / 180),
    w: b.kind === 'doors' ? 1.55 : b.kind === 'window' ? 0 : 0.52,
    e: b.alive ? 1.25 : b.kind === 'doors' ? 0.8 : 0.32, end: b.kind === 'window' ? 17.4 : R + 3.5, alive: !!b.alive,
  }));
  const ELL = [0, 60, 120].map((d) => { const a = (d + 30) * Math.PI / 180; return { c: Math.cos(a), s: Math.sin(a), a: 15.4, b: 6.6 }; });
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -half + (i + 0.5) * px, z = -half + (j + 0.5) * px, r = Math.hypot(x, z), th = Math.atan2(x, -z);
    const id = j * N + i;
    let k = 0; while (k < RINGS.length - 2 && r >= RINGS[k + 1]) k++;
    const n = nSlab[k], off = (k % 2) * 0.5;
    const sf = (((th / (Math.PI * 2)) * n + off) % n + n) % n, slab = Math.floor(sf), fr = sf - slab;
    const dRing = Math.min(r - RINGS[k], RINGS[k + 1] - r) * ppm;
    const dRad = k === 0 ? 99 : Math.min(fr, 1 - fr) * ((2 * Math.PI * r) / n) * ppm;
    // ---- gold inlays (lines are measured in texels so they stay crisp 1-2 px strokes) ----
    let g = 0, gw = 0;   // g = emissive strength, gw = white-hot
    const ring = (rc, w) => Math.abs(r - rc) * ppm < w;
    if (r > 6.3 && r < R + 0.6) {
      if (ring(6.72, 1.1) || ring(7.06, 0.55)) g = Math.max(g, 0.55);
      if (ring(10.0, 0.75)) g = Math.max(g, 0.42);
      if (ring(13.0, 1.0)) g = Math.max(g, 0.5);
      if (ring(16.0, 0.6)) g = Math.max(g, 0.36);
      if (ring(R - 0.75, 1.0) || ring(R - 0.45, 0.55)) g = Math.max(g, 0.5);
      // ticks on the 13 m ring: every 5 degrees short, every 15 long
      const adeg = (th * 180) / Math.PI + 360, deg = adeg % 5, deg15 = adeg % 15;
      const tw = ((0.6 / ppm) / r) * 57.2958;
      if (r > 13.0 && r < 13.42 && (deg < tw || deg > 5 - tw)) g = Math.max(g, 0.32);
      if (r > 12.55 && r < 13.6 && (deg15 < tw || deg15 > 15 - tw)) g = Math.max(g, 0.45);
      // planets riding the 10 m orbit
      for (const pd of [24, 142, 213, 318]) {
        const pa = (pd * Math.PI) / 180, qx = x - 10 * Math.sin(pa), qz = z + 10 * Math.cos(pa), q = Math.hypot(qx, qz);
        if (q < 0.34) g = Math.max(g, q < 0.16 ? 0.9 : 0.5);
        else if (Math.abs(q - 0.55) * ppm < 0.55) g = Math.max(g, 0.3);
      }
      // three crossing orbit ellipses (the orrery projected onto the floor)
      if (r > 7.3 && r < R - 1.2) for (const e of ELL) {
        const u = (x * e.c + z * e.s) / e.a, v = (-x * e.s + z * e.c) / e.b, q = Math.hypot(u, v);
        const grad = Math.hypot(u / e.a, v / e.b) / Math.max(q, 1e-4);
        if (Math.abs(q - 1) / grad * ppm < 0.6) g = Math.max(g, 0.3);
      }
    }
    // lanes out to every bay: twin rails and a dashed centre line, four-point stars where they cross the 13 m ring
    for (const L of lanes) {
      const al = x * L.dx + z * L.dz, ac = x * -L.dz + z * L.dx;
      if (al < 7.1 || al > L.end) continue;
      const aac = Math.abs(ac);
      if (L.w > 0 && Math.abs(aac - L.w) * ppm < 0.6) g = Math.max(g, L.e * 0.75);
      if (aac * ppm < 0.55 && ((al * 2) % 1) < (L.alive ? 0.7 : 0.45)) { g = Math.max(g, L.e * 0.6); if (L.alive) gw = 0.5; }
      for (const sc of [13.0, R - 2.1]) {
        const a = Math.abs(al - sc), c = aac;
        if (a + c * 7 <= 0.62 || c + a * 7 <= 0.62 || a + c <= 0.14) { g = Math.max(g, L.e * (a + c < 0.2 ? 1.3 : 0.95)); gw = Math.max(gw, a + c < 0.2 ? 0.8 : 0.2); }
      }
    }
    // constellations: a few gold points per slab
    if (g === 0 && k > 0 && k < RINGS.length - 2) {
      const h = hash2(slab, k, seed + 31);
      if (h < 0.35) for (let q = 0; q < 3; q++) {
        const ra = RINGS[k] + (RINGS[k + 1] - RINGS[k]) * (0.2 + 0.6 * hash2(slab, k * 7 + q, seed + 3));
        const ta = ((slab + 0.15 + 0.7 * hash2(slab, k * 13 + q, seed + 5) - off) / n) * Math.PI * 2;
        const qx = x - ra * Math.sin(ta), qz = z + ra * Math.cos(ta);
        if (Math.abs(qx) * ppm < 0.6 && Math.abs(qz) * ppm < 0.6) g = 0.22;
      }
    }
    if (g > 0) {
      const t = Math.min(1, 0.55 + g * 0.45);
      alb.set(i, j, rampDither(GOLD, t, i, j, 0.5));
      emi.set(i, j, gold(Math.min(1, g * 0.85), gw));
      hgt[id] = 0.9; rough[id] = 0.26; metal[id] = 1;
      continue;
    }
    // ---- stone ----
    const joint = dRing < 0.62 || dRad < 0.55;
    if (joint) { alb.set(i, j, '#040509'); hgt[id] = 0.25; rough[id] = 0.55; metal[id] = 0; emi.set(i, j, [0, 0, 0]); continue; }
    const tone = (hash2(slab, k, seed) - 0.5) * 0.22;
    const nn = fbm(i, j, N, N, 24, 3, seed) - 0.5;
    const vein = Math.pow(Math.max(0, 1 - Math.abs(fbm(i, j, N, N, 12, 3, seed + 9) * 2 - 1)), 14);
    let t = 0.42 + tone + nn * 0.28;
    if (dRing < 1.6 || dRad < 1.5) t -= 0.08;     // a dark bevel at every slab edge
    const c = hex(rampDither(STONE, t, i, j, 0.55)), vc = vein * 0.18;
    alb.set(i, j, [c[0] + (VEIN[0] - c[0]) * vc, c[1] + (VEIN[1] - c[1]) * vc, c[2] + (VEIN[2] - c[2]) * vc]);
    emi.set(i, j, [0, 0, 0]);
    hgt[id] = 1 - Math.max(0, -nn) * 0.08;
    rough[id] = 0.12 + Math.max(0, nn) * 0.22 + (k >= RINGS.length - 2 ? 0.25 : 0);
    metal[id] = 0;
  }
  const orm = ormCanvas(N, N, (i, j) => [Math.max(0.05, Math.min(1, rough[j * N + i])), metal[j * N + i]]);
  return {
    map: alb.texture({ repeat: false }), emissiveMap: emi.texture({ repeat: false }),
    normalMap: normalFromHeight(hgt, N, N, 1.4, false).texture({ kind: 'data', repeat: false }),
    ormMap: orm.texture({ kind: 'data', repeat: false }), size,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE GATE (World 1's mark). Master: THE PATH, browser/js/marks.js gateMarkShapes(). Ring radius 1, y down.
const GATE_R_IN = 0.835, GATE_EQ = 0.04, GATE_TOP = 0.27, GATE_END_OUT = 46, GATE_END_IN = 49.5;
const GATE_DOTS = [[-0.87, 0.040], [-0.61, 0.058], [-0.35, 0.064], [-0.09, 0.064], [0.17, 0.058]];
const GB = { T: [-0.165, 0.07], K1: [-0.262, 0.50], C: [-0.29, 0.60], K2: [-0.40, 0.665], B1: [-0.90, 1.13], S1: [-0.615, 1.13], A: [-0.248, 0.675], S2: [-0.49, 1.13], B2: [-0.19, 1.13] };
const gdeg = (d) => (d * Math.PI) / 180;
function garc(r, a0, a1, step = 2) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step)), out = [];
  for (let i = 0; i <= n; i++) { const a = gdeg(a0 + ((a1 - a0) * i) / n); out.push([r * Math.cos(a), r * Math.sin(a)]); }
  return out;
}
function gateMark() {
  const polys = [], dots = [];
  const mir = (p) => p.map(([x, y]) => [-x, y]);
  const eqO = (Math.asin(GATE_EQ) * 180) / Math.PI, eqI = (Math.asin(GATE_EQ / GATE_R_IN) * 180) / Math.PI;
  const topO = (Math.acos(GATE_TOP) * 180) / Math.PI, topI = (Math.acos(GATE_TOP / GATE_R_IN) * 180) / Math.PI;
  const nw = 0.032, needle = [[0, 1.30], [nw, 1.12], [nw, 0.39]];
  for (let i = 0; i <= 8; i++) { const a = gdeg((i * 180) / 8); needle.push([nw * Math.cos(a), 0.39 - nw * Math.sin(a)]); }
  needle.push([-nw, 1.12]);
  polys.push(needle);
  const road = [GB.B2, GB.T, GB.K1];
  for (let i = 1; i <= 8; i++) { const u = i / 8, v = 1 - u; road.push([v * v * GB.K1[0] + 2 * v * u * GB.C[0] + u * u * GB.K2[0], v * v * GB.K1[1] + 2 * v * u * GB.C[1] + u * u * GB.K2[1]]); }
  road.push(GB.B1, GB.S1, GB.A, GB.S2);
  polys.push(road, mir(road));
  for (const [y, r] of GATE_DOTS) dots.push([0, y, r]);
  const lowL = [...garc(1, 180 - GATE_END_OUT, 180 - eqO), ...garc(GATE_R_IN, 180 - eqI, 180 - GATE_END_IN)];
  const upL = [...garc(1, 180 + eqO, 180 + topO), ...garc(GATE_R_IN, 180 + topI, 180 + eqI)];
  polys.push(lowL, mir(lowL), upL, mir(upL));
  const cy = -1.25, w = 0.04;
  polys.push([[0, -1.58], [w, cy - w], [0.22, cy], [w, cy + w], [0, -1.0], [-w, cy + w], [-0.22, cy], [-w, cy - w]]);
  return { polys, dots, cy: -0.14, scale: 0.86 };
}

// The other six: wordless gold geometry (placeholders until THE PATH sets each world's mark). Unit = ring radius 1, y down.
const segD = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, h = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - vx * h, py - ay - vy * h);
};
const star4 = (x, y, cx, cy, s, k = 6) => { const a = Math.abs(x - cx), b = Math.abs(y - cy); return a * k + b <= s || b * k + a <= s; };
const arcIn = (x, y, r, w, a0, a1) => { const d = Math.hypot(x, y); if (Math.abs(d - r) > w) return false; let a = (Math.atan2(y, x) * 180) / Math.PI; a = (a + 360) % 360; return a0 <= a1 ? a >= a0 && a <= a1 : a >= a0 || a <= a1; };
/** Distance to a quadratic Bezier (sampled), with its parameter at the nearest point. */
const bezD = (px, py, P0, P1, P2, n = 28) => {
  let best = 1e9, bt = 0, ax = P0[0], ay = P0[1];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t, bx = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], by = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
    const d = segD(px, py, ax, ay, bx, by); if (d < best) { best = d; bt = t; }
    ax = bx; ay = by;
  }
  return [best, bt];
};
const ell = (x, y, a, b, rot, w) => { const c = Math.cos(rot), s = Math.sin(rot), u = (x * c + y * s) / a, v = (-x * s + y * c) / b, q = Math.hypot(u, v); return Math.abs(q - 1) * Math.min(a, b) < w; };
const INK = {
  gobekli: (x, y, w) => arcIn(x, y, 1, w * 1.2, 115, 65) || (Math.abs(x) < 0.09 && y > -0.26 && y < 0.82) || (Math.abs(y + 0.33) < 0.085 && Math.abs(x) < 0.46)
    || segD(x, y, -0.09, 0.12, -0.36, -0.02) < w || segD(x, y, 0.09, 0.12, 0.36, -0.02) < w || star4(x, y, 0, -0.72, 0.2) || Math.hypot(x + 0.62, y - 0.42) < 0.06 || Math.hypot(x - 0.62, y - 0.42) < 0.06,
  egypt: (x, y, w) => arcIn(x, y, 0.88, w, 0, 360) || arcIn(x, y, 0.42, w * 0.8, 0, 360) || (Math.abs(x) < w * 0.9 && Math.abs(y) < 1.42)
    || star4(x, y, 0, 0, 0.6, 5.5) || star4(x, y, 0, -1.45, 0.34, 5) || star4(x, y, 0, 1.4, 0.24, 5)
    || ell(x, y, 1.28, 0.44, -0.22, w * 0.9)
    || Math.hypot(x + 0.86, y - 0.12) < 0.13 || Math.hypot(x - 1.2, y + 0.18) < 0.15 || Math.hypot(x - 0.58, y - 0.66) < 0.09 || Math.hypot(x + 0.55, y + 0.67) < 0.08 || Math.hypot(x - 0.3, y + 0.35) < 0.06,
  east: (x, y, w) => { const sx = Math.sin(y * 2.6) * 0.42; return (Math.abs(x - sx) < w * 1.4 && Math.abs(y) < 0.9) || (Math.abs(x) < w && y > -1.2 && y < 1.1) || arcIn(x, y, 1, w, 200, 340) || arcIn(x, y, 0.82, w * 0.8, 210, 330) || star4(x, y, 0, -1.22, 0.22) || Math.hypot(x, y - 1.12) < 0.07; },
  vale: (x, y, w) => segD(x, y, -0.86, 0.6, 0, -0.3) < w * 1.3 || segD(x, y, 0.86, 0.6, 0, -0.3) < w * 1.3 || segD(x, y, -0.5, 0.6, 0, 0.12) < w || segD(x, y, 0.5, 0.6, 0, 0.12) < w
    || (Math.abs(y - 0.6) < w && Math.abs(x) < 0.95) || arcIn(x, y, 0.95, w, 205, 335) || (Math.abs(x) < w && y > -1.15 && y < -0.3) || star4(x, y, 0, -0.3, 0.2) || star4(x, y, 0, -1.15, 0.2),
  signal: (x, y, w) => arcIn(x, y, 1.0, w, 300, 240) || arcIn(x, y, 0.68, w, 120, 60) || arcIn(x, y, 0.36, w, 0, 360) || (Math.abs(x) < w && Math.abs(y) < 1.25 && Math.hypot(x, y) > 0.2)
    || star4(x, y, 0, 0, 0.2) || Math.hypot(x - 0.87, y - 0.5) < 0.07 || Math.hypot(x + 0.68, y + 0.0) < 0.06,
  atlantis: (x, y, w) => {
    if (arcIn(x, y, 1.12, w * 0.55, 0, 360)) return true;
    const ax = Math.abs(x);
    const [d1, t1] = bezD(ax, y, [0, -1.18], [0.3, -0.25], [1.02, 0.42]);
    if (d1 < w * (0.6 + 1.6 * Math.sin(Math.PI * t1) * 0.8 + t1 * 0.4)) return true;
    const [d2, t2] = bezD(ax, y, [1.02, 0.42], [0.42, 0.05], [0.07, 0.62]);
    if (d2 < w * (0.5 + 1.3 * Math.sin(Math.PI * t2))) return true;
    if (ax < w * (1.1 - Math.max(0, y - 0.6) * 0.75) && y > -1.38 && y < 1.42) return true;
    return star4(x, y, 0, -0.12, 0.5, 5) || star4(x, y, 0, -1.42, 0.2, 5) || Math.hypot(x - 1.12, y) < 0.06 || Math.hypot(x + 1.12, y) < 0.06;
  },
};

/** A medallion: dark disc, gold rims, the world's mark. Returns { map, emissiveMap } (square, the disc fills it). */
export function paintMark(world, S = 128) {
  const pc = new PixelCanvas(S, S), em = new PixelCanvas(S, S);
  const c = S / 2, unit = S * 0.29;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = i + 0.5 - c, dy = j + 0.5 - c, d = Math.hypot(dx, dy);
    em.set(i, j, [0, 0, 0]);
    if (d > c) { pc.set(i, j, '#05060a'); continue; }
    if (d > c - 3.2) { pc.set(i, j, d > c - 1.4 ? GOLD[2] : GOLD[4]); em.set(i, j, gold(0.35)); continue; }
    if (Math.abs(d - (c - 7)) < 0.6) { pc.set(i, j, GOLD[3]); em.set(i, j, gold(0.22)); continue; }
    // ticks between the rims
    const a = (Math.atan2(dy, dx) * 180) / Math.PI + 360;
    if (d > c - 6.4 && d < c - 3.2 && (a % 15) < 1.4) { pc.set(i, j, GOLD[2]); em.set(i, j, gold(0.15)); continue; }
    pc.set(i, j, rampDither(['#07080e', '#0b0d16', '#10131f', '#161a29'], 0.45 + (fbm(i, j, S, S, 6, 2, 3) - 0.5) * 0.6 - d / c * 0.25, i, j, 0.6));
  }
  const ink = (i, j, bright = 1) => { pc.set(i, j, bright > 0.9 ? GOLD[5] : GOLD[4]); em.set(i, j, gold(bright, bright > 0.9 ? 0.5 : 0)); };
  if (world === '80s') {
    const G = gateMark(), k = unit * G.scale;
    const P = ([x, y]) => [c + x * k, c + (y - G.cy) * k];
    const tmp = new PixelCanvas(S, S);
    for (const p of G.polys) tmp.poly(p.map(P), '#ffffff');
    for (const [x, y, r] of G.dots) tmp.ellipse(c + x * k, c + (y - G.cy) * k, Math.max(0.9, r * k), Math.max(0.9, r * k), '#ffffff');
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (tmp.alpha(i, j)) ink(i, j, 1);
  } else {
    const f = INK[world], w = Math.max(0.045, 0.85 / unit);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const x = (i + 0.5 - c) / unit, y = (j + 0.5 - c) / unit;
      if (Math.hypot(x, y) < 1.62 && f(x, y, w)) ink(i, j, 1);
    }
  }
  return { map: pc.texture({ repeat: false }), emissiveMap: em.texture({ repeat: false }) };
}

/** A bronze door leaf (the face toward the hall): framed panels, a ringed four-point star, studs, constellation points. */
export function paintDoorLeaf(seed = 4) {
  const W = 48, H = 96, R0 = rng(seed);
  const pc = new PixelCanvas(W, H), em = new PixelCanvas(W, H);
  const BR = ['#140c07', '#21150c', '#342213', '#4b321a', '#664623', '#86602f', '#a87d3f'];
  const hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    em.set(x, y, [0, 0, 0]);
    const n = fbm(x, y, W, H, 6, 3, seed) - 0.5;
    let t = 0.42 + n * 0.35, h = 0.6;
    const frame = x < 3 || x > W - 4 || y < 3 || y > H - 4;
    const inUpper = x >= 6 && x < W - 6 && y >= 6 && y < 42, inLower = x >= 6 && x < W - 6 && y >= 47 && y < H - 6;
    const edge = (x0, y0, x1, y1) => x === x0 || x === x1 || y === y0 || y === y1;
    if (frame) { t = 0.62 + n * 0.2; h = 1; }
    else if (inUpper || inLower) { t = 0.3 + n * 0.3; h = 0.4; if (inUpper ? edge(6, 6, W - 7, 41) : edge(6, 47, W - 7, H - 7)) { t = 0.75; h = 0.9; } }
    else { t = 0.55 + n * 0.25; h = 0.8; }
    pc.set(x, y, rampDither(BR, t, x, y, 0.7));
    hgt[y * W + x] = h;
  }
  // gold: the star in a ring on the upper panel, a needle down the lower panel, studs, points
  const cx = W / 2 - 0.5, cy = 23.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    const ringP = Math.abs(d - 13) < 0.7 || Math.abs(d - 10.5) < 0.45;
    const st = star4(x, y, cx, cy, 9.5, 5.5);
    const needle = Math.abs(x - cx) < 0.6 && y > 52 && y < H - 12;
    const stud = (y === 4 || y === H - 5 || y === 44) && x % 6 === 3;
    if (ringP || st || needle) { pc.set(x, y, st && d < 2.5 ? GOLD[5] : GOLD[4]); em.set(x, y, gold(st ? 0.55 : 0.3)); hgt[y * W + x] = 1; }
    else if (stud) { pc.set(x, y, GOLD[3]); em.set(x, y, gold(0.12)); hgt[y * W + x] = 1; }
  }
  for (let k = 0; k < 9; k++) { const x = 9 + Math.floor(R0() * (W - 18)), y = 55 + Math.floor(R0() * 30); pc.set(x, y, GOLD[4]); em.set(x, y, gold(0.35)); }
  return {
    map: pc.texture({ repeat: false }), emissiveMap: em.texture({ repeat: false }),
    normalMap: normalFromHeight(hgt, W, H, 2.0, false).texture({ kind: 'data', repeat: false }),
  };
}

/** The orrery's broad band: engraved ticks and points around its circumference (tiles along u). */
export function paintBand() {
  const W = 256, H = 8, pc = new PixelCanvas(W, H), em = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const rim = y === 0 || y === H - 1;
    const tick = x % 8 === 0 && y > 1 && y < H - 2, big = x % 32 === 0 && y > 0 && y < H - 1;
    const pt = x % 32 === 16 && (y === 3 || y === 4);
    if (rim || tick || big || pt) { pc.set(x, y, big || pt ? GOLD[5] : GOLD[4]); em.set(x, y, gold(big || pt ? 0.9 : 0.5)); }
    else { pc.set(x, y, rampDither(GOLD, 0.25 + (hash2(x, y, 9) - 0.5) * 0.2, x, y)); em.set(x, y, [0, 0, 0]); }
  }
  return { map: pc.texture(), emissiveMap: em.texture() };
}
