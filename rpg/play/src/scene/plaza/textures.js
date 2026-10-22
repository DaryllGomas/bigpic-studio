// The City plaza's own painters: polished pale marble with gold inlay, white-gold walls with arched windows, the old
// weathered stone of the first circle, striped market canvas, rippled water, and the garden sprites (cypress, palm,
// flowering bush, hanging vines). Same toolkit and rules as the engine's painters: our palette, ordered dither, no text.
import * as THREE from 'three';
import { PixelCanvas, rng, hash2, fbm, bayer, rampDither, hex, normalFromHeight, ormCanvas } from '../../engine/pixel/paint.js';
import { GOLD } from '../../engine/pixel/textures.js';

export const MARBLE = ['#685c4a', '#857661', '#a08f77', '#b9a78c', '#cebda0', '#ddceb2', '#e9dec6'];
export const WHITE = ['#6a6355', '#877f70', '#a39a89', '#bdb4a1', '#d3cab7', '#e6dfd0'];
const OLD = ['#2e322d', '#3c413b', '#4b5149', '#5b6258', '#6c7368', '#7f8579', '#93988b'];
const MOSS = ['#2a3a26', '#36492e', '#435a36', '#566d42'];
const WOOD = ['#1e140d', '#2f2016', '#45301f', '#5c432c', '#735638'];

const T = (pc, o) => pc.texture(o);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Plaza floor: big pale marble slabs (soft veins), a gold inlay grid every 8 units with a four-point star at each crossing. 8 x 8 units. */
export function paintMarbleFloor(seed = 31) {
  const W = 128, H = 128;
  const alb = new PixelCanvas(W, H), emi = new PixelCanvas(W, H);
  const hgt = new Float32Array(W * H), rough = new Float32Array(W * H), metal = new Float32Array(W * H);
  const star = (x, y) => {
    const dx = Math.min(x, W - x), dy = Math.min(y, H - y);
    return dx * 0.33 + dy <= 3.4 || dy * 0.33 + dx <= 3.4;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (x === 0 || y === 0 || star(x, y)) {
      const s = star(x, y) && (x !== 0 && y !== 0 || Math.min(x, W - x) + Math.min(y, H - y) < 3);
      const c = s ? (Math.min(x, W - x) + Math.min(y, H - y) < 2 ? GOLD[5] : GOLD[4]) : GOLD[3];
      alb.set(x, y, c); emi.set(x, y, s ? [255, 225, 160] : [150, 118, 64]);
      hgt[i] = 0.7; rough[i] = 0.3; metal[i] = 1; continue;
    }
    // slab joints (4 slabs of 4 x 4 units per tile), staggered half a slab on alternate rows of tiles
    const lx = x % 64, ly = y % 64;
    if (lx === 0 || ly === 0) { alb.set(x, y, '#3a352d'); hgt[i] = 0.25; rough[i] = 0.5; emi.set(x, y, [0, 0, 0]); continue; }
    const sid = (x >> 6) + (y >> 6) * 2;
    const tone = (hash2(sid, 3, seed) - 0.5) * 0.18;
    // veins: warped fbm ridges
    const w = fbm(x, y, W, H, 3, 3, seed + 4) * 7;
    const v = Math.abs(Math.sin((x * 0.09 + y * 0.05) + w + sid));
    const vein = Math.pow(1 - v, 18) * 0.8 + Math.pow(1 - Math.abs(fbm(x, y, W, H, 6, 3, seed + 9) - 0.5) * 2, 22) * 0.4;
    const n = fbm(x, y, W, H, 8, 3, seed) - 0.5;
    let t = 0.62 + tone + n * 0.22 - vein * 0.45;
    if (lx === 1 || ly === 1) t += 0.08;
    if (lx === 63 || ly === 63) t -= 0.12;
    alb.set(x, y, rampDither(MARBLE, t, x, y, 0.6));
    emi.set(x, y, [0, 0, 0]);
    hgt[i] = 1; rough[i] = 0.26 + Math.max(0, n) * 0.3 + vein * 0.1; metal[i] = 0;
  }
  const orm = ormCanvas(W, H, (x, y) => [clamp01(rough[y * W + x]), metal[y * W + x]]);
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.6), { kind: 'data' }), ormMap: T(orm, { kind: 'data' }), emissiveMap: T(emi), tpu: 16, size: [W, H] };
}

/** White-gold wall with tall arched windows in gold frames, a balcony rail under every other one; lit ones glow amber. 8 x 4 units. */
export function paintWhiteWindowWall(seed = 41, { litChance = 0.6, cyanChance = 0.05 } = {}) {
  const W = 128, H = 64, R = rng(seed);
  const alb = new PixelCanvas(W, H), emi = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  emi.fill('#000000');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = y >> 4, off = (row & 1) * 16, lx = (x + off) % 32, ly = y & 15, i = y * W + x;
    if (lx === 0 || ly === 0) { alb.set(x, y, '#9a917f'); hgt[i] = 0.5; continue; }
    const n = fbm(x, y, W, H, 8, 3, seed) - 0.5;
    let t = 0.66 + (hash2((x + off) >> 5, row, seed) - 0.5) * 0.14 + n * 0.2;
    if (ly === 1) t += 0.1;
    if (ly === 15 || lx === 31) t -= 0.06;
    alb.set(x, y, rampDither(WHITE, t, x, y, 0.6));
    hgt[i] = 1;
  }
  for (let wx = 0; wx < 4; wx++) {
    const cx = wx * 32 + 16, top = 14, bot = 52, half = 6;
    const lit = R() < litChance, cyan = lit && R() < cyanChance;
    const glow = cyan ? [63, 211, 200] : [255, 184, 100], warmth = 0.6 + R() * 0.4;
    for (let y = top - 3; y <= bot + 3; y++) for (let x = cx - half - 3; x <= cx + half + 2; x++) {
      const dy = y - (top + half);
      const inArch = y >= top + half || (x + 0.5 - cx) ** 2 + (dy + 0.5) ** 2 <= (half + 0.5) ** 2;
      const inFrame = y >= top + half - 1 || (x + 0.5 - cx) ** 2 + (dy + 0.5) ** 2 <= (half + 2.4) ** 2;
      const ii = y * W + x;
      if (y > bot && y <= bot + 3) { if (Math.abs(x + 0.5 - cx) <= half + 2) { alb.set(x, y, y === bot + 1 ? GOLD[4] : GOLD[2]); hgt[ii] = 1; } continue; }
      if (!inFrame) continue;
      if (!inArch || y > bot - 0) { alb.set(x, y, y < top + half ? GOLD[4] : GOLD[3]); emi.set(x, y, [40, 30, 14]); hgt[ii] = 0.95; continue; }
      const mull = x === cx || y === top + 16 || y === top + 28;
      hgt[ii] = 0.15;
      if (mull) { alb.set(x, y, '#4a3517'); continue; }
      if (lit) {
        const g = (0.55 + 0.45 * ((y - top) / (bot - top))) * warmth;
        alb.set(x, y, cyan ? '#2a6670' : '#8a6234');
        emi.set(x, y, [glow[0] * g, glow[1] * g, glow[2] * g]);
      } else alb.set(x, y, (x + y) % 6 === 0 ? '#3a5578' : (y < top + 10 ? '#1d2c48' : '#141d33'));
    }
    // a gold four-point star over each arch
    for (const [dx, dy, k] of [[0, -6, 5], [0, -5, 4], [0, -7, 4], [-1, -6, 4], [1, -6, 4]]) alb.set(cx + dx, top + dy, GOLD[k]);
  }
  for (let x = 0; x < W; x++) { alb.set(x, 0, '#4a4234'); alb.set(x, 1, GOLD[3]); alb.set(x, 2, WHITE[5]); alb.set(x, 3, WHITE[3]); hgt[x] = 0.3; hgt[W + x] = 1; }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.5), { kind: 'data' }), emissiveMap: T(emi), tpu: 16, size: [W, H] };
}

/** Pale ashlar for plinths, steps and parapets. 4 x 4 units. */
export function paintWhiteAshlar(seed = 43, { blockW = 32, blockH = 16 } = {}) {
  const W = 64, H = 64, alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / blockH), off = (row % 2) * (blockW / 2);
    const lx = (x + off) % blockW, ly = y % blockH, i = y * W + x;
    if (lx === 0 || ly === 0) { alb.set(x, y, '#958c7b'); hgt[i] = 0.45; continue; }
    const n = fbm(x, y, W, H, 6, 3, seed) - 0.5;
    let t = 0.64 + (hash2(Math.floor((x + off) / blockW), row, seed) - 0.5) * 0.14 + n * 0.2;
    if (ly === 1) t += 0.08;
    if (ly === blockH - 1 || lx === blockW - 1) t -= 0.07;
    alb.set(x, y, rampDither(WHITE, t, x, y, 0.6));
    hgt[i] = ly === blockH - 1 ? 0.75 : 1;
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.5), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** The first people's stone: grey-green, rough, lichen and moss in the hollows, faint old tool marks. 4 x 4 units. */
export function paintOldStone(seed = 51) {
  const W = 64, H = 64, alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x, y, W, H, 4, 4, seed), m = fbm(x, y, W, H, 12, 2, seed + 3) - 0.5;
    const pit = Math.abs(fbm(x, y, W, H, 6, 2, seed + 7) - 0.5) < 0.03;
    let t = 0.35 + (n - 0.5) * 0.9 + m * 0.35 + (y / H) * 0.1;
    const i = y * W + x;
    hgt[i] = n + m * 0.4;
    if (pit) { alb.set(x, y, OLD[0]); hgt[i] -= 0.3; continue; }
    const lichen = fbm(x, y, W, H, 5, 3, seed + 11);
    if (lichen > 0.66 && n < 0.55) { alb.set(x, y, rampDither(MOSS, (lichen - 0.66) * 3 + m, x, y)); continue; }
    if (hash2(x, y, seed) < 0.012) { alb.set(x, y, '#8f9078'); continue; }      // pale lichen dots
    alb.set(x, y, rampDither(OLD, t, x, y, 0.85));
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 3.0), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** Worn old flagstones inside the circle, grass in the joints. 4 x 4 units. */
export function paintOldFlags(seed = 53) {
  const W = 64, H = 64, R = rng(seed), alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  const pts = []; for (let k = 0; k < 14; k++) pts.push([R() * W, R() * H, (R() - 0.5) * 0.3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let d1 = 1e9, d2 = 1e9, best = 0;
    for (const [px, py, tone] of pts) for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
      if (d < d1) { d2 = d1; d1 = d; best = tone; } else if (d < d2) d2 = d;
    }
    const i = y * W + x, joint = d2 - d1 < 1.6;
    const n = fbm(x, y, W, H, 8, 3, seed) - 0.5;
    if (joint) { alb.set(x, y, hash2(x, y, seed) < 0.55 ? MOSS[1 + ((x + y) & 1)] : '#1c1e1a'); hgt[i] = 0.2; continue; }
    alb.set(x, y, rampDither(OLD, 0.55 + best + n * 0.4 + (d2 - d1 < 3 ? -0.1 : 0.05), x, y, 0.8));
    hgt[i] = 0.8 + n * 0.3;
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 2.0), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** Market canvas: wide stripes in two colours, a woven texture. 2 x 2 units. */
export function paintAwning(a = '#e6dcc4', b = '#1d2b4f', seed = 61) {
  const W = 32, H = 32, alb = new PixelCanvas(W, H), A = hex(a), B = hex(b);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const stripe = (x >> 3) & 1, c = stripe ? B : A;
    const weave = ((x + y) & 1) ? 0.94 : 1.0, fold = 0.9 + 0.1 * Math.sin((x & 7) / 7 * Math.PI);
    const k = weave * fold * (1 + (hash2(x, y, seed) - 0.5) * 0.06);
    alb.set(x, y, [c[0] * k, c[1] * k, c[2] * k]);
  }
  return { map: T(alb), tpu: 16, size: [W, H] };
}

/** Stall timber. 2 x 2 units. */
export function paintWood(seed = 63) {
  const W = 32, H = 32, alb = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const plank = y >> 3, ly = y & 7;
    const grain = fbm(x * 0.25, y * 3, W, H, 4, 2, seed + plank) - 0.5;
    let t = 0.5 + (hash2(plank, 1, seed) - 0.5) * 0.3 + grain * 0.5;
    if (ly === 0) t = 0.05; if (ly === 1) t += 0.15;
    alb.set(x, y, rampDither(WOOD, t, x, y, 0.6));
  }
  return { map: T(alb), tpu: 16, size: [W, H] };
}

/** Water ripples as a tileable normal map (pixel-stepped), scrolled in two directions by the water material. */
export function paintRipples(seed = 71) {
  const W = 64, H = 64, hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = fbm(x, y, W, H, 4, 3, seed), b = fbm(x, y, W, H, 8, 2, seed + 5);
    hgt[y * W + x] = Math.round((Math.sin(a * 14 + b * 4) * 0.5 + 0.5) * 5) / 5;
  }
  return { normalMap: T(normalFromHeight(hgt, W, H, 0.9), { kind: 'data' }), tpu: 8, size: [W, H] };
}

// ---------------- garden and street sprites (pixel billboards) ----------------

const LEAF = ['#0b1714', '#10221b', '#173024', '#1f3f2c', '#2a5136', '#386343', '#4b7852'];
const shadeLeaf = (pc, x, y, t, ramp = LEAF) => {
  const f = clamp01(t) * (ramp.length - 1), i = Math.floor(f);
  pc.set(x, y, ramp[Math.min(ramp.length - 1, f - i > bayer(x, y) ? i + 1 : i)]);
};

/** Italian cypress: a tall dark flame of foliage, lit from the upper left. 20 x 72. */
export function paintCypress(seed = 81) {
  const W = 20, H = 72, pc = new PixelCanvas(W, H);
  for (let y = 66; y < H; y++) for (let x = 9; x <= 10; x++) pc.set(x, y, x === 9 ? '#2f2016' : '#1e140d');
  for (let y = 0; y < 68; y++) {
    const t = y / 68, half = Math.max(0.6, Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * 8.4 * (1 - t * 0.18));
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - 10) / half;
      const jag = (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.35;
      if (Math.abs(dx) > 1 + jag) continue;
      const tuft = Math.sin(y * 0.9 + x * 0.6 + hash2(x >> 2, y >> 2, seed) * 6) * 0.12;
      shadeLeaf(pc, x, y, 0.56 - dx * 0.32 - t * 0.08 + tuft + (hash2(x, y, seed + 1) - 0.5) * 0.2);
    }
  }
  pc.outline('#050a08');
  return { map: pc };
}

/** A date palm in a gold planter-ready silhouette: arching fronds, a ringed trunk. 56 x 72. */
export function paintPalm(seed = 83) {
  const W = 56, H = 72, R = rng(seed), pc = new PixelCanvas(W, H);
  // trunk: gently curved, ringed
  for (let y = 22; y < H; y++) {
    const cx = 28 + Math.sin((y - 22) / 50 * 1.4) * 3;
    for (let x = Math.round(cx - 2); x <= Math.round(cx + 1); x++) pc.set(x, y, (y % 3 === 0) ? '#2a1d14' : x < cx - 0.5 ? '#6b5236' : x < cx + 0.5 ? '#54402a' : '#3a2b1d');
  }
  // fronds: arcs out from the crown
  const crown = [28, 20];
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI / 2 + (k / 10 - 0.5) * Math.PI * 1.7 + (R() - 0.5) * 0.2, len = 15 + R() * 9;
    for (let s = 0; s <= 1; s += 0.02) {
      const droop = s * s * 9 * (0.6 + Math.abs(Math.cos(a)) * 0.6);
      const x = crown[0] + Math.cos(a) * len * s, y = crown[1] + Math.sin(a) * len * s * 0.75 + droop;
      const w = (1 - s) * 2.2 + 0.6;
      for (let o = -w; o <= w; o += 1) {
        const px = Math.round(x + Math.sin(a) * o * 0.5), py = Math.round(y + o * 0.6);
        shadeLeaf(pc, px, py, 0.62 - s * 0.25 - o * 0.06 + (Math.sin(a) < 0 ? 0.08 : -0.06));
      }
    }
  }
  pc.outline('#050a08');
  return { map: pc };
}

/** A flowering shrub: clipped dark-green mound, white (or gold, or soft lavender) blossoms. 32 x 20. */
export function paintFlowerBush(seed = 85, flowers = ['#f4efe2', '#dcd3bd']) {
  const W = 32, H = 20, R = rng(seed), pc = new PixelCanvas(W, H);
  const blobs = []; for (let k = 0; k < 7; k++) blobs.push([5 + R() * 22, 9 + R() * 6, 4.5 + R() * 4]);
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) {
    let best = -1, nx = 0, ny = 0;
    for (const [cx, cy, r] of blobs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d < 1 && Math.sqrt(1 - d) * r > best) { best = Math.sqrt(1 - d) * r; nx = dx; ny = dy; } }
    if (best < 0) continue;
    shadeLeaf(pc, x, y, 0.55 - ny * 0.35 - nx * 0.15 + (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.3);
  }
  const fc = flowers.map(hex);
  for (let k = 0; k < 26; k++) {
    const x = 2 + Math.floor(R() * 28), y = 2 + Math.floor(R() * 13);
    if (!pc.alpha(x, y)) continue;
    pc.set(x, y, fc[0]); if (R() < 0.6 && pc.alpha(x + 1, y)) pc.set(x + 1, y, fc[1]); if (R() < 0.4 && pc.alpha(x, y + 1)) pc.set(x, y + 1, fc[1]);
  }
  pc.outline('#050a08');
  return { map: pc };
}

/** Hanging greenery for balconies and arches: trailing strands with small white flowers. 32 x 48. */
export function paintVines(seed = 87) {
  const W = 32, H = 48, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let k = 0; k < 9; k++) {
    let x = 2 + R() * 28, y = 0;
    const len = 18 + R() * 28;
    while (y < len) {
      const w = y < 6 ? 2 : 1;
      for (let o = 0; o < w; o++) shadeLeaf(pc, Math.round(x + o), Math.round(y), 0.5 - y / len * 0.3 + (hash2(x | 0, y | 0, seed) - 0.5) * 0.4);
      if (R() < 0.35) shadeLeaf(pc, Math.round(x + (R() < 0.5 ? -1 : 1)), Math.round(y), 0.62);
      if (R() < 0.08) pc.set(Math.round(x), Math.round(y), R() < 0.7 ? '#f4efe2' : '#e6c47e');
      x += (R() - 0.5) * 0.9; y += 1;
    }
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < 4; y++) if (R() < 0.85) shadeLeaf(pc, x, y, 0.45 + (R() - 0.5) * 0.3);
  pc.outline('#050a08');
  return { map: pc };
}

/** Bake a painter result's PixelCanvases into textures (sprites: no repeat, no mips, nearest). */
export function bakeSprite(r) {
  const o = {};
  for (const k of ['map', 'emissive']) if (r[k]) {
    const t = r[k].texture({ repeat: false, mips: false });
    t.magFilter = t.minFilter = THREE.NearestFilter;
    o[k === 'emissive' ? 'emissiveMap' : k] = t;
  }
  o.w = r.map.w; o.h = r.map.h;
  return o;
}

/** Recolour a canvas texture through a per-pixel function (used for the ivory banners from the navy one). */
export function recolorTexture(tex, fn) {
  const src = tex.image, c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const o = fn(d[i], d[i + 1], d[i + 2]); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = tex.colorSpace; t.magFilter = tex.magFilter; t.minFilter = tex.minFilter; t.generateMipmaps = tex.generateMipmaps; t.anisotropy = tex.anisotropy;
  t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
  return t;
}

/** A broad old tree (the Ashford ash): a wide, layered, silvery-green crown on a strong trunk. 96 x 88. */
export function paintBroadTree(seed = 89) {
  const W = 96, H = 88, R = rng(seed), pc = new PixelCanvas(W, H);
  const ASH = ['#0d1a16', '#14261e', '#1d3628', '#284632', '#36583c', '#486c48', '#5e8256', '#7a9a6a'];
  for (let y = 46; y < H; y++) { const w = y > 80 ? 5 : 3 + (y - 46) * 0.03; for (let x = Math.round(48 - w); x <= Math.round(47 + w); x++) pc.set(x, y, x < 46 ? '#4a3a2a' : x < 49 ? '#33281d' : '#221a13'); }
  for (const [x0, y0, x1, y1] of [[47, 60, 30, 44], [48, 58, 66, 42], [47, 52, 40, 36], [48, 50, 58, 34]]) for (let t = 0; t <= 1; t += 0.03) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; pc.set(Math.round(x), Math.round(y), '#33281d'); pc.set(Math.round(x) + 1, Math.round(y), '#221a13'); }
  const blobs = [];
  for (let k = 0; k < 22; k++) { const a = R() * Math.PI, r = R(); blobs.push([48 + Math.cos(a) * r * 38, 30 - Math.sin(a) * r * 22 + R() * 10, 8 + R() * 9]); }
  blobs.push([48, 26, 18]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = -1, nx = 0, ny = 0;
    for (const [cx, cy, r] of blobs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d < 1) { const hh = Math.sqrt(1 - d) * r - cy * 0.12; if (hh > best) { best = hh; nx = dx; ny = dy; } } }
    if (best < -50 || best === -1) continue;
    const leaf = hash2(x >> 1, y >> 1, seed);
    shadeLeaf(pc, x, y, 0.55 - nx * 0.22 - ny * 0.32 + (leaf - 0.5) * 0.3 - (y > 44 ? 0.15 : 0), ASH);
  }
  for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) if (pc.alpha(x, y) && !pc.alpha(x, y - 1) && y < 50 && hash2(x, y, 3) < 0.6) pc.set(x, y, '#9ab27e');
  pc.outline('#050a08');
  return { map: pc };
}
