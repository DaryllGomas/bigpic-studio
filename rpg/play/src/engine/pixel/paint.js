// Pixel painting toolkit: seeded noise, tileable fbm, palette ramps with ordered dithering, outlines, normal maps.
// Everything the procedural painters draw goes through a PixelCanvas (a plain RGBA byte buffer), then becomes a texture.
import * as THREE from 'three';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x, y, s = 0) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Value noise that tiles with period (px, py) in lattice units. */
export function vnoise(x, y, px = 1e9, py = 1e9, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const m = (v, p) => ((v % p) + p) % p;
  const x0 = m(xi, px), x1 = m(xi + 1, px), y0 = m(yi, py), y1 = m(yi + 1, py);
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Tileable fbm over a w*h texture: freq = lattice cells across the texture. */
export function fbm(x, y, w, h, freq = 4, oct = 4, seed = 0, gain = 0.5) {
  let amp = 1, sum = 0, norm = 0, f = freq;
  for (let o = 0; o < oct; o++) {
    sum += amp * vnoise((x / w) * f, (y / h) * f, f, f, seed + o * 17);
    norm += amp; amp *= gain; f *= 2;
  }
  return sum / norm;
}

export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)];

export function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Pick a colour from a ramp of hex colours at t in [0,1], with 4x4 ordered dithering between neighbours. */
export function rampDither(ramp, t, x, y, dither = 1) {
  const n = ramp.length - 1;
  const f = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.floor(f), fr = f - i;
  const pick = fr > 0.5 + (bayer(x, y) - 0.5) * dither ? Math.min(i + 1, n) : i;
  return ramp[pick];
}

export class PixelCanvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  idx(x, y) { return (y * this.w + x) * 4; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, c, a = 255) {
    x |= 0; y |= 0;
    if (!this.inside(x, y)) return;
    const i = this.idx(x, y);
    if (typeof c === 'string') c = hex(c);
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a;
  }
  /** Wrapping set (for tileable textures). */
  setw(x, y, c, a = 255) { this.set(((x % this.w) + this.w) % this.w, ((y % this.h) + this.h) % this.h, c, a); }
  get(x, y) {
    x |= 0; y |= 0;
    if (!this.inside(x, y)) return [0, 0, 0, 0];
    const i = this.idx(x, y);
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }
  alpha(x, y) { return this.inside(x | 0, y | 0) ? this.data[this.idx(x | 0, y | 0) + 3] : 0; }
  fill(c, a = 255) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c, a); }
  rect(x0, y0, w, h, c, a = 255) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c, a); }
  /** Multiply-darken an existing pixel by k (keeps alpha). */
  shade(x, y, k) {
    if (!this.inside(x | 0, y | 0)) return;
    const i = this.idx(x | 0, y | 0);
    this.data[i] *= k; this.data[i + 1] *= k; this.data[i + 2] *= k;
  }
  /** Blend a colour over an existing pixel. */
  blend(x, y, c, t) {
    if (!this.inside(x | 0, y | 0)) return;
    const i = this.idx(x | 0, y | 0);
    if (typeof c === 'string') c = hex(c);
    for (let k = 0; k < 3; k++) this.data[i + k] = this.data[i + k] + (c[k] - this.data[i + k]) * t;
  }
  /** Scanline polygon fill (integer pixel coverage at pixel centres). */
  poly(pts, c, a = 255) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c, a);
    }
  }
  ellipse(cx, cy, rx, ry, c, a = 255) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, a);
      }
  }
  line(x0, y0, x1, y1, c, a = 255) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** Outline: every transparent pixel touching an opaque one becomes `c` (selective: darkened neighbour if c is null). */
  outline(c = '#07080d', diag = false) {
    const src = new Uint8ClampedArray(this.data);
    const A = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[(y * this.w + x) * 4 + 3] : 0);
    const col = typeof c === 'string' ? hex(c) : c;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (A(x, y) > 0) continue;
      let hit = A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1);
      if (!hit && diag) hit = A(x - 1, y - 1) || A(x + 1, y - 1) || A(x - 1, y + 1) || A(x + 1, y + 1);
      if (hit) this.set(x, y, col);
    }
  }
  /** Copy a region from another canvas, optionally mirrored horizontally. */
  blit(src, sx, sy, w, h, dx, dy, flip = false) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = src.get(sx + x, sy + y);
      if (p[3] === 0) continue;
      this.set(dx + (flip ? w - 1 - x : x), dy + y, p, p[3]);
    }
  }
  toCanvas() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.data, this.w, this.h), 0, 0);
    return c;
  }
  /** A texture with pixel-art sampling. kind: 'color' (sRGB) | 'data' (linear). */
  texture({ kind = 'color', repeat = true, mips = true, nearestMin = false } = {}) {
    const t = new THREE.CanvasTexture(this.toCanvas());
    t.colorSpace = kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = mips ? (nearestMin ? THREE.NearestMipmapLinearFilter : THREE.LinearMipmapLinearFilter) : THREE.NearestFilter;
    t.generateMipmaps = mips;
    t.anisotropy = 8;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }
}

/** Height (Float32Array w*h, 0..1) -> tangent-space normal map canvas. Wraps at edges when tile=true. */
export function normalFromHeight(hgt, w, h, strength = 2, tile = true) {
  const pc = new PixelCanvas(w, h);
  const H = (x, y) => {
    if (tile) { x = ((x % w) + w) % w; y = ((y % h) + h) % h; } else { x = Math.min(Math.max(x, 0), w - 1); y = Math.min(Math.max(y, 0), h - 1); }
    return hgt[y * w + x];
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    let nx = -dx, ny = dy, nz = 1; // canvas y points down; three's normal map expects +y up (OpenGL convention)
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    pc.set(x, y, [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255]);
  }
  return pc;
}

/** Roughness (G) + metalness (B) packed map, as three's roughnessMap/metalnessMap read them. */
export function ormCanvas(w, h, fn) {
  const pc = new PixelCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, m] = fn(x, y);
    pc.set(x, y, [255, r * 255, m * 255]);
  }
  return pc;
}

/** Scale a PixelCanvas up by an integer factor into a plain canvas (debug/preview). */
export function upscale(pc, k) {
  const c = document.createElement('canvas');
  c.width = pc.w * k; c.height = pc.h * k;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(pc.toCanvas(), 0, 0, c.width, c.height);
  return c;
}
