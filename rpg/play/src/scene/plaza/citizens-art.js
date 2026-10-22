// The people of the City, painted in code at the same pixel scale as Atlas (a 32 x 48 grid, Scale2x to 64 x 96).
// Robes, tunics and dresses in our palette (ivory, navy, muted teal, sand, sage, indigo, plum, pale sky; gold and brass
// trims; nothing saturated red), five skin tones, several hair styles and silhouettes (adults, elders, children), and the
// things people carry (baskets, jugs, a book, a staff, a satchel).
// Sheet: variants in pairs side by side; per variant 4 rows [down, up, left, right] x 8 columns
//   [idle0, idle1, walk0, walk1, walk2, walk3, look-up, point].
import { PixelCanvas, bayer, hex } from '../../engine/pixel/paint.js';

const BW = 32, BH = 48;
export const CIT_FW = 64, CIT_FH = 96, CIT_COLS = 8;
export const CIT_DIRS = ['down', 'up', 'left', 'right'];
export const COL = { idle: 0, walk: 2, look: 6, point: 7 };

const R_ = {
  ivory: ['#5b5240', '#8a7f68', '#b5aa90', '#d6ccb2', '#ece4cf'],
  white: ['#6a6458', '#9a9384', '#c4bdac', '#e2dccd', '#f6f2e8'],
  navy: ['#0a1020', '#121c36', '#1b2a50', '#26386a', '#344a82'],
  teal: ['#0d2626', '#15393a', '#1f5050', '#2c6a68', '#3f8580'],
  sand: ['#4a3a24', '#6e5636', '#93774c', '#b39864', '#ccb47f'],
  sage: ['#1f2a20', '#2f3e2e', '#43573f', '#5b7254', '#768d6b'],
  indigo: ['#151228', '#221d3d', '#2f2952', '#3b3563', '#4f4a7a'],
  plum: ['#21141e', '#34202f', '#4a2e42', '#634058', '#7b5670'],
  ember: ['#2a1810', '#45291a', '#663f27', '#875735', '#a57046'],
  sky: ['#2c3b52', '#475a78', '#6880a0', '#8ea6c2', '#b5c9dc'],
  gold: ['#4a3517', '#7a5c2c', '#9c7a3e', '#c19a55', '#d4b06a', '#f1dcaa'],
  brass: ['#3f2c12', '#6a4e22', '#9c7a3e', '#c19a55'],
  wood: ['#1e140d', '#3a2718', '#5c432c', '#7d5f3e'],
  leather: ['#160f0b', '#2a1d14', '#45301f', '#5f4430'],
  shoe: ['#0d0b0a', '#1c1613', '#2c231d'],
};
const SKIN = [
  ['#7a4e3c', '#a8735a', '#cf9a7c', '#e8bc9c', '#f4d4b8'],
  ['#5a3528', '#86533f', '#ad7457', '#cf9a78', '#e6b996'],
  ['#4e3322', '#734b31', '#946442', '#b58256', '#cc9d6e'],
  ['#3a2218', '#583424', '#764832', '#935e42', '#ad7656'],
  ['#22140e', '#352018', '#4a2e22', '#62402f', '#7a523d'],
];
const HAIR = {
  black: ['#0b090b', '#151115', '#211b20', '#30282e'],
  brown: ['#140c08', '#24170f', '#3a2518', '#523522'],
  auburn: ['#1e0f08', '#3a1d10', '#5a2e1a', '#7a4426'],
  grey: ['#4a4547', '#7a7576', '#a9a4a2', '#d4d0cc'],
  sandy: ['#3d2c16', '#6a5030', '#93734a', '#b8996a'],
};

/** The cast. kind: robe | tunic | dress | child | childDress | elder. */
export const VARIANTS = [
  { kind: 'robe', robe: 'ivory', trim: 'gold', sash: 'navy', mantle: 'navy', skin: 1, hair: 'brown', style: 'short' },
  { kind: 'dress', robe: 'sky', trim: 'gold', sash: 'ivory', mantle: 'ivory', skin: 0, hair: 'sandy', style: 'long', circlet: true },
  { kind: 'tunic', robe: 'sand', trim: null, sash: 'leather', legs: 'sage', skin: 3, hair: 'black', style: 'short', acc: 'basket' },
  { kind: 'robe', robe: 'navy', trim: 'gold', sash: 'gold', skin: 2, hair: 'black', style: 'bun' },
  { kind: 'dress', robe: 'ivory', trim: 'gold', sash: 'gold', skin: 4, hair: 'black', style: 'curly', acc: 'jug' },
  { kind: 'elder', robe: 'indigo', trim: 'gold', sash: 'gold', mantle: 'ivory', skin: 0, hair: 'grey', style: 'bald', beard: true, acc: 'book' },
  { kind: 'child', robe: 'ivory', trim: null, sash: 'teal', legs: 'sand', skin: 2, hair: 'brown', style: 'short' },
  { kind: 'childDress', robe: 'sage', trim: 'gold', sash: 'ivory', skin: 3, hair: 'black', style: 'long' },
  { kind: 'robe', robe: 'teal', trim: 'brass', sash: 'sand', skin: 1, hair: 'grey', style: 'short', acc: 'staff', beard: true },
  { kind: 'tunic', robe: 'plum', trim: 'brass', sash: 'leather', legs: 'navy', skin: 0, hair: 'auburn', style: 'short', acc: 'bag' },
  { kind: 'dress', robe: 'sand', trim: 'gold', sash: 'navy', mantle: 'navy', skin: 1, hair: 'brown', style: 'veil', veil: 'ivory' },
  { kind: 'robe', robe: 'white', trim: 'gold', sash: 'gold', skin: 2, hair: 'black', style: 'short', circlet: true },
  { kind: 'robe', robe: 'ember', trim: null, sash: 'ivory', mantle: 'ivory', skin: 4, hair: 'black', style: 'short', beard: true },
  { kind: 'dress', robe: 'indigo', trim: 'gold', sash: 'gold', skin: 0, hair: 'auburn', style: 'long', circlet: true },
  { kind: 'child', robe: 'sky', trim: null, sash: 'sand', legs: 'sand', skin: 1, hair: 'black', style: 'curly' },
  { kind: 'tunic', robe: 'sage', trim: null, sash: 'navy', legs: 'sand', skin: 2, hair: 'sandy', style: 'short', acc: 'basket' },
];
// Reserved for the quest elder: silver beard, sage robe, ivory mantle and staff.
export const ELDER_VARIANT = VARIANTS.length;
VARIANTS.push({ kind: 'elder', robe: 'sage', trim: 'gold', sash: 'teal', mantle: 'ivory', skin: 2, hair: 'grey', style: 'bald', beard: true, acc: 'staff' });
// The street musician (a lute across the chest) and the sweeper (a straw broom): small lives in the square.
export const MUSICIAN_VARIANT = VARIANTS.length;
VARIANTS.push({ kind: 'tunic', robe: 'teal', trim: 'gold', sash: 'sand', legs: 'navy', skin: 3, hair: 'black', style: 'curly', acc: 'lute' });
export const SWEEPER_VARIANT = VARIANTS.length;
VARIANTS.push({ kind: 'tunic', robe: 'sand', trim: null, sash: 'leather', legs: 'sage', skin: 1, hair: 'grey', style: 'short', acc: 'broom', beard: true });
export const CHILD_VARIANTS = VARIANTS.map((v, i) => (v.kind.startsWith('child') ? i : -1)).filter((i) => i >= 0);

class Grid {
  constructor(w = BW, h = BH) { this.W = w; this.H = h; this.a = new Array(w * h).fill(null); }
  set(x, y, id) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.W && y < this.H) this.a[y * this.W + x] = id; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H ? this.a[y * this.W + x] : null; }
  h(y, x0, x1, id) { for (let x = Math.round(x0); x <= Math.round(x1); x++) this.set(x, y, id); }
  rect(x0, y0, x1, y1, id) { for (let y = y0; y <= y1; y++) this.h(y, x0, x1, id); }
  over(x, y, id, on) { const c = this.get(Math.round(x), Math.round(y)); if (c && (!on || on.includes(c))) this.set(x, y, id); }
  line(x0, y0, x1, y1, id, w = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let k = 0; k < w; k++) this.set(x + k - (w - 1) / 2, y, id); }
  }
}

// poses: idle (breath), walk (contact / pass / contact / pass), look-up, point
const POSE = [
  { bob: 0, lL: 0, rL: 0, aL: 0, aR: 0, hem: 0, ff: -1, bf: 1, sw: 0 },
  { bob: 0, lL: 0, rL: 0, aL: 0, aR: 0, hem: 0, ff: -1, bf: 1, sw: 0, breath: 1 },
  { bob: 0, lL: 0, rL: 2, aL: 1, aR: -1, hem: 1, ff: -4, bf: 4, sw: -2 },
  { bob: -1, lL: 0, rL: 1, aL: 0, aR: 0, hem: 0, ff: -1, bf: 1, sw: 0 },
  { bob: 0, lL: 2, rL: 0, aL: -1, aR: 1, hem: -1, ff: 4, bf: -4, sw: 2 },
  { bob: -1, lL: 1, rL: 0, aL: 0, aR: 0, hem: 0, ff: 1, bf: -1, sw: 0 },
  { bob: 0, lL: 0, rL: 0, aL: 0, aR: 0, hem: 0, ff: -1, bf: 1, sw: 0, look: 1 },
  { bob: -1, lL: 0, rL: 0, aL: 0, aR: 0, hem: 0, ff: -1, bf: 1, sw: 0, look: 1, point: 1 },
];

function geom(v) {
  const child = v.kind === 'child' || v.kind === 'childDress';
  if (child) return { child, hy: 22, head: 7, torso: 7, x0: 11, x1: 20, hw: 0 };
  if (v.kind === 'elder') return { child, hy: 9, head: 8, torso: 10, x0: 11, x1: 20, hw: 0 };
  return { child, hy: 7, head: 8, torso: 10, x0: 10, x1: 21, hw: 0 };
}

// ---------- facing the camera ----------
function paintFront(g, v, p, back) {
  const G = geom(v), b = p.bob, hy = G.hy + b, look = p.look ? -1 : 0;
  const neck = hy + G.head, t0 = neck + 1, t1 = t0 + G.torso - 1, s0 = t1 + 1;
  const long = v.kind !== 'tunic' && v.kind !== 'child';
  const skirtEnd = long ? 45 : (G.child ? 41 : s0 + 8);
  // legs and feet
  const foot = (x, lift) => { g.rect(x, 46 - lift, x + 2, 47 - lift, 'K'); };
  if (!long) { g.rect(12, skirtEnd + 1, 14, 45 - p.lL, 'L'); g.rect(17, skirtEnd + 1, 19, 45 - p.rL, 'L'); }
  foot(12, p.lL); foot(17, p.rL);
  // skirt
  const n = skirtEnd - s0;
  for (let y = s0; y <= skirtEnd; y++) {
    const t = (y - s0) / Math.max(1, n), sway = Math.round(p.hem * t * t);
    const x0 = Math.round(G.x0 + (G.child ? 0 : 0.5) - t * (v.kind === 'dress' ? 3 : 2.2)) + sway, x1 = Math.round(G.x1 - 0.5 + t * (v.kind === 'dress' ? 3 : 2.2)) + sway;
    g.h(y + b, x0, x1, 'R');
    if (t > 0.25) { g.set(x0 + 2 + Math.round(t), y + b, 'r'); g.set(x1 - 2 - Math.round(t), y + b, 'r'); }
    if (!back && v.kind === 'dress' && t > 0.1) g.set(15 + sway, y + b, 'r');
    if (back && t > 0.1) g.set(15 + sway, y + b, 'r');
    if (y === skirtEnd && v.trim) g.h(y + b, x0, x1, 'T');
  }
  // torso
  for (let y = t0; y <= t1; y++) { const k = y > t0 + G.torso * 0.55 ? 1 : 0; g.h(y, G.x0 + k, G.x1 - k, 'R'); }
  g.h(t1 - 1, G.x0 + 1, G.x1 - 1, 'B'); g.h(t1, G.x0 + 1, G.x1 - 1, 'B');
  if (!back && v.trim) { g.set(14, t0, 'T'); g.set(17, t0, 'T'); g.set(15, t0 + 1, 'T'); g.set(16, t0 + 1, 'T'); g.rect(15, t0, 16, t0, 'S'); }
  if (v.mantle) { g.h(t0, G.x0 - 1, G.x1 + 1, 'O'); g.h(t0 + 1, G.x0 - 1, G.x1 + 1, 'O'); g.h(t0 + 2, G.x0, G.x1, 'O'); if (!back) { g.h(t0 + 3, G.x0, G.x0 + 2, 'O'); g.h(t0 + 3, G.x1 - 2, G.x1, 'O'); } else g.h(t0 + 3, G.x0 + 1, G.x1 - 1, 'O'); }
  // arms
  const armL = (sw) => { g.rect(G.x0 - 2, t0 + 1, G.x0 - 1, t1 + 1 + sw, 'R'); g.rect(G.x0 - 2, t1 + 2 + sw, G.x0 - 1, t1 + 3 + sw, 'S'); };
  const armR = (sw) => { g.rect(G.x1 + 1, t0 + 1, G.x1 + 2, t1 + 1 + sw, 'R'); g.rect(G.x1 + 1, t1 + 2 + sw, G.x1 + 2, t1 + 3 + sw, 'S'); };
  armL(p.aL);
  if (p.point) {
    // raised toward him: from the shoulder, up and out
    const sx = back ? G.x0 - 1 : G.x1 + 1;
    const dx = back ? -1 : 1;
    g.line(sx, t0 + 1, sx + dx * 4, t0 - 5, 'R', 2);
    g.rect(Math.min(sx + dx * 4, sx + dx * 5), t0 - 8, Math.max(sx + dx * 4, sx + dx * 5), t0 - 6, 'S');
    if (back) armR(0);
  } else armR(p.aR);
  if (p.point && back) { /* left arm already raised above */ }
  // head
  const hx0 = G.child ? 12 : 12, hx1 = G.child ? 19 : 19;
  const H0 = hy + look;
  for (let y = 0; y < G.head; y++) {
    const yy = H0 + y, inset = y === 0 || y === G.head - 1 ? 1 : 0;
    g.h(yy, hx0 + inset, hx1 - inset, back ? 'H' : 'S');
  }
  g.set(15, neck, 'S'); g.set(16, neck, 'S');
  if (p.look) { g.set(15, neck - 1, 'S'); g.set(16, neck - 1, 'S'); }
  if (!back) {
    const ey = H0 + (G.child ? 3 : 4) + look;
    g.set(14, ey, 'E'); g.set(17, ey, 'E');
    g.set(15, ey + 1, 's');
    if (p.look) { g.set(15, ey + 3, 'E'); g.set(16, ey + 3, 'm'); } else { g.set(15, ey + 2 + (G.child ? 0 : 1), 'm'); g.set(16, ey + 2 + (G.child ? 0 : 1), 'm'); }
    if (v.beard) { for (let y = ey + 2; y <= H0 + G.head; y++) g.h(y, 13, 18, 'H'); g.set(15, ey + 3, 'm'); g.set(16, ey + 3, 'm'); }
  }
  // hair
  const st = v.style;
  if (st !== 'bald' && st !== 'veil') {
    g.h(H0, hx0 + 1, hx1 - 1, 'H'); g.h(H0 + 1, hx0, hx1, 'H');
    if (!back) { g.set(hx0, H0 + 2, 'H'); g.set(hx1, H0 + 2, 'H'); g.set(hx0, H0 + 3, 'H'); g.set(hx1, H0 + 3, 'H'); g.set(14, H0 + 2, 'h'); }
  }
  if (st === 'long') for (let y = H0 + 2; y <= neck + 5; y++) { g.set(hx0 - 1, y, 'H'); g.set(hx1 + 1, y, 'H'); if (back) g.h(y, hx0, hx1, 'H'); }
  if (st === 'bun') { g.rect(14, H0 - 2, 17, H0 - 1, 'H'); g.set(15, H0 - 2, 'h'); }
  if (st === 'curly') { g.h(H0 - 1, hx0, hx1, 'H'); g.h(H0, hx0 - 1, hx1 + 1, 'H'); for (let y = H0 + 1; y <= H0 + 4; y++) { g.set(hx0 - 1, y, 'H'); g.set(hx1 + 1, y, 'H'); } g.set(13, H0 - 1, 'h'); g.set(17, H0, 'h'); }
  if (st === 'bald') { g.set(hx0, H0 + 3, 'H'); g.set(hx1, H0 + 3, 'H'); g.set(hx0, H0 + 4, 'H'); g.set(hx1, H0 + 4, 'H'); if (back) { g.h(H0 + 3, hx0, hx1, 'H'); g.h(H0 + 4, hx0, hx1, 'H'); g.h(H0 + 5, hx0 + 1, hx1 - 1, 'H'); for (let y = H0; y < H0 + 3; y++) g.h(y, hx0 + 1, hx1 - 1, 'S'); } }
  if (st === 'veil') {
    g.h(H0 - 1, hx0, hx1, 'V'); g.h(H0, hx0 - 1, hx1 + 1, 'V'); g.h(H0 + 1, hx0 - 1, hx1 + 1, 'V');
    for (let y = H0 + 2; y <= neck + 4; y++) { g.set(hx0 - 1, y, 'V'); g.set(hx1 + 1, y, 'V'); if (back) g.h(y, hx0, hx1, 'V'); }
    if (!back) { g.set(hx0, H0 + 2, 'v'); g.set(hx1, H0 + 2, 'v'); }
  }
  if (v.circlet) { g.h(H0 + 2, hx0, hx1, 'C'); if (!back) g.set(15, H0 + 2, 'W'); }
  // carried things
  const acc = v.acc;
  if (acc === 'basket') { const x = back ? G.x1 + 1 : G.x0 - 5; g.rect(x, t1 - 1 + p.aL, x + 4, t1 + 2 + p.aL, 'A'); g.h(t1 - 2 + p.aL, x + 1, x + 3, 'a'); }
  if (acc === 'jug') { const x = back ? G.x0 - 2 : G.x1 - 1; g.rect(x, H0 - 3, x + 3, H0 + 2, 'A'); g.h(H0 - 4, x + 1, x + 2, 'A'); if (!back) g.rect(G.x1 + 1, H0 + 2, G.x1 + 2, t0, 'S'); }
  if (acc === 'book' && !back) { g.rect(13, t0 + 3, 18, t0 + 6, 'a'); g.h(t0 + 3, 13, 18, 'T'); g.set(15, t0 + 5, 'T'); g.set(16, t0 + 5, 'T'); }
  if (acc === 'staff') { const x = back ? G.x0 - 3 : G.x1 + 3; for (let y = H0 - 3; y <= 47; y++) g.set(x, y, 'A'); g.set(x, H0 - 4, 'T'); }
  if (acc === 'lute' && !back) {
    for (let y = t1 - 3; y <= t1 + 3; y++) { const w = y < t1 ? 2 + (y - (t1 - 3)) : 6 - (y - t1); g.h(y, 13 - (w >> 1) + 1, 13 + (w >> 1) + 2, 'A'); }
    g.set(15, t1, 'T'); g.line(16, t1 - 3, 22, H0 - 5, 'A'); g.set(22, H0 - 6, 'T'); g.rect(G.x1 + 1, t0 + 3, G.x1 + 2, t1 - 1, 'S');
  }
  if (acc === 'broom') { const x = back ? G.x0 - 3 : G.x1 + 3; for (let y = H0 + 2; y <= 42; y++) g.set(x + (y > 30 ? 1 : 0), y, 'A'); g.rect(x - 1, 42, x + 3, 47, 'a'); g.h(47, x - 2, x + 4, 'a'); }
  if (acc === 'bag') { for (let k = 0; k < G.torso; k++) g.set(back ? G.x1 - k : G.x0 + k, t0 + k, 'A'); g.rect(back ? G.x0 - 1 : G.x1 - 2, t1 + 1, back ? G.x0 + 2 : G.x1 + 1, t1 + 4, 'A'); }
}

// ---------- in profile (facing left; right is the mirror) ----------
function paintSide(g, v, p) {
  const G = geom(v), b = p.bob, hy = G.hy + b, look = p.look ? -1 : 0;
  const neck = hy + G.head, t0 = neck + 1, t1 = t0 + G.torso - 1, s0 = t1 + 1;
  const long = v.kind !== 'tunic' && v.kind !== 'child';
  const skirtEnd = long ? 45 : (G.child ? 41 : s0 + 8);
  const ff = p.ff, bf = p.bf;
  // legs / feet: front foot to the left
  if (!long) { g.line(14, skirtEnd + 1, 14 + ff * 0.6, 45, 'L', 2); g.line(17, skirtEnd + 1, 17 + bf * 0.6, 45, 'L', 2); }
  g.rect(Math.round(12 + ff * 0.7), 46, Math.round(14 + ff * 0.7), 47, 'K');
  g.rect(Math.round(16 + bf * 0.7), 46, Math.round(18 + bf * 0.7), 47, 'K');
  // skirt
  const n = skirtEnd - s0;
  for (let y = s0; y <= skirtEnd; y++) {
    const t = (y - s0) / Math.max(1, n);
    const fl = Math.round(Math.abs(p.ff) * 0.35 * t);
    const x0 = Math.round(12 - t * 2.2) - fl, x1 = Math.round(19 + t * 1.6) + Math.round(fl * 0.5);
    g.h(y + b, x0, x1, 'R');
    if (t > 0.3) g.set(Math.round((x0 + x1) / 2 + p.sw * 0.4), y + b, 'r');
    if (y === skirtEnd && v.trim) g.h(y + b, x0, x1, 'T');
  }
  for (let y = t0; y <= t1; y++) g.h(y, 12, 19, 'R');
  g.h(t1 - 1, 12, 19, 'B'); g.h(t1, 12, 19, 'B');
  if (v.trim) g.set(12, t0 + 1, 'T');
  if (v.mantle) { g.h(t0, 11, 20, 'O'); g.h(t0 + 1, 12, 20, 'O'); g.h(t0 + 2, 13, 19, 'O'); }
  // head (face to the left)
  const H0 = hy + look;
  for (let y = 0; y < G.head; y++) { const inset = y === 0 || y === G.head - 1 ? 1 : 0; g.h(H0 + y, 12 + inset, 18 - inset, 'S'); }
  const ey = H0 + (G.child ? 3 : 4) + look;
  g.set(11, ey + 1 + (p.look ? -1 : 0), 'S');           // nose
  g.set(13, ey, 'E');
  g.set(12, ey + 3, 'm');
  if (p.look) g.set(12, ey + 4, 'S');
  g.set(15, neck, 'S'); g.set(16, neck, 'S');
  const st = v.style;
  if (st !== 'bald' && st !== 'veil') { g.h(H0, 13, 18, 'H'); g.h(H0 + 1, 13, 19, 'H'); for (let y = H0 + 2; y <= H0 + 5; y++) g.h(y, 16, 18 + (y < H0 + 4 ? 1 : 0), 'H'); g.set(14, H0 + 1, 'h'); }
  if (st === 'long') for (let y = H0 + 2; y <= neck + 6; y++) g.h(y, 16, 19, 'H');
  if (st === 'bun') g.rect(17, H0 - 1, 19, H0 + 1, 'H');
  if (st === 'curly') { g.h(H0 - 1, 13, 18, 'H'); for (let y = H0; y <= H0 + 5; y++) g.h(y, 16, 20, 'H'); }
  if (st === 'bald') { g.h(H0 + 3, 16, 18, 'H'); g.h(H0 + 4, 16, 18, 'H'); }
  if (st === 'veil') { g.h(H0 - 1, 12, 18, 'V'); g.h(H0, 12, 19, 'V'); for (let y = H0 + 1; y <= neck + 5; y++) g.h(y, 15, 20, 'V'); }
  if (v.beard) for (let y = ey + 2; y <= H0 + G.head; y++) g.h(y, 12, 16, 'H');
  if (v.circlet) g.h(H0 + 2, 12, 18, 'C');
  // the near arm: swinging, or raised to point ahead and up
  if (p.point) { g.line(15, t0 + 1, 9, t0 - 5, 'R', 2); g.rect(7, t0 - 8, 8, t0 - 6, 'S'); }
  else { const sw = p.sw; g.line(15, t0 + 1, 15 + sw, t1 + 1, 'R', 2); g.rect(15 + sw - 1, t1 + 2, 15 + sw, t1 + 3, 'S'); }
  const acc = v.acc;
  if (acc === 'basket') { g.rect(14 + p.sw, t1 + 1, 18 + p.sw, t1 + 4, 'A'); g.h(t1, 15 + p.sw, 17 + p.sw, 'a'); }
  if (acc === 'jug') { g.rect(15, H0 - 3, 18, H0 + 1, 'A'); g.h(H0 - 4, 16, 17, 'A'); }
  if (acc === 'book') g.rect(10, t0 + 3, 12, t0 + 6, 'a');
  if (acc === 'staff') for (let y = H0 - 3; y <= 47; y++) g.set(9, y, 'A');
  if (acc === 'lute') { g.rect(17, t1 - 3, 21, t1 + 3, 'A'); g.set(19, t1, 'T'); g.line(17, t1 - 2, 10, H0 - 5, 'A'); g.set(10, H0 - 6, 'T'); }
  if (acc === 'broom') { for (let y = H0 + 2; y <= 42; y++) g.set(9 + (y > 30 ? 1 : 0), y, 'A'); g.rect(8, 42, 13, 47, 'a'); g.h(47, 7, 14, 'a'); }
  if (acc === 'bag') { g.rect(18, t1 + 1, 21, t1 + 4, 'A'); for (let k = 0; k < 6; k++) g.set(18 - k * 0.5, t0 + k, 'A'); }
}

/** Scale2x (EPX) over material IDs. */
function scale2x(g) {
  const o = new Grid(g.W * 2, g.H * 2);
  for (let y = 0; y < g.H; y++) for (let x = 0; x < g.W; x++) {
    const P = g.get(x, y), A = g.get(x, y - 1), B = g.get(x + 1, y), C = g.get(x - 1, y), D = g.get(x, y + 1);
    o.set(2 * x, 2 * y, C === A && C !== D && A !== B ? A : P);
    o.set(2 * x + 1, 2 * y, A === B && A !== C && B !== D ? B : P);
    o.set(2 * x, 2 * y + 1, D === C && D !== B && C !== A ? C : P);
    o.set(2 * x + 1, 2 * y + 1, B === D && B !== A && D !== C ? D : P);
  }
  return o;
}

function materials(v) {
  const robe = R_[v.robe];
  const fold = robe.map((c) => { const k = hex(c); return '#' + k.map((q) => Math.round(q * 0.72).toString(16).padStart(2, '0')).join(''); });
  return {
    R: { ramp: robe, base: 0.58 }, r: { ramp: fold, base: 0.5 },
    T: { ramp: R_[v.trim || 'gold'], base: 0.62, flat: true }, B: { ramp: R_[v.sash] || R_.leather, base: 0.5 },
    O: { ramp: R_[v.mantle || 'ivory'], base: 0.6 }, L: { ramp: R_[v.legs || 'sand'], base: 0.45 },
    K: { ramp: R_.shoe, base: 0.4 }, S: { ramp: SKIN[v.skin], base: 0.62 }, s: { ramp: SKIN[v.skin].slice(0, 3), base: 0.6 },
    H: { ramp: HAIR[v.hair], base: 0.5 }, h: { ramp: HAIR[v.hair].slice(1), base: 0.8 },
    E: { ramp: ['#120d0d'], base: 0 }, m: { ramp: [SKIN[v.skin][0]], base: 0 },
    V: { ramp: R_[v.veil || 'ivory'], base: 0.6 }, v: { ramp: R_[v.veil || 'ivory'].slice(0, 3), base: 0.5 },
    A: { ramp: v.acc === 'jug' ? ['#3a2016', '#5a3422', '#7a4c32', '#946446'] : v.acc === 'bag' ? R_.leather : R_.wood, base: 0.55 },
    a: { ramp: v.acc === 'book' ? ['#1a1430', '#2a2350', '#3b3563'] : ['#4a5a2a', '#9a7a2e', '#d49a4a', '#e6c47e'], base: 0.6 },
    C: { ramp: R_.gold, base: 0.75, flat: true }, W: { ramp: ['#fff4d6'], base: 0 },
  };
}

function shade(G, M, pc, ox, oy) {
  for (let y = 0; y < G.H; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < G.W; x++) if (G.get(x, y)) { if (x0 < 0) x0 = x; x1 = x; }
    for (let x = 0; x < G.W; x++) {
      const id = G.get(x, y); if (!id) continue;
      const m = M[id];
      let t = m.base;
      const xr = x1 > x0 ? (x - x0) / (x1 - x0) : 0.5;
      t += (0.5 - xr) * 0.34;
      const up = G.get(x, y - 1), dn = G.get(x, y + 1), lf = G.get(x - 1, y), rt = G.get(x + 1, y);
      if (!m.flat) {
        if (up !== id || lf !== id) t += 0.12;
        if (dn !== id || rt !== id) t -= 0.1;
      } else if (up !== id) t += 0.2;
      const r = m.ramp, n = r.length - 1, f = Math.max(0, Math.min(1, t)) * n, i = Math.floor(f), fr = f - i;
      pc.set(ox + x, oy + y, r[Math.min(n, fr > 0.5 + (bayer(x, y) - 0.5) * 0.4 ? i + 1 : i)]);
    }
  }
  // selective outline (the darkest tone of the neighbouring material, deepened)
  for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) {
    if (G.get(x, y)) continue;
    const id = G.get(x, y + 1) || G.get(x, y - 1) || G.get(x - 1, y) || G.get(x + 1, y);
    if (!id) continue;
    const c = hex(M[id].ramp[0]);
    pc.set(ox + x, oy + y, [c[0] * 0.5 + 4, c[1] * 0.5 + 4, c[2] * 0.5 + 8]);
  }
}

/** Paint every variant. Returns { map: PixelCanvas, w, h, cols, rowsPerVariant, pairs }. */
export function paintCitizenSheet() {
  const pairs = Math.ceil(VARIANTS.length / 2);
  const W = CIT_FW * CIT_COLS * 2, H = CIT_FH * 4 * pairs;
  const pc = new PixelCanvas(W, H);
  VARIANTS.forEach((v, vi) => {
    const M = materials(v);
    const bx = (vi % 2) * CIT_COLS * CIT_FW, by = Math.floor(vi / 2) * 4 * CIT_FH;
    CIT_DIRS.forEach((dir, row) => {
      for (let col = 0; col < CIT_COLS; col++) {
        const g = new Grid();
        const p = POSE[col];
        if (dir === 'down') paintFront(g, v, p, false);
        else if (dir === 'up') paintFront(g, v, p, true);
        else paintSide(g, v, p);
        let fg = g;
        if (dir === 'right') { fg = new Grid(); for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) fg.set(BW - 1 - x, y, g.get(x, y)); }
        shade(scale2x(fg), M, pc, bx + col * CIT_FW, by + row * CIT_FH);
      }
    });
  });
  return { map: pc, w: W, h: H };
}

/** UV offset (bottom-left of the cell, flipY convention) for a variant / direction / column. */
export function cellUV(sheetW, sheetH, variant, dir, col) {
  const row = Math.floor(variant / 2) * 4 + CIT_DIRS.indexOf(dir);
  const x = ((variant % 2) * CIT_COLS + col) * CIT_FW;
  return [x / sheetW, 1 - ((row + 1) * CIT_FH) / sheetH];
}
