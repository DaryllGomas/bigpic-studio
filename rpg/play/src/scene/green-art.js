// The Green's art, painted in code at the engine's pixel scale: warm meadow, tilled soil, a dirt lane, whitewash and
// honey timber, clay roofs, crop sprites (four kinds x four growth stages), leafy trees and the name plate on your post.
// Everything here is a PixelCanvas / CanvasTexture; any entry can become a painted image later without touching the scene.
import * as THREE from 'three';
import { PixelCanvas, rng, fbm, rampDither, hash2, bayer } from '../engine/pixel/paint.js';

const tex = (pc, o) => pc.texture(o);

const MEADOW = ['#27481b', '#35601f', '#477a28', '#5f9632', '#80b23f', '#a6c94e', '#cbdc6a'];
export function paintMeadow(seed = 12) {
  const W = 64, H = 64, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x, y, W, H, 3, 3, seed) - 0.5, m = fbm(x, y, W, H, 14, 2, seed + 4) - 0.5;
    pc.set(x, y, rampDither(MEADOW, 0.5 + n * 0.8 + m * 0.35, x, y, 0.9));
  }
  for (let k = 0; k < 150; k++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), h = 2 + Math.floor(R() * 2);
    for (let j = 0; j < h; j++) pc.setw(x, y - j, MEADOW[4 + (j === h - 1 ? 1 : 0)]);
    pc.setw(x + 1, y, MEADOW[1]);
  }
  const FL = ['#fff4c8', '#ffd45e', '#f6b4d0', '#c9b8ff', '#ffffff'];
  for (let k = 0; k < 11; k++) { const x = Math.floor(R() * W), y = Math.floor(R() * H); pc.setw(x, y, FL[k % FL.length]); pc.setw(x, y + 1, MEADOW[2]); }
  return tex(pc);
}

const SOIL = ['#2a1b12', '#3b2618', '#4f3322', '#664429', '#7c5636'];
export function paintSoilTile(seed = 5) {
  // one tile (24 x 24 px) of tilled earth: furrows across, a pale crumbly rim so the grid reads
  const W = 24, H = 24, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const furrow = Math.sin(y * 1.05) * 0.5 + 0.5;
    const n = fbm(x, y, W, H, 3, 2, seed);
    pc.set(x, y, rampDither(SOIL, 0.2 + furrow * 0.45 + (n - 0.5) * 0.5, x, y, 0.8));
  }
  for (let k = 0; k < 20; k++) pc.setw(Math.floor(R() * W), Math.floor(R() * H), '#8d6842');
  for (let i = 0; i < W; i++) { pc.set(i, 0, '#2a1b12'); pc.set(0, i, '#2a1b12'); pc.set(i, 1, '#4a3120'); pc.set(1, i, '#4a3120'); }
  return tex(pc, { mips: true });
}
export function paintBed(seed = 6) {
  const W = 32, H = 32, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, rampDither(SOIL, 0.25 + (fbm(x, y, W, H, 4, 2, seed) - 0.5) * 0.9 + (Math.sin(y * 1.6) * 0.5 + 0.5) * 0.2, x, y, 0.8));
  for (let k = 0; k < 14; k++) pc.setw(Math.floor(R() * W), Math.floor(R() * H), '#8d6842');
  return tex(pc);
}

const DIRT = ['#6a4d30', '#85653f', '#a07f50', '#b99863', '#cfb27a', '#e0c68f'];
export function paintDirt(seed = 8) {
  const W = 64, H = 64, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, rampDither(DIRT, 0.55 + (fbm(x, y, W, H, 4, 3, seed) - 0.5) * 0.9, x, y, 0.9));
  for (let k = 0; k < 46; k++) { const x = Math.floor(R() * W), y = Math.floor(R() * H); pc.setw(x, y, '#e9d9ab'); pc.setw(x + 1, y, '#a58554'); }
  for (let k = 0; k < 18; k++) { const x = Math.floor(R() * W), y = Math.floor(R() * H); pc.setw(x, y, '#4e3922'); }
  return tex(pc);
}

export function paintWood(seed = 9, ramp = ['#3a2616', '#5a3d22', '#7d5832', '#a37a45', '#c19a5c']) {
  const W = 32, H = 32, pc = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const plank = Math.floor(x / 8), g = fbm(x * 0.4 + plank * 9, y, W, H, 2, 3, seed + plank) - 0.5;
    const edge = x % 8 === 0 ? -0.35 : 0;
    pc.set(x, y, rampDither(ramp, 0.55 + g * 0.8 + edge, x, y, 0.7));
  }
  return tex(pc);
}
export function paintPlaster(seed = 4) {
  const W = 32, H = 32, pc = new PixelCanvas(W, H), ramp = ['#a99b82', '#c8bba0', '#e2d6bb', '#f2e8cf', '#fff6de'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, rampDither(ramp, 0.62 + (fbm(x, y, W, H, 3, 3, seed) - 0.5) * 0.9, x, y, 0.85));
  return tex(pc);
}
export function paintClay(seed = 3) {
  // clay roof tiles in rows with a scalloped lower edge
  const W = 32, H = 32, pc = new PixelCanvas(W, H), ramp = ['#5a2a1e', '#7c3b28', '#a14d32', '#c4693f', '#e08a52'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / 6), xo = (x + (row % 2) * 4) % 8, ly = y % 6;
    const scallop = Math.abs(xo - 4) * 0.12;
    let t = 0.62 - ly * 0.07 - scallop + (hash2(x >> 2, row, seed) - 0.5) * 0.35;
    if (ly === 5) t = 0.05;
    pc.set(x, y, rampDither(ramp, t, x, y, 0.5));
  }
  return tex(pc);
}
export function paintThatchSage(seed = 2) {
  const W = 32, H = 32, pc = new PixelCanvas(W, H), ramp = ['#2d3b26', '#43573a', '#5f7a4c', '#86a062', '#b0c07c'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pc.set(x, y, rampDither(ramp, 0.5 + (hash2(x, y >> 1, seed) - 0.5) * 0.7 + Math.sin(x * 1.3) * 0.15, x, y, 0.5));
  return tex(pc);
}

// ---------------------------------------------------------------- crops
// An atlas of 4 kinds (columns) x 4 stages (rows, 0 = sprout ... 3 = grown), 16 x 16 px cells, painted bottom-anchored.
export const CROP_CELL = 16;
export function paintCrops() {
  const C = CROP_CELL, pc = new PixelCanvas(C * 4, C * 4);
  const L = ['#214526', '#356b32', '#509c3b', '#7ac64b', '#b0e66e', '#ddf797'];
  const px = (ox, oy, x, y, c) => pc.set(ox + x, oy + y, c);
  const blade = (ox, oy, x, h, lean, c1, c2) => { for (let j = 0; j < h; j++) px(ox, oy, x + Math.round(lean * j / h), C - 2 - j, j > h - 3 ? c2 : c1); };
  const rosette = (ox, oy, cx, cy, rx, ry, seed, ramp = L) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (d > 1) continue;
      const t = 0.5 + (-y / ry) * 0.3 - (x / rx) * 0.12 + (hash2(x + 9, y + 9, seed) - 0.5) * 0.4;
      pc.set(ox + cx + x, oy + cy + y, rampDither(ramp, t, x + 40, y + 40, 0.9));
    }
  };
  for (let kind = 0; kind < 4; kind++) for (let st = 0; st < 4; st++) {
    const ox = kind * C, oy = st * C;
    if (st === 0) {            // sprout: two bright leaves on a mound of soil
      px(ox, oy, 7, 13, '#5c3d24'); px(ox, oy, 8, 13, '#4a3020'); px(ox, oy, 6, 14, '#4a3020'); px(ox, oy, 7, 14, '#664429'); px(ox, oy, 8, 14, '#664429'); px(ox, oy, 9, 14, '#4a3020');
      px(ox, oy, 8, 12, L[3]); px(ox, oy, 8, 11, L[4]); px(ox, oy, 7, 10, L[4]); px(ox, oy, 9, 10, L[4]); px(ox, oy, 6, 10, L[5]); px(ox, oy, 10, 10, L[5]);
      for(const [x,y] of [[6,9],[7,9],[9,9],[10,9],[5,10],[11,10],[8,10]])px(ox,oy,x,y,L[4]);
      continue;
    }
    if (kind === 0) {          // wheat
      const n = st === 1 ? 4 : st === 2 ? 7 : 9, h = st === 1 ? 6 : st === 2 ? 10 : 12;
      for (let i = 0; i < n; i++) {
        const x = 3 + Math.round(i * 10 / (n - 1)), lean = (i - n / 2) * 0.3, hh = h - (i % 3);
        blade(ox, oy, x, hh, lean, st === 3 ? '#7fa23e' : L[3], st === 3 ? '#e8c45a' : L[4]);
        if (st === 3) { const tx = x + Math.round(lean), ty = C - 2 - hh; px(ox, oy, tx, ty, '#f4d56e'); px(ox, oy, tx, ty - 1, '#e8b94a'); px(ox, oy, tx, ty - 2, '#f4d56e'); px(ox, oy, tx - 1, ty - 1, '#c9983a'); px(ox, oy, tx + 1, ty, '#c9983a'); }
      }
    } else if (kind === 1) {   // leafy greens / cabbage
      const r = st === 1 ? 3 : st === 2 ? 5 : 6;
      rosette(ox, oy, 8, C - 2 - Math.floor(r * 0.7), r + 1, Math.ceil(r * 0.8), 3 + st);
      if (st === 3) { rosette(ox, oy, 8, C - 6, 3, 2, 11, ['#6c9c6a', '#9cc89a', '#cfe8c4', '#eaf6dc']); px(ox, oy, 4, 11, '#b98ad0'); px(ox, oy, 12, 10, '#b98ad0'); }
    } else if (kind === 2) {   // tomato vines on a stake
      for (let j = 0; j < (st === 1 ? 5 : 12); j++) px(ox, oy, 8, C - 2 - j, '#8a6a3a');
      const r = st === 1 ? 3 : st === 2 ? 5 : 6;
      rosette(ox, oy, 8, C - 2 - (st === 1 ? 4 : 7), r, st === 1 ? 3 : 6, 21 + st);
      if (st === 3) for (const [x, y] of [[5, 9], [11, 8], [6, 5], [10, 4], [8, 7], [4, 11], [12, 11]]) { px(ox, oy, x, y, '#e2432c'); px(ox, oy, x + 1, y, '#b02a1c'); px(ox, oy, x, y + 1, '#b02a1c'); px(ox, oy, x, y - 1, '#ff8a6a'); }
      if (st === 2) for (const [x, y] of [[5, 9], [11, 8]]) { px(ox, oy, x, y, '#9ee36a'); px(ox, oy, x + 1, y, '#6cc04c'); }
    } else {                   // flowers
      const stems = st === 1 ? 2 : st === 2 ? 4 : 6;
      for (let i = 0; i < stems; i++) {
        const x = 4 + Math.round(i * 8 / Math.max(1, stems - 1)), hh = (st === 1 ? 5 : 8) + (i % 2) * 2;
        blade(ox, oy, x, hh, (i - stems / 2) * 0.35, L[3], L[4]);
        const tx = x + Math.round((i - stems / 2) * 0.35), ty = C - 2 - hh;
        if (st === 2) px(ox, oy, tx, ty, ['#f6b4d0', '#c9b8ff', '#ffd45e'][i % 3]);
        if (st === 3) { const col = ['#e97faf', '#8daeff', '#ffd96d', '#fff4e2', '#f07864', '#ba98e8'][i % 6], mid = ['#ffe0ec', '#e6dcff', '#8a5a14', '#ffd45e', '#ffe0a0', '#fff1cb'][i % 6];
          px(ox, oy, tx, ty - 1, col); px(ox, oy, tx - 1, ty, col); px(ox, oy, tx + 1, ty, col); px(ox, oy, tx, ty + 1, col); px(ox, oy, tx, ty, mid); }
      }
      rosette(ox, oy, 8, C - 3, 4, 2, 31, L);
    }
  }
  pc.outline('#0c2412');
  const t = pc.texture({ repeat: false, mips: false }); t.magFilter = t.minFilter = THREE.NearestFilter;
  return t;
}

// A small pixel glint above a mature plot tile, legible through the crop silhouette.
export function paintHarvestGlint() {
  const pc=new PixelCanvas(16,16);
  pc.line(8,1,8,14,'#ffe5a0');pc.line(2,8,14,8,'#f8c86b');
  for(let y=6;y<=10;y++)for(let x=6;x<=10;x++)if(Math.abs(x-8)+Math.abs(y-8)<4)pc.set(x,y,'#fff6d2');
  return pc.texture({repeat:false,mips:false});
}

// ---------------------------------------------------------------- trees, bushes
export function paintLeafyTree(seed = 3, ramp = ['#143018', '#1d4a22', '#2b6a2c', '#418b38', '#63ad46', '#8bcb55', '#b8e270'], blossom = null, shape = 'round') {
  const W = 48, H = 72, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let y = 44; y < H; y++) { const w = y > 66 ? 3 : 2; for (let x = 24 - w; x <= 23 + w; x++) pc.set(x, y, x < 23 ? '#6a4a2c' : x < 25 ? '#4a3220' : '#2e2014'); }
  pc.line(23, 52, 16, 44, '#4a3220'); pc.line(24, 50, 31, 42, '#4a3220');
  const blobs = [];
  // Same pixel footprint, different silhouettes: spreading oak, upright pear, tiered fir.
  if (shape === 'conifer') {
    for (let k = 0; k < 6; k++) blobs.push([24, 8 + k * 7, 3 + k * 2.5]);
  } else {
    const spread = shape === 'wide' ? 30 : shape === 'tall' ? 16 : 26;
    for (let k = 0; k < 11; k++) blobs.push([24 + (R() - 0.5) * spread, 10 + R() * (shape === 'wide' ? 25 : 34), 7 + R() * (shape === 'tall' ? 4 : 7)]);
    blobs.push([24, 26, shape === 'tall' ? 10 : 13]);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = -1, nx = 0, ny = 0;
    for (const [cx, cy, r] of blobs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d < 1) { const hgt = Math.sqrt(1 - d) * r + cy * -0.15; if (hgt > best) { best = hgt; nx = dx; ny = dy; } } }
    if (best < 0) continue;
    if (shape === 'conifer') {
      // Stepped triangular boughs rather than the round lobes of a broadleaf.
      const tier = Math.min(5, Math.max(0, Math.floor((y - 2) / 8)));
      const halfWidth = 2 + tier * 2.5 + ((y - 2) % 8) * 0.55;
      if (y < 2 || y > 53 || Math.abs(x - 23.5) > halfWidth) continue;
    }
    let t = 0.55 - nx * 0.25 - ny * 0.3 + (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.27; if (y > 38) t -= 0.12;
    pc.set(x, y, rampDither(ramp, t, x, y, 0.9));
  }
  if (blossom) for (let k = 0; k < 125; k++) { const x = 6 + Math.floor(R() * 36), y = 4 + Math.floor(R() * 36); if (pc.alpha(x, y)) pc.set(x, y, blossom[k % blossom.length]); }
  pc.outline(blossom ? '#79565b' : '#25462a');
  return { map: pc.texture({ repeat: false, mips: false }) };
}
export function paintFlowerBush(seed = 5) {
  const W = 32, H = 18, R = rng(seed), pc = new PixelCanvas(W, H), ramp = ['#173a1a', '#235a26', '#337a33', '#4c9c42', '#6cbc50', '#92d866'];
  const blobs = []; for (let k = 0; k < 6; k++) blobs.push([6 + R() * 20, 8 + R() * 6, 5 + R() * 4]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = -1, ny = 0, nx = 0;
    for (const [cx, cy, r] of blobs) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; if (d < 1 && Math.sqrt(1 - d) * r > best) { best = Math.sqrt(1 - d) * r; ny = dy; nx = dx; } }
    if (best < 0 || y > H - 2) continue;
    pc.set(x, y, rampDither(ramp, 0.55 - ny * 0.35 - nx * 0.15 + (hash2(x >> 1, y >> 1, seed) - 0.5) * 0.4, x, y, 0.9));
  }
  const FL = ['#ffe3f0', '#ffd45e', '#e6dcff', '#ffffff'];
  for (let k = 0; k < 9; k++) { const x = 3 + Math.floor(R() * 26), y = 3 + Math.floor(R() * 9); if (pc.alpha(x, y)) { pc.set(x, y, FL[k % 4]); pc.set(x + 1, y, FL[(k + 1) % 4]); } }
  pc.outline('#0a1c0e');
  return { map: pc.texture({ repeat: false, mips: false }) };
}
export function paintReeds(seed = 7) {
  const W = 24, H = 32, R = rng(seed), pc = new PixelCanvas(W, H);
  for (let i = 0; i < 9; i++) {
    const x = 3 + Math.floor(R() * 18), h = 14 + Math.floor(R() * 16), lean = (R() - 0.5) * 6;
    for (let j = 0; j < h; j++) pc.set(x + Math.round(lean * j / h), H - 1 - j, j > h - 4 ? '#b9c860' : ['#2f6a2c', '#418b38', '#63ad46'][j % 3]);
    if (i % 3 === 0) { const tx = x + Math.round(lean), ty = H - 1 - h; pc.set(tx, ty, '#6a4a2c'); pc.set(tx, ty - 1, '#7d5832'); pc.set(tx, ty - 2, '#6a4a2c'); }
  }
  pc.outline('#0a1c0e');
  return { map: pc.texture({ repeat: false, mips: false }) };
}

/** The name plate on your post: gold serif on honey wood, a small leaf under it. */
export function nameTexture(name = 'ATLAS') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, '#8a6038'); gr.addColorStop(1, '#5e3e22');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 96);
  g.strokeStyle = '#d4b06a'; g.lineWidth = 4; g.strokeRect(5, 5, 246, 86);
  g.strokeStyle = '#3a2412'; g.lineWidth = 2; g.strokeRect(10, 10, 236, 76);
  g.fillStyle = '#f1dcaa'; g.font = '700 46px "Cinzel","Trajan Pro","Times New Roman",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#2a1a0c'; g.shadowBlur = 0; g.shadowOffsetY = 2; g.fillText(name, 128, 46);
  g.fillStyle = '#8bcb55'; g.beginPath(); g.ellipse(128, 79, 7, 3, 0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(139, 78, 6, 2.5, -0.4, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** Soft water ripple normal map (tileable). */
export function rippleHeights(W = 64, H = 64, seed = 3) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = fbm(x, y, W, H, 6, 3, seed);
  return h;
}

// Tiny original fish portraits, shared by the water sprite and the catch card.
export function fishPortrait(fish) {
  const c=document.createElement('canvas'); c.width=32;c.height=20;
  const x=c.getContext('2d'); x.fillStyle=fish.color;
  for(let y=4;y<16;y++) { const w=Math.round(Math.sqrt(Math.max(0,1-((y-10)/6)**2))*10); x.fillRect(17-w,y,w*2,1); }
  x.fillRect(2,5,3,11);x.fillRect(5,7,4,7);x.fillRect(14,2,7,3);x.fillRect(15,15,6,3);
  x.fillStyle='#ffffff';x.fillRect(14,6,10,2);x.fillRect(24,8,3,3);x.fillStyle='#213445';x.fillRect(25,9,2,2);
  if(fish.id==='lantern-eel') {x.clearRect(0,0,32,20);x.fillStyle=fish.color;x.fillRect(3,9,25,5);x.fillRect(1,7,5,4);x.fillRect(10,7,18,4);x.fillStyle='#fff';x.fillRect(25,8,3,3);x.fillStyle='#213445';x.fillRect(26,9,2,2);}
  if(fish.id==='starfin') {x.fillStyle=fish.color;x.fillRect(16,0,3,5);x.fillRect(16,15,3,5);x.fillRect(1,3,3,14);}
  if(fish.id==='gilded-carp'||fish.id==='moon-koi') {x.fillStyle='#e79a51';x.fillRect(11,8,4,4);x.fillRect(19,12,4,3);}
  if(fish.glow) {x.fillStyle='#fff4c4';for(let i=0;i<4;i++)x.fillRect(10+i*4,11,2,2);}
  return c;
}

export function createFishingArt(scene, fishKinds) {
  const point=new THREE.Vector3(-20,.16,-6.5), end=new THREE.Vector3(-16,1.7,-6.5);
  const mat=(color)=>new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false});
  const ringMat=mat(new THREE.Color('#a9eee6').multiplyScalar(2)), ring=new THREE.Mesh(new THREE.RingGeometry(.65,.70,48),ringMat);ring.rotation.x=-Math.PI/2;ring.position.copy(point);scene.add(ring);
  const rippleMat=mat('#d1eeef'), ripple=new THREE.Mesh(new THREE.RingGeometry(.7,.75,48),rippleMat);ripple.rotation.x=-Math.PI/2;ripple.position.copy(point);scene.add(ripple);
  const bob=new THREE.Group();
  for(const [color,y,r] of [['#fff4cf',0,.13],['#edac5c',.14,.09]]) {const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),new THREE.MeshBasicMaterial({color}));m.position.y=y;bob.add(m)}scene.add(bob);
  const rod=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#d7b27e'}));scene.add(rod);
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:25},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:'#f6ebc9',transparent:true,opacity:.8}));scene.add(line);
  const textures=fishKinds.map(f=>{const t=new THREE.CanvasTexture(fishPortrait(f));t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;return t});
  const fish=new THREE.Sprite(new THREE.SpriteMaterial({map:textures[0],depthTest:false}));fish.scale.set(1.5,.94,1);scene.add(fish);
  const splash=new THREE.Group();scene.add(splash);
  for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.13,.08),mat(i%2?'#c1faff':'#ffe5a3'));splash.add(m)}
  const hud=document.createElement('div');hud.id='fishing-hud';hud.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:25;font-family:Georgia,serif;color:#fff2cf';
  // Match the dialogue's round Xbox A, including its gold gradient and dark ring.
  const glyph = id => {
    const el=document.createElement('div');el.id=id;el.textContent='A';
    el.style.cssText="position:absolute;width:4.4vh;height:4.4vh;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 2.5vh/1 'Cinzel','Times New Roman',serif;color:#1b1608;background:radial-gradient(circle at 35% 30%,#fff1c4,#d4b06a 70%);box-shadow:0 0 0 2px rgba(7,10,26,.8),0 0 14px rgba(241,220,170,.6)";
    return el;
  };
  const waterA=glyph('fishing-water-a');hud.append(waterA);
  const meter=document.createElement('div');meter.style.cssText='position:absolute;width:min(504px,76vw);height:56px;transform:translate(-50%,-50%);background:#071022fa;border:3px solid #f0d49b;border-radius:24px;box-shadow:0 3px 24px #0008;overflow:visible';
  meter.innerHTML='<div style="position:absolute;left:28%;width:44%;top:3px;bottom:3px;border-radius:20px;background:#bfffe5e6;box-shadow:0 0 22px #bfffe577,inset 0 0 18px #bfffe5"></div>';
  const mark=document.createElement('img');mark.src=fishPortrait(fishKinds[0]).toDataURL();mark.style.cssText='position:absolute;width:88px;height:56px;top:0;transform:translateX(-50%);image-rendering:pixelated;filter:drop-shadow(0 0 7px #fff) drop-shadow(0 2px 2px #102838)';meter.append(mark);
  const beats=document.createElement('div');beats.style.cssText='position:absolute;top:64px;width:100%;text-align:center;font-size:32px;letter-spacing:16px;text-shadow:0 2px 5px #000';meter.append(beats);hud.append(meter);
  const reelA=glyph('fishing-reel-a');reelA.style.left='50%';reelA.style.top='108px';reelA.style.transform='translateX(-50%)';meter.append(reelA);
  const card=document.createElement('div');card.id='fishing-catch';card.style.cssText='position:absolute;left:50%;top:12%;transform:translateX(-50%);padding:18px 36px;background:linear-gradient(135deg,#183748f5,#263c43f5);border:2px solid #e7cd94;border-radius:12px;box-shadow:0 8px 40px #0008;text-align:center;min-width:240px';
  const portrait=document.createElement('img');portrait.style.cssText='width:128px;height:80px;image-rendering:pixelated;filter:drop-shadow(0 0 10px #afd7c777)';
  const name=document.createElement('div');name.style.cssText='font-size:30px;letter-spacing:1px';const detail=document.createElement('div');detail.style.cssText='font-size:18px;margin-top:8px;color:#d3dfcf';card.append(portrait,name,detail);hud.append(card);document.body.append(hud);
  let last='',burst=10,lastHits=0,feedback=0,miss=false;
  return { update(f,dt,t,near,hero,camera) {
    const s=f.snapshot,active=!['idle','escape','catch'].includes(s.state);
    if(s.state!==last) {
      if(['wait','bite','catch','escape'].includes(s.state))burst=0;
      if(s.state==='catch'){portrait.src=fishPortrait(s.fish).toDataURL();name.textContent=s.fish.name;detail.textContent=`${s.size} cm · ${s.tally[s.fish.id].count} caught · best ${s.tally[s.fish.id].best} cm`;}
      last=s.state;
    }
    burst+=dt;
    ring.visible=near||active;ringMat.opacity=s.state==='bite'?.9:.20+Math.sin(t*2)*.09;ring.scale.setScalar(s.state==='bite'?1.7:1+Math.sin(t*1.6)*.12);
    ripple.visible=burst<1.2;ripple.scale.setScalar(1+burst*2.5);rippleMat.opacity=Math.max(0,1-burst/1.2)*.8;
    const a=Math.min(1,s.elapsed/.8);bob.visible=active;
    bob.position.copy(point);if(s.state==='cast'){bob.position.lerpVectors(end,point,a);bob.position.y+=Math.sin(a*Math.PI)*2.7;}
    else bob.position.y+=s.state==='bite'?-.23+Math.sin(t*20)*.07:Math.sin(t*3)*.025+(s.twitch?Math.sin(t*35)*.12:0);
    rod.visible=line.visible=active;
    const start=hero.clone().add(new THREE.Vector3(-.2,1.15,0));const tip=hero.clone().add(new THREE.Vector3(-1.7,2.5,0));
    rod.geometry.setFromPoints([start,tip]);
    const pos=line.geometry.attributes.position;for(let i=0;i<25;i++){const v=tip.clone().lerp(bob.position,i/24);v.y-=Math.sin(i/24*Math.PI)*.38;pos.setXYZ(i,v.x,v.y,v.z)}pos.needsUpdate=true;line.geometry.computeBoundingSphere();
    fish.visible=s.state==='catch';if(fish.visible){fish.material.map=textures[fishKinds.findIndex(k=>k.id===s.fish.id)];const p=Math.min(1,s.elapsed/.9);fish.position.copy(point).lerp(hero.clone().add(new THREE.Vector3(0,1.4,0)),p);fish.position.y+=Math.sin(p*Math.PI)*3;fish.material.rotation=Math.sin(p*Math.PI)*.6;fish.material.color.setScalar(s.fish.glow?2:1);}
    splash.visible=burst<.75 || (s.state==='catch'&&s.elapsed<1.5);for(let i=0;i<splash.children.length;i++){const m=splash.children[i],a=i*2.4;m.position.set(point.x+Math.cos(a)*burst*2,.2+Math.max(0,burst*4-burst*burst*6),point.z+Math.sin(a)*burst*2);if(s.state==='catch'){m.position.copy(fish.position);m.position.x+=Math.cos(a+t*2)*(.4+s.elapsed*.5);m.position.y+=Math.sin(a+t*3)*.65;m.position.z+=Math.sin(a)*.5;m.material.color.setRGB(2,1.7,.9);m.material.opacity=Math.max(0,1-s.elapsed/1.5)}else{m.material.color.set(i%2?'#c1faff':'#ffe5a3');m.material.opacity=Math.max(0,1-burst/.75)}m.rotation.z=t+i}
    if (s.hits > lastHits) { feedback = .45; miss = false; }
    if (s.state === 'escape' && lastHits >= 0 && meter.style.display === 'block') { feedback = .55; miss = true; }
    feedback = Math.max(0, feedback - dt);
    meter.style.display=s.state==='reel'||feedback>0?'block':'none';
    const p=point.clone().add(new THREE.Vector3(0,2.8,0)).project(camera);
    const halfWidth=Math.min(252,innerWidth*.38);
    meter.style.left=`${Math.max(halfWidth+16,Math.min(innerWidth-halfWidth-16,(p.x*.5+.5)*innerWidth))}px`;
    meter.style.top=`${Math.max(32,Math.min(65,(-p.y*.5+.5)*100))}%`;
    mark.style.left=`${s.mark*100}%`;
    beats.textContent=Array.from({length:s.fish?.beats||2},(_,i)=>i<s.hits?'◆':'◇').join('');
    meter.style.borderColor=feedback>0?(miss?'#a5afb3':'#ffe6a0'):'#f0d49b';
    meter.style.background=feedback>0?(miss?'#69757ce8':'#8c7135ee'):'#071022fa';
    meter.style.boxShadow=feedback>0&&!miss?'0 0 32px #ffdc85aa, inset 0 0 22px #ffe5a366':'0 3px 24px #0008';
    meter.style.opacity=feedback>0&&miss?'.6':'1';
    reelA.style.display=s.state==='reel'?'flex':'none';
    const idleHint=near && s.state==='idle';
    waterA.style.display=s.state==='bite'||idleHint?'flex':'none';
    const hint=(idleHint?new THREE.Vector3(-16,.2,-6.5):bob.position).clone().add(new THREE.Vector3(0,idleHint?.45:1.15,0)).project(camera);
    waterA.style.left=`${(hint.x*.5+.5)*innerWidth}px`;
    waterA.style.top=`${(-hint.y*.5+.5)*innerHeight}px`;
    waterA.style.opacity=idleHint?'.35':'1';
    waterA.style.transform=`translate(-50%,-100%) scale(${idleHint?1:1.15+.15*Math.sin(s.elapsed*18)})`;
    lastHits=s.hits;
    card.style.display=s.state==='catch'&&s.elapsed>.65?'block':'none';
  }};
}

// Atlas's cottage: the same whitewash, honey timber and sage thatch as its neighbours.
export function createHomesteadArt(scene, M, glow) {
  const root=new THREE.Group(); root.position.set(11,0,-58); scene.add(root);
  const stages=[new THREE.Group(),new THREE.Group(),new THREE.Group()]; stages.forEach(g=>root.add(g));
  const navy=new THREE.MeshStandardMaterial({map:M.wood.map,color:'#263958',roughness:.85});
  const box=(g,m,w,h,d,x,y,z)=>{const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;g.add(a);return a;};
  for(let x=0;x<4;x++)for(let z=0;z<3;z++)box(stages[0],M.pale,1.82,.45,1.9,(x-1.5)*1.85,.225,(z-1)*1.93);
  for(const x of [-3.2,3.2])for(const z of [-2.4,2.4])box(stages[1],M.wood,.25,3.3,.25,x,2.05,z);
  for(const z of [-2.4,2.4])box(stages[1],M.wood,6.6,.23,.23,0,3.65,z);
  box(stages[1],M.wood,6.8,.14,5,0,.53,0);
  const g=stages[2];
  const gold=M.gold.clone();gold.emissive.set('#ffcf70');gold.emissiveIntensity=1.6;
  for(const z of [-2.85,2.85]){box(g,navy,7.5,.3,.24,0,3.55,z);box(g,gold,7.5,.055,.26,0,3.42,z);}

  box(g,M.plaster,6.4,3,4.8,0,2,0);
  for(const x of [-3.25,3.25])box(g,navy,.2,3.2,5,x,2,0);
  for(const z of [-2.48,2.48])box(g,navy,6.6,.22,.16,0,.7,z);
  const sh=new THREE.Shape();sh.moveTo(-2.9,0);sh.lineTo(2.9,0);sh.lineTo(0,2.1);sh.closePath();
  const roof=new THREE.ExtrudeGeometry(sh,{depth:7.4,bevelEnabled:false});roof.translate(0,0,-3.7);roof.rotateY(Math.PI/2);roof.translate(0,3.5,0);g.add(new THREE.Mesh(roof,M.sage));
  box(g,navy,1.3,2.3,.15,-1,1.65,2.48);box(g,M.gold,.1,2.4,.18,-1.72,1.68,2.5);box(g,M.gold,.1,2.4,.18,-.28,1.68,2.5);
  const mark=box(g,gold,.4,.4,.1,-1,3.12,2.54);mark.rotation.z=Math.PI/4;
  const window=M.lit.clone();box(g,navy,1.8,1.55,.18,1.4,2.2,2.5);box(g,window,1.5,1.25,.2,1.4,2.2,2.52);
  for(const x of [.34,2.46]){box(g,navy,.42,1.5,.18,x,2.2,2.53);for(const y of [1.55,2.85])box(g,gold,.46,.07,.2,x,y,2.55);}
  box(g,M.wood,.08,1.3,.24,1.4,2.2,2.56);box(g,M.wood,1.6,.08,.24,1.4,2.2,2.56);
  box(g,M.wood,2,.3,.55,1.4,1.35,2.72);
  for(let i=0;i<7;i++){box(g,M.hedge,.23,.3,.24,.65+i*.25,1.62,2.75);box(g,i%2?M.gold:M.lit,.12,.12,.12,.65+i*.25,1.84,2.75);}
  box(g,M.wood,4,.18,1.8,-.5,.42,3.2);box(g,M.pale,2,.2,.5,-1,.15,4.1);
  box(g,M.pale,.7,2.4,.7,2,4.8,-.8);box(g,M.dark,.9,.15,.9,2,6,-.8);
  box(g,navy,.22,2,.22,-2.2,1.5,3.9);box(g,M.glass,.4,.55,.4,-2.2,2.7,3.9);
  box(g,navy,.16,1.6,.16,-2.8,.8,5.7);box(g,gold,.5,.08,.5,-2.8,1.65,5.7);box(g,M.glass,.34,.42,.34,-2.8,1.9,5.7);box(g,gold,.5,.08,.5,-2.8,2.15,5.7);
  const spill=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({map:glow,color:'#ffc477',transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));spill.rotation.x=-Math.PI/2;spill.position.set(.5,.07,4);g.add(spill);
  root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
  const smoke=[];for(let i=0;i<8;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#eddfca',transparent:true,opacity:.3,depthWrite:false}));g.add(s);smoke.push(s);}
  const dust=[];for(let i=0;i<30;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:i%2?'#ddcba4':'#ffe5a0',transparent:true,opacity:0,depthWrite:false}));root.add(s);dust.push(s);}
  return {root, update(stage,t,build,door,night){stages.forEach((g,i)=>{g.visible=stage>i;g.position.y=build>0&&i===stage-1?Math.sin(Math.min(1,(3.2-build)/2)*Math.PI)*1.7:0;});window.emissiveIntensity=(night?3:1.6)+door*2;smoke.forEach((s,i)=>{const p=(t*.14+i/8)%1;s.position.set(2+Math.sin(t+i)*p*.7,6+p*4,-.8);s.scale.setScalar(1.1+p*2.6);s.material.opacity=.32*Math.sin(p*Math.PI);});dust.forEach((s,i)=>{s.position.set(Math.sin(i*8)*4, .3+(3.2-build)*(1+i%3)*.5,Math.cos(i*5)*3);s.scale.setScalar(.35+(3.2-build)*.2);s.material.opacity=build>0?Math.min(.6,build*.3):0;});}};
}
