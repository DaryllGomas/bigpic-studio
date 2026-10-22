// Large painted sprites for the world: the colossus card (from "Sorrowful Ruined Stone Titan"; superseded on the gate road by
// the sculpted 3D colossus in world/colossus.js, which uses the two tileable surfaces below), ornamental trees, bushes,
// plus soft glow / mist textures. The card is painted from a layered height field: shapes -> dome heights -> normals ->
// lit with a cool sky key and a warm rim -> quantised to stone, cloth, rust and gold ramps with ordered dither.
import * as THREE from 'three';
import { PixelCanvas, rng, hash2, bayer, vnoise, hex, fbm, rampDither } from './paint.js';

const STONE = ['#0d0e14', '#16171f', '#20222c', '#2b2e3a', '#383b48', '#474a57', '#585b67', '#6c6e78', '#83848c'];
const CLOTH = ['#100f12', '#19171b', '#232026', '#2f2b31', '#3c373c', '#4a4448', '#5a5356', '#6d6566', '#827978'];
const RUST = ['#1a0f0a', '#2a170e', '#3d2213', '#542f18', '#6e3f1f', '#874f27'];
const GOLDR = ['#3a2a10', '#5e4622', '#8a6a33', '#b48d4a', '#d4b06a', '#f1dcaa'];

function capsuleDist(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}

/** The colossus: seated, head bowed under a hood, hands hanging from the knees, robe in tatters, gold bands, cyan cracks. */
export function paintColossus(seed = 7) {
  const W = 256, H = 256, R = rng(seed);
  const pc = new PixelCanvas(W, H), emi = new PixelCanvas(W, H);
  const hgt = new Float32Array(W * H).fill(-1), mat = new Uint8Array(W * H); // 0 none, 1 stone, 2 cloth, 3 gold, 4 hood shadow
  const put = (x, y, h, m) => { const i = y * W + x; if (h > hgt[i]) { hgt[i] = h; mat[i] = m; } };
  const ell = (cx, cy, rx, ry, z, m, rot = 0) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let y = Math.max(0, Math.floor(cy - Math.max(rx, ry))); y < Math.min(H, cy + Math.max(rx, ry)); y++)
      for (let x = Math.max(0, Math.floor(cx - Math.max(rx, ry))); x < Math.min(W, cx + Math.max(rx, ry)); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry, d = u * u + v * v;
        if (d <= 1) put(x, y, z + Math.sqrt(1 - d) * Math.min(rx, ry), m);
      }
  };
  const cap = (ax, ay, bx, by, r, z, m) => {
    for (let y = Math.max(0, Math.floor(Math.min(ay, by) - r)); y < Math.min(H, Math.max(ay, by) + r); y++)
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - r)); x < Math.min(W, Math.max(ax, bx) + r); x++) {
        const d = capsuleDist(x + 0.5, y + 0.5, ax, ay, bx, by) / r;
        if (d <= 1) put(x, y, z + Math.sqrt(1 - d * d) * r, m);
      }
  };
  // robe skirt (seated, spilling to the ground), with a ragged hem
  for (let y = 140; y < H; y++) {
    const t = (y - 140) / (H - 140);
    const x0 = 66 - t * 58, x1 = 190 + t * 58;
    for (let x = Math.floor(x0); x < x1; x++) {
      const u = (x - x0) / (x1 - x0);
      const hem = H - 4 - Math.abs(vnoise(x * 0.18, 0, 1e9, 1e9, seed) - 0.5) * 22 - (hash2(x >> 2, 1, seed) < 0.25 ? 10 : 0);
      if (y > hem) continue;
      const folds = Math.sin(u * 34 + vnoise(x * 0.05, y * 0.02, 1e9, 1e9, seed + 3) * 4) * 3;
      put(x, y, 10 + Math.sin(u * Math.PI) * 26 + folds, 2);
    }
  }
  // knees (seated, forward) and the lap
  ell(90, 200, 38, 21, 30, 2); ell(166, 200, 38, 21, 30, 2);
  ell(128, 184, 42, 20, 24, 2);
  // torso: broad, heavy shoulders rising around the bowed head
  ell(128, 138, 72, 40, 20, 1);
  ell(128, 112, 70, 20, 22, 1);
  ell(80, 104, 26, 16, 26, 1); ell(176, 104, 26, 16, 26, 1);
  // upper arms, forearms resting on the knees, hands hanging between them
  cap(68, 108, 56, 166, 18, 28, 1); cap(188, 108, 200, 166, 18, 28, 1);
  cap(56, 166, 98, 196, 14, 44, 1); cap(200, 166, 158, 196, 14, 44, 1);
  cap(99, 198, 103, 228, 10, 56, 1); cap(157, 198, 153, 228, 10, 56, 1);
  for (const [hx, s] of [[102, 1], [154, -1]]) for (let f = -1; f <= 2; f++) cap(hx + f * 4 * s - 2 * s, 222, hx + f * 4.6 * s - 2 * s, 238 + (f === 0 ? 2 : 0), 2.6, 58, 1);
  // a cowl over the shoulders, and the hooded head bowed low between them
  ell(128, 110, 70, 21, 30, 2);
  ell(84, 104, 30, 17, 31, 2); ell(172, 104, 30, 17, 31, 2);
  ell(128, 98, 23, 24, 40, 2);
  for (let y = 72; y < 92; y++) { const t = (y - 72) / 20, w = 12 + t * 11; for (let x = Math.floor(128 - w); x < 128 + w; x++) put(x, y, 40 + (1 - Math.abs(x - 128) / w) * 14 * t, 2); }
  ell(128, 112, 13, 8, 52, 4);                   // the hood opening, turned to the ground
  // tatters hanging from the forearms and the cowl
  for (let k = 0; k < 22; k++) {
    const side = k % 2 ? 1 : -1, u = R();
    const x = 128 + side * (72 - u * 30 + R() * 6), top = 150 + u * 40, len = 18 + R() * 40;
    cap(x, top, x + side * R() * 3, top + len, 2 + R() * 3, 46 + R() * 6, 2);
  }
  for (let k = 0; k < 14; k++) { const x = 90 + R() * 76, top = 112 + R() * 6, len = 8 + R() * 16; cap(x, top, x, top + len, 2 + R() * 2.5, 33, 2); }
  // gold bands: upper arms and wrists
  const band = (ax, ay, bx, by, r, z) => cap(ax, ay, bx, by, r, z, 3);
  band(62, 138, 60, 144, 17, 30); band(194, 138, 196, 144, 17, 30);
  band(87, 190, 90, 192, 13.5, 47); band(169, 190, 166, 192, 13.5, 47);

  // light it
  const L = [-0.45, -0.55, 0.7], LL = Math.hypot(...L);
  const crackMask = new Uint8Array(W * H);
  // cyan cracks: wandering lines through the stone and the cloth seams
  for (let k = 0; k < 9; k++) {
    let x = 70 + R() * 116, y = 110 + R() * 110, a = Math.PI / 2 + (R() - 0.5) * 1.0;
    for (let j = 0; j < 14 + R() * 22; j++) {
      const xi = x | 0, yi = y | 0;
      if (xi >= 0 && yi >= 0 && xi < W && yi < H && mat[yi * W + xi] === 1) crackMask[yi * W + xi] = j % 7 === 0 ? 2 : 1;
      a += (R() - 0.5) * 0.7; x += Math.cos(a) * 1.0; y += Math.sin(a) * 1.0;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, m = mat[i];
    if (!m) continue;
    const hx = (hgt[Math.min(i + 1, W * H - 1)] - hgt[Math.max(i - 1, 0)]) * 0.5;
    const hy = (hgt[Math.min(i + W, W * H - 1)] - hgt[Math.max(i - W, 0)]) * 0.5;
    let nx = -hx, ny = -hy, nz = 1.6; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    if (Math.abs(hx) > 6 || Math.abs(hy) > 6) { nx = 0; ny = 0.3; nz = 0.95; }  // layer edges: a soft crease, not a spike
    let lum = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / LL);
    lum = 0.18 + lum * 0.7;
    // occlusion where a nearer layer sits just above (under the hood, under arms)
    const up4 = y > 4 ? hgt[i - 4 * W] : -1;
    if (up4 > hgt[i] + 6) lum *= 0.55;
    const n = vnoise(x * 0.09, y * 0.09, 1e9, 1e9, seed + 11);
    const chisel = (hash2(x >> 1, y >> 1, seed + 5) - 0.5) * 0.08 + (vnoise(x * 0.35, y * 0.35, 1e9, 1e9, seed + 6) - 0.5) * 0.12;
    let ramp = m === 1 ? STONE : m === 2 ? CLOTH : m === 3 ? GOLDR : STONE;
    let t = lum + chisel;
    if (m === 2) t += Math.sin(x * 0.9 + n * 6) * 0.05;
    // rust only as faint streaks running down from the gold and the cracks
    const streak = vnoise(x * 0.6, y * 0.03, 1e9, 1e9, seed + 12);
    if ((m === 1 || m === 2) && streak > 0.8 && n > 0.55) { ramp = RUST; t = lum * 0.85; }
    if (m === 3) t = lum * 0.62 - (y % 4 === 0 ? 0.2 : 0) - (hash2(x, y, 3) < 0.12 ? 0.18 : 0);
    if (m === 4) { ramp = STONE; t = 0.04 + lum * 0.08; }
    t = Math.round(t * 7) / 7 + (t - Math.round(t * 7) / 7) * 0.5;   // posterise a little: carved planes
    const f = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
    const fi = Math.floor(f), fr = f - fi;
    let c = ramp[Math.min(ramp.length - 1, fr > 0.5 + (bayer(x, y) - 0.5) * 0.6 ? fi + 1 : fi)];
    if (crackMask[i]) { c = '#123c3c'; emi.set(x, y, crackMask[i] === 2 ? '#5ff0e4' : '#22857e'); }
    else if (m === 3 && lum > 0.55 && (x + y) % 3 === 0) emi.set(x, y, '#3a2c12');   // gold catching the last light
    pc.set(x, y, c);
  }
  // eyes under the hood: two faint cyan points, mournful, looking down
  // under the hood: no eyes, only a faint cyan breath of light, turned to the ground
  for (let x = 122; x <= 134; x++) if (mat[114 * W + x] === 4) emi.set(x, 114, x % 3 ? '#0a2a2a' : '#145250');
  // a cyan seam down the centre of the chest (the colossus's signal core, dimmed)
  for (let y = 124; y < 168; y++) if (mat[y * W + 128] === 1) { emi.set(128, y, y % 9 < 2 ? '#2fa39a' : '#0b3a38'); pc.set(128, y, '#123c3c'); }
  pc.outline('#07080d');
  return { map: pc, emissive: emi };
}

// ---------- the sculpted colossus's surfaces (tileable, sampled triplanar in world/colossus.js) ----------
const TITAN_STONE = ['#0b0c12', '#13151c', '#1b1e27', '#242833', '#2e3340', '#3a3f4d', '#474c5a', '#565b68', '#686c78'];
const TITAN_CLOTH = ['#221f1c', '#302c27', '#3f3a33', '#504a41', '#635c51', '#787063', '#8e8577', '#a49a8a', '#bab09e'];

/** Carved stone skin: worn scale-like plates (tileable Worley cells, lit from above), chisel noise, and a crack mask
 *  (bright = glowing Signal crack, dim = dead crack) in `crack`. 128 x 128. */
export function paintColossusStone(seed = 7) {
  const N = 128, R = rng(seed), map = new PixelCanvas(N, N), crack = new PixelCanvas(N, N);
  const G = 9, cell = N / G, pts = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) pts.push([(i + 0.2 + R() * 0.6) * cell, (j + 0.2 + R() * 0.6) * cell]);
  const cr = new Uint8Array(N * N);
  // cracks: wandering, branching walks that wrap around the tile
  for (let k = 0; k < 13; k++) {
    let x = R() * N, y = R() * N, a = R() * 6.283;
    const live = k < 6, len = 40 + R() * 70;
    for (let j = 0; j < len; j++) {
      const xi = ((Math.floor(x) % N) + N) % N, yi = ((Math.floor(y) % N) + N) % N;
      cr[yi * N + xi] = Math.max(cr[yi * N + xi], live ? 2 : 1);
      if (live && j % 9 === 4 && R() < 0.5) { let bx = x, by = y, ba = a + (R() < 0.5 ? 1 : -1) * (0.7 + R() * 0.6); for (let q = 0; q < 8 + R() * 10; q++) { const bxi = ((Math.floor(bx) % N) + N) % N, byi = ((Math.floor(by) % N) + N) % N; cr[byi * N + bxi] = 2; ba += (R() - 0.5) * 0.5; bx += Math.cos(ba); by += Math.sin(ba); } }
      a += (R() - 0.5) * 0.65; x += Math.cos(a); y += Math.sin(a);
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let d1 = 1e9, d2 = 1e9, py = 0;
    const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = ((ci + di) % G + G) % G, jj = ((cj + dj) % G + G) % G, p = pts[jj * G + ii];
      const qx = p[0] + (ci + di - ii) * cell, qy = p[1] + (cj + dj - jj) * cell, d = Math.hypot(x + 0.5 - qx, y + 0.5 - qy);
      if (d < d1) { d2 = d1; d1 = d; py = qy; } else if (d < d2) d2 = d;
    }
    const edge = d2 - d1, n = fbm(x, y, N, N, 4, 4, seed), fine = fbm(x, y, N, N, 16, 2, seed + 3);
    // each plate is a shallow dome lit from above: brighter on its upper half, a dark groove between plates
    let t = 0.42 + (n - 0.5) * 0.45 + (fine - 0.5) * 0.18 + ((py - (y + 0.5)) / cell) * 0.22;
    if (edge < 1.4) t -= 0.3; else if (edge < 2.6) t += 0.05;
    const c = cr[y * N + x];
    if (c) t = c === 2 ? 0.04 : 0.1;
    map.set(x, y, rampDither(TITAN_STONE, t, x, y, 0.55));
    crack.set(x, y, c === 2 ? '#ffffff' : c === 1 ? '#202020' : '#000000');
  }
  return { map, crack };
}

/** Heavy stone-cloth for the robes: long vertical folds (tile repeats cleanly), weave, worn threadbare patches. 128 x 128. */
export function paintColossusCloth(seed = 9) {
  const N = 128, map = new PixelCanvas(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const warp = fbm(x, y, N, N, 3, 3, seed) * 5;
    const fold = Math.sin((x / N) * Math.PI * 2 * 7 + warp) * 0.5 + Math.sin((x / N) * Math.PI * 2 * 17 + warp * 1.7) * 0.18;
    const n = fbm(x, y, N, N, 8, 3, seed + 1), worn = fbm(x, y, N, N, 6, 3, seed + 2);
    let t = 0.5 + fold * 0.36 + (n - 0.5) * 0.34 + (((x >> 1) + (y >> 1)) & 1 ? 0.03 : -0.03);
    if (worn > 0.68) t -= 0.2 + (worn - 0.68) * 1.5;
    map.set(x, y, rampDither(TITAN_CLOTH, t, x, y, 0.5));
  }
  return { map };
}

/** Ornamental city tree: dark teal canopy clusters with warm rim, slim trunk. 48 x 72. */
export function paintTree(seed = 3) {
  const W = 48, H = 72, R = rng(seed), pc = new PixelCanvas(W, H);
  const LEAF = ['#0a1416', '#0f1e1d', '#152a25', '#1d382e', '#284838', '#365a44', '#4a7052'];
  // trunk
  for (let y = 44; y < H; y++) { const w = y > 66 ? 3 : 2; for (let x = 24 - w; x <= 23 + w; x++) pc.set(x, y, x < 23 ? '#2a1d14' : x < 25 ? '#1c130d' : '#120c08'); }
  pc.line(23, 52, 16, 44, '#1c130d'); pc.line(24, 50, 31, 42, '#1c130d');
  const blobs = [];
  for (let k = 0; k < 11; k++) blobs.push([24 + (R() - 0.5) * 26, 10 + R() * 34, 7 + R() * 7]);
  blobs.push([24, 26, 13]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = -1, nx = 0, ny = 0;
    for (const [cx, cy, r] of blobs) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy;
      if (d < 1) { const hgt = Math.sqrt(1 - d) * r + cy * -0.15; if (hgt > best) { best = hgt; nx = dx; ny = dy; } }
    }
    if (best < 0) continue;
    const leafN = hash2(x >> 1, y >> 1, seed);
    let t = 0.45 - nx * 0.25 - ny * 0.3 + (leafN - 0.5) * 0.35;
    if (y > 38) t -= 0.15;
    const f = Math.max(0, Math.min(1, t)) * (LEAF.length - 1), i = Math.floor(f);
    pc.set(x, y, LEAF[Math.min(LEAF.length - 1, f - i > bayer(x, y) ? i + 1 : i)]);
  }
  // a few warm lantern-lit leaf edges (rim) and gold glints
  for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) if (pc.alpha(x, y) && !pc.alpha(x - 1, y) && y < 44 && hash2(x, y, 9) < 0.5) pc.set(x, y, '#58603f');
  pc.outline('#040708');
  return { map: pc };
}

/** Low bush. 32 x 18. */
export function paintBush(seed = 5) {
  const W = 32, H = 18, R = rng(seed), pc = new PixelCanvas(W, H);
  const LEAF = ['#0b1517', '#11201e', '#182e26', '#213d30', '#2f503c', '#40644a'];
  const blobs = []; for (let k = 0; k < 6; k++) blobs.push([6 + R() * 20, 8 + R() * 6, 5 + R() * 4]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = -1, ny = 0, nx = 0;
    for (const [cx, cy, r] of blobs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d < 1 && Math.sqrt(1 - d) * r > best) { best = Math.sqrt(1 - d) * r; ny = dy; nx = dx; } }
    if (best < 0 || y > H - 2) continue;
    const t = 0.5 - ny * 0.35 - nx * 0.15 + (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.35;
    const f = Math.max(0, Math.min(1, t)) * (LEAF.length - 1), i = Math.floor(f);
    pc.set(x, y, LEAF[Math.min(LEAF.length - 1, f - i > bayer(x, y) ? i + 1 : i)]);
  }
  // tiny blue-white flowers
  for (let k = 0; k < 4; k++) { const x = 4 + Math.floor(R() * 24), y = 4 + Math.floor(R() * 8); if (pc.alpha(x, y)) pc.set(x, y, '#cfeeff'); }
  pc.outline('#040708');
  return { map: pc };
}

/** Soft radial glow with a four-point flare (Ora, lantern halos). Smooth, not pixel: light is light. */
export function glowTexture(size = 128, flare = 0.6, core = 0.18) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1, r = Math.hypot(u, v);
    let a = Math.exp(-r * r * 9) * 0.9 + Math.exp(-r / core * 1.0) * 1.0;
    const fl = Math.exp(-Math.abs(u) * 40) * Math.exp(-Math.abs(v) * 2.6) + Math.exp(-Math.abs(v) * 40) * Math.exp(-Math.abs(u) * 2.6);
    a += fl * flare;
    a *= Math.max(0, 1 - r);
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Soft mist puff. */
export function mistTexture(size = 128, seed = 2) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1, r = Math.hypot(u, v * 1.4);
    let n = 0, a = 0.5, f = 3;
    for (let o = 0; o < 4; o++) { n += vnoise(x / size * f, y / size * f, f, f, seed + o) * a; a *= 0.5; f *= 2; }
    const al = Math.max(0, 1 - r) ** 1.6 * (0.4 + n * 0.9);
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, al * 255);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
