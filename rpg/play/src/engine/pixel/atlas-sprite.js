// Atlas Veyr at pixel scale, 64 x 96 per frame, painted natively in code from the production sprite sheet
// (Boards/ChatGPT 2026-10-10 Art Direction/03-atlas-pixel-sprite-sheet-v1.png) and the prototype poster:
// a midnight-navy long coat (#1A2B4D) that flares open over the legs, gold trim (#D4AF7C) and constellation embroidery,
// layered aged-brass pauldrons (#8B6F3D), black leather (#1B1B1B) trousers, tall boots with brass knee guards,
// belt + pouches + cross strap, the cyan Signal (#3EE6FF) pendant and Gauntlet, swept dark brown hair with restrained grey temples.
// Method: shapes are rasterised into a material grid with per-pixel normals (domes, cylinders, cloth folds) -> ramp shading
// (key light from the upper left, a cast shadow wherever a nearer part overlaps, light ordered dither) -> selective outline.
// The face and hair are hand-placed pixels and stay soft: strong brows, calm eyes, a short mouth, dark jaw stubble with a few grey flecks.
// Every sheet shares one layout: rows = directions [down, up, left, right]; columns = [idle0, idle1, walk0..3].
//   paintAtlasSheet() -> { map, emissive, run: { map, emissive }, cast: { map, emissive, cols } }
//   run:  same layout; columns 2..5 are the run cycle. attachAtlasRun(hero, A.atlas) swaps it in while Shift is held.
//   cast: 5 columns [prepare, channel, cast, peak, recover] x 4 directions (exported for later; not wired).
import { PixelCanvas, bayer, hex } from './paint.js';

export const FRAME_W = 64, FRAME_H = 96;
export const DIRS = ['down', 'up', 'left', 'right'];
export const COLS = 6;
export const CAST_COLS = 5;
const W = FRAME_W, H = FRAME_H;
const SOLE = 90.6;            // ankle height that puts the sole on the bottom row (93)

const MAT = {
  coat:    { ramp: ['#070b18', '#0b1226', '#101a34', '#152241', '#1a2b4d', '#21365e', '#2a4472', '#365586', '#4a6a9c'], base: 0.5, k: 0.55 },
  jacket:  { ramp: ['#05070f', '#080c19', '#0c1324', '#111a31', '#16223f', '#1c2b4f', '#253862', '#30477a'], base: 0.46, k: 0.6 },   // the coat's upper body, darker
  lining:  { ramp: ['#04060c', '#070b16', '#0b1120', '#10182c', '#152038'], base: 0.45, k: 0.45 },
  gold:    { ramp: ['#4a3618', '#6e5228', '#9a7a46', '#c29e6a', '#d4af7c', '#e8cc9c', '#fbeac4'], base: 0.62, k: 0.5, metal: true },
  brass:   { ramp: ['#1d150a', '#3a2c13', '#574220', '#765b2f', '#8b6f3d', '#a8894f', '#c9a965', '#e6cf8e', '#fff0c0'], base: 0.46, k: 0.75, metal: true },
  trouser: { ramp: ['#08080a', '#0f0f13', '#17171c', '#202027', '#2b2b34', '#3a3a45', '#4f4f5c'], base: 0.42, k: 0.75 },
  leather: { ramp: ['#08080a', '#0f0f13', '#17171c', '#1f1f26', '#2a2a32', '#383842', '#4b4b57'], base: 0.42, k: 0.7 },
  boot:    { ramp: ['#0b0807', '#151009', '#20180f', '#2c2116', '#3a2c1e', '#4d3a28', '#664e36', '#816548'], base: 0.4, k: 0.75 },
  brown:   { ramp: ['#140c07', '#21150c', '#2f1e12', '#3f2919', '#523622', '#67462d', '#80593a'], base: 0.46, k: 0.55 },
  skin:    { ramp: ['#7a4b36', '#a26b50', '#c48d6a', '#d6a47e', '#e8c09a'], base: 0.6, k: 0.4 },
  hair:    { ramp: ['#211b19', '#332821', '#49392d', '#604b39', '#765d46'], base: 0.5, k: 0.5 },   // dark brown, swept back; highlights stay warm
  eye:     { ramp: ['#1a2638', '#3f5f80', '#7fa3bf'], base: 0, k: 0 },
  grey:    { ramp: ['#5f6470', '#8a909c', '#b4bac4', '#d8dce3'], base: 0.5, k: 0.5 },
  feat:    { ramp: ['#191317', '#5a3328', '#8e4e40'], base: 0, k: 0 },
  stub:    { ramp: ['#695044', '#856653', '#9b7b64'], base: 0.5, k: 0.3 },
  cyan:    { ramp: ['#0a3c4a', '#127c94', '#22b8d8', '#3ee6ff', '#9af4ff', '#e6fdff'], base: 0.62, k: 0.4, glow: true },
};
const L = (() => { const v = [-0.5, -0.6, 0.62], l = Math.hypot(...v); return v.map((c) => c / l); })();
const HV = (() => { const v = [L[0], L[1], L[2] + 1], l = Math.hypot(...v); return v.map((c) => c / l); })();

// ---------- the painter: shapes -> material grid with normals ----------
class Painter {
  constructor() {
    const n = W * H;
    this.m = new Array(n).fill(null);
    this.tone = new Int8Array(n).fill(-1);
    this.nx = new Float32Array(n); this.ny = new Float32Array(n); this.nz = new Float32Array(n).fill(1);
    this.lift = new Float32Array(n);
    this.part = new Int16Array(n).fill(-1);
    this.casts = [];
    this.lean = 0; this.leanY = 53;
  }
  /** Lean: everything above the hips shifts (forward is -x for a left-facing figure). */
  T(x, y) { return y < this.leanY ? x - this.lean * (this.leanY - y) / (this.leanY - 6) : x; }
  newPart(cast = true) { this.casts.push(cast); return this.casts.length - 1; }
  put(x, y, mat, nx, ny, nz, o, part) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (o.on && !o.on.includes(this.m[i])) return;
    if (o.under && this.m[i]) return;
    const l = Math.hypot(nx, ny, nz) || 1;
    this.m[i] = mat; this.nx[i] = nx / l; this.ny[i] = ny / l; this.nz[i] = nz / l;
    this.tone[i] = o.tone ?? -1; this.lift[i] = o.lift || 0;
    if (!o.keepPart || this.part[i] < 0) this.part[i] = part;
  }
  ellipse(cx, cy, rx, ry, mat, o = {}) {
    cx = this.T(cx, cy);
    const part = this.newPart(o.cast ?? true), rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1, bz = o.dome ?? 1;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry, d = u * u + v * v;
      if (d > 1) continue;
      this.put(x, y, mat, (u * c - v * s) * bz, (u * s + v * c) * bz, Math.sqrt(Math.max(0.04, 1 - d)), o, part);
    }
  }
  capsule(ax, ay, bx, by, ra, rb, mat, o = {}) {
    ax = this.T(ax, ay); bx = this.T(bx, by);
    const part = this.newPart(o.cast ?? true), dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, R = Math.max(ra, rb) + 1;
    for (let y = Math.floor(Math.min(ay, by) - R); y <= Math.ceil(Math.max(ay, by) + R); y++)
      for (let x = Math.floor(Math.min(ax, bx) - R); x <= Math.ceil(Math.max(ax, bx) + R); x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
        const ex = px - (ax + dx * t), ey = py - (ay + dy * t), r = ra + (rb - ra) * t, d = Math.hypot(ex, ey);
        if (d > r) continue;
        const q = d / r;
        this.put(x, y, mat, (ex / r) * (o.round ?? 1), (ey / r) * (o.round ?? 1), Math.sqrt(Math.max(0.04, 1 - q * q)), o, part);
      }
  }
  poly(pts, mat, o = {}) {
    pts = pts.map(([x, y]) => [this.T(x, y), y]);
    const part = this.newPart(o.cast ?? true);
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[(i + 1) % pts.length];
        if ((ya <= yc && yb > yc) || (yb <= yc && ya > yc)) xs.push(xa + ((yc - ya) / (yb - ya)) * (xb - xa));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
          const n = o.fn ? o.fn(x + 0.5, yc) : (o.n || [0, 0, 1]);
          this.put(x, y, mat, n[0], n[1], n[2], o, part);
        }
    }
  }
  line(x0, y0, x1, y1, mat, o = {}) {
    x0 = this.T(x0, y0); x1 = this.T(x1, y1);
    const part = this.newPart(o.cast ?? false), n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    const oo = { keepPart: true, ...o };
    for (let i = 0; i <= n; i++) { const t = i / n; this.put(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t), mat, 0, 0, 1, oo, part); }
  }
  path(pts, mat, o = {}) { for (let i = 0; i + 1 < pts.length; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], mat, o); }
  px(x, y, mat, tone, o = {}) { const part = this.newPart(false); this.put(Math.floor(this.T(x, y)), Math.floor(y), mat, 0, 0, 1, { keepPart: true, tone, ...o }, part); }
  /** Hand-placed pixels: rows of characters through the legend (char -> [material, tone]). */
  ascii(x0, y0, rows, o = {}) {
    const dx = Math.round(this.T(x0 + 10, y0 + 10) - (x0 + 10));
    const part = this.newPart(true);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const e = LEGEND[r[i]]; if (e) this.put(x0 + i + dx, y0 + j, e[0], 0, 0, 1, { tone: e[1], lift: o.lift }, part); } });
  }
  get(x, y) { return x >= 0 && y >= 0 && x < W && y < H ? this.m[y * W + x] : null; }
  flipX() {
    for (const k of ['m', 'tone', 'nx', 'ny', 'nz', 'lift', 'part'])
      for (let y = 0; y < H; y++) { const a = this[k]; for (let x = 0; x < W / 2; x++) { const i = y * W + x, j = y * W + W - 1 - x, t = a[i]; a[i] = a[j]; a[j] = t; } }
    for (let i = 0; i < W * H; i++) this.nx[i] = -this.nx[i];
  }

  /** Shade into pixels: ramps lit by the key light, cast shadows from nearer parts, bevels, dither; then the outline. */
  render(pc, emi, ox, oy) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, id = this.m[i];
      if (!id) continue;
      const M = MAT[id], r = M.ramp, n = r.length - 1;
      let c;
      if (this.tone[i] >= 0) c = r[Math.min(n, this.tone[i])];
      else {
        const nx = this.nx[i], ny = this.ny[i], nz = this.nz[i];
        const ndl = nx * L[0] + ny * L[1] + nz * L[2];
        let t = M.base + M.k * (ndl - 0.62) + this.lift[i] - (y / H) * 0.05;
        if (M.metal) { const sp = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]); t += Math.pow(sp, 14) * 0.45; }
        // a nearer part above or to the left throws a shadow down-right onto this one
        const p = this.part[i];
        const nb = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false; const j = yy * W + xx, q = this.part[j]; return this.m[j] && q > p && this.casts[q]; };
        if (nb(x, y - 1)) t -= 0.17; else if (nb(x, y - 2)) t -= 0.08;
        if (nb(x - 1, y)) t -= 0.12;
        if (nb(x + 1, y) || nb(x, y + 1)) t -= 0.06;
        // silhouette bevel: the top-left rim catches light, the bottom falls away
        if (!this.get(x, y - 1) || !this.get(x - 1, y)) t += 0.07;
        if (!this.get(x, y + 1)) t -= 0.06;
        const f = Math.max(0, Math.min(1, t)) * n, fi = Math.floor(f), fr = f - fi;
        const dith = M.metal ? 0.15 : 0.45;
        c = r[Math.min(n, fr > 0.5 + (bayer(x, y) - 0.5) * dith ? fi + 1 : fi)];
      }
      pc.set(ox + x, oy + y, c);
      if (M.glow) emi.set(ox + x, oy + y, c);
    }
    // selective outline: a deepened tone of the neighbouring material (ink, not a black box)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (this.get(x, y)) continue;
      const ns = [this.get(x, y + 1), this.get(x, y - 1), this.get(x - 1, y), this.get(x + 1, y)].filter(Boolean);
      if (!ns.length) continue;
      const id = ns[0], base = hex(MAT[id].ramp[0]), k = MAT[id].glow ? 0.9 : 0.42;
      pc.set(ox + x, oy + y, [base[0] * k + 3, base[1] * k + 3, base[2] * k + 7]);
      if (MAT[id].glow) emi.set(ox + x, oy + y, MAT[id].ramp[1]);
    }
  }
}

// ---------- the head, hand-placed (20 wide), soft features ----------
const LEGEND = {
  1: ['hair', 0], 2: ['hair', 1], 3: ['hair', 2], 4: ['hair', 3], 0: ['hair', 4],
  5: ['grey', 0], 6: ['grey', 1], 7: ['grey', 2],
  a: ['skin', 0], b: ['skin', 1], c: ['skin', 2], d: ['skin', 3], e: ['skin', 4],
  E: ['feat', 0], B: ['hair', 1], w: ['grey', 2], p: ['eye', 0], i: ['eye', 1], M: ['feat', 1], m: ['feat', 2], g: ['stub', 0], G: ['stub', 1], q: ['grey', 1],
};
const HEAD = {
  // 20 wide: swept-back hair in big lit locks split by dark creases, grey at the temples; exposed cheeks and chin, a thin jaw shadow
  down: [
    '......13443321......',
    '....1344002433221...',
    '...134400244332221..',
    '..13440024443322221.',
    '.134440244433222221.',
    '.134432dddd24332221.',
    '.1344dddddddddd4331.',
    '..356dBBBddBBBd523..',
    '...35dcEEddEEcd53...',
    '....cddwpddpwddc....',
    '....bdddeeccccba....',
    '.....dddcbbcccb.....',
    '.....cddcggccdb.....',
    '.....cdgMmmMbdc.....',
    '......cddccdbb......',
    '......GcddcbGb......',
    '......bqGGGGgb......',
    '.......bgGqgb.......',
    '........abba........',
  ],
  up: [
    '......13443321......',
    '....1344043433221...',
    '...134404433432221..',
    '..13440443343322221.',
    '.1344402443343222221',
    '.1344024433433222221',
    '.1344024433433322431',
    '..34640244334322643.',
    '...56402443342265...',
    '....c54024334225b...',
    '....b2402433222a....',
    '.....242243222......',
    '.....a22233222a.....',
    '......b222222b......',
    '......bc2cc2cb......',
    '.......bccccb.......',
    '........bccb........',
  ],
  left: [
    '.......134431.......',
    '.....1344004321.....',
    '....1344004433221...',
    '...1344400443332221.',
    '...24440443443322221',
    '..3d44404334333221..',
    '..ddd444343333222221',
    '..dded5443443332221.',
    '..dBBBdd5443332221..',
    '..dpwddc5cb4332221..',
    '.eddddcc2bb433221...',
    '.dddddcc2ba33221....',
    '..bddcccc2b22221....',
    '..cddcccG2b2221.....',
    '..mgccccGcb21.......',
    '...cdcccGcb2........',
    '...bGGqGGb..........',
    '....bGGgb...........',
    '.....abba...........',
  ],
};
for (const k in HEAD) for (const r of HEAD[k]) if (r.length !== 20) throw new Error('head row ' + k + ' ' + r.length + ' ' + r);

// ---------- shared pieces ----------
function pauldron(P, cx, cy, s, rosette, o = {}) {
  // two lames under a shallow cap with a gold lip: plate armour, not a ball
  P.ellipse(cx + s * 0.9, cy + 6.8, 4.8, 2.0, 'brass', { ...o, dome: 0.5, lift: (o.lift || 0) - 0.08 });
  P.ellipse(cx + s * 0.5, cy + 4.5, 5.7, 2.4, 'brass', { ...o, dome: 0.5, lift: (o.lift || 0) - 0.04 });
  P.ellipse(cx, cy, 6.2, 4.4, 'brass', { ...o, dome: 0.5, lift: (o.lift || 0) - 0.05 });
  for (let a = 0.3; a < Math.PI - 0.3; a += 0.09) P.px(cx + Math.cos(a) * 5.7, cy + Math.sin(a) * 3.9, 'gold', 5, { on: ['brass'] });
  P.px(cx - 3.2 * s, cy - 2.6, 'brass', 8); P.px(cx - 2.2 * s, cy - 3.1, 'brass', 7);
  if (rosette) { const x = cx + s * 1.2, y = cy - 0.6; P.px(x - 1, y, 'gold', 4); P.px(x + 1, y, 'gold', 4); P.px(x, y - 1, 'gold', 4); P.px(x, y + 1, 'gold', 4); P.px(x, y, 'cyan', 4); }
  else { P.px(cx + s * 1.5, cy - 0.5, 'brass', 7); }
}
/** Constellation embroidery: bright star points joined by faint gold thread, only on coat cloth. */
function constellation(P, pts, links) {
  for (const [a, b] of links) P.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], 'gold', { tone: 1, on: ['coat'] });
  pts.forEach(([x, y], k) => {
    P.px(x, y, 'gold', 6, { on: ['coat', 'gold'] });
    if (k % 2 === 0) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.px(x + dx, y + dy, 'gold', 3, { on: ['coat'] });
  });
}
const folds = (s, top, bot, k = 0.9, ph = 0) => (x, y) => {
  const t = Math.max(0, Math.min(1, (y - top) / (bot - top)));
  return [s * 0.22 + Math.sin(x * k + y * 0.07 + ph) * 0.55 * t, -0.05, 1];
};
const cyl = (cx, half, amt = 0.6) => (x) => [Math.max(-1, Math.min(1, (x - cx) / half)) * amt, 0, 1];

// ---------- front (facing the camera) ----------
function legFront(P, hx, hy, lift, s, o = {}) {
  const fy = SOLE - lift, ky = hy + (fy - hy) * 0.47 - lift * 0.45, kx = hx + s * 0.4;
  const d = { lift: o.dark || 0 };
  P.capsule(hx, hy, kx, ky, 4.4, 3.9, 'trouser', d);
  P.capsule(kx, ky + 2, kx + s * 0.3, fy - 0.5, 4.0, 3.6, 'boot', d);
  P.ellipse(kx + s * 1.2, fy + 1.4, 4.4, 2.3 + Math.min(1, lift * 0.15), 'boot', d);
  P.capsule(kx - 3.6, ky + 4.6, kx + 3.6, ky + 4.6, 1.25, 1.25, 'brass', d);
  for (const sy of [fy - 9, fy - 4]) P.line(kx - 4, sy, kx + 4, sy, 'brass', { tone: 3, on: ['boot'] });
  P.px(kx + s * 2.5, fy - 9, 'brass', 7, { on: ['brass'] });
  P.ellipse(kx, ky + 3.0, 2.9, 1.7, 'brass', { ...d, dome: 0.5, lift: -0.14 });
  P.ellipse(kx, ky - 0.3, 3.2, 3.4, 'brass', { ...d, dome: 0.55, lift: -0.08 });
  P.px(kx - 0.5, ky - 0.6, 'cyan', 4); P.px(kx - 0.5, ky + 0.4, 'cyan', 2);
}
function coatPanelFront(P, s, top, flare, sway, drop) {
  const X = (x) => 32 + s * x;
  const hemO = 80 + drop, hemI = 79.5;
  const pts = [[X(2.5), top], [X(11.5), top - 1], [X(14.8), 62], [X(21 + flare) + sway, hemO], [X(10 + flare * 0.3) + sway, hemI], [X(6.6) + sway * 0.4, 66]];
  P.poly(pts, 'coat', { fn: folds(s, top + 6, hemO, 0.95, s) });
  // the lining shows where the panel turns back at its open edge
  P.path([[X(3.5), top + 1], [X(7.6) + sway * 0.4, 66], [X(11 + flare * 0.3) + sway, hemI - 1]], 'lining', { tone: 3, on: ['coat'] });
  P.path([[X(2.5), top], [X(6.6) + sway * 0.4, 66], [X(10 + flare * 0.3) + sway, hemI]], 'gold', { tone: 4 });
  P.path([[X(10 + flare * 0.3) + sway, hemI], [X(21 + flare) + sway, hemO]], 'gold', { tone: 5 });
  P.path([[X(10.5 + flare * 0.3) + sway, hemI - 2], [X(20 + flare) + sway, hemO - 2]], 'gold', { tone: 2, on: ['coat'] });
  const st = [[X(14) + sway * 0.5, 66], [X(16.5) + sway * 0.7, 71], [X(13) + sway * 0.7, 74], [X(18) + sway, 76.5]];
  constellation(P, st, [[0, 1], [1, 2], [1, 3]]);
}
function plainForearm(P, el, wr, o = {}) {
  // black leather sleeve, a brass bracer with a small Signal inset at the wrist end
  const at = (t) => [el[0] + (wr[0] - el[0]) * t, el[1] + (wr[1] - el[1]) * t];
  const dx = wr[0] - el[0], dy = wr[1] - el[1], l = Math.hypot(dx, dy) || 1, px = -dy / l * 3, py = dx / l * 3;
  const mid = at(0.45);
  P.capsule(el[0], el[1], wr[0], wr[1], 3.5, 3.1, 'leather', o);
  P.capsule(mid[0], mid[1], ...at(0.92), 3.5, 3.2, 'brass', { ...o, lift: (o.lift || 0) - 0.05 });
  P.line(mid[0] - px, mid[1] - py, mid[0] + px, mid[1] + py, 'gold', { tone: 5, on: ['brass'] });
  const c = at(0.7); P.px(c[0], c[1] - 0.5, 'cyan', 4); P.px(c[0], c[1] + 0.5, 'cyan', 3);
}
function armFrontPlain(P, sx, u, a, run, o = {}) {
  // his right arm (screen left): coat sleeve, brass bracer with a Signal inset, gloved hand
  const sh = [sx, 33 + u];
  const el = run ? [sx - 3, 43 + u] : [sx - 2.5, 45 + u];
  const wr = run ? [sx + 1.5 + a * 0.5, 47 + u - a * 2.5] : [sx - 3 + a * 0.6, 55 + u - a * 1.6];
  P.capsule(sh[0], sh[1], el[0], el[1], 4.1, 3.6, 'jacket', o);
  plainForearm(P, el, wr, o);
  const dx = wr[0] - el[0], dy = wr[1] - el[1], l = Math.hypot(dx, dy);
  P.ellipse(wr[0] + dx / l * 2.6, wr[1] + dy / l * 2.6, 2.9, 3.2, 'leather', o);
}
function gauntlet(P, el, wr, o = {}) {
  P.capsule(el[0], el[1], wr[0], wr[1], 4.3, 3.8, 'brass', o);
  const dx = wr[0] - el[0], dy = wr[1] - el[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  // segmented plates and the glowing Signal channel running down the forearm
  for (const t of [0.3, 0.62]) P.line(el[0] + dx * t - uy * 4, el[1] + dy * t + ux * 4, el[0] + dx * t + uy * 4, el[1] + dy * t - ux * 4, 'brass', { tone: 1, on: ['brass'] });
  for (let t = 0.12; t <= 0.9; t += 0.1) {
    const x = el[0] + dx * t, y = el[1] + dy * t;
    P.px(x, y, 'cyan', t > 0.25 && t < 0.75 ? 4 : 3); P.px(x - uy, y + ux, 'cyan', 2);
  }
  P.line(wr[0] - uy * 4, wr[1] + ux * 4, wr[0] + uy * 4, wr[1] - ux * 4, 'gold', { tone: 5, on: ['brass'] });
}
function palmUp(P, x, y, glow = 1) {
  // an open gloved hand, palm up, the Signal pooling in it
  P.ellipse(x, y, 3.5, 2.3, 'leather');
  P.capsule(x + 2.5, y - 0.5, x + 4, y - 2.5, 1.1, 1.0, 'leather');
  P.px(x - 1, y - 1.5, 'cyan', 3); P.px(x, y - 1.5, 'cyan', 5); P.px(x + 1, y - 1.5, 'cyan', 4);
  if (glow > 0.5) { P.px(x, y - 2.5, 'cyan', 3); P.px(x - 1, y - 2.5, 'cyan', 1); P.px(x + 1, y - 2.5, 'cyan', 2); }
}
function front(P, p) {
  const b = Math.round(p.bob || 0), u = b - (p.breath ? 1 : 0), hy = 53 + b, top = 51 + u;
  const fl = p.fl || 0, fr = p.fr || 0, sway = p.sway || 0;
  // the back of the coat, seen between the legs
  P.poly([[23, top], [41, top], [44 + fr * 0.5 + sway, 80], [20 - fl * 0.5 + sway, 80]], 'lining', { n: [0, 0, 1] });
  P.line(21 + sway, 79, 43 + sway, 79, 'gold', { tone: 1, on: ['lining'] });
  legFront(P, 28, hy, p.lLift || 0, -1, { dark: p.lLift > 3 ? -0.04 : 0 });
  legFront(P, 36, hy, p.rLift || 0, 1, { dark: p.rLift > 3 ? -0.04 : 0 });
  coatPanelFront(P, -1, top, fl, sway, p.dropL || 0);
  coatPanelFront(P, 1, top, fr, sway, p.dropR || 0);
  // torso: the coat over a black leather tunic, lapels turned back, a cross strap, the Signal pendant
  P.poly([[21, 29 + u], [43, 29 + u], [42.5, 40 + u], [40.5, 51 + u], [23.5, 51 + u], [21.5, 40 + u]], 'jacket', { fn: cyl(32, 12) });
  P.poly([[28, 25 + u], [36, 25 + u], [35.5, 51 + u], [28.5, 51 + u]], 'leather', { fn: cyl(32, 5, 0.45) });
  for (const s of [-1, 1]) {
    const X = (x) => 32 + s * x;
    P.poly([[X(8), 27 + u], [X(4.2), 27 + u], [X(4.2), 38 + u]], 'coat', { n: [s * 0.55, -0.25, 1] });
    P.path([[X(8), 27 + u], [X(4.2), 38 + u]], 'gold', { tone: s < 0 ? 5 : 3 });
    P.path([[X(4.2), 27 + u], [X(3.7), 51 + u]], 'gold', { tone: s < 0 ? 4 : 3 });
  }
  P.capsule(25, 31 + u, 38.5, 48 + u, 1.25, 1.25, 'brown');
  P.px(31.5, 39.5 + u, 'brass', 7); P.px(30.5, 39.5 + u, 'brass', 4); P.px(32.5, 40.5 + u, 'brass', 3);
  P.path([[29, 25.5 + u], [31.5, 32 + u]], 'gold', { tone: 3 }); P.path([[35, 25.5 + u], [32.5, 32 + u]], 'gold', { tone: 2 });
  P.px(31, 33 + u, 'brass', 6); P.px(32, 33 + u, 'brass', 4);
  P.px(31, 34 + u, 'cyan', 4); P.px(32, 34 + u, 'cyan', 3); P.px(31, 35 + u, 'cyan', 5); P.px(32, 35 + u, 'cyan', 3);
  P.px(31, 36 + u, 'cyan', 3); P.px(32, 36 + u, 'cyan', 2); P.px(31, 37 + u, 'cyan', 2);
  // belt, buckle, pouches
  P.poly([[22.5, 48.5 + u], [41.5, 48.5 + u], [41.5, 52 + u], [22.5, 52 + u]], 'brown', { fn: cyl(32, 10, 0.5) });
  for (let x = 24; x <= 40; x += 3) P.px(x, 51 + u, 'brown', 0, { on: ['brown'] });
  P.poly([[29.5, 48 + u], [34.5, 48 + u], [34.5, 53 + u], [29.5, 53 + u]], 'brass', { n: [0, 0, 1] });
  P.px(31, 50 + u, 'cyan', 4); P.px(32, 50 + u, 'cyan', 3); P.px(31, 51 + u, 'cyan', 2); P.px(32, 51 + u, 'cyan', 1);
  P.px(30, 48 + u, 'brass', 8); P.px(31, 48 + u, 'brass', 7);
  for (const [x0, x1, s] of [[18.5, 24, -1], [40, 45.5, 1]]) {
    P.poly([[x0, 52 + u], [x1, 52 + u], [x1, 58.5 + u], [x0 + 0.5, 59 + u]], 'brown', { n: [s * 0.3, 0, 1] });
    P.poly([[x0 - 0.3, 51.5 + u], [x1 + 0.3, 51.5 + u], [x1 + 0.3, 54.5 + u], [x0 - 0.3, 54.5 + u]], 'brown', { n: [s * 0.2, -0.5, 1], lift: 0.08 });
    P.px((x0 + x1) / 2, 55 + u, 'brass', 7);
  }
  // arms: his right (plain) on our left; his left, the Signal Gauntlet, held out on our right with the palm up
  armFrontPlain(P, 21.5, u, p.armL || 0, p.run);
  if (!p.castArm) {
    if (p.run) {
      const a = p.armR || 0;
      P.capsule(42.5, 33 + u, 45.5, 43 + u, 4.1, 3.7, 'jacket');
      gauntlet(P, [45.5, 43 + u], [42 - a * 0.5, 47.5 + u + a * 2.5]);
      P.ellipse(40.5 - a * 0.5, 49 + u + a * 2.5, 2.9, 3.1, 'leather');
      P.px(40.5 - a * 0.5, 49 + u + a * 2.5, 'cyan', 4);
    } else {
      const a = p.armR || 0;
      P.capsule(42.5, 33 + u, 45.5, 44.5 + u, 4.1, 3.8, 'jacket');
      gauntlet(P, [45.5, 44.5 + u], [51.5, 49.5 + u - a]);
      palmUp(P, 54.5, 50 + u - a);
    }
  }
  pauldron(P, 20.8, 31 + u, -1, false);
  pauldron(P, 43.2, 31 + u, 1, true);
  // neck and the high standing collar, open in a V under the beard
  P.poly([[29, 20 + u], [35, 20 + u], [35, 27 + u], [29, 27 + u]], 'skin', { n: [0, 0.5, 1], lift: -0.12 });
  for (const s of [-1, 1]) {
    const X = (x) => 32 + s * x;
    P.poly([[X(3.6), 23 + u], [X(7.8), 18.5 + u], [X(9.3), 20.5 + u], [X(9.3), 27 + u], [X(7.5), 30 + u], [X(4.2), 28 + u]], 'coat', { n: [s * 0.45, -0.1, 1] });
    P.path([[X(3.6), 23 + u], [X(7.8), 18.5 + u], [X(9.3), 20.5 + u]], 'gold', { tone: s < 0 ? 5 : 3 });
    P.path([[X(4.6), 23.5 + u], [X(7.6), 20.5 + u]], 'lining', { tone: 3, on: ['coat'] });
  }
  P.ascii(22, 3 + u + (p.headBob || 0), HEAD.down);
}

// ---------- back (walking away, toward the gate) ----------
function legBack(P, hx, hy, lift, s, o = {}) {
  const fy = SOLE - lift, ky = hy + (fy - hy) * 0.47 - lift * 0.45, kx = hx + s * 0.4, d = { lift: o.dark || 0 };
  P.capsule(hx, hy, kx, ky, 4.4, 3.9, 'trouser', d);
  P.capsule(kx, ky + 2, kx + s * 0.3, fy - 0.5, 4.0, 3.6, 'boot', d);
  P.ellipse(kx + s * 0.4, fy + 1.6 - Math.min(2, lift * 0.3), 4.0, 2.0, 'boot', d);
  P.capsule(kx - 3.6, ky + 4.6, kx + 3.6, ky + 4.6, 1.25, 1.25, 'brass', d);
  for (const sy of [fy - 9, fy - 4]) P.line(kx - 4, sy, kx + 4, sy, 'brass', { tone: 3, on: ['boot'] });
  P.line(kx - 3, ky - 1, kx + 3, ky - 1, 'trouser', { tone: 1, on: ['trouser'] });
}
function back(P, p) {
  const b = Math.round(p.bob || 0), u = b - (p.breath ? 1 : 0), hy = 53 + b, top = 51 + u;
  const fl = p.fl || 0, fr = p.fr || 0, sway = p.sway || 0;
  legBack(P, 28, hy, p.lLift || 0, -1);
  legBack(P, 36, hy, p.rLift || 0, 1);
  // coat back: two panels split by a vent, constellation embroidery across the skirt
  for (const s of [-1, 1]) {
    const X = (x) => 32 + s * x, f = s < 0 ? fl : fr;
    P.poly([[X(0), top], [X(10.5), top - 1], [X(15.5), 63], [X(22 + f) + sway, 80 + (s < 0 ? p.dropL || 0 : p.dropR || 0)], [X(1.5) + sway, 80.5], [X(0) + sway * 0.4, 64]], 'coat', { fn: folds(s, top + 4, 80, 0.85, s * 2) });
    P.path([[X(0.5) + sway * 0.4, 64], [X(1.5) + sway, 80.5]], 'gold', { tone: 3 });
    P.path([[X(1.5) + sway, 80.5], [X(22 + f) + sway, 80 + (s < 0 ? p.dropL || 0 : p.dropR || 0)]], 'gold', { tone: 5 });
    P.path([[X(2) + sway, 78.5], [X(21 + f) + sway, 78]], 'gold', { tone: 2, on: ['coat'] });
  }
  constellation(P, [[17 + sway * 0.6, 70], [23 + sway * 0.4, 63], [28, 72 + 0], [36 + sway * 0.4, 66], [41 + sway * 0.6, 73], [46 + sway * 0.8, 69], [25 + sway * 0.7, 77]],
    [[0, 1], [1, 2], [2, 6], [3, 4], [4, 5], [1, 3]]);
  // torso back, straps crossing to a brass medallion
  P.poly([[21, 29 + u], [43, 29 + u], [42.5, 40 + u], [40.5, 51 + u], [23.5, 51 + u], [21.5, 40 + u]], 'jacket', { fn: cyl(32, 12) });
  P.line(32, 42 + u, 32, 50 + u, 'jacket', { tone: 1, on: ['jacket'] });
  P.capsule(24.5, 31 + u, 39.5, 48 + u, 1.2, 1.2, 'brown');
  P.capsule(39.5, 31 + u, 24.5, 48 + u, 1.2, 1.2, 'brown');
  P.ellipse(32, 39.6 + u, 2.6, 2.6, 'brass');
  P.px(32, 39.5 + u, 'gold', 6); P.px(31, 39.5 + u, 'gold', 3); P.px(33, 39.5 + u, 'gold', 3); P.px(32, 38.5 + u, 'gold', 3); P.px(32, 40.5 + u, 'gold', 3);
  P.poly([[22.5, 48.5 + u], [41.5, 48.5 + u], [41.5, 52 + u], [22.5, 52 + u]], 'brown', { fn: cyl(32, 10, 0.5) });
  P.ellipse(32, 50.3 + u, 2.4, 2.1, 'brass');
  P.px(31.5, 50 + u, 'cyan', 4);
  P.poly([[40, 52 + u], [45, 52 + u], [45, 58.5 + u], [40.5, 59 + u]], 'brown', { n: [0.3, 0, 1] });
  P.px(42.5, 55 + u, 'brass', 7);
  // arms: his left (the Gauntlet) on our left, held out, palm up; his right hanging
  if (!p.castArm) {
    const a = p.armL || 0;
    if (p.run) {
      P.capsule(21.5, 33 + u, 18.5, 43 + u, 4.1, 3.7, 'jacket');
      gauntlet(P, [18.5, 43 + u], [22 + a * 0.5, 47.5 + u - a * 2.5]);
      P.ellipse(23.5 + a * 0.5, 49 + u - a * 2.5, 2.9, 3.1, 'leather');
    } else {
      P.capsule(21.5, 33 + u, 18.5, 44.5 + u, 4.1, 3.8, 'jacket');
      gauntlet(P, [18.5, 44.5 + u], [12.5, 49.5 + u - a]);
      P.ellipse(9.8, 49.6 + u - a, 3.3, 2.4, 'leather');
      P.px(9.5, 47.5 + u - a, 'cyan', 4); P.px(10.5, 47.5 + u - a, 'cyan', 3); P.px(9.5, 46.5 + u - a, 'cyan', 2);
    }
  }
  {
    const a = p.armR || 0, sx = 42.5;
    const el = p.run ? [sx + 3, 43 + u] : [sx + 2.5, 45 + u];
    const wr = p.run ? [sx - 1.5 - a * 0.5, 47 + u + a * 2.5] : [sx + 3 - a * 0.6, 55 + u + a * 1.6];
    P.capsule(sx, 33 + u, el[0], el[1], 4.1, 3.6, 'jacket');
    plainForearm(P, el, wr);
    const dx = wr[0] - el[0], dy = wr[1] - el[1], l = Math.hypot(dx, dy);
    P.ellipse(wr[0] + dx / l * 2.6, wr[1] + dy / l * 2.6, 2.9, 3.2, 'leather');
  }
  pauldron(P, 20.8, 31 + u, -1, true);
  pauldron(P, 43.2, 31 + u, 1, false);
  // the collar from behind, standing up around the neck
  P.poly([[24, 19.5 + u], [40, 19.5 + u], [41.5, 30 + u], [22.5, 30 + u]], 'coat', { fn: cyl(32, 9, 0.5) });
  P.line(24, 19.5 + u, 39.5, 19.5 + u, 'gold', { tone: 5 });
  P.line(24.5, 21 + u, 39, 21 + u, 'lining', { tone: 2, on: ['coat'] });
  P.ascii(22, 3 + u + (p.headBob || 0), HEAD.up);
}

// ---------- side (facing left; the right-facing frame is this painted with the Gauntlet near, then mirrored) ----------
function legSide(P, hx, hy, a, bend, o = {}) {
  const TH = 18, SH = 19;
  const kx = hx - Math.sin(a) * TH, ky = hy + Math.cos(a) * TH;
  const sa = a - bend, ax = kx - Math.sin(sa) * SH, ay = ky + Math.cos(sa) * SH;
  const d = { lift: o.dark || 0 };
  P.capsule(hx, hy, kx, ky, 4.4, 3.8, 'trouser', d);
  P.capsule(kx - Math.sin(sa) * 2, ky + Math.cos(sa) * 2, ax, ay, 3.9, 3.4, 'boot', d);
  const fa = o.toe || 0, hxh = ax + 1.4, hyh = ay + 0.6;
  P.capsule(hxh, hyh, hxh - Math.cos(fa) * 7.2, hyh + Math.sin(fa) * 7.2, 2.7, 2.2, 'boot', d);
  const cx = kx - Math.sin(sa) * 4.6, cy = ky + Math.cos(sa) * 4.6, px = Math.cos(sa) * 3.9, py = Math.sin(sa) * 3.9;
  P.capsule(cx - px, cy - py, cx + px, cy + py, 1.25, 1.25, 'brass', d);
  for (const t of [0.55, 0.85]) { const x = kx - Math.sin(sa) * SH * t, y = ky + Math.cos(sa) * SH * t; P.line(x - px, y - py, x + px, y + py, 'brass', { tone: 3, on: ['boot'] }); }
  P.ellipse(kx - Math.cos(a) * 1.4, ky + Math.sin(a) * 0.6 + 2.6, 2.6, 2.0, 'brass', d);
  P.ellipse(kx - Math.cos(a) * 1.6, ky - 0.4, 2.9, 3.8, 'brass', { ...d, rot: -a * 0.6 });
  if (!o.far) { P.px(kx - Math.cos(a) * 2.6, ky - 0.6, 'cyan', 4); P.px(kx - Math.cos(a) * 2.6, ky + 0.4, 'cyan', 2); }
  return [ax, ay];
}
function armSide(P, sx, sy, phi, psi, gaunt, o = {}) {
  // phi: upper arm angle from straight down (+ swings back, toward +x); psi: elbow bend (forearm lifts forward)
  const el = [sx + Math.sin(phi) * 12, sy + Math.cos(phi) * 12];
  const fa = phi - psi, wr = [el[0] + Math.sin(fa) * 10.5, el[1] + Math.cos(fa) * 10.5];
  P.capsule(sx, sy, el[0], el[1], 4.0, 3.5, 'jacket', o);
  if (gaunt) gauntlet(P, el, wr, o);
  else {
    plainForearm(P, el, wr, o);
  }
  const hx = wr[0] + Math.sin(fa) * 2.6, hy = wr[1] + Math.cos(fa) * 2.6;
  P.ellipse(hx, hy, 2.8, 3.1, 'leather', o);
  if (gaunt) { P.px(hx, hy - 0.5, 'cyan', 5); P.px(hx - 1, hy, 'cyan', 3); P.px(hx, hy + 0.5, 'cyan', 3); }
}
function side(P, p, nearGauntlet) {
  // the support leg sets the hip height, so the body bobs naturally through the stride
  const A = (leg) => Math.cos(leg[0]) * 18 + Math.cos(leg[0] - leg[1]) * 19;
  const near = p.near, far = p.far;
  const hy = SOLE - Math.max(A(near), A(far)) - (p.air || 0);
  const u = Math.round(hy - 53.6) - (p.breath ? 1 : 0), top = 51 + u, hx = 33;
  P.lean = p.lean || 0; P.leanY = hy;
  // far arm and far leg, in shade
  if (!(p.castArm && !nearGauntlet)) armSide(P, 33.5, 33 + u, p.farArm[0], p.farArm[1], !nearGauntlet, { lift: -0.2 });
  legSide(P, hx + 0.5, hy, far[0], far[1], { dark: -0.16, far: true, toe: far[2] || 0 });
  // the coat skirt: open at the front edge, flaring out behind with the stride
  const fl = p.flare || 0, tail = p.tail || 0, sw = p.sway || 0;
  const hem = [[30 + sw * 0.3, 80], [37, 80.8 - tail * 0.3], [44 + fl * 0.6, 80.3 - tail * 0.6], [50 + fl, 79 - tail]];
  P.poly([[26.5, top], [40.5, top], [44 + fl * 0.35, 62 - tail * 0.2], ...hem.slice().reverse(), [28.5 + sw * 0.2, 66]], 'coat', { fn: folds(1, top + 4, 80, 0.8, 0.5) });
  P.path([[26.5, top], [28.5 + sw * 0.2, 66], hem[0]], 'gold', { tone: 4 });
  P.path(hem, 'gold', { tone: 5 });
  P.path(hem.map(([x, y]) => [x - 0.5, y - 2]), 'gold', { tone: 2, on: ['coat'] });
  constellation(P, [[35, 65], [40 + fl * 0.3, 70], [36, 75], [45 + fl * 0.6, 75.5]], [[0, 1], [1, 2], [1, 3]]);
  legSide(P, hx - 0.5, hy, near[0], near[1], { toe: near[2] || 0 });
  // torso in profile: chest forward (left), the tunic's front, the pendant hanging clear
  P.poly([[27, 19 + u], [31.5, 19 + u], [31.5, 27 + u], [27, 27 + u]], 'skin', { n: [0, 0.5, 1], lift: -0.12 });
  P.poly([[25, 29 + u], [39.5, 28.5 + u], [41, 37 + u], [40, 51 + u], [26, 51 + u], [24.5, 38 + u]], 'jacket', { fn: cyl(33, 8) });
  P.poly([[24.5, 25.5 + u], [28.5, 25.5 + u], [28.5, 51 + u], [26, 51 + u], [24, 38 + u]], 'leather', { fn: cyl(26.5, 3, 0.4) });
  P.path([[28.5, 26 + u], [28.5, 51 + u]], 'gold', { tone: 4 });
  P.capsule(29.5, 30 + u, 39, 47 + u, 1.15, 1.15, 'brown');
  P.px(23.5, 34 + u, 'brass', 6); P.px(23.5, 35 + u, 'cyan', 5); P.px(23.5, 36 + u, 'cyan', 3); P.px(24.5, 35 + u, 'cyan', 3); P.px(23.5, 37 + u, 'cyan', 2);
  P.poly([[24.5, 48.5 + u], [40.5, 48.5 + u], [40.5, 52 + u], [24.5, 52 + u]], 'brown', { fn: cyl(33, 8, 0.5) });
  P.poly([[24, 48 + u], [27, 48 + u], [27, 53 + u], [24, 53 + u]], 'brass', { n: [-0.3, 0, 1] });
  P.px(25, 50 + u, 'cyan', 4);
  P.poly([[38, 52 + u], [42.5, 52 + u], [42.5, 58.5 + u], [38.5, 59 + u]], 'brown', { n: [0.3, 0, 1] });
  P.poly([[37.7, 51.5 + u], [42.8, 51.5 + u], [42.8, 54.5 + u], [37.7, 54.5 + u]], 'brown', { n: [0.2, -0.5, 1], lift: 0.08 });
  P.px(40, 55 + u, 'brass', 7);
  // near arm, then the shoulder plate over it
  if (!p.castArm || !nearGauntlet) armSide(P, 32.5, 33 + u, p.nearArm[0], p.nearArm[1], nearGauntlet);
  pauldron(P, 32.6, 31 + u, 1, nearGauntlet);
  // collar standing behind the neck, then the head
  P.poly([[30, 17.5 + u], [36.5, 19.5 + u], [38.5, 30 + u], [29.5, 30 + u], [28.5, 25 + u]], 'coat', { n: [0.3, -0.1, 1] });
  P.path([[30, 17.5 + u], [36.5, 19.5 + u], [38.5, 29 + u]], 'gold', { tone: 4 });
  P.ascii(21, 3 + u + (p.headBob || 0), HEAD.left);
}

// ---------- poses ----------
// front/back: lLift/rLift raise a foot; armL/armR swing (-1..1); fl/fr flare a coat panel; sway shifts the hem.
const FRONT = {
  idle: [{}, { breath: 1, sway: 0 }],
  walk: [
    { rLift: 3, armL: 1, armR: 0.5, fr: 2, sway: 1 },
    { bob: -1, rLift: 1, armL: 0.3, fl: 0.5, fr: 1 },
    { lLift: 3, armL: -1, armR: -0.5, fl: 2, sway: -1 },
    { bob: -1, lLift: 1, armL: -0.3, fl: 1, fr: 0.5 },
  ],
  run: [
    { run: 1, bob: -2, rLift: 8, lLift: 0, armL: 1, armR: -1, fr: 4, fl: 1, sway: 2, dropR: -2 },
    { run: 1, bob: -3, rLift: 3, lLift: 2, armL: 0, armR: 0, fr: 3, fl: 3, sway: 0, dropL: -1, dropR: -1 },
    { run: 1, bob: -2, lLift: 8, rLift: 0, armL: -1, armR: 1, fl: 4, fr: 1, sway: -2, dropL: -2 },
    { run: 1, bob: -3, lLift: 3, rLift: 2, armL: 0, armR: 0, fr: 3, fl: 3, sway: 0, dropL: -1, dropR: -1 },
  ],
};
// side: near/far = [thigh angle (+ forward), knee bend, toe tilt]; arms = [shoulder angle (+ back), elbow bend]
const SIDE = {
  idle: [
    { near: [0.1, 0.06], far: [-0.08, 0.04], nearArm: [0.05, 0.15], farArm: [-0.05, 0.15], flare: 0 },
    { near: [0.1, 0.06], far: [-0.08, 0.04], nearArm: [0.05, 0.18], farArm: [-0.05, 0.18], flare: 0.6, breath: 1 },
  ],
  walk: [
    { near: [0.42, 0.05], far: [-0.36, 0.22, 0.35], nearArm: [0.32, 0.25], farArm: [-0.3, 0.3], flare: 2, sway: 1 },
    { near: [0.02, 0.06], far: [0.26, 0.8], nearArm: [0.02, 0.2], farArm: [0, 0.2], flare: 3.5, sway: 0 },
    { near: [-0.36, 0.22, 0.35], far: [0.42, 0.05], nearArm: [-0.3, 0.3], farArm: [0.32, 0.25], flare: 2, sway: -1 },
    { near: [0.26, 0.8], far: [0.02, 0.06], nearArm: [0, 0.2], farArm: [0.02, 0.2], flare: 3.5, sway: 0 },
  ],
  run: [
    { near: [0.66, 0.22], far: [-0.55, 0.95, 0.6], nearArm: [0.75, 1.35], farArm: [-0.55, 1.5], flare: 6, tail: 5, lean: 3, air: 1.5, sway: 1 },
    { near: [0.04, 0.38], far: [0.8, 1.7], nearArm: [0.1, 1.4], farArm: [0.1, 1.4], flare: 5, tail: 3, lean: 3, sway: 0 },
    { near: [-0.55, 0.95, 0.6], far: [0.66, 0.22], nearArm: [-0.55, 1.5], farArm: [0.75, 1.35], flare: 6, tail: 5, lean: 3, air: 1.5, sway: -1 },
    { near: [0.8, 1.7], far: [0.04, 0.38], nearArm: [0.1, 1.4], farArm: [0.1, 1.4], flare: 5, tail: 3, lean: 3, sway: 0 },
  ],
};

function paintFrame(dir, pose) {
  const P = new Painter();
  if (dir === 'down') front(P, pose);
  else if (dir === 'up') back(P, pose);
  else { side(P, pose, dir === 'right'); if (dir === 'right') P.flipX(); }
  if (pose.after) pose.after(P, dir);
  return P;
}
function paintSheet(kind) {
  const pc = new PixelCanvas(W * COLS, H * DIRS.length), emi = new PixelCanvas(W * COLS, H * DIRS.length);
  DIRS.forEach((dir, row) => {
    const S = dir === 'left' || dir === 'right' ? SIDE : FRONT;
    const poses = [...S.idle, ...S[kind]];
    poses.forEach((pose, col) => paintFrame(dir, pose).render(pc, emi, col * W, row * H));
  });
  return { map: pc, emissive: emi };
}

// ---------- the Signal cast (5 frames x 4 directions): prepare, channel, cast, peak, recover ----------
function sigil(P, cx, cy, r, bright) {
  // a ring of light with tick marks and a hot core: drawn as glow pixels (they bloom in the scene)
  const n = Math.max(12, Math.round(r * 7));
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    P.px(x, y, 'cyan', k % 3 === 0 ? bright + 1 : bright);
    if (r > 6 && k % 4 === 0) P.px(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 'cyan', bright - 1);
  }
  if (r > 4) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; P.px(cx + Math.cos(a) * (r * 0.55), cy + Math.sin(a) * (r * 0.55), 'cyan', 2); }
  P.px(cx, cy, 'cyan', 5); P.px(cx - 1, cy, 'cyan', 4); P.px(cx + 1, cy, 'cyan', 4); P.px(cx, cy - 1, 'cyan', 4); P.px(cx, cy + 1, 'cyan', 4);
}
const CAST = [
  { reach: 0.15, ring: 0, sparks: 2 },
  { reach: 0.55, ring: 2.5, sparks: 5 },
  { reach: 0.9, ring: 5, sparks: 8 },
  { reach: 1.0, ring: 9.5, sparks: 14 },
  { reach: 0.45, ring: 0, sparks: 6 },
];
function castOverlay(stage) {
  const c = CAST[stage];
  return (P, dir) => {
    // the Gauntlet arm reaching out (screen right for front/right, screen left for back/left), the Signal blooming at the palm
    const side = dir === 'left' || dir === 'right', s = dir === 'up' || dir === 'left' ? -1 : 1;
    const sh = side ? [32.5 + s * 0.5, 33] : [32 + s * 10.5, 33];
    const el = side ? [sh[0] + s * (2 + c.reach * 6), 43 - c.reach * 4] : [sh[0] + s * (3 - c.reach * 1.5), 43.5 - c.reach * 4];
    const wr = side ? [el[0] + s * (3 + c.reach * 8), el[1] - 1 - c.reach * 5] : [el[0] - s * (1 + c.reach * 3), el[1] - 2 - c.reach * 4];
    P.lean = 0;
    P.capsule(sh[0], sh[1], el[0], el[1], 4.1, 3.8, 'jacket');
    gauntlet(P, el, wr);
    const hx = side ? wr[0] + s * 3 : wr[0] - s * 0.5, hy = side ? wr[1] - 1 : wr[1] - 2.5;
    P.ellipse(hx, hy, 2.7, 3.0, 'leather');
    pauldron(P, side ? 32.6 : 32 + s * 11.2, 31, s, true);
    if (c.ring) sigil(P, hx + (side ? s : 0), hy, c.ring, c.ring > 6 ? 3 : 2);
    P.px(hx, hy, 'cyan', 5); P.px(hx + s, hy, 'cyan', 4);
    let seed = stage * 97 + 13;
    const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < c.sparks; k++) { const a = R() * 6.283, d = 2 + R() * (c.ring + 4); P.px(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.9, 'cyan', R() < 0.4 ? 4 : 2); }
  };
}
function paintCastSheet() {
  const pc = new PixelCanvas(W * CAST_COLS, H * DIRS.length), emi = new PixelCanvas(W * CAST_COLS, H * DIRS.length);
  DIRS.forEach((dir, row) => {
    const isSide = dir === 'left' || dir === 'right';
    for (let col = 0; col < CAST_COLS; col++) {
      const base = isSide ? { ...SIDE.idle[0] } : { ...FRONT.idle[0] };
      base.castArm = true; base.after = castOverlay(col);
      // the far-side frames paint the reaching arm before the flip, so it mirrors with the body
      const P = new Painter();
      if (dir === 'down') front(P, base);
      else if (dir === 'up') back(P, base);
      else { side(P, base, dir === 'right'); }
      base.after(P, dir === 'right' ? 'left' : dir);
      if (dir === 'right') P.flipX();
      P.render(pc, emi, col * W, row * H);
    }
  });
  return { map: pc, emissive: emi, cols: CAST_COLS };
}

/** Paint all of Atlas's sheets. The manifest reads { map, emissive }; the run and cast sheets ride along in `raw`. */
export function paintAtlasSheet() {
  const walk = paintSheet('walk');
  return { map: walk.map, emissive: walk.emissive, run: paintSheet('run'), cast: paintCastSheet() };
}
export { paintCastSheet as paintAtlasCastSheet };

/**
 * Give a SpriteCharacter built from the atlas asset a real run cycle: above `threshold` m/s (Shift held) its map,
 * emissive map and shadow map swap to the run sheet (same layout, so the frame picker is untouched) and the cadence
 * is slowed to suit the longer stride. Call once after constructing the hero: attachAtlasRun(hero, A.atlas).
 */
export function attachAtlasRun(hero, asset, { threshold = 7.6, cadence = 0.52 } = {}) {
  const raw = asset && asset.raw && asset.raw.run;
  if (!raw || hero.__atlasRun) return hero;
  const mk = (pc, like) => {
    const t = pc.texture({ repeat: false, mips: false });
    t.repeat.copy(like.repeat); t.offset.copy(like.offset);
    t.magFilter = like.magFilter; t.minFilter = like.minFilter; t.generateMipmaps = false;
    t.wrapS = like.wrapS; t.wrapT = like.wrapT; t.colorSpace = like.colorSpace;
    return t;
  };
  const walk = { map: hero.material.map, emi: hero.material.emissiveMap };
  const run = { map: mk(raw.map, walk.map), emi: walk.emi ? mk(raw.emissive, walk.emi) : null };
  const update = hero.update.bind(hero);
  let on = false;
  hero.update = (dt, camera, move, speed, right, fwd) => {
    on = !!move && speed > (on ? threshold - 1.2 : threshold);
    const s = on ? run : walk;
    if (hero.material.map !== s.map) {
      hero.material.map = s.map;
      if (s.emi) hero.material.emissiveMap = s.emi;
      if (hero.mesh.customDepthMaterial) hero.mesh.customDepthMaterial.map = s.map;
    }
    hero.running = on;
    update(dt, camera, move, on ? speed * cadence : speed, right, fwd);
  };
  hero.__atlasRun = run;
  return hero;
}
