// Procedural pixel textures for the world. Calm, intentional, our palette: slate and pale stone, engraved gold, navy, cyan Signal.
// Each painter returns { map, normalMap?, ormMap?, emissiveMap?, tpu } where tpu = texels per world unit.
import { PixelCanvas, rng, hash2, fbm, bayer, rampDither, hex, normalFromHeight, ormCanvas } from './paint.js';

export const GOLD = ['#4a3517', '#7a5c2c', '#9c7a3e', '#c19a55', '#d4b06a', '#f1dcaa'];
const SLATE = ['#1d2029', '#262a34', '#2f343f', '#383e4a', '#434956', '#4f5563'];
const PALE = ['#3f3a33', '#4f4940', '#61594d', '#73695a', '#867b69', '#988c77'];
const DARK = ['#1b1c23', '#24262e', '#2e3039', '#393b45', '#454852', '#53565f'];
const ROCK = ['#16181f', '#1e212a', '#272b36', '#313643', '#3c4251', '#4a5161'];
const GRASS = ['#10171a', '#152019', '#1b291f', '#223225', '#2b3d2b', '#374a32'];
const NAVY = ['#0a0f1d', '#101830', '#16213d', '#1d2b4f', '#263862', '#324876'];

const T = (pc, opts) => pc.texture(opts);

/** The causeway: slate flagstones, curb stones, gold-inlaid seams, a four-point star at every transverse seam. 7 x 8 units. */
export function paintRoad(seed = 11) {
  const W = 112, H = 128, R = rng(seed);
  const alb = new PixelCanvas(W, H), emi = new PixelCanvas(W, H);
  const hgt = new Float32Array(W * H), rough = new Float32Array(W * H), metal = new Float32Array(W * H);
  const id = new Int32Array(W * H).fill(-1);
  let nid = 0;
  const stoneTone = [];
  // field stones: rows along the road
  const rows = [16, 15, 17, 14, 16, 16, 15, 17];
  let y0 = 2;
  for (const rh of rows) {
    let x = 14 + Math.floor(R() * 10) - 10;
    while (x < 98) {
      const len = 18 + Math.floor(R() * 20);
      const xa = Math.max(14, x), xb = Math.min(98, x + len);
      if (xb - xa >= 4) {
        for (let yy = y0; yy < y0 + rh; yy++) for (let xx = xa; xx < xb; xx++) id[yy * W + xx] = nid;
        stoneTone.push((R() - 0.5) * 0.5);
        nid++;
      }
      x += len;
    }
    y0 += rh;
  }
  // curb stones (long), each side
  for (const [xa, xb] of [[0, 12], [100, 112]]) {
    for (let y = 0; y < H; y += 32) {
      for (let yy = y; yy < y + 32; yy++) for (let xx = xa; xx < xb; xx++) id[yy * W + xx] = nid;
      stoneTone.push(0.12 + (R() - 0.5) * 0.3);
      nid++;
    }
  }
  const isGold = (x, y) => (x >= 12 && x <= 13) || (x >= 98 && x <= 99) || (y <= 1 && x >= 12 && x <= 99);
  // four-point star inlay at the centre of the transverse seam
  const starC = [56, 1];
  const inStar = (x, y) => { const dx = Math.abs(x - starC[0]), dy = Math.abs(y - starC[1] < -64 ? y + H - starC[1] : y - starC[1]);
    const dyy = Math.min(Math.abs(y - starC[1]), Math.abs(y - starC[1] - H)); return dx * 0.38 + dyy * 1.0 <= 3.2 || dx * 1.0 + dyy * 0.38 <= 3.2; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const s = id[i];
    const wet = fbm(x, y, W, H, 3, 3, seed + 5);
    const puddle = Math.max(0, Math.min(1, (wet - 0.6) * 9));
    if (isGold(x, y) || inStar(x, y)) {
      const star = inStar(x, y);
      const top = (y <= 1 && y === 0) || x === 12 || x === 98;
      const c = star ? (Math.abs(x - starC[0]) + Math.min(y, H - y) < 2 ? GOLD[5] : GOLD[4]) : top ? GOLD[4] : GOLD[3];
      alb.set(x, y, c);
      hgt[i] = 0.62; rough[i] = 0.28; metal[i] = 1;
      emi.set(x, y, star ? [255, 230, 170] : [150, 118, 64]);
      continue;
    }
    // joint?
    const left = x > 0 ? id[i - 1] : s, up = id[((y - 1 + H) % H) * W + x], right = x < W - 1 ? id[i + 1] : s, down = id[((y + 1) % H) * W + x];
    const joint = s < 0 || s !== left || s !== up;
    if (joint) {
      alb.set(x, y, mixHex('#12141a', '#1a1d25', bayer(x, y)));
      hgt[i] = 0.15; rough[i] = 0.3; metal[i] = 0;
      emi.set(x, y, [0, 0, 0]);
      continue;
    }
    const edgeB = s !== right || s !== down;
    const n = fbm(x, y, W, H, 8, 3, seed + 2) - 0.5;
    const n2 = fbm(x, y, W, H, 24, 2, seed + 9) - 0.5;
    let t = 0.55 + stoneTone[s] + n * 0.35 + n2 * 0.18;
    if (edgeB) t -= 0.18;
    if (!edgeB && (s !== (x > 1 ? id[i - 2] : s) || s !== id[((y - 2 + H) % H) * W + x])) t += 0.12; // lit bevel
    t -= puddle * 0.22;
    alb.set(x, y, rampDither(SLATE, t, x, y, 0.8));
    hgt[i] = edgeB ? 0.8 : 1 - Math.max(0, -n2) * 0.25;
    rough[i] = 0.55 - puddle * 0.47 + n2 * 0.1;
    metal[i] = 0;
    emi.set(x, y, [0, 0, 0]);
  }
  // a few hairline cracks
  for (let k = 0; k < 6; k++) {
    let x = 16 + R() * 80, y = R() * H, a = R() * 6.28;
    for (let j = 0; j < 8 + R() * 10; j++) {
      const xi = x | 0, yi = ((y | 0) % H + H) % H;
      if (id[yi * W + xi] >= 0 && !isGold(xi, yi)) { alb.blend(xi, yi, '#14161c', 0.7); hgt[yi * W + xi] *= 0.7; }
      a += (R() - 0.5) * 1.2; x += Math.cos(a); y += Math.sin(a);
    }
  }
  const orm = ormCanvas(W, H, (x, y) => [Math.max(0.04, Math.min(1, rough[y * W + x])), metal[y * W + x]]);
  return {
    map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 2.2), { kind: 'data' }), ormMap: T(orm, { kind: 'data' }), emissiveMap: T(emi),
    tpu: 16, size: [W, H],
  };
}

function mixHex(a, b, t) { const A = hex(a), B = hex(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; }

/** Ashlar blocks: pale warm stone (the City), or dark carved stone (the gate). 4 x 4 units. */
export function paintAshlar(seed = 3, ramp = PALE, { blockW = 16, blockH = 8, W = 64, H = 64, joint = '#221f1c', speck = 0.04 } = {}) {
  const R = rng(seed);
  const alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  const tone = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / blockH), off = (row % 2) * (blockW / 2);
    const bx = Math.floor((x + off) / blockW) % (W / blockW), key = row * 100 + bx;
    if (tone[key] === undefined) tone[key] = (hash2(bx, row, seed) - 0.5) * 0.35;
    const lx = (x + off) % blockW, ly = y % blockH;
    const i = y * W + x;
    if (lx === 0 || ly === 0) { alb.set(x, y, joint); hgt[i] = 0.1; continue; }
    const n = fbm(x, y, W, H, 6, 3, seed) - 0.5;
    let t = 0.5 + tone[key] + n * 0.3;
    if (ly === 1) t += 0.16;            // top edge catches light
    if (ly === blockH - 1 || lx === blockW - 1) t -= 0.14;
    if (hash2(x, y, seed + 1) < speck) t -= 0.2;
    alb.set(x, y, rampDither(ramp, t, x, y, 0.7));
    hgt[i] = ly === blockH - 1 || lx === blockW - 1 ? 0.75 : 1 - Math.max(0, -n) * 0.4;
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.6), { kind: 'data' }), tpu: 16, size: [W, H] };
}

export const paintPaleStone = (seed = 3) => paintAshlar(seed, PALE);
export const paintDarkStone = (seed = 5) => paintAshlar(seed, DARK, { blockW: 24, blockH: 12, joint: '#101116', speck: 0.02 });

/** City wall with arched windows; lit windows go to the emissive map (amber, a rare cyan). 8 x 4 units per floor. */
export function paintWindowWall(seed = 21, { litChance = 0.6, cyanChance = 0.08 } = {}) {
  const W = 128, H = 64;
  const base = paintAshlarCanvas(seed, PALE, W, H);
  const alb = base.alb, hgt = base.hgt, emi = new PixelCanvas(W, H);
  emi.fill('#000000');
  const R = rng(seed + 7);
  for (let wx = 0; wx < 4; wx++) {
    const cx = wx * 32 + 16, top = 20, bot = 50, half = 5;
    const lit = R() < litChance, cyan = lit && R() < cyanChance;
    const glow = cyan ? [63, 211, 200] : [255, 176, 92];
    const warmth = 0.55 + R() * 0.45;
    // frame + glass
    for (let y = top - 2; y <= bot + 2; y++) for (let x = cx - half - 2; x <= cx + half + 1; x++) {
      const dy = y - (top + half);
      const inArch = y >= top + half || (x + 0.5 - cx) ** 2 + (dy + 0.5) ** 2 <= (half + 0.5) ** 2;
      const inFrame = y >= top + half - 1 || (x + 0.5 - cx) ** 2 + (dy + 0.5) ** 2 <= (half + 2.0) ** 2;
      if (y > bot + 1 && y <= bot + 2) { alb.set(x, y, '#9c7a3e'); hgt[y * W + x] = 1; continue; } // sill
      if (!inFrame || y > bot + 1) continue;
      if (!inArch || y > bot) { alb.set(x, y, y < top + half ? '#c19a55' : '#7a5c2c'); hgt[y * W + x] = 0.9; continue; }
      const mull = x === cx || (y === top + 14);
      const ii = y * W + x;
      hgt[ii] = 0.2;
      if (mull) { alb.set(x, y, '#3a2c18'); emi.set(x, y, [0, 0, 0]); continue; }
      if (lit) {
        const g = (0.55 + 0.45 * ((y - top) / (bot - top))) * warmth;
        alb.set(x, y, cyan ? '#1e4f55' : '#6a4a26');
        emi.set(x, y, [glow[0] * g, glow[1] * g, glow[2] * g]);
      } else {
        alb.set(x, y, (x + y) % 7 === 0 ? '#2a3550' : '#0d111c');
      }
    }
    // a small brass ornament over each arch
    alb.set(cx, top - 4, '#d4b06a'); alb.set(cx - 1, top - 3, '#9c7a3e'); alb.set(cx + 1, top - 3, '#9c7a3e');
  }
  // a string course (cornice) at the floor line
  for (let x = 0; x < W; x++) { alb.set(x, 0, '#2a2620'); alb.set(x, 1, '#988c77'); alb.set(x, 2, '#73695a'); alb.set(x, 3, '#4f4940'); hgt[x] = 0.3; hgt[W + x] = 1; hgt[2 * W + x] = 1; }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.6), { kind: 'data' }), emissiveMap: T(emi), tpu: 16, size: [W, H] };
}

function paintAshlarCanvas(seed, ramp, W, H) {
  const alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H), blockW = 16, blockH = 8;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / blockH), off = (row % 2) * 8;
    const bx = Math.floor((x + off) / blockW);
    const lx = (x + off) % blockW, ly = y % blockH, i = y * W + x;
    if (lx === 0 || ly === 0) { alb.set(x, y, '#221f1c'); hgt[i] = 0.1; continue; }
    const n = fbm(x, y, W, H, 8, 3, seed) - 0.5;
    let t = 0.5 + (hash2(bx, row, seed) - 0.5) * 0.3 + n * 0.3;
    if (ly === 1) t += 0.15;
    if (ly === blockH - 1 || lx === blockW - 1) t -= 0.13;
    alb.set(x, y, rampDither(ramp, t, x, y, 0.7));
    hgt[i] = ly === blockH - 1 ? 0.75 : 1;
  }
  return { alb, hgt };
}

/** Navy slate roof scales. 2 x 2 units. */
export function paintRoof(seed = 4) {
  const W = 32, H = 32, alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / 6), off = (row % 2) * 4, lx = (x + off) % 8, ly = y % 6;
    const d = Math.hypot(lx - 3.5, ly - 0.5) / 4.6;
    let t = 0.65 - ly * 0.08 + (hash2(Math.floor((x + off) / 8), row, seed) - 0.5) * 0.3;
    if (lx === 0 || d > 1.05) t = 0.05;
    if (ly === 5) t -= 0.2;
    alb.set(x, y, rampDither(NAVY, t, x, y, 0.6));
    hgt[y * W + x] = 1 - ly / 6;
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.4), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** Cliff rock: calm horizontal strata. 4 x 4 units. */
export function paintCliff(seed = 8) {
  const W = 64, H = 64, alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const warp = fbm(x, y, W, H, 4, 3, seed) * 10;
    const strata = Math.sin((y + warp) * 0.55) * 0.5 + 0.5;
    const n = fbm(x, y, W, H, 12, 2, seed + 3) - 0.5;
    let t = 0.35 + strata * 0.3 + n * 0.3;
    const crack = Math.abs(fbm(x, y, W, H, 6, 2, seed + 9) - 0.5) < 0.018;
    if (crack) t = 0.05;
    alb.set(x, y, rampDither(ROCK, t, x, y, 0.8));
    hgt[y * W + x] = crack ? 0.2 : 0.5 + strata * 0.5;
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 2.5), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** Night grass: dark teal-green, small tufts, rare blue-white and gold flowers. 4 x 4 units. */
export function paintGrass(seed = 9) {
  const W = 64, H = 64, R = rng(seed), alb = new PixelCanvas(W, H), hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x, y, W, H, 4, 3, seed) - 0.5, m = fbm(x, y, W, H, 16, 2, seed + 4) - 0.5;
    alb.set(x, y, rampDither(GRASS, 0.42 + n * 0.5 + m * 0.3, x, y, 0.9));
    hgt[y * W + x] = 0.5 + m;
  }
  for (let k = 0; k < 170; k++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), h = 2 + Math.floor(R() * 2);
    for (let j = 0; j < h; j++) { alb.setw(x, y - j, GRASS[4 + (j === h - 1 ? 1 : 0)]); hgt[(((y - j) % H + H) % H) * W + x] = 1; }
    alb.setw(x + 1, y, GRASS[1]);
  }
  for (let k = 0; k < 7; k++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), gold = R() < 0.4;
    const c = gold ? '#e6c47e' : '#bfe8ff';
    alb.setw(x, y, c); alb.setw(x - 1, y, gold ? '#9c7a3e' : '#5e88a8'); alb.setw(x + 1, y, gold ? '#9c7a3e' : '#5e88a8'); alb.setw(x, y + 1, GRASS[2]);
  }
  return { map: T(alb), normalMap: T(normalFromHeight(hgt, W, H, 1.2), { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** Small metal swatches: dark iron and aged brass. */
export function paintMetal(kind = 'iron', seed = 2) {
  const W = 16, H = 16, alb = new PixelCanvas(W, H);
  const ramp = kind === 'brass' ? GOLD.slice(0, 5) : ['#0e0f13', '#16181e', '#1f222a', '#2a2e38', '#383d4a'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) alb.set(x, y, rampDither(ramp, 0.5 + (fbm(x, y, W, H, 4, 2, seed) - 0.5) * 0.7 + (x === 0 ? 0.2 : 0), x, y));
  const orm = ormCanvas(W, H, () => [kind === 'brass' ? 0.38 : 0.55, kind === 'brass' ? 1 : 0.6]);
  return { map: T(alb), ormMap: T(orm, { kind: 'data' }), tpu: 16, size: [W, H] };
}

/** A navy banner with a gold border and the Veyr mark (swept arrowhead, axis, four-point star, thin circle). */
export function paintBanner(seed = 1) {
  const W = 32, H = 80, alb = new PixelCanvas(W, H), emi = new PixelCanvas(W, H);
  emi.fill('#000000', 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // swallowtail bottom
    const tail = y > 66 && Math.abs(x - 15.5) < (y - 66) * 1.15;
    if (tail) { alb.set(x, y, [0, 0, 0], 0); continue; }
    const fold = Math.sin(x * 0.55 + 0.8) * 0.5 + 0.5;
    let t = 0.35 + fold * 0.38 - (y / H) * 0.1;
    alb.set(x, y, rampDither(NAVY, t, x, y, 0.8));
    const border = x <= 1 || x >= W - 2 || y <= 2;
    const tailEdge = y > 64 && Math.abs(x - 15.5) < (y - 66) * 1.15 + 2.2 && Math.abs(x - 15.5) >= (y - 66) * 1.15;
    if (border || tailEdge) { alb.set(x, y, x === 0 || x === W - 1 ? GOLD[2] : GOLD[4]); emi.set(x, y, [70, 52, 26]); }
    if (y === 4 || (y > 64 && false)) { alb.set(x, y, GOLD[2]); }
  }
  // the mark, centred at (16, 30)
  const cx = 15.5, cy = 30;
  const gold = (x, y, c = GOLD[4]) => { alb.set(x, y, c); emi.set(x, y, [120, 92, 48]); };
  // thin circle
  for (let a = 0; a < 6.283; a += 0.02) { const x = Math.round(cx + Math.cos(a) * 11.5 - 0.5), y = Math.round(cy + Math.sin(a) * 11.5); gold(x, y, GOLD[3]); }
  // the axis
  for (let y = cy - 17; y <= cy + 18; y++) gold(15, y, y < cy - 12 || y > cy + 12 ? GOLD[3] : GOLD[5]), gold(16, y, GOLD[3]);
  // the swept arrowhead: two arms from the apex curving out and down, with hooked tails
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 0; k <= 20; k++) {
      const u = k / 20;
      const x = cx + s * (u * 10.5), y = cy - 13 + u * 20 - Math.sin(u * 3.14) * 2.0;
      gold(Math.round(x - 0.5), Math.round(y), GOLD[4]);
      if (u > 0.25) gold(Math.round(x - 0.5 - s), Math.round(y), GOLD[3]);
    }
    // inner swept curve that hooks back up toward the axis
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      const x = cx + s * (10 - u * 7.5), y = cy + 7 - Math.sin(u * 2.2) * 6;
      gold(Math.round(x - 0.5), Math.round(y), GOLD[3]);
    }
  }
  // four-point star at the heart
  const star = [[0, -3], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [0, 3], [-3, 0], [-2, 0], [-1, 0], [1, 0], [2, 0], [3, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [dx, dy] of star) { const x = 15 + dx, y = cy + 1 + dy; alb.set(x, y, Math.abs(dx) + Math.abs(dy) <= 1 ? '#fff4d6' : GOLD[5]); emi.set(x, y, [255, 225, 160]); alb.set(x + 1, y, Math.abs(dx) + Math.abs(dy) <= 1 ? '#fff4d6' : GOLD[5]); emi.set(x + 1, y, [255, 225, 160]); }
  // embroidered constellation dots below the mark
  for (const [x, y] of [[8, 52], [11, 55], [15, 53], [20, 56], [24, 52], [13, 59], [18, 60]]) { alb.set(x, y, GOLD[3]); emi.set(x, y, [60, 46, 22]); }
  for (let x = 4; x < W - 4; x++) if (x % 2 === 0) alb.set(x, 62, GOLD[2]);
  return { map: T(alb, { repeat: false }), emissiveMap: T(emi, { repeat: false }), size: [W, H] };
}

/** Lantern glass: an amber flame behind brass bars (emissive). 8 x 12. */
export function paintLantern() {
  const W = 8, H = 12, alb = new PixelCanvas(W, H), emi = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bar = x === 0 || x === W - 1 || y === 0 || y === H - 1 || x === 4 && y < 3;
    if (bar) { alb.set(x, y, '#9c7a3e'); emi.set(x, y, [40, 28, 12]); continue; }
    const d = Math.hypot((x - 3.5) / 2.6, (y - 7) / 4.2);
    const f = Math.max(0, 1 - d);
    alb.set(x, y, '#e8a24c');
    emi.set(x, y, [255 * (0.45 + f * 0.55), 170 * (0.35 + f * 0.65), 70 * (0.2 + f * 0.8)]);
  }
  return { map: T(alb, { repeat: false, mips: false }), emissiveMap: T(emi, { repeat: false, mips: false }), size: [W, H] };
}

/** Plaza paving: big calm slabs, cool grey. 4 x 4 units. */
export const paintPaving = (seed = 6) => paintAshlar(seed, ['#1f2027', '#27282f', '#303139', '#393a43', '#43444e', '#4f505b'], { blockW: 32, blockH: 16, joint: '#121318', speck: 0.015 });

/** The compass inlay on the gate plaza: two engraved gold rings, a long four-point star, ticks and constellation points. */
export function paintCompass(size = 224) {
  const S = size, c = S / 2, alb = new PixelCanvas(S, S), emi = new PixelCanvas(S, S);
  const orm = new PixelCanvas(S, S);
  const gold = (x, y, k = 4, e = 0.4) => { alb.set(x, y, GOLD[k]); emi.set(x, y, [255 * e, 214 * e, 150 * e]); orm.set(x, y, [255, 70, 255]); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy) / c, a = Math.atan2(dy, dx);
    if (r > 1) continue;
    const ring = (rr, w) => Math.abs(r - rr) < w;
    if (ring(0.97, 0.018) || ring(0.9, 0.008) || ring(0.42, 0.012)) { gold(x, y, ring(0.97, 0.008) ? 5 : 3, 0.35); continue; }
    // ticks every 15 degrees between the outer rings
    const deg = ((a * 180) / Math.PI + 360) % 15;
    if (r > 0.905 && r < 0.96 && (deg < 0.9 || deg > 14.1)) { gold(x, y, 2, 0.2); continue; }
    // four-point star: long cardinal points, short diagonals
    const ax = Math.abs(dx) / c, ay = Math.abs(dy) / c;
    const star = ax * 9 + ay * 1.25 <= 0.66 || ay * 9 + ax * 1.25 <= 0.66;
    const diag = Math.abs(ax - ay) < 0.04 && r < 0.36;
    if (star) { gold(x, y, (dx < 0) === (dy < 0) ? 5 : 3, 0.7); continue; }
    if (diag) { gold(x, y, 2, 0.3); continue; }
  }
  for (const [px, py] of [[0.3, -0.55], [0.55, -0.3], [-0.6, 0.25], [-0.25, 0.62], [0.62, 0.48], [-0.5, -0.5]]) {
    const x = Math.round(c + px * c), y = Math.round(c + py * c);
    for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) gold(x + ox, y + oy, ox || oy ? 3 : 5, ox || oy ? 0.4 : 1.0);
  }
  return { map: alb.texture({ repeat: false }), emissiveMap: emi.texture({ repeat: false }), ormMap: orm.texture({ kind: 'data', repeat: false }) };
}
