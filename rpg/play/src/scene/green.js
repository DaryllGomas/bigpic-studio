// green-gifts: harvested crops and caught fish feed saved, daily gifts.
import { Satchel, CROPS, giftChoices } from '../engine/satchel.js';
import { createFriends } from '../engine/friends.js';
import { greenGiftReaction } from './green-lines.js';
// SCENE: "The Green." The calm half of the game, outside the City walls at golden hour. A gentle valley: farm fields in rows,
// gardens, a glasshouse, a pond that holds the sky, a few cottages of people who chose nature, slow wanderers tending things,
// doves. The City's white-gold skyline stands on its hill in the far distance, the beacon over its crown. A dirt lane runs up
// from the City (the way back: walk down it and you are in the plaza), and at the lane's end is YOUR plot: a fence, a post with
// your name, and a bed of soil. Stand in a soil tile and hold Space (or F) to plant one seed; it is there when you come back.
// Coordinates: x east, z south; the lane runs along -Z from the City end (z = LANE_START) to the plot. 1 unit ~ 1 m.
import * as THREE from 'three';
import { MANIFEST } from './manifest.js';
import { loadAssets } from '../engine/assets.js';
import { Batch } from '../engine/world/builders.js';
import { createSky, skyUniforms } from '../engine/world/sky.js';
import { createCitySkyline } from '../engine/world/city-skyline.js';
import { PlanarReflection, occluder } from '../engine/world/reflection.js';
import { plazaOccluderFade as addOccluderFade } from '../engine/world/telor-occlusion.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { DayCycle, KEYS, ORDER } from '../engine/lighting/daycycle.js';
import { createParticles } from '../engine/fx/particles.js';
import { glowTexture, mistTexture } from '../engine/pixel/world-sprites.js';
import { SpriteCharacter, addSpriteRim } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { Ora } from '../engine/actors/ora.js';
import { DioramaCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { GreenAmbience } from '../engine/audio-green.js';
import { normalFromHeight, rng } from '../engine/pixel/paint.js';
import { Fishing, FISH } from '../engine/fishing.js';
import { GreenPlot, COLS, ROWS, TILE, tileAt, tileCentre } from '../engine/green-plot.js';
import { paintCitizenSheet, cellUV, CIT_FW, CIT_FH, COL as CCOL, VARIANTS } from './plaza/citizens-art.js';
import { Homestead } from '../engine/homestead.js';
import { createTalk } from '../engine/talk.js';
import { GREENFOLK, HOME_NAME, hasFished } from './green-lines.js';
import * as Art from './green-art.js';

// ---------------------------------------------------------------- layout
const LANE_START = 62, LANE_END = -46, LANE_HALF = 1.9;
const PLOT = { x: 0, z: -58 };                       // the centre of your soil bed
const FENCE = { hw: 6.1, hd: 5.3, gate: 1.15 };       // half-width / half-depth of the fence; half-width of the gate opening (south side)
const POND = { x: -25, z: -8, rx: 11.5, rz: 7.5 };
// The pond's harmonics expand its radius by at most .08+.05+.06.
// Enclose the entire 1.22-scale bank plus sprite clearance, not just the water.
const FOLK_POND_RX = POND.rx * 1.19 * 1.22 + .8;
const FOLK_POND_RZ = POND.rz * 1.19 * 1.22 + .8;
function folkPathDry(a, b) {
  const x = (a[0] - POND.x) / FOLK_POND_RX, z = (a[1] - POND.z) / FOLK_POND_RZ;
  const dx = (b[0] - a[0]) / FOLK_POND_RX, dz = (b[1] - a[1]) / FOLK_POND_RZ;
  const t = Math.max(0, Math.min(1, -(x * dx + z * dz) / (dx * dx + dz * dz || 1)));
  return (x + t * dx) ** 2 + (z + t * dz) ** 2 > 1;
}
const CITY = { z: -470, base: 22 };

const FIELDS = [   // x0, z0, w, d, kind
  { x0: 13, z0: 9, w: 20, d: 11, kind: 0 },
  { x0: 13, z0: -8, w: 20, d: 11, kind: 1 },
  { x0: 13, z0: -25, w: 20, d: 11, kind: 2 },
  { x0: -37, z0: 18, w: 11, d: 8, kind: 3 },
  { x0: -23, z0: 18, w: 11, d: 8, kind: 1 },
  { x0: -37, z0: 29, w: 25, d: 6, kind: 3 },
];
const COTTAGES = [   // x, z, w, d, ridgeAlongX
  { x: 25, z: -42, w: 7, d: 5.4, rx: true, name: 'a' },
  { x: 43, z: -2, w: 5.6, d: 7, rx: false, name: 'b' },
  { x: -42, z: -14, w: 7, d: 5.4, rx: true, name: 'c' },
  { x: -46, z: -36, w: 5.6, d: 6.6, rx: false, name: 'd' },
  { x: 40, z: 24, w: 7.4, d: 5.6, rx: true, name: 'e' },
];
const GLASSHOUSE = { x: -20, z: -38, w: 15, d: 8 };
const SAIL = { x: 46, z: -34 };

// golden hour: the valley's own time of day (added to the shared day cycle in THIS page only)
const dir = (az, el) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize(); };
const Cc = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
function ensureGoldenKey() {
  if (KEYS.golden) return;
  KEYS.golden = {
    zenith: Cc('#2c5aa6'), upper: Cc('#7a98d6'), horizon: Cc('#ffd29c'), glow: Cc('#ffc577', 1.9), below: Cc('#6f7e5a'),
    skySun: dir(12, 7), sunColor: Cc('#ffd49a', 1.6), sunDisc: 0.9,
    moonDir: dir(-17, -40), moonColor: Cc('#e9eeff'), moonGlow: 0, stars: 0.0,
    cloudLit: Cc('#ffdcb4', 1.55), cloudDark: Cc('#9486b4'), cloudCover: 0.5,
    lightDir: dir(16, 13), lightColor: Cc('#ffc983'), lightInt: 6.4,
    hemiSky: Cc('#8d94d6'), hemiGround: Cc('#5a5236'), hemiInt: 1.3,
    haze: 0.0008, fogA: 0.0022, fogB: 0.06, fogBase: -2, hazeMax: 0.42,
    exposure: 1.36, bloom: 0.3, sat: 1.0, contrast: 1.2, vignette: 0.42,
    shadowTint: Cc('#a8b4ff'), highTint: Cc('#ffe8c4').multiplyScalar(1.06), lift: Cc('#080a14'),
    shaft: 0.32, shaftColor: Cc('#ffd49a'),
    rim: Cc('#ffd18a', 1.15),
    windows: 2.0, lanterns: 3.4, glyphs: 1.6, seams: 0.5, colossus: 0, banners: 0.4, lanternLight: 1.25, oraLight: 0.8,
    fireflies: 0.3, motes: 1.4, mist: 0.5,
  };
  ORDER.unshift('golden');
}

const inRect = (x, z, x0, z0, x1, z1, pad = 0) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Ground height: flat across the valley floor, rising to the rim, and a broad plateau far north for the City. */
export function heightAt(x, z) {
  const r = Math.hypot(x, (z + 30) * 0.8);
  const rim = sstep(100, 235, r) * 15;
  const bump = (Math.sin(x * 0.043 + 1.3) + Math.sin(z * 0.051 + 0.4) + Math.sin((x + z) * 0.031)) * 2.2 * sstep(70, 150, r);
  const pl = (1 - sstep(120, 210, Math.hypot(x, (z - CITY.z) * 0.9))) * CITY.base;
  return Math.max(rim + bump, pl);
}

export async function createGreen(engine, { time = null, from = null, go = null } = {}) {
  ensureGoldenKey();
  const q = new URLSearchParams(location.search);
  const start = q.has('time') ? q.get('time') : 'golden';
  const A = await loadAssets(MANIFEST);
  const scene = engine.scene;
  const R = rng(20261011);
  const roles = { windows: [], lanterns: [], glyphs: [], seams: [] };
  const rep = (t, tile) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData.tile = tile; return t; };
  const std = (o, tile, role, base = 1) => {
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.tile = tile;
    if (role) { roles[role].push(m); m.userData.base = base; }
    return m;
  };

  // ---------------------------------------------------------------- materials
  const meadowT = Art.paintMeadow(12), dirtT = Art.paintDirt(8), woodT = Art.paintWood(9), plasterT = Art.paintPlaster(4),
    clayT = Art.paintClay(3), thatchT = Art.paintThatchSage(2), bedT = Art.paintBed(6);
  const M = {
    meadow: std({ map: meadowT, color: '#efe9b4', roughness: 1, envMapIntensity: 0.15 }, 6),
    dirt: std({ map: dirtT, roughness: 1, envMapIntensity: 0.1 }, 4),
    bed: std({ map: bedT, roughness: 1, envMapIntensity: 0.1 }, 3),
    wood: std({ map: woodT, roughness: 0.85, envMapIntensity: 0.2 }, 2.5),
    plaster: std({ map: plasterT, roughness: 0.9, envMapIntensity: 0.3 }, 3),
    clay: std({ map: clayT, roughness: 0.7, envMapIntensity: 0.4 }, 3),
    sage: std({ map: thatchT, roughness: 0.95, envMapIntensity: 0.2 }, 3),
    pale: std({ map: A.pale.map, normalMap: A.pale.normalMap, roughness: 0.92, envMapIntensity: 0.3, color: '#fff3dc' }, A.pale.tile),
    dark: std({ map: A.dark.map, normalMap: A.dark.normalMap, roughness: 0.85, envMapIntensity: 0.35 }, A.dark.tile),
    roof: std({ map: A.roof.map, normalMap: A.roof.normalMap, roughness: 0.55, envMapIntensity: 0.6, color: '#e8d6a8' }, A.roof.tile),
    brass: std({ map: A.brass.map, roughnessMap: A.brass.ormMap, metalnessMap: A.brass.ormMap, roughness: 1, metalness: 1, envMapIntensity: 1.2 }, 1),
    gold: std({ color: '#d4b06a', metalness: 1, roughness: 0.28, envMapIntensity: 1.4, emissive: '#7a5c2c', emissiveIntensity: 0.4 }, 1, 'seams', 0.8),
    cyan: std({ color: '#0d3333', emissive: '#3fd3c8', emissiveIntensity: 2.0, roughness: 0.4 }, 1, 'glyphs', 1),
    glass: std({ map: A.lantern.map, emissiveMap: A.lantern.emissiveMap, emissive: 0xffffff, emissiveIntensity: 3, roughness: 0.3 }, 1, 'lanterns', 1),
    flame: std({ color: '#ffb060', emissive: '#ffa040', emissiveIntensity: 6 }, 1, 'lanterns', 2),
    pane: new THREE.MeshStandardMaterial({ color: '#cfeeee', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.26, envMapIntensity: 2.0, depthWrite: false, side: THREE.DoubleSide }),
    hedge: std({ map: Art.paintThatchSage(5), color: '#9be07a', roughness: 1 }, 2),
  };
  for (const k of ['win0', 'win1', 'win2'])
    M[k] = std({ map: A[k].map, normalMap: A[k].normalMap, emissiveMap: A[k].emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.88, envMapIntensity: 0.3, color: '#fff0d8' }, A[k].tile, 'windows', 1);
  for (const k of ['plaster', 'clay', 'sage', 'wood', 'pale', 'roof', 'brass', 'gold', 'glass', 'flame', 'win0', 'win1', 'win2', 'cyan', 'dark']) addOccluderFade(M[k]);
  // a window that glows warm (cottages): an emissive pane
  M.lit = std({ color: '#3a2a14', emissive: '#ffb454', emissiveIntensity: 1.4, roughness: 0.5 }, 1, 'windows', 1.0);
  addOccluderFade(M.lit); addOccluderFade(M.hedge);
  // Baked window spill: soft pools add warmth without spending more point lights.
  const windowSpill = new THREE.MeshBasicMaterial({ map: glowTexture(64, 0, 0.3), color: '#ffc477', transparent: true, opacity: 0.26, depthWrite: false, blending: THREE.AdditiveBlending });
  const B = new Batch(M);
  const lights = new LightPool(scene, 12);
  const lanternPos = [];
  engine.camera.layers.enable(1);
  scene.add(createSky());

  // ---------------------------------------------------------------- ground (flat valley floor, rim hills, the City's hill)
  {
    const SX = 640, SZ = 760, nx = 160, nz = 190;
    const g = new THREE.PlaneGeometry(SX, SZ, nx, nz); g.rotateX(-Math.PI / 2); g.translate(0, 0, -200);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, heightAt(x, z)); uv.setXY(i, x / 6, z / 6); }
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, M.meadow); ground.receiveShadow = true; scene.add(ground);
  }
  // the lane: a ribbon of packed earth from the City end to the plot, with soft verges of paler grass-edge
  {
    const g = new THREE.PlaneGeometry(LANE_HALF * 2, LANE_START - LANE_END + 60, 1, 1); g.rotateX(-Math.PI / 2);
    g.translate(0, 0.03, (LANE_START + 60 + LANE_END) / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
    const lane = new THREE.Mesh(g, M.dirt); lane.receiveShadow = true; scene.add(lane);
    // the apron before your plot and the side paths between the fields
    const apron = new THREE.Mesh(new THREE.CircleGeometry(4.6, 24), M.dirt); apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.032, LANE_END + 1); apron.receiveShadow = true; scene.add(apron);
    const path = (x0, z0, x1, z1, w = 1.7) => {
      const L = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(w, L);
      g.rotateX(-Math.PI / 2); g.rotateY(Math.atan2(x1 - x0, z1 - z0)); g.translate((x0 + x1) / 2, 0.031, (z0 + z1) / 2);
      const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 4, p.getZ(i) / 4);
      const m = new THREE.Mesh(g, M.dirt); m.receiveShadow = true; scene.add(m);
    };
    path(LANE_HALF, 14, 36, 14); path(LANE_HALF, -4, 36, -4); path(LANE_HALF, -21, 36, -21);
    path(-LANE_HALF, 15, -36, 15); path(-LANE_HALF, 27, -36, 27);
    path(LANE_HALF, -40, 25, -40); path(-LANE_HALF, -34, -20, -34);
    path(9, -44, 9, 26, 1.6);
    path(-LANE_HALF, -8, -13, -8);
  }

  // ---------------------------------------------------------------- crops (one instanced mesh for every plant)
  const cropTex = Art.paintCrops();
  const MAXC = 3000;
  const KIND_SIZE = [[0.62, 1.05], [0.86, 0.72], [0.66, 1.25], [0.62, 0.82]];
  const cropGeo = (() => {
    const a = new THREE.PlaneGeometry(1, 1); a.translate(0, 0.5, 0);
    const b = a.clone(); b.rotateY(Math.PI / 2);
    const merged = new THREE.BufferGeometry();
    const pos = [], nor = [], uvs = [], idx = [];
    for (const [k, gm] of [a, b].entries()) {
      const base = pos.length / 3;
      for (let i = 0; i < gm.attributes.position.count; i++) { pos.push(gm.attributes.position.getX(i), gm.attributes.position.getY(i), gm.attributes.position.getZ(i)); nor.push(0, 1, 0); uvs.push(gm.attributes.uv.getX(i), gm.attributes.uv.getY(i)); }
      for (const i of gm.index.array) idx.push(base + i);
    }
    merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    merged.setIndex(idx);
    return merged;
  })();
  const cropCell = new THREE.InstancedBufferAttribute(new Float32Array(MAXC * 2), 2); cropCell.setUsage(THREE.DynamicDrawUsage);
  cropGeo.setAttribute('aCell', cropCell);
  const cropTime = { value: 0 };
  const foliageRim = { value: new THREE.Color(1, 0.7, 0.4) };
  const cropMat = new THREE.MeshStandardMaterial({ map: cropTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0, envMapIntensity: 0.2 });
  {
    const prev = cropMat.onBeforeCompile;
    cropMat.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      sh.uniforms.uCell = { value: 0.25 }; sh.uniforms.uSway = cropTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aCell; uniform float uCell; uniform float uSway;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = uv * uCell + aCell;\n#endif')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float ph = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.6; transformed.x += sin(uSway * 1.3 + ph) * 0.06 * position.y; transformed.z += sin(uSway * 1.1 + ph * 1.3) * 0.03 * position.y; }`);
    };
    cropMat.customProgramCacheKey = () => 'green-crops';
    addSpriteRim(cropMat, new THREE.Vector2(1 / 64, 1 / 64), foliageRim, 0.8);
  }
  const crops = new THREE.InstancedMesh(cropGeo, cropMat, MAXC);
  crops.frustumCulled = false; crops.castShadow = false; crops.receiveShadow = false;
  scene.add(crops);
  let cropN = 0;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const setCrop = (i, x, y, z, kind, stage, k = 1, rot = 0) => {
    const [w, h] = KIND_SIZE[kind];
    const grow = [0.8, 0.9, 1, 1][stage];
    _q.setFromAxisAngle(_up, rot);
    _m.compose(_p.set(x, y, z), _q, _s.set(w * k * (stage === 0 ? 0.9 : 1), h * grow * k, w * k));
    crops.setMatrixAt(i, _m);
    cropCell.setXY(i, kind * 0.25, 1 - (stage + 1) * 0.25);
  };
  const addCrop = (x, z, kind, stage, k = 1) => { if (cropN < MAXC - 400) setCrop(cropN++, x, 0.05, z, kind, stage, k, R() * 3); };
  const bedBoxes = [];
  const field = (f) => {
    B.box('bed', f.w, 0.1, f.d, f.x0 + f.w / 2, 0.05, f.z0 + f.d / 2);
    bedBoxes.push(f);
    for (let z = f.z0 + 0.7; z < f.z0 + f.d - 0.3; z += 0.9) for (let x = f.x0 + 0.5; x < f.x0 + f.w - 0.3; x += 0.62) {
      const st = R() < 0.14 ? 2 : 3;
      addCrop(x + (R() - 0.5) * 0.12, z + (R() - 0.5) * 0.12, f.kind, st, 0.92 + R() * 0.2);
    }
  };
  FIELDS.forEach(field);

  // ---------------------------------------------------------------- the pond (it holds the sky), its shore, reeds, lilies
  const mirror = new PlanarReflection(engine.renderer, { y: 0.045, scale: 0.4 });
  const rippleH = Art.rippleHeights(64, 64, 3);
  const rippleN = normalFromHeight(rippleH, 64, 64, 2.2).texture({ kind: 'data', repeat: true, mips: true });
  rippleN.repeat.set(0.09, 0.09);
  const waterMat = new THREE.MeshStandardMaterial({ color: '#344f58', roughness: 0.12, metalness: 0.0, normalMap: rippleN, normalScale: new THREE.Vector2(0.2, 0.2), envMapIntensity: 1.1 });
  mirror.apply(waterMat, { base: 0.48, streak: 0.0065 });
  mirror.uniforms.uReflStrength.value = 0.8;
  const pondShape = (s) => {
    const sh = new THREE.Shape();
    for (let i = 0; i <= 56; i++) {
      const a = (i / 56) * Math.PI * 2, n = 1 + Math.sin(a * 3 + 0.7) * 0.08 + Math.sin(a * 5 + 2) * 0.05 + Math.sin(a * 2 - 1) * 0.06;
      const x = Math.cos(a) * POND.rx * s * n, y = Math.sin(a) * POND.rz * s * n;
      i ? sh.lineTo(x, y) : sh.moveTo(x, y);
    }
    return sh;
  };
  {
    const bank = new THREE.Mesh(new THREE.ShapeGeometry(pondShape(1.22)), M.dirt); bank.geometry.rotateX(-Math.PI / 2); bank.position.set(POND.x, 0.034, POND.z);
    const bu = bank.geometry.attributes.uv; for (let i = 0; i < bu.count; i++) bu.setXY(i, bank.geometry.attributes.position.getX(i) / 4, bank.geometry.attributes.position.getZ(i) / 4);
    bank.receiveShadow = true; scene.add(bank);
    const wg = new THREE.ShapeGeometry(pondShape(1.0)); wg.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(wg, waterMat); water.position.set(POND.x, 0.045, POND.z); water.layers.set(1); water.receiveShadow = true; scene.add(water);
    // stones around the rim
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + R() * 0.2, rr = 1.13 + R() * 0.12, s = 0.25 + R() * 0.4;
      const g = new THREE.DodecahedronGeometry(s, 0); g.scale(1, 0.55, 1.1); g.rotateY(R() * 6);
      g.translate(POND.x + Math.cos(a) * POND.rx * rr, 0.08, POND.z + Math.sin(a) * POND.rz * rr);
      B.add('dark', g);
    }
    // lily pads
    const lg = new THREE.CircleGeometry(0.48, 14, 0.18, Math.PI * 2 - 0.36); lg.rotateX(-Math.PI / 2);
    const lilies = new THREE.InstancedMesh(lg, new THREE.MeshStandardMaterial({ color: '#4fa04a', roughness: 0.7, emissive: '#1a3a1a', emissiveIntensity: 0.4 }), 26);
    const flw = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4), new THREE.MeshStandardMaterial({ color: '#ffd9ea', emissive: '#ff8ab8', emissiveIntensity: 0.5, roughness: 0.6 }), 8);
    let fi = 0;
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.82, x = POND.x + Math.cos(a) * POND.rx * rr, z = POND.z + Math.sin(a) * POND.rz * rr;
      _q.setFromAxisAngle(_up, R() * 6); const sc = 0.8 + R() * 0.9;
      lilies.setMatrixAt(i, _m.compose(_p.set(x, 0.06, z), _q, _s.set(sc, 1, sc)));
      if (i % 3 === 0 && fi < 8) flw.setMatrixAt(fi++, _m.compose(_p.set(x, 0.12, z), _q.identity(), _s.set(1, 0.8, 1)));
    }
    flw.count = fi; scene.add(lilies, flw);
    // a little jetty on the east bank
    for (let k = 0; k < 20; k++) B.box('wood', 0.36, 0.12, 2.4, -16.8 + k * 0.38, 0.20, POND.z + 1.5);
    for (const x of [-16.5, -13.5, -10]) for (const z of [-7.55,-5.45]) B.box('wood', .18, .9, .18, x, .08, z);
    for (const sz of [-1, 1]) B.box('wood', 0.14, 0.5, 0.14, POND.x + POND.rx - 0.2, 0.1, POND.z + 1.5 + sz * 0.7);
  }

  // ---------------------------------------------------------------- buildings
  const gable = (key, cx, cy, cz, w, d, h, ridgeX, over = 0.5) => {
    // a gable roof as an extruded triangle (ridge along x if ridgeX)
    const span = (ridgeX ? d : w) + over * 2, len = (ridgeX ? w : d) + over * 2;
    const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2);
    if (ridgeX) g.rotateY(Math.PI / 2);
    g.translate(cx, cy, cz);
    B.add(key, g, { tile: 3 });
  };
  const doorLight = (x, y, z, i = 16, d = 9, col = '#ffb25a') => lights.add({ pos: new THREE.Vector3(x, y, z), color: col, intensity: i, distance: d, flicker: 0.1, role: 'lantern' });
  const lantern = (x, y, z, scale = 1, light = true) => {
    B.box('dark', 0.34 * scale, 0.06, 0.34 * scale, x, y + 0.03, z);
    const g = new THREE.BoxGeometry(0.24 * scale, 0.36 * scale, 0.24 * scale); g.translate(x, y + 0.06 + 0.18 * scale, z); B.add('glass', g, { uv: false });
    B.pyramid('dark', 0.38 * scale, 0.38 * scale, 0.18 * scale, x, y + 0.06 + 0.36 * scale, z);
    B.cone('gold', 0.04, 0.18, x, y + 0.06 + 0.36 * scale + 0.16 * scale, z, 4);
    const p = new THREE.Vector3(x, y + 0.06 + 0.18 * scale, z); lanternPos.push(p);
    if (light) lights.add({ pos: p, color: '#ffa853', intensity: 18 * scale, distance: 11, flicker: 0.12, role: 'lantern' });
  };
  const cottage = (c) => {
    const { x, z, w, d, rx } = c, wallH = 3.0, roofKey = c.name === 'b' || c.name === 'd' ? 'sage' : 'clay';
    B.box('pale', w + 0.5, 0.5, d + 0.5, x, 0.25, z);                         // stone plinth
    B.box('plaster', w, wallH, d, x, 0.5 + wallH / 2, z);
    // timber frame
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box('wood', 0.28, wallH, 0.28, x + sx * w / 2, 0.5 + wallH / 2, z + sz * d / 2);
    B.box('wood', w + 0.12, 0.2, d + 0.12, x, 0.5 + wallH, z);
    gable(roofKey, x, 0.5 + wallH + 0.1, z, w, d, 2.4, rx, 0.6);
    // chimney
    B.box('pale', 0.7, 2.2, 0.7, x + (rx ? w * 0.28 : 0.0), 0.5 + wallH + 1.4, z + (rx ? 0 : d * 0.2));
    // front (south, +z) door and windows, warm and lit; a cyan glyph by the door; a gold lintel
    const fz = z + d / 2 + 0.03;
    B.box('wood', 1.1, 2.1, 0.12, x - (w > 6 ? 1.2 : 0), 0.5 + 1.05, fz);
    B.box('gold', 1.35, 0.1, 0.16, x - (w > 6 ? 1.2 : 0), 0.5 + 2.2, fz);
    B.box('lit', 0.95, 0.95, 0.1, x + (w > 6 ? 1.6 : 1.4), 0.5 + 1.55, fz);
    B.box('wood', 1.15, 0.1, 0.16, x + (w > 6 ? 1.6 : 1.4), 0.5 + 1.0, fz + 0.03);
    B.box('wood', 0.1, 0.95, 0.14, x + (w > 6 ? 1.6 : 1.4), 0.5 + 1.55, fz + 0.02);
    B.box('cyan', 0.12, 0.7, 0.1, x - (w > 6 ? 1.2 : 0) - 0.95, 0.5 + 1.5, fz);
    B.box('lit', 0.8, 0.8, 0.1, x - w / 2 - 0.03, 0.5 + 1.6, z, { rotY: 0 });
    for (const side of [false, true]) {
      const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), windowSpill);
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(side ? x - w / 2 - 1.2 : x + (w > 6 ? 1.6 : 1.4), 0.04, side ? z : fz + 1.4);
      if (side) spill.rotation.z = Math.PI / 2;
      scene.add(spill);
    }
    // a small porch light and a planter box
    lantern(x - (w > 6 ? 1.2 : 0) + 0.85, 0.5 + 2.25, fz + 0.15, 0.8, false);
    doorLight(x, 2.2, z + d / 2 + 1.2, 10, 8);
    B.box('wood', 1.3, 0.3, 0.36, x + (w > 6 ? 1.6 : 1.4), 0.5 + 0.9, fz + 0.28);
    // a little yard: low fence and a few flowers
    for (let i = -3; i <= 3; i++) { B.box('wood', 0.1, 0.62, 0.1, x + i * 1.2, 0.31, z + d / 2 + 3.4); }
    B.box('wood', 7.4, 0.07, 0.07, x, 0.45, z + d / 2 + 3.4);
    B.box('wood', 7.4, 0.07, 0.07, x, 0.25, z + d / 2 + 3.4);
    for (let i = 0; i < 5; i++) addCrop(x - 2.6 + i * 1.3 + (R() - 0.5) * 0.3, z + d / 2 + 1.6 + R() * 1.2, 3, 3, 0.9);
    for (let i = 0; i < 3; i++) addCrop(x + (R() - 0.5) * (w - 1), z - d / 2 - 0.9, 1 + (i % 2), 3, 0.9);
  };
  COTTAGES.forEach(cottage);

  // the glasshouse: brass ribs, a low stone course, glass walls and a pitched glass roof, green and warm inside
  {
    const { x, z, w, d } = GLASSHOUSE, wallH = 3.2;
    B.box('pale', w + 0.4, 0.7, d + 0.4, x, 0.35, z);
    for (let i = 0; i <= 10; i++) {
      const px = x - w / 2 + (w * i) / 10;
      B.box('brass', 0.14, wallH, 0.14, px, 0.7 + wallH / 2, z + d / 2); B.box('brass', 0.14, wallH, 0.14, px, 0.7 + wallH / 2, z - d / 2);
    }
    for (const sx of [-1, 1]) for (let i = 0; i <= 5; i++) B.box('brass', 0.14, wallH, 0.14, x + sx * w / 2, 0.7 + wallH / 2, z - d / 2 + (d * i) / 5);
    B.box('brass', w + 0.2, 0.14, 0.18, x, 0.7 + wallH, z + d / 2); B.box('brass', w + 0.2, 0.14, 0.18, x, 0.7 + wallH, z - d / 2);
    B.box('brass', w + 0.2, 0.1, 0.1, x, 0.7 + wallH + 2.4, z);
    const rs = new THREE.Shape(); rs.moveTo(-d / 2, 0); rs.lineTo(d / 2, 0); rs.lineTo(0, 2.4); rs.closePath();
    const rg = new THREE.ExtrudeGeometry(rs, { depth: w, bevelEnabled: false }); rg.translate(0, 0, -w / 2); rg.rotateY(Math.PI / 2); rg.translate(x, 0.7 + wallH, z);
    const roofMesh = new THREE.Mesh(rg, M.pane); roofMesh.renderOrder = 6; scene.add(roofMesh);
    for (let i = 0; i <= 10; i++) { const px = x - w / 2 + (w * i) / 10; for (const sd of [-1, 1]) { const rb = new THREE.BoxGeometry(0.1, 0.1, Math.hypot(d / 2, 2.4)); rb.rotateX(sd * Math.atan2(2.4, d / 2)); rb.translate(px, 0.7 + wallH + 1.2, z + sd * d / 4); B.add('brass', rb, { uv: false }); } }
    const wall = (ww, hh, dd, px, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), M.pane); m.position.set(px, 0.7 + hh / 2, pz); m.renderOrder = 6; scene.add(m); };
    wall(w, wallH, 0.05, x, z + d / 2); wall(w, wallH, 0.05, x, z - d / 2); wall(0.05, wallH, d, x - w / 2, z); wall(0.05, wallH, d, x + w / 2, z);
    // inside: warm glow, benches and plants
    for (const dz of [-2, 2]) { B.box('wood', w - 2, 0.12, 1.2, x, 0.9, z + dz); }
    for (let i = 0; i < 20; i++) for (const dz of [-2, 2]) { if (i % 1 === 0) addCrop(x - w / 2 + 1.4 + i * 0.64, z + dz + (R() - 0.5) * 0.3, 1 + ((i >> 2) % 3), 3, 0.9); }
    for (let i = 0; i < 6; i++) addCrop(x - 5 + i * 2, z - 0.1, 2, 3, 1.3);
    lights.add({ pos: new THREE.Vector3(x, 2.4, z), color: '#ffd68a', intensity: 40, distance: 14, flicker: 0.04, role: 'lantern', priority: 1.2 });
    lights.add({ pos: new THREE.Vector3(x + 4, 2.2, z + d / 2 + 0.6), color: '#ffd68a', intensity: 14, distance: 9, flicker: 0.04, role: 'lantern' });
    lantern(x + w / 2 + 0.3, 0.7, z + d / 2 + 1.3, 0.9, false);
  }

  // a slim wind-sail tower: white stone, a gold ring, three tall sails that turn slowly (the valley's power)
  const sail = new THREE.Group();
  {
    B.cyl('pale', 1.5, 22, SAIL.x, 0, SAIL.z, 12, 0.8);
    B.cyl('gold', 1.0, 0.4, SAIL.x, 10, SAIL.z, 12, 1.05);
    B.cyl('dark', 0.9, 0.5, SAIL.x, 22, SAIL.z, 12, 0.5);
    B.cone('gold', 0.2, 1.6, SAIL.x, 22.5, SAIL.z, 6);
    sail.position.set(SAIL.x, 21, SAIL.z + 1.2);
    for (let k = 0; k < 3; k++) {
      const arm = new THREE.Group(); arm.rotation.z = (k / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.9, 10, 0.08), M.pale); blade.position.y = 6; arm.add(blade);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 10, 0.12), M.gold); edge.position.set(0.45, 6, 0); arm.add(edge);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M.cyan); tip.position.set(0, 11.2, 0); arm.add(tip);
      for (const m of arm.children) m.castShadow = true;
      sail.add(arm);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), M.gold); sail.add(hub);
    scene.add(sail);
  }

  // ---------------------------------------------------------------- the lane's gate, lamp posts, the fences
  {
    // the Green's gate at the City end: two pale posts with gold caps and lanterns, white and gold like the City
    for (const s of [-1, 1]) {
      B.box('pale', 0.9, 3.4, 0.9, s * (LANE_HALF + 1.1), 1.7, LANE_START - 2); B.box('dark', 1.1, 0.2, 1.1, s * (LANE_HALF + 1.1), 3.5, LANE_START - 2);
      B.box('gold', 0.92, 0.07, 0.92, s * (LANE_HALF + 1.1), 3.1, LANE_START - 2);
      lantern(s * (LANE_HALF + 1.1), 3.6, LANE_START - 2, 1.1);
      for (let i = 1; i <= 5; i++) { B.box('pale', 0.34, 0.8, 0.34, s * (LANE_HALF + 1.1 + i * 2.2), 0.4, LANE_START - 2); B.box('wood', 2.2, 0.1, 0.12, s * (LANE_HALF + 1.1 + i * 2.2 - 1.1), 0.7, LANE_START - 2); }
    }
    for (let z = LANE_START - 14; z > LANE_END + 6; z -= 14) for (const s of [-1, 1]) {
      if ((z / 14 | 0) % 2 === 0 && s === -1) continue;
      B.box('wood', 0.14, 2.3, 0.14, s * (LANE_HALF + 0.55), 1.15, z); B.box('gold', 0.18, 0.06, 0.18, s * (LANE_HALF + 0.55), 2.28, z);
      lantern(s * (LANE_HALF + 0.55), 2.3, z, 0.85);
    }
    // fences between fields and lane, low and honey-coloured
    const fence = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 1.6), ang = Math.atan2(x1 - x0, z1 - z0);
      for (let i = 0; i <= n; i++) B.box('wood', 0.12, 0.85, 0.12, x0 + ((x1 - x0) * i) / n, 0.42, z0 + ((z1 - z0) * i) / n);
      for (const hy of [0.35, 0.7]) B.box('wood', 0.07, 0.08, L, (x0 + x1) / 2, hy, (z0 + z1) / 2, { rotY: ang });
    };
    fence(10.4, 27, 10.4, -27); fence(-10.4, 14, -10.4, 36);
    // your plot: fence all round with a gate gap on the south side facing the lane
    const { x: px, z: pz } = PLOT, hw = FENCE.hw, hd = FENCE.hd, gt = FENCE.gate;
    fence(px - hw, pz - hd, px + hw, pz - hd); fence(px - hw, pz - hd, px - hw, pz + hd); fence(px + hw, pz - hd, px + hw, pz + hd);
    fence(px - hw, pz + hd, px - gt, pz + hd); fence(px + gt, pz + hd, px + hw, pz + hd);
    for (const s of [-1, 1]) { B.box('wood', 0.22, 1.5, 0.22, px + s * gt, 0.75, pz + hd); B.box('gold', 0.26, 0.06, 0.26, px + s * gt, 1.5, pz + hd); }
    B.box('wood', 2 * gt + 0.3, 0.14, 0.14, px, 1.55, pz + hd); B.box('gold', 0.4, 0.4, 0.06, px, 1.78, pz + hd);
    // bed edging
    const bw = COLS * TILE, bd = ROWS * TILE;
    for (const sz of [-1, 1]) B.box('wood', bw + 0.5, 0.2, 0.25, px, 0.1, pz + sz * (bd / 2 + 0.12));
    for (const sx of [-1, 1]) B.box('wood', 0.25, 0.2, bd, px + sx * (bw / 2 + 0.12), 0.1, pz);
    // the name post: tall honey post, a swinging-plate sign with your name, a lantern above
    const nx = px - hw - 2.0, nz = pz + hd + 1.4;
    B.box('wood', 0.2, 2.9, 0.2, nx, 1.45, nz); B.box('wood', 1.7, 0.1, 0.1, nx + 0.9, 2.55, nz); B.box('gold', 0.24, 0.07, 0.24, nx, 2.92, nz);
    lantern(nx + 1.75, 2.2, nz, 0.7);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshStandardMaterial({ map: Art.nameTexture(HOME_NAME), roughness: 0.8, emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0, side: THREE.DoubleSide }));
    sign.position.set(nx + 0.9, 2.2, nz + 0.07); sign.castShadow = true; scene.add(sign);
    // a small tool shed, a rain barrel, a wheelbarrow
    B.box('wood', 2.4, 1.8, 1.8, px + hw - 1.6, 0.9, pz - hd + 1.3); gable('clay', px + hw - 1.6, 1.8, pz - hd + 1.3, 2.4, 1.8, 0.9, true, 0.25);
    B.cyl('wood', 0.5, 0.9, px - hw + 0.9, 0, pz - hd + 0.8, 10, 0.45); B.box('dark', 1.0, 0.07, 1.0, px - hw + 0.9, 0.92, pz - hd + 0.8);
  }

  B.build(scene);

  // the plot's bed: a soil grid, each tile its own square
  const soilT = Art.paintSoilTile(5); soilT.repeat.set(COLS, ROWS);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(COLS * TILE, ROWS * TILE), new THREE.MeshStandardMaterial({ map: soilT, roughness: 1, envMapIntensity: 0.1, color:'#e9cea2', emissive:'#9d7546', emissiveIntensity:.18 }));
  bed.rotation.x = -Math.PI / 2; bed.position.set(PLOT.x, 0.06, PLOT.z); bed.receiveShadow = true; scene.add(bed);
  // a soft glow under the tile you stand in (the cue is the soil itself, no words)
  const cueMat = new THREE.MeshBasicMaterial({ map: glowTexture(64, 0.0, 0.5), color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const cue = new THREE.Mesh(new THREE.PlaneGeometry(TILE * 1.15, TILE * 1.15), cueMat); cue.rotation.x = -Math.PI / 2; cue.renderOrder = 3; cue.position.y = 0.09; scene.add(cue);

  const glintMap=Art.paintHarvestGlint();
  const ripeGlints = Array.from({length:COLS*ROWS},()=>{
    const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glintMap,color:'#ffe4a0',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    m.visible=false;scene.add(m);return m;
  });

  // ---------------------------------------------------------------- your plot: state -> sprouts
  let storage = null; try { storage = window.localStorage; } catch {}
  const plot = new GreenPlot(storage, () => Date.now(), {fastgrow:new URLSearchParams(location.search).get('fastgrow')==='1'});
  const satchel = new Satchel(storage);
  const friends = createFriends({storage});
  const homestead = new Homestead(storage);
  const fishing = new Fishing(storage);
  const fishingArt = Art.createFishingArt(scene, FISH);
  let fishActionHeld = false, fishPointerPress = false, fishPrevious = 'idle';
  // Preserve quick clicks that begin and end between two simulation frames.
  window.addEventListener('pointerdown', e => { if (e.button === 0 && e.target?.id === 'view') fishPointerPress = true; });
  const atDock = () => Math.abs(hero.group.position.x + 16) < 1.25 && Math.abs(hero.group.position.z + 6.5) < 1;
  const PLOT_BASE = MAXC - 400;            // the last 400 instance slots belong to the plot (4 per tile)
  const pops = new Map();                  // tile key -> seconds since planted (a little pop-in)
  const refreshPlot = () => {
    for (let i = 0; i < COLS * ROWS * 4; i++) crops.setMatrixAt(PLOT_BASE + i, _m.makeScale(0, 0, 0));
    for (const t of plot.planted()) {
      const c0 = tileCentre(t.c, t.r), n = t.stage + 1, key = t.c + ',' + t.r, pop = pops.get(key);
      const k = pop === undefined ? 1 : Math.min(1, pop / 0.7), e = 1 - Math.pow(1 - k, 3) * Math.cos(k * 9) * (1 - k);
      const spots = [[0, 0], [-0.34, 0.2], [0.34, 0.12], [0.02, -0.38]];
      for (let j = 0; j < n; j++) {
        const o = spots[j], sp = (n === 1 ? 0 : 1);
        setCrop(PLOT_BASE + (t.r * COLS + t.c) * 4 + j, PLOT.x + c0.x + o[0] * sp, 0.07, PLOT.z + c0.z + o[1] * sp, t.kind, Math.min(3, Math.max(0, t.stage)), (1.4 + 0.1 * ((j * 7 + t.c) % 3) * 0.5) * e, (t.c * 3 + t.r * 5 + j) * 1.7);
      }
    }
    crops.instanceMatrix.needsUpdate = true; cropCell.needsUpdate = true;
    crops.count = MAXC;
  };
  // all field crops are written once; then the plot
  crops.count = MAXC;
  const writeFieldsDone = () => { crops.instanceMatrix.needsUpdate = true; cropCell.needsUpdate = true; };
  for (let i = cropN; i < MAXC; i++) crops.setMatrixAt(i, _m.makeScale(0, 0, 0));
  refreshPlot(); writeFieldsDone();

  // ---------------------------------------------------------------- trees, bushes, reeds (billboards)
  const billboards = [];
  const spriteMat = (map) => { map.magFilter = THREE.NearestFilter; return new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }); };
  const treeStyles = [
    [3, ['#143018', '#1d4a22', '#2b6a2c', '#418b38', '#63ad46', '#8bcb55', '#b8e270'], null, 'round'],
    [29, ['#29351b', '#3c5027', '#536e33', '#718e42', '#91ac58', '#b2c978', '#d6e3a1'], null, 'wide'],
    [41, ['#15352e', '#245447', '#36715a', '#528d6a', '#75aa7f', '#9ac598', '#c4dfb5'], null, 'tall'],
    [17, ['#67434b', '#92606a', '#bc858c', '#dda8ad', '#efc4c6', '#f8dedb', '#fff1e6'], ['#ffe3dc', '#f5baca', '#fff4ef'], 'wide'],
    [53, ['#58614a', '#7b8568', '#a5ad8b', '#ccd1b5', '#e5e6d2', '#f5f2e5', '#fffbee'], ['#fffdf4', '#e9e6d9', '#ffffff'], 'tall'],
    [67, ['#665837', '#8e7c49', '#b5a168', '#d6c18b', '#ecdbab', '#f8ebc9', '#fff6df'], ['#fff0c4', '#ffe2a3', '#fff8e4'], 'round'],
    [79, ['#102a26', '#193c32', '#25503c', '#38654a', '#527e59', '#72966b', '#9eb388'], null, 'conifer'],
  ];
  const treeMats = treeStyles.map(([seed, ramp, blossom, shape]) => spriteMat(Art.paintLeafyTree(seed, ramp, blossom, shape).map));
  const bushMat = spriteMat(Art.paintFlowerBush(5).map), reedMat = spriteMat(Art.paintReeds(7).map);
  for (const [m, tx] of [...treeMats.map(m => [m, [48, 72]]), [bushMat, [32, 18]], [reedMat, [24, 32]]]) { addSpriteRim(m, new THREE.Vector2(1 / tx[0], 1 / tx[1]), foliageRim, 0.55); addOccluderFade(m); }
  // Bend the canopy on the GPU; trunks stay rooted. Reuse this for alpha shadows.
  const canopySway = (mat) => {
    const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey.bind(mat);
    mat.onBeforeCompile = (sh, r) => {
      prev(sh, r); sh.uniforms.uBreeze = cropTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uBreeze;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float crown = smoothstep(0.38, 1.0, uv.y);
          transformed.x += sin(uBreeze * 0.85 + modelMatrix[3].x * 0.23 + modelMatrix[3].z * 0.17) * 0.09 * crown;`);
    };
    mat.customProgramCacheKey = () => key() + '|green-breeze';
  };
  treeMats.forEach(canopySway); canopySway(reedMat);
  const addBillboard = (mat, w, h, x, z, y = null, cast = true) => {
    if (mat === reedMat && x > -25 && z > -9) return;
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, mat); m.position.set(x, y ?? heightAt(x, z), z); m.castShadow = cast; m.receiveShadow = false;
    if (cast) m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: 0.5 });
    if (treeMats.includes(mat) && m.customDepthMaterial) canopySway(m.customDepthMaterial);
    scene.add(m); billboards.push(m);
  };
  const clear = (x, z, pad = 0) => walkable(x, z, pad) && Math.abs(x) > LANE_HALF + 1.2;
  // a hedgerow of trees along the fields, groves by the cottages, the pond's willows, then the hillside ring
  let treeCount = 0, blossomCount = 0;
  const tree = (x, z, s = 1) => {
    if(x>4 && x<19 && z<-35 && z>-66) return;
    // Keep the dock approach and its foreground clear from the default couch view.
    if (x > -26 && x < -6 && z > -13 && z < 16) return;
    const accent = treeCount++ % 6 === 4;
    const edgeFir = !accent && Math.abs(x) > 65 && treeCount % 5 === 0;
    const i = accent ? 3 + blossomCount++ % 3 : edgeFir ? 6 : treeCount % 3;
    const width = [1, 1.14, 0.83, 1.06, 0.86, 0.98, 0.72][i];
    addBillboard(treeMats[i], 4.0 * s * width, 6.0 * s * (i === 6 ? 1.2 : 1), x, z);
  };
  for (let z = 30; z > -48; z -= 7 + R() * 4) { tree(37.5 + R() * 3, z, 0.9 + R() * 0.3); }
  for (const c of COTTAGES) for (let k = 0; k < 3; k++) { const x = c.x + (k - 1) * 5.5 + (R() - 0.5) * 2, z = c.z - c.d / 2 - 2.5 - R() * 2; tree(x, z, 1.0 + R() * 0.4); }
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.05 + 1.1 * k / 7); tree(POND.x + Math.cos(a) * (POND.rx + 3.5), POND.z - Math.sin(a) * (POND.rz + 4.5), 1.1 + R() * 0.3); }
  for (let k = 0; k < 22; k++) addBillboard(reedMat, 1.6, 2.2, POND.x + Math.cos(k * (Math.PI * 2 / 22) + 0.5) * POND.rx * 1.02 * (0.95 + R() * 0.1), POND.z + Math.sin(k * (Math.PI * 2 / 22) + 0.5) * POND.rz * 1.02 * (0.95 + R() * 0.1), 0.02, false);
  for (let k = 0; k < 44; k++) { const x = (R() < 0.5 ? -1 : 1) * (12 + R() * 56), z = 40 - R() * 112; if (clear(x, z, 3)) addBillboard(bushMat, 2.6, 1.46, x, z, 0, false); }
  for (let k = 0; k < 10; k++) { const s = k % 2 ? 1 : -1; tree(s * (LANE_HALF + 7 + R() * 4), 50 - k * 10 - R() * 3, 0.9 + R() * 0.25); }
  for (let k = 0; k < 90; k++) { const a = R() * Math.PI * 2, r = 70 + R() * 90, x = Math.cos(a) * r * 1.15, z = -30 + Math.sin(a) * r * 0.95; if (z < 10 || Math.abs(x) > 80) tree(x, z, 1.2 + R() * 0.7); }
  // a screen of trees between the plot and the hill, to frame your garden
  for (let k = 0; k < 9; k++) tree(-24 + k * 6.5 + (R() - 0.5) * 2, PLOT.z - 11 - R() * 6, 1.1 + R() * 0.4);
  addBillboard(bushMat, 2.4, 1.4, PLOT.x - FENCE.hw - 0.9, PLOT.z + 1.5, 0, false); addBillboard(bushMat, 2.4, 1.4, PLOT.x + 17, PLOT.z - 3.5, 0, false);

  // The same distant City can be placed on the open road with another bearing.
  const city = createCitySkyline(scene, -CITY.z, { x: 0, z: -1 }, 0.85);
  city.group.position.y = CITY.base;
  // backlit by the low sun: the City reads as a cool, hazed silhouette with its beacon the brightest point
  for (const m of city.group.children) if (m.name === 'city-depth-layer') m.material.color.set('#b7b4d2');

  // ---------------------------------------------------------------- folk: the valley's people, slowly tending things
  const folk = [];
  const folkMeshes = (() => {
    const sheet = paintCitizenSheet();
    const tex = sheet.map.texture({ repeat: false, mips: false }); tex.magFilter = tex.minFilter = THREE.NearestFilter;
    const cell = new THREE.Vector2(CIT_FW / sheet.w, CIT_FH / sheet.h);
    const PPU = 40, N = 9;
    const geo = new THREE.PlaneGeometry(CIT_FW / PPU, CIT_FH / PPU); geo.translate(0, CIT_FH / PPU / 2, 0);
    const cells = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2); cells.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aCell', cells);
    const patch = (mat, key) => {
      const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = (sh, r) => { prev && prev(sh, r); sh.uniforms.uCellSize = { value: cell };
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aCell; uniform vec2 uCellSize;').replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = uv * uCellSize + aCell;\n#endif'); };
      const pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => ''; mat.customProgramCacheKey = () => pk() + '|folk-' + key; mat.needsUpdate = true;
    };
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 });
    patch(mat, 'g'); addSpriteRim(mat, new THREE.Vector2(1 / sheet.w, 1 / sheet.h), foliageRim, 0.9);
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }); patch(depth, 'gd');
    const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.customDepthMaterial = depth; mesh.castShadow = true; mesh.frustumCulled = false;
    const sg = new THREE.PlaneGeometry(1.3, 0.75); sg.rotateX(-Math.PI / 2);
    const shadows = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ map: glowTexture(64, 0.0, 0.12), color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }), N); shadows.frustumCulled = false; shadows.renderOrder = 2;
    scene.add(mesh, shadows);
    return { mesh, shadows, cells, sheet, N };
  })();
  {
    const routes = [   // each wanderer: a variant, a loop of [x, z, faceX, faceZ] stops (they pause to tend what they face)
      { v: 2, pts: [[11.2, 7, 22, 12], [24, 7, 24, 12], [34.5, 7, 34, 2], [24, 7, 24, 2]] },
      { v: 15, pts: [[11.2, -6.5, 20, -3], [11.2, -22.5, 20, -20], [30, -22.5, 30, -18], [35, -6.5, 30, -3]] },
      { v: 4, pts: [[-14, 16, -14, 20], [-28, 16, -28, 20], [-36, 16, -36, 22], [-20, 16, -20, 22]] },
      { v: 5, pts: [[-40, 4, -30, 1], [-44, -8, -33, -8], [-40, -23, -28, -14], [-25, -23, -20, -15], [-40, -23, -28, -14], [-44, -8, -33, -8]] },
      { v: 7, pts: [[-8, 30, -20, 31], [-20, 24.5, -20, 22], [-30, 30, -30, 33], [-10, 24.5, -10, 22]] },
      { v: 9, pts: [[-12, -36, -12, -38], [-30, -36, -30, -38], [-27, -33, -27, -38], [-14, -33, -14, -38]] },
      { v: 8, pts: [[26, -37, 26, -42], [36, -37, 36, -34], [46, -29, 46, -34], [36, -26, 38, -22]] },
      { v: 14, pts: [[3.6, 18, 6, 12], [3.6, 40, 6, 44], [-3.6, 30, -6, 24], [3.6, 52, 6, 48]] },
      { v: 10, pts: [[-3.2, -44, 0, -48], [-3.2, -30, -6, -26], [3.3, -18, 6, -14], [3.3, -36, 6, -40]] },
    ];
    for (const r of routes) for (let i = 0; i < r.pts.length; i++) {
      if (!folkPathDry(r.pts[i], r.pts[(i + 1) % r.pts.length])) throw new Error(`Greenfolk route ${r.v} enters pond bank`);
    }
    routes.forEach((r, i) => folk.push({ v: r.v, pts: r.pts, at: i % r.pts.length, x: r.pts[i % r.pts.length][0], z: r.pts[i % r.pts.length][1], wait: 1 + R() * 6, speed: 0.9 + R() * 0.35, face: [0, 1], moving: false, phase: R() * 9, dir: 'down' }));
  }

  // ---------------------------------------------------------------- doves (instanced, a cheap flap)
  const doveN = 14;
  const dg = new THREE.PlaneGeometry(1.0, 0.34); dg.rotateX(-Math.PI / 2);
  const doves = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ color: 0xfff4e0, side: THREE.DoubleSide }), doveN);
  doves.frustumCulled = false; scene.add(doves);
  const doveData = Array.from({ length: doveN }, (_, i) => ({ cx: (R() - 0.5) * 120, cz: -10 - R() * 70, r: 8 + R() * 22, h: 12 + R() * 22, sp: 0.12 + R() * 0.12, ph: R() * 6.28, fl: 5 + R() * 2 }));

  // ---------------------------------------------------------------- particles: pollen in the golden light, a few fireflies
  const glow = glowTexture(64, 0.0, 0.12), flare = glowTexture(128, 0.9, 0.08), mist = mistTexture(128, 3);
  const P = [];
  const addP = (o) => { const p = createParticles(o); scene.add(p); P.push(p); return p; };
  const fireflies = addP({ preset: 'fireflies', count: 120, min: new THREE.Vector3(-50, 0.4, -75), max: new THREE.Vector3(50, 3.5, 55), texture: glow, seed: 3 });
  const motes = addP({ preset: 'motes', count: 360, min: new THREE.Vector3(-45, 0.6, -75), max: new THREE.Vector3(45, 7, 60), texture: glow, seed: 5, overrides: { size: 0.12, speed: 0.65, color: '#fff3d1', color2: '#ffdca0' } });
  const mistLow = addP({ preset: 'mist', count: 26, min: new THREE.Vector3(-80, 0.4, -110), max: new THREE.Vector3(80, 4, -40), texture: mist, seed: 8, overrides: { size: 40 } });
  // Local canopy shafts: eight tapered cards in one draw, using the same additive
  // light convention as the motes. No extra render target or fullscreen pass.
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uStrength; uniform float uTime;
      void main(){ float width=mix(.48,.12,vUv.y); float edge=1.0-smoothstep(width*.25,width,abs(vUv.x-.5));
      float fade=smoothstep(0.0,.2,vUv.y)*(1.0-smoothstep(.72,1.0,vUv.y));
      float drift=.9+.1*sin(uTime*.4+vUv.y*8.0); float a=edge*fade*uStrength*drift;
      gl_FragColor=vec4(uColor*a,1.0); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const canopyShafts = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.6, 9), shaftMat, 8);
  const shaftMatrix = new THREE.Matrix4(), shaftRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.55));
  [[-15,-8],[-30,-15],[-23,-33],[16,-24],[29,-12],[-9,24],[24,30],[-34,32]].forEach(([x,z],i) => {
    shaftMatrix.compose(new THREE.Vector3(x,4.2,z),shaftRotation,new THREE.Vector3(1,1,1)); canopyShafts.setMatrixAt(i,shaftMatrix);
  });
  canopyShafts.frustumCulled = false; canopyShafts.renderOrder = 8; scene.add(canopyShafts);
  const pollen = addP({ preset: 'motes', count: 100, min: new THREE.Vector3(-36, 1, -38), max: new THREE.Vector3(34, 5, 34), texture: glow, seed: 23,
    overrides: { size: 0.08, speed: 0.45, color: '#fff4d0', color2: '#ffd293' } });
  // lantern halos
  {
    const n = lanternPos.length, pos = new Float32Array(n * 3); lanternPos.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const hm = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 } },
      vertexShader: `uniform float uScale; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 2.2 * uScale / -mv.z; }`,
      fragmentShader: `uniform sampler2D uTex; uniform float uI; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vec3(1.0, 0.62, 0.28) * a * a * 0.9 * uI, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    const halos = new THREE.Points(g, hm); halos.frustumCulled = false; halos.renderOrder = 9; scene.add(halos);
    halos.update = (dt, t, camera, h) => { hm.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    P.push(halos); roles.halos = hm;
  }

  // ---------------------------------------------------------------- sun + ambient + env map
  const sun = new THREE.DirectionalLight(0xffcf8a, 5);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x93b4f2, 0x6c6a3c, 3.4); scene.add(hemi);
  const pmrem = new THREE.PMREMGenerator(engine.renderer);
  const envScene = new THREE.Scene(); envScene.add(createSky());
  let envRT = null, envDirty = true, envTimer = 0;
  const refreshEnv = () => { const old = envRT; envRT = pmrem.fromScene(envScene, 0, 1, 2000); scene.environment = envRT.texture; if (old) old.dispose(); };

  // ---------------------------------------------------------------- hero + Ora
  const sheet = A.atlas, sp0 = sheet.sprite;
  const hero = new SpriteCharacter({ map: sheet.map, emissiveMap: sheet.emissiveMap, cols: sp0.cols, rows: sp0.rows, frameW: sp0.frameW, frameH: sp0.frameH, ppu: sp0.ppu, contactTex: glow });
  hero.applyGear(); attachAtlasRun(hero, sheet);
  hero.group.position.set(0, 0, LANE_START - 9);
  if (from === 'home') { hero.group.position.set(10, 0, -53); hero.dir = 'left'; } // cottage-inside: face the garden
  scene.add(hero.group);
  const ora = new Ora({ glow, flare }); scene.add(ora.group, ora.trail);

  // ---------------------------------------------------------------- camera, input, day cycle, audio
  const cam = new DioramaCamera(engine.camera, { pitch: 12, dist: 32, fov: 32, height: 2.4, lead: 6 });
  let fishingZoom = 0;
  const fishingFocus = new THREE.Vector3();
  const input = new Input();
  const audio = new GreenAmbience();
  input.onFirstGesture(() => audio.start());
  const day = new DayCycle({ start: start in KEYS ? start : 'golden' });
  const sunTarget = new THREE.Vector3();
  day.onApply((k, moving) => {
    const U = skyUniforms;
    U.uZenith.value.copy(k.zenith); U.uUpper.value.copy(k.upper); U.uHorizon.value.copy(k.horizon); U.uGlow.value.copy(k.glow); U.uBelow.value.copy(k.below);
    U.uSunDir.value.copy(k.skySun); U.uSunColor.value.copy(k.sunColor); U.uSunDisc.value = k.sunDisc;
    U.uMoonDir.value.copy(k.moonDir); U.uMoonColor.value.copy(k.moonColor); U.uMoonGlow.value = k.moonGlow; U.uStars.value = k.stars;
    U.uCloudLit.value.copy(k.cloudLit); U.uCloudDark.value.copy(k.cloudDark); U.uCloudCover.value = k.cloudCover;
    sun.color.copy(k.lightColor); sun.intensity = k.lightInt;
    hemi.color.copy(k.hemiSky); hemi.groundColor.copy(k.hemiGround); hemi.intensity = k.hemiInt;
    const H = engine.post.haze.u, F = engine.post.final.u;
    H.uHazeDensity.value = k.haze; H.uFogA.value = k.fogA; H.uFogB.value = k.fogB; H.uFogBase.value = k.fogBase; H.uHazeMax.value = k.hazeMax;
    F.uExposure.value = k.exposure; F.uBloom.value = k.bloom; F.uSat.value = k.sat; F.uContrast.value = k.contrast; F.uVignette.value = k.vignette;
    F.uShadowTint.value.copy(k.shadowTint); F.uHighTint.value.copy(k.highTint); F.uLift.value.copy(k.lift);
    F.uShaft.value = k.shaft; F.uShaftColor.value.copy(k.shaftColor);
    hero.rim.value.copy(k.rim).multiplyScalar(0.3); hero.tintRim();
    foliageRim.value.copy(k.rim).multiplyScalar(0.9);
    for (const m of roles.windows) m.emissiveIntensity = m.userData.base * k.windows;
    for (const m of roles.lanterns) m.emissiveIntensity = (m.userData.base ?? 1) * k.lanterns;
    for (const m of roles.glyphs) m.emissiveIntensity = (m.userData.base ?? 1) * k.glyphs;
    for (const m of roles.seams) m.emissiveIntensity = (m.userData.base ?? 1) * k.seams;
    windowSpill.opacity = 0.2 * Math.min(1.8, k.windows);
    roles.halos.uniforms.uI.value = k.lanterns / 3.2;
    lights.roleScale.lantern = k.lanternLight;
    ora.lightScale = k.oraLight;
    fireflies.material.uniforms.uAmount.value = Math.min(1, k.fireflies);
    fireflies.material.uniforms.uIntensity.value = 6 * Math.max(0.5, k.fireflies);
    motes.material.uniforms.uIntensity.value = 4 * k.motes;
    pollen.material.uniforms.uIntensity.value = 3 * k.motes;
    shaftMat.uniforms.uColor.value.copy(k.shaftColor);
    shaftMat.uniforms.uStrength.value = k.shaft * Math.max(0, k.skySun.y) * 0.65;
    mistLow.material.uniforms.uColor.value.copy(k.horizon).lerp(k.upper, 0.4); mistLow.material.uniforms.uColor2.value.copy(k.cloudLit).multiplyScalar(0.5).lerp(k.upper, 0.5); mistLow.material.uniforms.uIntensity.value = k.mist * 0.55;
    if (moving) envDirty = true;
    audio.setNight(Math.max(0, Math.min(1, (k.stars - 0.4) / 0.6)));
  });

  // ---------------------------------------------------------------- walkable space
  function walkable(x, z, pad = 0) {
    if (x < -78 || x > 78 || z < -74 || z > LANE_START + (go ? 4 : -1)) return false;
    if (inRect(x,z,7.3,-61,14.7,-55.3,pad)) return false;
    // Shore-connected dock, with enough room to turn around.
    if (x >= -17 && x <= -9.2 && z >= -7.7 && z <= -5.3) return true;
    // the pond
    { const dx = (x - POND.x) / (POND.rx * 1.12 + pad), dz = (z - POND.z) / (POND.rz * 1.12 + pad); if (dx * dx + dz * dz < 1) return false; }
    // crops stay unstepped-on; the paths between the beds are the way
    for (const f of FIELDS) if (inRect(x, z, f.x0, f.z0, f.x0 + f.w, f.z0 + f.d, pad)) return false;
    for (const c of COTTAGES) if (inRect(x, z, c.x - c.w / 2 - 0.4, c.z - c.d / 2 - 0.4, c.x + c.w / 2 + 0.4, c.z + c.d / 2 + 0.4, pad)) return false;
    if (inRect(x, z, GLASSHOUSE.x - GLASSHOUSE.w / 2 - 0.4, GLASSHOUSE.z - GLASSHOUSE.d / 2 - 0.4, GLASSHOUSE.x + GLASSHOUSE.w / 2 + 0.4, GLASSHOUSE.z + GLASSHOUSE.d / 2 + 0.4, pad)) return false;
    if (Math.hypot(x - SAIL.x, z - SAIL.z) < 2 + pad) return false;
    // the plot's fence: closed on three sides, open at the gate
    const lx = x - PLOT.x, lz = z - PLOT.z, hw = FENCE.hw, hd = FENCE.hd, t = 0.35;
    const nearX = Math.abs(Math.abs(lx) - hw) < t && Math.abs(lz) < hd + t, nearZN = Math.abs(lz + hd) < t && Math.abs(lx) < hw + t;
    const nearZS = Math.abs(lz - hd) < t && Math.abs(lx) < hw + t && Math.abs(lx) > FENCE.gate - 0.1;
    if (nearX || nearZN || nearZS) return false;
    // the shed and the barrel, inside the fence, in the corners
    if (inRect(lx, lz, hw - 2.9, -hd + 0.3, hw - 0.3, -hd + 2.3)) return false;
    // the name post
    if (Math.hypot(x - (PLOT.x - hw - 2.0), z - (PLOT.z + hd + 1.4)) < 0.5 + pad) return false;
    return true;
  }

  // Keep the horizon crowns in frame from the lane; widen the vista toward the plot.
  const zoneFor = (z) => {
    const L = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
    const lane = { pitch: 7, dist: 31, height: 2.4, lead: 6, fov: 32 }, vista = { pitch: 7, dist: 34, height: 3.2, lead: 9, fov: 36 };
    const t = sstep(40, -30, z), o = {};
    for (const k in lane) o[k] = L(lane[k], vista[k], t);
    return o;
  };

  const vel = new THREE.Vector3(), heroPos = hero.group.position, anchor = new THREE.Vector3();
  ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
  Object.assign(cam.target, zoneFor(heroPos.z));
  Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
  engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
  cam.snap(heroPos);
  day.update(0); refreshEnv();

  // ---------------------------------------------------------------- per-frame
  const auto = { move: null, until: 0 };
  let leaving = false, holdT = 0, latched = false, plotCheck = 0;
  let buildT=0, doorT=0, gatherT=0, gatherLatch=false, talkPx=0;
  const homeArt=Art.createHomesteadArt(scene,M,glow);
  const cottageMaterials=new Set();
  homeArt.root.traverse(o=>{if(o.isMesh && !o.material.transparent && !Object.values(M).includes(o.material)) cottageMaterials.add(o.material);});
  for(const material of cottageMaterials) addOccluderFade(material);
  const pathLight=lights.add({pos:new THREE.Vector3(8.2,1.9,-52.3),color:'#ffbf71',intensity:0,distance:7,role:'lantern'});
  const homeLight=lights.add({pos:new THREE.Vector3(12.4,2,-54.7),color:'#ffc477',intensity:20,distance:10,role:'lantern'});
  const project=(x,y,z)=>{const p=new THREE.Vector3(x,y,z).project(engine.camera);return {x:(p.x*.5+.5)*innerWidth,y:(.5-p.y*.5)*innerHeight,on:p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1};};
  const talk=createTalk({input,project,hero:()=>heroPos,barks:false,onOpen:()=>{vel.set(0,0,0);auto.move=null;}});
  const context=()=>({...homestead.snapshot,ready:homestead.ready,fished:hasFished(storage)});
  for(const def of GREENFOLK){const f=folk[def.folk];if(def.at){f.x=def.at[0];f.z=def.at[1];f.pts=[[f.x,f.z,11,-58]];f.wait=999999;}
    talk.register({id:def.id,name:def.name,agent:f,pos:()=>({x:f.x,y:0,z:f.z}),lines:()=>def.lines(context()),choices:()=>giftChoices(satchel,friends,def.id,greenGiftReaction,id=>talk.rise(id)),onBefore:()=>friends.touch(def.id),onEnd:completed=>{if(def.id==='builder'&&completed&&homestead.deliver()){buildT=3.2;audio.built();}}});
  }
  const supplies=[];
  const supply=(kind,x,z,i)=>{
    const g=new THREE.Group();g.position.set(x,.1,z);scene.add(g);
    const mat=new THREE.MeshStandardMaterial({map:kind==='stone'?M.pale.map:M.wood.map,color:kind==='stone'?'#eee6cc':kind==='timber'?'#a17b50':'#c9bc72',roughness:1,emissive:'#70522a',emissiveIntensity:.3});
    for(let j=0;j<(kind==='reed'?5:1);j++){const geo=kind==='stone'?new THREE.DodecahedronGeometry(.38,0):new THREE.CylinderGeometry(kind==='reed'?.035:.13,kind==='reed'?.05:.18,kind==='reed'?1:1.4,6);const m=new THREE.Mesh(geo,mat);if(kind==='stone')m.scale.y=.6;else m.rotation.z=kind==='reed'?.5:1.3;m.position.set(j*.09,.25,j*.05);g.add(m);}
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#ffe4a0',transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.setScalar(1.3);halo.position.y=.6;g.add(halo);
    supplies.push({kind,x,z,g,halo,cool:0,lift:0,i});
  };
  // Each cluster supplies the whole stage in a leisurely walk; a minute restores it.
  for(let i=0;i<8;i++)supply('stone',11.5+i%2*24,5-i*4,i);
  for(let i=0;i<10;i++)supply('timber',i%2?-7:7,40-i*9,i);
  for(let i=0;i<12;i++){const a=.4+i/11*Math.PI*1.15;supply('reed',-25+Math.cos(a)*15,-8-Math.sin(a)*11,i);}
  const carried=document.createElement('div');carried.id='home-carried';carried.style.cssText='position:fixed;left:0;top:0;pointer-events:none;color:#ffe6ad;font:600 20px Georgia;text-shadow:0 2px 4px #000;z-index:18;white-space:nowrap';document.body.appendChild(carried);
  const sunWorld = new THREE.Vector3(), focalWorld = new THREE.Vector3();
  const FOLK_STAND = [CCOL.idle, CCOL.idle + 1];
  const api = {
    hero, ora, cam, day, lights, input, walkable, plot, audio, fishing, homestead, talk, satchel, friends,
    get homeSupplies(){return supplies.map(({kind,x,z,cool})=>({kind,x,z,cool}));},
    homeDoor:{x:10,z:-53.5}, get homeMoment(){return {build:buildT,door:doorT};},
    get folkPaths() { return folk.map(f => ({ x: f.x, z: f.z, pts: f.pts.map(p => [...p]) })); },
    fishingSpot: { x: -16, z: -6.5 },
    teleport(x, z, dirn = 'up') {
      fishingZoom = 0; fishing.cancel(); heroPos.set(x, 0, z); hero.dir = dirn;
      Object.assign(cam.target, zoneFor(z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
      engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
      cam.snap(heroPos); ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
    },
    setTime(name, instant = true) { day.set(name, instant); envDirty = true; },
    autoWalk(dx, dz, seconds, run = false) { auto.move = new THREE.Vector3(dx, 0, dz).normalize(); auto.run = run; auto.until = engine.time + seconds; },
    /** Plant at the tile under the hero right now (what a completed hold does). */
    plantHere() {
      const tl = tileAt(heroPos.x - PLOT.x, heroPos.z - PLOT.z);
      if (!tl) return false;
      if (plot.stage(tl.c,tl.r)===3) {
        const kind=plot.kind(tl.c,tl.r); if(!satchel.add(CROPS[kind]))return false;
        plot.harvest(tl.c,tl.r);refreshPlot();audio.planted();soilPuff(tl,true);return true;
      }
      if (!plot.plant(tl.c, tl.r)) return false;
      pops.set(tl.c + ',' + tl.r, 0); refreshPlot(); audio.planted(); soilPuff(tl);
      return true;
    },
    update(dt, t) {
      if (input.consume('KeyT')) day.next();
      if (input.consume('KeyQ')) cam.turn(-1);
      if (input.consume('KeyE')) cam.turn(1);
      const homePress=['Space','KeyF','Enter'].some(k=>input.pressed.has(k))||fishPointerPress;
      if(!atDock() && buildT<=0 && doorT<=0) talk.update(dt);
      const locked=talk.active||buildT>0||doorT>0;
      const ax = locked ? {x:0,y:0,run:false} : input.axis(), fwd = cam.forward(), right = cam.right();
      let move = null, speed = 0;
      if (ax.x || ax.y) { move = right.clone().multiplyScalar(ax.x).addScaledVector(fwd, ax.y).normalize(); speed = ax.run ? 9 : 4.6; }
      else if (!locked && auto.move && t < auto.until) { move = auto.move.clone(); speed = auto.run ? 9 : 4.6; }
      const want = move ? move.clone().multiplyScalar(speed) : new THREE.Vector3();
      vel.lerp(want, 1 - Math.exp(-dt * 12));
      const nx = heroPos.x + vel.x * dt, nz = heroPos.z + vel.z * dt;
      if (walkable(nx, nz)) { heroPos.x = nx; heroPos.z = nz; }
      else if (walkable(nx, heroPos.z)) { heroPos.x = nx; vel.z = 0; }
      else if (walkable(heroPos.x, nz)) { heroPos.z = nz; vel.x = 0; }
      else vel.set(0, 0, 0);
      // the way back: walk down the lane to its City end and you are in the plaza
      if (go && !leaving && heroPos.z > LANE_START - 1.5) {
        leaving = true; auto.move = new THREE.Vector3(0, 0, 1); auto.run = vel.length() > 7; auto.until = t + 3; audio.duck(true);
        go('plaza');
      }
      const moving = vel.length() > 0.4;
      hero.update(dt, engine.camera, moving ? vel.clone().setY(0).normalize() : null, vel.length(), right, fwd);
      const off = { down: [0.95, 1.62, 0.25], up: [-0.95, 1.62, 0.25], left: [-0.7, 1.55, 0.3], right: [0.85, 1.6, 0.3] }[hero.dir];
      anchor.copy(heroPos).addScaledVector(right, off[0]).addScaledVector(fwd, -off[2]); anchor.y += off[1];

      if(homestead.stage===3 && heroPos.distanceTo(new THREE.Vector3(11,0,-55))<14) anchor.set(12+Math.cos(t)*.8,2.5,-54.8+Math.sin(t)*.6);
      if(doorT>0)anchor.set(10+Math.cos(t*4)*1.7,2+Math.sin(t*3)*.5,-53.5+Math.sin(t*4)*1.2);
      if (atDock()) anchor.set(-18.5, 1.15, -6.5);
      ora.update(dt, t, anchor, engine.camera, engine.post.h);
      day.update(dt);
      envTimer += dt;
      if (envDirty && envTimer > 0.4) { refreshEnv(); envDirty = false; envTimer = 0; }
      // Fishing uses press edges: a held A never hooks or reels by itself.
      const fishHeld = input.action() || input.down.has('Enter');
      const fishPress = ['Space','KeyF','Enter'].map(k => input.consume(k)).some(Boolean) || (fishHeld && !fishActionHeld) || fishPointerPress;
      fishPointerPress = false;
      const cancelled = input.consume('Escape') || !atDock();
      if (cancelled) fishing.cancel();
      else if (fishPress && !locked) { fishing.press(day.name); hero.dir = 'left'; }
      fishActionHeld = fishHeld;
      fishing.update(dt);
      if (fishing.state === 'catch' && fishPrevious !== 'catch') satchel.add(fishing.snapshot.fish.id);
      if (fishing.state !== fishPrevious) { audio.fishingSound(fishing.state); fishPrevious = fishing.state; }
      // A reversible 0.8-second dolly; keep the line and Atlas around the frame centre.
      const close = !['idle', 'escape'].includes(fishing.state);
      fishingZoom = THREE.MathUtils.clamp(fishingZoom + (close ? dt : -dt) / .8, 0, 1);
      const zoom = fishingZoom * fishingZoom * (3 - 2 * fishingZoom);
      const wide = zoneFor(heroPos.z);
      const plotNear = 1 - sstep(6, 13, Math.hypot(heroPos.x-PLOT.x, heroPos.z-PLOT.z));
      for(const [key,value] of Object.entries({pitch:24,dist:24,height:1.2,lead:1.6})) wide[key]=THREE.MathUtils.lerp(wide[key],value,plotNear);
      const tight = { pitch: 6, dist: wide.dist * .60, height: 1.8, lead: 1.5, fov: wide.fov };
      for (const key of ['pitch', 'dist', 'height', 'lead']) {
        cam.target[key] = cam[key] = THREE.MathUtils.lerp(wide[key], tight[key], zoom);
      }
      cam.target.fov = wide.fov;
      fishingFocus.copy(heroPos); fishingFocus.x -= 1.8 * zoom;
      if(buildT>0)fishingFocus.lerp(new THREE.Vector3(9,0,-56),Math.sin(Math.min(1,buildT/3.2)*Math.PI)*.65);
      cam.update(dt, fishingFocus);
      const vw=innerWidth,vh=innerHeight;let offset=0;
      if(talk.active){const p=talk.speaker.pos();offset=Math.min(vh*.5,Math.max(vh*.1,Math.max(project(heroPos.x,0,heroPos.z).y,project(p.x,0,p.z).y)+talkPx-vh*.56));}
      talkPx+=(offset-talkPx)*(1-Math.exp(-dt*5));if(talkPx>.5)engine.camera.setViewOffset(vw,vh,0,talkPx,vw,vh);else engine.camera.clearViewOffset();
      buildT=Math.max(0,buildT-dt);doorT=Math.max(0,doorT-dt);
      homeLight.intensity=homestead.stage===3?20:0;
      pathLight.intensity=homestead.stage===3?12:0;
      homeArt.update(homestead.stage,t,buildT,doorT,day.name==='night');
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        const glint=ripeGlints[r*COLS+c];glint.visible=plot.stage(c,r)===3;
        if(glint.visible){const p=tileCentre(c,r),pulse=.5+.5*Math.sin(t*2.5+c*2+r);glint.position.set(PLOT.x+p.x+.28,1.65,PLOT.z+p.z);glint.scale.setScalar(.28+pulse*.17);glint.material.opacity=.55+pulse*.4;}
      }
      const actHome=input.action()||input.down.has('Enter');
      let near=null,bd=1.6;
      for(const item of supplies){item.cool=Math.max(0,item.cool-dt);if(item.lift>0){item.lift-=dt;item.g.position.lerp(heroPos.clone().add(new THREE.Vector3(0,1.5,0)),Math.min(1,dt*9));}else item.g.position.set(item.x,.1,item.z);item.g.visible=item.cool===0||item.lift>0;item.halo.material.opacity=.45+Math.sin(t*3+item.i)*.2;const d=Math.hypot(item.x-heroPos.x,item.z-heroPos.z);if(item.cool===0&&d<bd){near=item;bd=d;}}
      if(!actHome)gatherLatch=false;
      if(near&&actHome&&!locked&&!gatherLatch&&vel.length()<1.5){gatherT+=dt;near.halo.scale.setScalar(1.3+gatherT*2);if(gatherT>=.6){homestead.gather(near.kind);near.cool=65;near.lift=.55;gatherLatch=true;gatherT=0;audio.gathered();}}else gatherT=0;
      const cp=project(heroPos.x,0,heroPos.z);carried.textContent=Object.entries(homestead.snapshot.carried).filter(([,n])=>n>0).map(([k,n])=>({stone:'◆',timber:'▰',reed:'♧'}[k])+' '+n).join('  ');carried.style.display=cp.on&&!talk.active&&carried.textContent?'block':'none';carried.style.transform=`translate(${Math.max(16,Math.min(innerWidth-carried.offsetWidth-16,cp.x-carried.offsetWidth/2))}px,${Math.max(16,Math.min(innerHeight-38,cp.y+18))}px)`;
      if(homestead.stage===3&&!locked&&homePress&&Math.hypot(heroPos.x-10,heroPos.z+53.5)<1.8){if(go&&!leaving){leaving=true;go('home',{time:day.name});}}

      fishingArt.update(fishing, dt, t, atDock(), heroPos, engine.camera);
      // the plot: stand in a soil tile and hold the action key to plant one seed
      const tl = tileAt(heroPos.x - PLOT.x, heroPos.z - PLOT.z), act = input.down.has('Space') || input.down.has('KeyF') || input.down.has('Enter') || input.down.has('Action');
      const free = !locked && tl && (!plot.has(tl.c, tl.r) || plot.stage(tl.c,tl.r)===3);
      if (tl) { const c0 = tileCentre(tl.c, tl.r); cue.position.set(PLOT.x + c0.x, 0.09, PLOT.z + c0.z); }
      cueMat.opacity += ((tl && free ? 0.5 + Math.sin(t * 2.4) * 0.12 : 0) - cueMat.opacity) * Math.min(1, dt * 6);
      if (act && free && !latched && vel.length() < 1.5) {
        holdT += dt; cueMat.opacity = Math.min(1, 0.6 + holdT);
        if (holdT > 0.55) { holdT = 0; latched = true; api.plantHere(); }
      } else holdT = 0;
      if (!act) latched = false;
      // crops sway; the plot's pop-ins; stage changes by real time (checked now and then)
      cropTime.value = t;
      for (const [key, s] of pops) { const ns = s + dt; if (ns > 0.8) pops.delete(key); else pops.set(key, ns); }
      plotCheck += dt;
      if (pops.size || plotCheck > 20) { refreshPlot(); plotCheck = 0; }
      for (const s of soil) soilStep(s, dt);
      // folk
      const FM = folkMeshes;
      for (let i = 0; i < folk.length; i++) {
        const f = folk[i], dst = f.pts[(f.at + 1) % f.pts.length];
        if(talk.active&&talk.speaker.agent===f){f.moving=false;f.face=[heroPos.x-f.x,heroPos.z-f.z];}
        else if (f.wait > 0) { f.wait -= dt; f.moving = false; if (f.wait <= 0) f.at = (f.at + 1) % f.pts.length; }
        else {
          const tx = f.pts[f.at][0], tz = f.pts[f.at][1], dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
          if (d < 0.15) { f.wait = 5 + R() * 8; f.moving = false; f.face = [f.pts[f.at][2] - f.x, f.pts[f.at][3] - f.z]; }
          else { f.x += (dx / d) * f.speed * dt; f.z += (dz / d) * f.speed * dt; f.moving = true; f.face = [dx, dz]; }
        }
        // screen-space facing from the camera basis
        const fl = f.face[0] * right.x + f.face[1] * right.z, fu = f.face[0] * fwd.x + f.face[1] * fwd.z;
        f.dir = Math.abs(fl) > Math.abs(fu) * 1.05 ? (fl > 0 ? 'right' : 'left') : fu > 0 ? 'up' : 'down';
        const col = f.moving ? CCOL.walk + (Math.floor(t * 6 + f.phase) % 4) : FOLK_STAND[Math.floor(t * 0.7 + f.phase) % 2];
        const uv = cellUV(FM.sheet.w, FM.sheet.h, f.v, f.dir, col);
        FM.cells.setXY(i, uv[0], uv[1]);
        const bob = f.moving ? 0 : Math.sin(t * 2 + f.phase) * 0.01;
        _q.setFromAxisAngle(_up, Math.atan2(engine.camera.position.x - f.x, engine.camera.position.z - f.z));
        FM.mesh.setMatrixAt(i, _m.compose(_p.set(f.x, bob, f.z), _q, _s.set(1, 1, 1)));
        FM.shadows.setMatrixAt(i, _m.compose(_p.set(f.x, 0.04, f.z), _q.identity(), _s.set(1, 1, 1)));
      }
      FM.mesh.count = FM.shadows.count = folk.length;
      FM.mesh.instanceMatrix.needsUpdate = FM.shadows.instanceMatrix.needsUpdate = true; FM.cells.needsUpdate = true;
      // doves
      for (let i = 0; i < doveN; i++) {
        const d = doveData[i], a = t * d.sp + d.ph, x = d.cx + Math.cos(a) * d.r, z = d.cz + Math.sin(a) * d.r * 0.7;
        const hd = Math.atan2(-Math.sin(a) * d.r, Math.cos(a) * d.r * 0.7), fl = 0.35 + Math.abs(Math.sin(t * d.fl + i)) * 0.9;
        _q.setFromAxisAngle(_up, hd + Math.PI / 2);
        doves.setMatrixAt(i, _m.compose(_p.set(x, d.h + Math.sin(a * 2) * 1.2, z), _q, _s.set(1, fl, 1.1)));
      }
      doves.instanceMatrix.needsUpdate = true;
      sail.rotation.z = -t * 0.18;
      // sun follows the focus (texel snapped)
      const k = day.current;
      sunTarget.copy(cam.focus);
      const texel = 92 / 4096; sunTarget.x = Math.round(sunTarget.x / texel) * texel; sunTarget.z = Math.round(sunTarget.z / texel) * texel;
      sun.target.position.copy(sunTarget); sun.position.copy(sunTarget).addScaledVector(k.lightDir, 140);
      lights.update(cam.focus, dt, t);
      rippleN.offset.x = (t * 0.004) % 1; rippleN.offset.y = (t * 0.0025) % 1;
      for (const b of billboards) b.rotation.y = Math.atan2(engine.camera.position.x - b.position.x, engine.camera.position.z - b.position.z);
      for (const p of P) p.update && p.update(dt, t, engine.camera, engine.post.h);
      shaftMat.uniforms.uTime.value = t;
      city.update(t);
      skyUniforms.uTime.value = t;
      { const F = engine.post.final.u; F.uGround.value = 0.3; const fp = focalWorld.set(0, CITY.base + 40, CITY.z).project(engine.camera); F.uFocalPos.value.set(fp.x * 0.5 + 0.5, fp.y * 0.5 + 0.5); F.uFocal.value = fp.z < 1 ? 0.18 : 0; }
      const H = engine.post.haze.u, heroDist = engine.camera.position.distanceTo(heroPos);
      H.uFocusDist.value = heroDist - 0.5;
      const spp = heroPos.clone(); spp.y += 1.2; spp.project(engine.camera);
      H.uFocusY.value = spp.y * 0.5 + 0.5;
      const pw = engine.post.w, ph = engine.post.h;
      const hpx = (hero.height / (2 * heroDist * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov) / 2))) * ph;
      occluder.uOcc.value.set((spp.x * 0.5 + 0.5) * pw, (spp.y * 0.5 + 0.5) * ph, heroDist, hpx * 1.65);
      engine.camera.updateMatrixWorld();
      if (Math.hypot(heroPos.x - POND.x, heroPos.z - POND.z) < 75) mirror.render(scene, engine.camera, pw, ph);
      sunWorld.copy(engine.camera.position).addScaledVector(k.skySun, 900);
      const sh = sunWorld.project(engine.camera);
      engine.post.final.u.uShaftPos.value.set(sh.x * 0.5 + 0.5, sh.y * 0.5 + 0.5);
      input.endFrame();
    },
  };

  // a few specks of soil that leap when a seed goes in (pooled; no allocation per frame)
  const soil = [];
  const soilGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07), soilMat = new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 1 });
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(soilGeo, soilMat); m.visible = false; scene.add(m); soil.push({ m, v: new THREE.Vector3(), life: 0 }); }
  const harvestGeo = new THREE.OctahedronGeometry(.07,0);
  const harvestMat = new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe39c').multiplyScalar(3),toneMapped:false});
  function soilPuff(tl, harvest = false) {
    const c0 = tileCentre(tl.c, tl.r);
    for (const s of soil) { s.m.material=harvest?harvestMat:soilMat;s.m.geometry=harvest?harvestGeo:soilGeo;s.m.scale.setScalar(harvest?1.8:1);s.harvest=harvest;s.m.position.set(PLOT.x + c0.x + (harvest?(R()-.5)*.6:0), harvest?.8:.12, PLOT.z + c0.z + (harvest?(R()-.5)*.6:0)); s.v.set((R() - 0.5) * 1.6, 1.6 + R() * 1.4, (R() - 0.5) * 1.6); s.life = (harvest?1.2:.55) + R() * 0.3; s.m.visible = true; }
  }
  function soilStep(s, dt) {
    if (s.life <= 0) return;
    s.life -= dt; s.v.y -= (s.harvest?2:9) * dt; s.m.position.addScaledVector(s.v, dt);
    if (s.life <= 0 || s.m.position.y < 0.07) { s.life = 0; s.m.visible = false; }
  }

  engine.add(api);
  return api;
}
