// SCENE: "The open road." Past the woken ring gate the road runs out across wild in-between ground (heather, stones, broken
// pillars, mist) to the old stone bridge over a dark ravine: the first landmark. Dusk, adventurous, a little lonely. The colossus
// kneels on the far horizon. Encounters (src/engine/encounters.js) happen here: a stirring drifts toward Atlas; contact fades to a
// placeholder battle card (the real battle is designed elsewhere). Coordinates: the road runs along -Z; ground top y = 0.
import * as THREE from 'three';
import {createRiver} from './river.js';
import {onRiverPath} from './river-state.js';
import {enterBeat} from '../beat/door.js';
import {enterMatch} from '../match/door.js';
import {BUILD} from '../build-config.js';
import {isWebConcept,shouldShowCheckpoint,showCheckpointCard} from '../checkpoint.js';
import {createTalk} from '../engine/talk.js';
import { MANIFEST } from './manifest.js';
import { loadAssets } from '../engine/assets.js';
import { Batch } from '../engine/world/builders.js';
import { createSky, skyUniforms } from '../engine/world/sky.js';
import { createCitySkyline } from '../engine/world/city-skyline.js';
import { buildColossus } from '../engine/world/colossus.js';
import { PlanarReflection, addOccluderFade, occluder } from '../engine/world/reflection.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { DayCycle, KEYS } from '../engine/lighting/daycycle.js';
import { createParticles } from '../engine/fx/particles.js';
import { glowTexture, mistTexture } from '../engine/pixel/world-sprites.js';
import { SpriteCharacter } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { Ora } from '../engine/actors/ora.js';
import { DioramaCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { RoadAmbience } from '../engine/audio-road.js';
import { rng } from '../engine/pixel/paint.js';
import { Encounters, fetchSteps } from '../engine/encounters.js';
import { quests, QUEST2_STATES } from '../engine/quests.js';
import { guardianLines, GUARDIAN_REPLAY, GUARDIAN_DECLINE } from './open-road-lines.js';

const ROAD_HALF = 2.6, START = 10, END = -222;            // road z range Atlas can walk
const RAV_Z0 = -150, RAV_Z1 = -186, RAV_L = RAV_Z0 - RAV_Z1;   // the ravine's near and far edges (bridge spans between)
const HUMP = 1.5, WIDE = 74;                              // bridge crown rise; half-width of the roaming ground
const COLOSSUS = { z: -1050, bottom: -12, size: 86, scale: 0.52 };
const MID = (RAV_Z0 + RAV_Z1) / 2;
const WILDS_END = -249;                                   // once Sloth is woken the causeway runs on to here (the stub edge of the Wilds)
const bridgeY = (z) => (z <= RAV_Z0 && z >= RAV_Z1 ? HUMP * Math.sin(Math.PI * (RAV_Z0 - z) / RAV_L) : 0);

// This page's dusk (each scene is its own page load, so patching KEYS here touches only the open road): the glow sits
// behind the kneeling colossus so he reads as a dark mass against the brightest sky (the gate road's value funnel);
// height fog settles on the heath at y = 0 (the gate road's fog base is down in its abyss); the moon is a quiet disc.
const az = (a, e) => { const r = THREE.MathUtils.degToRad(a), l = THREE.MathUtils.degToRad(e); return new THREE.Vector3(Math.sin(r) * Math.cos(l), Math.sin(l), -Math.cos(r) * Math.cos(l)).normalize(); };
function roadDusk() {
  if (KEYS.dusk.__road) return;
  KEYS.dusk = { ...KEYS.dusk, __road: true, skySun: az(-5, -1.2), moonDir: az(38, 22), moonGlow: 0.25, moonColor: KEYS.dusk.moonColor.clone().multiplyScalar(0.55),
    upper: new THREE.Color('#3a3a86'), zenith: new THREE.Color('#080e2e'), horizon: new THREE.Color('#c88078'),
    fogA: 0.006, fogB: 0.12, fogBase: -1.5, haze: 0.0013, hazeMax: 0.62, contrast: 1.2 };
}

export async function createOpenRoad(engine, { time = 'dusk', from = null, go = null, startBattle = null } = {}) {
  roadDusk();
  const A = await loadAssets(MANIFEST);
  const scene = engine.scene;
  const R = rng(20261011);
  const roles = { lanterns: [], glyphs: [] };
  const waystonePos = [];
  const std = (o, tile, role, base = 1) => {
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.tile = tile;
    if (role) { roles[role].push(m); m.userData.base = base; }
    return m;
  };
  const M = {
    heath: std({ map: A.grass.map, normalMap: A.grass.normalMap, color: 0xc3b39b, roughness: 1, envMapIntensity: 0.3, emissive: 0x3a2a48, emissiveIntensity: 0.04 }, A.grass.tile),
    road: std({ map: A.pave.map, normalMap: A.pave.normalMap, color: 0xd8ccc8, roughness: 0.5, envMapIntensity: 0.75, emissive: 0x2a2230, emissiveIntensity: 0.08 }, A.pave.tile),
    pale: std({ map: A.pale.map, normalMap: A.pale.normalMap, color: 0xc9c3d0, roughness: 0.92, envMapIntensity: 0.3 }, A.pale.tile),
    dark: std({ map: A.dark.map, normalMap: A.dark.normalMap, roughness: 0.85, envMapIntensity: 0.35 }, A.dark.tile),
    cliff: std({ map: A.cliff.map, normalMap: A.cliff.normalMap, roughness: 0.95, envMapIntensity: 0.2 }, A.cliff.tile),
    ravine: std({ color: '#06070b', roughness: 1 }, 4),
    iron: std({ map: A.iron.map, roughnessMap: A.iron.ormMap, metalnessMap: A.iron.ormMap, roughness: 1, metalness: 1 }, 1),
    brass: std({ map: A.brass.map, roughnessMap: A.brass.ormMap, metalnessMap: A.brass.ormMap, roughness: 1, metalness: 1, envMapIntensity: 1.2 }, 1),
    gold: std({ color: '#d4b06a', metalness: 1, roughness: 0.34, envMapIntensity: 1.4, emissive: '#7a5c2c', emissiveIntensity: 0.3 }, 1),
    signal: std({ color: '#0b2020', emissive: '#3fd3c8', emissiveIntensity: 0.6, roughness: 0.5 }, 1, 'glyphs', 1.2),
    cyan: std({ color: '#0d3333', emissive: '#3fd3c8', emissiveIntensity: 2.5, roughness: 0.4 }, 1, 'glyphs', 1),
    glass: std({ map: A.lantern.map, emissiveMap: A.lantern.emissiveMap, emissive: 0xffffff, emissiveIntensity: 3, roughness: 0.3 }, 1, 'lanterns', 1),
    flame: std({ color: '#ffb060', emissive: '#ffa040', emissiveIntensity: 6 }, 1, 'lanterns', 2),
  };
  // Broad soil pockets and worn shoulders are evaluated in world space: no extra terrain draw.
  M.heath.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vHeath;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvHeath = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vHeath;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rise = sin(vHeath.x * 0.17 + sin(vHeath.y * 0.09) * 2.0) * sin(vHeath.y * 0.13);
        float shoulder = exp(-pow((abs(vHeath.x) - 3.3) / 1.5, 2.0));
        diffuseColor.rgb *= mix(vec3(0.48, 0.52, 0.62), vec3(1.22, 1.12, 0.86), rise * 0.5 + 0.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.14, 0.105), shoulder * 0.45);`);
  };
  M.heath.customProgramCacheKey = () => 'open-road-soil';
  // wet stone: the road holds the dusk glow like the gate road's causeway (the lit leading line to the colossus)
  const mirror = new PlanarReflection(engine.renderer, { y: 0.12, scale: 0.6 });
  mirror.apply(M.road, { base: 0.55, streak: 0.01 });
  engine.camera.layers.enable(1);
  const B = new Batch(M);
  for (const k of ['pale', 'dark', 'iron', 'brass', 'gold', 'cyan', 'signal']) addOccluderFade(M[k]);
  const lights = new LightPool(scene, 10);
  const obstacles = [];                                    // circles Atlas walks around: [x, z, r]
  const lanternPos = [];
  scene.add(createSky());

  // ---------- the ground: two halves of heath either side of the ravine, the ravine itself, far edge ----------
  const NEAR = 60, FAR = -330;
  B.box('heath', WIDE * 8, 2, NEAR - RAV_Z0, 0, -1, (NEAR + RAV_Z0) / 2);
  B.box('heath', WIDE * 8, 2, RAV_Z1 - FAR, 0, -1, (RAV_Z1 + FAR) / 2);
  B.box('cliff', WIDE * 8, 120, 3, 0, -61, RAV_Z0 - 1.5);          // the ravine's walls and its black floor
  B.box('cliff', WIDE * 8, 120, 3, 0, -61, RAV_Z1 + 1.5);
  B.box('ravine', WIDE * 8, 2, RAV_L, 0, -118, MID);
  B.box('cliff', WIDE * 8, 160, 4, 0, -81, FAR - 2);                 // the world's far edge (the abyss before the colossus)
  // ---------- the road: worn paving laid in lengths with gaps where the heath has taken it back ----------
  {
    const stones = [];
    let z = START + 4;
    while (z > END - 6) {
      const len = 14 + R() * 26, gap = R() < 0.55 ? 0.5 + R() * 1.6 : 0.2;
      const z1 = Math.max(z - len, END - 6);
      const nearRav = z1 < RAV_Z0 + 8 && z > RAV_Z1 - 8;
      if (nearRav) { z = z1; if (z <= RAV_Z1 - 8) z = RAV_Z1 - 8; continue; }
      const half = ROAD_HALF * (0.92 + R() * 0.14);
      B.box('road', half * 2, 0.12, z - z1, (R() - 0.5) * 0.3, 0.06, (z + z1) / 2);
      z = z1 - gap;
    }
    B.box('road', ROAD_HALF * 2 + 1.4, 0.12, 8, 0, 0.06, RAV_Z0 + 4); B.box('road', ROAD_HALF * 2 + 1.4, 0.12, 8, 0, 0.06, RAV_Z1 - 4);
    // kerb and fallen edge stones
    for (const s of [-1, 1]) for (let zz = START; zz > END; zz -= 1.8 + R() * 2.4) {
      if (zz < RAV_Z0 + 3 && zz > RAV_Z1 - 3) continue;
      if (R() < 0.25) continue;
      const w = 0.5 + R() * 0.7, h = 0.2 + R() * 0.35;
      B.box(R() < 0.5 ? 'pale' : 'dark', w, h, 0.6 + R() * 0.9, s * (ROAD_HALF + 0.2 + R() * 0.9), h / 2 - 0.02, zz, { rotY: (R() - 0.5) * 0.8 });
    }
  }
  // ---------- the stone bridge ----------
  {
    const W = 6.6, N = 26, seg = RAV_L / N;
    for (let i = 0; i < N; i++) {                          // the humped deck, slab by slab
      const z0 = RAV_Z0 - i * seg, z1 = z0 - seg, y0 = bridgeY(z0), y1 = bridgeY(z1), slope = Math.atan2(y1 - y0, z0 - z1);
      const g = new THREE.BoxGeometry(W, 1.6, seg + 0.06); g.rotateX(slope); g.translate(0, (y0 + y1) / 2 - 0.8, (z0 + z1) / 2);
      B.add(i % 3 === 1 ? 'dark' : 'pale', g);
      for (const s of [-1, 1]) {                           // low parapets, broken in places
        if (((i * 7 + (s > 0 ? 3 : 0)) % 11) === 4 || i === 12 && s < 0) continue;
        const h = ((i + (s > 0 ? 5 : 0)) % 9 === 2) ? 0.35 : 0.85;
        const p = new THREE.BoxGeometry(0.55, h, seg + 0.04); p.rotateX(slope); p.translate(s * (W / 2 - 0.1), (y0 + y1) / 2 + h / 2, (z0 + z1) / 2);
        B.add('pale', p);
      }
    }
    // the arch: a body of stone with a great semi-elliptical opening, standing on buttresses sunk into the ravine walls
    const Y0 = -13, sh = new THREE.Shape();
    sh.moveTo(0, Y0); sh.lineTo(0, -1.3); sh.lineTo(RAV_L, -1.3); sh.lineTo(RAV_L, Y0);
    sh.absellipse(RAV_L / 2, Y0, RAV_L / 2 - 1.2, 9.4, 0, Math.PI, false);
    sh.lineTo(0, Y0);
    const a = new THREE.ExtrudeGeometry(sh, { depth: W - 0.6, bevelEnabled: false, curveSegments: 28 });
    a.translate(0, 0, -(W - 0.6) / 2); a.rotateY(-Math.PI / 2); a.translate(0, 0, RAV_Z1);
    B.add('pale', a);
    for (const z of [RAV_Z0 + 0.5, RAV_Z1 - 0.5]) B.box('dark', W - 0.4, 60, 3, 0, -42, z + (z > MID ? -0.5 : 0.5));
    // keystone and the old carving, a cyan glyph worn almost away
    B.box('gold', 0.7, 0.2, 1.2, 0, 0.0 + 0.02 + HUMP, MID);
    B.box('signal', 0.12, 0.04, 2.4, 0, HUMP + 0.012, MID, { uv: false });
    // gate pillars at each end, one standing, one broken
    for (const [z, h] of [[RAV_Z0 + 5.6, 5.4], [RAV_Z1 - 5.6, 3.2]]) for (const s of [-1, 1]) {
      const hh = (z > MID && s > 0) ? h : (z > MID ? 4.4 : h - (s > 0 ? 0 : 1.6));
      const x = s * (W / 2 + 0.2);
      B.box('dark', 1.5, 0.7, 1.5, x, 0.35, z); B.cyl('pale', 0.55, hh, x, 0.7, z, 8, 0.5);
      if (hh > 4) { B.box('dark', 1.3, 0.35, 1.3, x, 0.7 + hh, z); B.box('gold', 1.0, 0.08, 1.0, x, 0.7 + hh - 0.5, z); }
      obstacles.push([x, z, 1.0]);
    }
    for (const z of [RAV_Z0 + 5.6]) for (const s of [-1, 1]) {   // hung lanterns on the near pillars
      const x = s * (W / 2 + 0.2), y = 3.0;
      B.box('iron', 0.1, 0.1, 0.1, x - s * 0.7, y + 0.3, z);
      B.box('glass', 0.3, 0.44, 0.3, x - s * 0.7, y, z, { uv: false });
      B.cone('iron', 0.26, 0.22, x - s * 0.7, y + 0.22, z, 4);
      const p = new THREE.Vector3(x - s * 0.7, y, z); lanternPos.push(p);
      lights.add({ pos: p, color: '#ffa04a', intensity: 22, distance: 13, flicker: 0.14, role: 'lantern', priority: 1.3 });
    }
  }
  const slothHook = { x: 0, y: HUMP, z: MID, radius: 7 };

  // ---------- the in-between: rocks, ridges, broken pillars, waymarks ----------
  const free = (x, z, pad = 0) => Math.abs(x) > ROAD_HALF + 2.5 + pad || z > START + 6;
  const inRav = (z, pad = 8) => z < RAV_Z0 + pad && z > RAV_Z1 - pad;
  for (let k = 0; k < 110; k++) {                          // stones
    const x = (R() * 2 - 1) * 62, z = START + 20 - R() * 330;
    if (!free(x, z) || inRav(z, 3)) continue;
    const s = 0.5 + Math.pow(R(), 2.2) * 3.4, g = new THREE.DodecahedronGeometry(s, 0);
    g.scale(1, 0.55 + R() * 0.4, 1 + R() * 0.3); g.rotateY(R() * 6); g.rotateX((R() - 0.5) * 0.5); g.translate(x, s * 0.2, z);
    B.add(R() < 0.7 ? 'cliff' : 'dark', g); if (s > 1.2) obstacles.push([x, z, s * 0.95]);
  }
  for (let k = 0; k < 20; k++) {                           // broken pillars: standing stumps, leaning, and fallen drums
    const x = (R() < 0.5 ? -1 : 1) * (ROAD_HALF + 4 + R() * 40), z = START - 10 - R() * 200;
    if (inRav(z, 6)) continue;
    const r = 0.5 + R() * 0.35, h = 1.5 + R() * 5.5, kind = R();
    B.box('dark', r * 2.8, 0.45, r * 2.8, x, 0.2, z, { rotY: R() });
    if (kind < 0.55) {
      const g = new THREE.CylinderGeometry(r * 0.9, r, h, 8, 1); const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0) pa.setY(i, pa.getY(i) - (pa.getX(i) + pa.getZ(i) + 1) * 0.35);   // a jagged break
      g.translate(0, h / 2 + 0.4, 0); g.rotateZ((R() - 0.5) * 0.18); g.translate(x, 0, z); B.add('pale', g);
      if (R() < 0.5) B.box('gold', r * 2.05, 0.1, r * 2.05, x, 0.4 + h * 0.3, z, { uv: false });
    } else {
      const g = new THREE.CylinderGeometry(r, r, h * 0.8, 8, 1); g.rotateZ(Math.PI / 2 + (R() - 0.5) * 0.2); g.rotateY(R() * 3); g.translate(x, r * 0.85, z); B.add('pale', g);
      B.box('pale', r * 2.4, 0.5, r * 2.4, x + 2.8, 0.25, z + 1, { rotY: R() });
    }
    obstacles.push([x, z, r + 0.6]);
  }
  for (const [px, pz] of [[-9.5, -62], [9.5, -62]]) {      // a ruined portal across the road, half-fallen
    B.box('dark', 2.0, 0.8, 2.0, px, 0.4, pz); B.cyl('pale', 0.8, px < 0 ? 9 : 5, px, 0.8, pz, 8, 0.7);
    obstacles.push([px, pz, 1.4]);
  }
  B.box('pale', 11, 1.2, 1.6, -4.6, 0.7, -60.2, { rotY: 0.35 }); B.box('pale', 5, 1.1, 1.5, 3.0, 0.55, -64.5, { rotY: -0.5 });
  for (let z = -18; z > END; z -= 34) {                    // waymarks: a stone post with a worn cyan glyph, a small light each
    if (inRav(z, 12)) continue;
    const x = (z / 34 | 0) % 2 ? 4.4 : -4.4;
    B.box('dark', 0.9, 0.5, 0.9, x, 0.25, z); B.box('pale', 0.55, 1.5, 0.55, x, 1.15, z); B.pyramid('dark', 0.7, 0.7, 0.35, x, 1.9, z, Math.PI / 4);
    B.box('signal', 0.3, 0.7, 0.04, x, 1.25, z + 0.3, { uv: false });
    waystonePos.push(new THREE.Vector3(x, 1.4, z + 0.6));
    lights.add({ pos: new THREE.Vector3(x, 1.4, z + 0.6), color: '#3fd3c8', intensity: 24, distance: 11, flicker: 0.05, role: 'glyph', priority: 1.4 });
    obstacles.push([x, z, 0.7]);
  }
  for (const s of [-1, 1]) {                               // the arrival markers by the gate road
    B.box('dark', 1.6, 0.6, 1.6, s * 4.8, 0.3, START - 2); B.cyl('pale', 0.6, 5, s * 4.8, 0.6, START - 2, 8, 0.5); B.box('gold', 1.1, 0.08, 1.1, s * 4.8, 4.4, START - 2);
    obstacles.push([s * 4.8, START - 2, 1.0]);
  }
  // ridges and far ruins, hazed by distance
  for (let k = 0; k < 16; k++) {
    const side = k % 2 ? 1 : -1, x = side * (140 + R() * 180), z = 40 - R() * 380, s = 18 + R() * 30;
    const g = new THREE.DodecahedronGeometry(s, 0); g.scale(1.6 + R(), 0.9 + R() * 0.7, 1.2 + R()); g.rotateY(R() * 6); g.translate(x, s * 0.3 - 4, z); B.add('cliff', g);
  }
  for (let k = 0; k < 26; k++) {
    const side = R() < 0.5 ? -1 : 1, x = side * (50 + R() * 170), z = 10 - R() * 330, h = 6 + R() * 26, r = 1.2 + R() * 1.8;
    B.cyl('pale', r, h, x, 0, z, 7, r * 0.8); B.box('dark', r * 2.6, 1.2, r * 2.6, x, 0.6, z);
    if (R() < 0.4) B.box('signal', 0.3, h * 0.5, 0.06, x, h * 0.5, z + r, { uv: false });
  }
  // the colossus's seat: a broken crag in the mist
  {
    const g = new THREE.CylinderGeometry(70, 104, 240, 26, 10); const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x);
      const k = 1 + (Math.sin(a * 5 + y * 0.031) * 0.09 + Math.sin(a * 11 + y * 0.09) * 0.06) * (y > 119 ? 0.35 : 1);
      pa.setX(i, x * k); pa.setZ(i, z * k);
    }
    g.translate(0, COLOSSUS.bottom - 120.5, COLOSSUS.z + 6); g.computeVertexNormals(); B.add('cliff', g);
  }
  { const built = B.build(scene); built.road.layers.set(1); }

  // ---------- heath: painted branching stems on crossed cards; solid stones and bent trees ----------
  // Local pixel paintings preserve the diorama's texel scale without reusing the round bush silhouette.
  const heathTexture = (grass = false) => {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const line = (ax, ay, bx, by, color, width = 1) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    };
    for (let j = 0; j < 75; j++) {
      const x = 12 + R() * 104, y = 20 + R() * 32, lean = 3 + R() * 10;
      line(x, 63, x + lean, y, grass ? '#514c35' : '#292925', 2);
      if (grass) { line(x + lean, y, x + lean + 6, y + 9, '#8b8056'); continue; }
      for (let k = 0; k < 4; k++) {
        const yy = y + k * 5, xx = x + lean * (63 - yy) / (63 - y), side = k % 2 ? -1 : 1;
        line(xx, yy + 6, xx + side * 5, yy, '#464134');
        ctx.fillStyle = ['#695064', '#805969', '#956b67', '#a17d6d'][j % 4];
        ctx.fillRect(Math.round(xx + side * 5), Math.round(yy), 2, 3);
      }
    }
    const map = new THREE.CanvasTexture(canvas); map.magFilter = THREE.NearestFilter;
    map.colorSpace = THREE.SRGBColorSpace; return map;
  };
  const scatterHeath = (map, n, grass) => {
    const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1 });
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(g, mat, n * 2), obj = new THREE.Object3D();
    let c = 0;
    for (let k = 0; k < n * 4 && c < n * 2; k++) {
      const x = (R() * 2 - 1) * WIDE, z = START + 20 - R() * (START + 20 - FAR - 30);
      if (Math.abs(x) < ROAD_HALF + 0.8 || inRav(z, 1)) continue;
      const w = grass ? 0.5 + R() * 0.7 : 1.0 + R() * 1.6, h = grass ? 0.35 + R() * 0.35 : 0.38 + R() * 0.5;
      const angle = R() * Math.PI;
      for (let card = 0; card < 2; card++) {
        obj.position.set(x, 0.015, z); obj.rotation.set(0, angle + card * Math.PI / 2, 0); obj.scale.set(w, h, 1); obj.updateMatrix();
        mesh.setMatrixAt(c, obj.matrix); mesh.setColorAt(c++, new THREE.Color().setScalar(0.72 + R() * 0.35));
      }
    }
    mesh.count = c; mesh.receiveShadow = true; scene.add(mesh);
  };
  scatterHeath(heathTexture(), 740, false);
  scatterHeath(heathTexture(true), 480, true);
  const heathBatch = new Batch({ rock: M.pale,
    bark: new THREE.MeshStandardMaterial({ color: '#39332f', roughness: 1 }),
    leaves: new THREE.MeshStandardMaterial({ color: '#555349', roughness: 1, flatShading: true }) });
  for (let k = 0; k < 300; k++) {
    const x = (R() * 2 - 1) * 65, z = START + 15 - R() * 325;
    if (Math.abs(x) < ROAD_HALF + 0.6 || inRav(z, 2)) continue;
    const r = 0.12 + R() * 0.48, g = new THREE.DodecahedronGeometry(r, 0);
    g.scale(1.5, 0.65, 1); g.rotateY(R() * 6); g.translate(x, r * 0.25, z); heathBatch.add('rock', g);
  }
  const branch = (a, b, r0, r1) => {
    const d = b.clone().sub(a), g = new THREE.CylinderGeometry(r1, r0, d.length(), 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray()); heathBatch.add('bark', g);
  };
  for (let k = 0; k < 18; k++) {
    const x = (k % 2 ? 1 : -1) * (12 + R() * 55), z = 15 - R() * 300;
    if (inRav(z, 6)) continue;
    const h = 3 + R() * 3.5, base = new THREE.Vector3(x, 0, z), elbow = new THREE.Vector3(x + 0.45, h * 0.55, z), top = new THREE.Vector3(x + 1.5, h, z + 0.35);
    branch(base, elbow, 0.22, 0.13); branch(elbow, top, 0.13, 0.035);
    for (let j = 0; j < 5; j++) {
      const root = elbow.clone().lerp(top, j * 0.15), tip = root.clone().add(new THREE.Vector3(0.9 + R() * 1.6, 0.2 + R() * 0.8, (R() - 0.5) * 2.4));
      branch(root, tip, 0.08, 0.018);
      const g = new THREE.DodecahedronGeometry(0.65 + R() * 0.4, 0); g.scale(1.8, 0.5, 0.9); g.translate(...tip.toArray()); heathBatch.add('leaves', g);
    }
    obstacles.push([x, z, 0.5]);
  }
  heathBatch.build(scene);

  // ---------- the colossus, far beyond: kneeling on the horizon ----------
  const colossus = buildColossus({ gold: M.brass });
  colossus.group.scale.setScalar(COLOSSUS.scale);
  colossus.group.position.set(0, COLOSSUS.bottom, COLOSSUS.z);
  scene.add(colossus.group);
  // Daryll, 2026-10-17: the far colossus read as a second Sloth on the horizon. Sloth on the bridge is the only giant here.
  colossus.group.visible = false;
  const quest = quests();
  // Reuse the bowed stone sculpt and its materials at bridge scale, flattened into a dormant slump.
  const sloth = colossus.group.clone();
  sloth.scale.set(0.043, 0.025, 0.04);
  sloth.position.set(slothHook.x, slothHook.y, slothHook.z);
  scene.add(sloth);
  const mossStone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1),
    new THREE.MeshStandardMaterial({ color: '#65745b', roughness: 1, map: A.pale.map }));
  mossStone.scale.set(1, 0.65, 1.3);
  mossStone.position.set(2.1, bridgeY(MID - 9) + 0.65, MID - 9);
  scene.add(mossStone);
  // A rock shelf supports the awakened Sloth beside the bridge, above the ravine.
  const shelf=new THREE.Mesh(new THREE.CylinderGeometry(4.5,2.2,13,7),M.dark);shelf.position.set(6.2,bridgeY(MID-10)-6.5,MID-10);scene.add(shelf);
  const warmSloth=[];sloth.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.emissive){o.material.emissive.set('#ad7629');warmSloth.push(o.material);}}});
  const awakeTexture=await new THREE.TextureLoader().loadAsync('/rpg/play/pitch/beat/sloth-woken.png');
  awakeTexture.colorSpace=THREE.SRGBColorSpace;
  const awakeSloth=new THREE.Sprite(new THREE.SpriteMaterial({map:awakeTexture,color:'#ffdfaf',transparent:true,alphaTest:.035}));
  awakeSloth.scale.set(13,13*awakeTexture.image.height/awakeTexture.image.width,1);
  awakeSloth.center.set(.5,0);scene.add(awakeSloth);
  // The painted Sloth stands on the bridge before the fight (Daryll, 2026-10-17: the old sculpt read as a pale blob).
  // The sculpt group stays for logic and tests but draws nothing.
  sloth.traverse(o=>{if(o.isMesh)o.visible=false;});
  const idleTexture=await new THREE.TextureLoader().loadAsync('/rpg/play/pitch/beat/sloth-idle-road.png');
  idleTexture.colorSpace=THREE.SRGBColorSpace;
  const idleSloth=new THREE.Sprite(new THREE.SpriteMaterial({map:idleTexture,color:'#e8d2b4',transparent:true,alphaTest:.035}));
  idleSloth.scale.set(15,15*idleTexture.image.height/idleTexture.image.width,1);
  idleSloth.center.set(.5,0);scene.add(idleSloth);
  const syncSloth = () => {
    const awake=quest.snapshot.quest2===QUEST2_STATES.CLEARED;
    sloth.visible=!awake;awakeSloth.visible=awake;awakeSloth.position.set(5.2,bridgeY(MID-10),MID-10);sloth.position.x=awake?5.2:0;sloth.position.z=awake?MID-10:MID;sloth.position.y=bridgeY(sloth.position.z);
    sloth.rotation.y=awake?-.45:0;
    for(const m of warmSloth)m.emissiveIntensity=awake?.16:.025;
    const asleep = quest.snapshot.quest2 === QUEST2_STATES.LOCKED;
    sloth.scale.y = asleep ? .009 : awake?.036:.025;
    sloth.rotation.z = asleep ? -.18 : 0;
    idleSloth.visible=!awake;idleSloth.position.set(0,bridgeY(MID)-.15,MID);idleSloth.material.color.set(asleep?'#9f8e7c':'#e8d2b4');
    mossStone.visible = quest.snapshot.secondDeed;
  };
  syncSloth();
  {
    const head = colossus.headLocal.clone().multiplyScalar(COLOSSUS.scale).add(colossus.group.position);
    const halo = new THREE.Group(); halo.position.set(0, head.y + COLOSSUS.size * 0.05, head.z - 24); halo.rotation.z = 0.1;
    for (const [a0, len] of [[0.25, 0.95], [1.32, 0.7], [2.15, 0.62], [2.95, 0.8], [3.95, 0.45], [4.55, 0.85], [5.55, 0.55]]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(COLOSSUS.size * 0.17, COLOSSUS.size * 0.012, 6, 40, len), M.brass); t.rotation.z = a0; halo.add(t);
    }
    halo.visible = false; scene.add(halo);
  }

  // Home lies behind Atlas: the canonical City remains a small, luminous landmark
  // when the camera turns back, rather than another skyline ahead of the road.
  const city = createCitySkyline(scene, 760, { x: -0.22, z: 1 }, 0.48);
  city.group.position.y = 12;

  // ---------- particles ----------
  const glow = glowTexture(64, 0.0, 0.12), flare = glowTexture(128, 0.9, 0.08), mist = mistTexture(128, 3);
  const P = [];
  const addP = (o) => { const p = createParticles(o); scene.add(p); P.push(p); return p; };
  const motes = addP({ preset: 'motes', count: 200, min: new THREE.Vector3(-26, 0.4, -230), max: new THREE.Vector3(26, 12, START + 10), texture: glow, seed: 5 });
  const flies = addP({ preset: 'fireflies', count: 60, min: new THREE.Vector3(-22, 0.4, -210), max: new THREE.Vector3(22, 3, START), texture: glow, seed: 3 });
  const mistLow = addP({ preset: 'mist', count: 46, min: new THREE.Vector3(-70, 0.2, -230), max: new THREE.Vector3(70, 1.2, START + 20), texture: mist, seed: 8, overrides: { size: 18, speed: 0.45 } });
  mistLow.material.fragmentShader = mistLow.material.fragmentShader.replace('vec4(c * uIntensity, a)', 'vec4(c * uIntensity, a * 0.32)');
  const mistRav = addP({ preset: 'mist', count: 26, min: new THREE.Vector3(-60, -50, RAV_Z0), max: new THREE.Vector3(60, -4, RAV_Z1), texture: mist, seed: 9, overrides: { size: 36 } });
  const mistAbyss = addP({ preset: 'mist', count: 60, min: new THREE.Vector3(-260, -70, -330), max: new THREE.Vector3(260, -28, -520), texture: mist, seed: 7, overrides: { size: 70 } });
  const mistGiant = addP({ preset: 'mist', count: 16, min: new THREE.Vector3(-150, COLOSSUS.bottom - 34, COLOSSUS.z - 40), max: new THREE.Vector3(150, COLOSSUS.bottom - 12, COLOSSUS.z + 110), texture: mist, seed: 12, overrides: { size: 80 } });
  // Cyan scattering at the waystones: pooled soft cards ground the glow in the
  // drifting mist and spill onto the paving, with one instanced draw per layer.
  const cyanScatter = new THREE.MeshBasicMaterial({ map: glow, color: '#53dfe9', transparent: true,
    opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const cyanSpill = cyanScatter.clone(); cyanSpill.opacity = 0.25;
  const scatterCards = new THREE.InstancedMesh(new THREE.PlaneGeometry(4, 3), cyanScatter, waystonePos.length);
  const spillCards = new THREE.InstancedMesh(new THREE.PlaneGeometry(5, 5), cyanSpill, waystonePos.length);
  const cardMatrix = new THREE.Matrix4(), cardQ = new THREE.Quaternion(), cardScale = new THREE.Vector3(1,1,1);
  waystonePos.forEach((p,i) => {
    cardMatrix.compose(p,cardQ.identity(),cardScale); scatterCards.setMatrixAt(i,cardMatrix);
    cardMatrix.compose(new THREE.Vector3(p.x,0.035,p.z),cardQ.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),cardScale); spillCards.setMatrixAt(i,cardMatrix);
  });
  scatterCards.renderOrder = 8; spillCards.renderOrder = 3; scene.add(scatterCards,spillCards);
  let haloLit;
  {                                                        // lantern halos (one sprite each, one draw call)
    const points = [...lanternPos, ...waystonePos];
    const n = Math.max(1, points.length), pos = new Float32Array(n * 3), colors = new Float32Array(n * 3);
    points.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); colors.set(i < lanternPos.length ? [1, .62, .28] : [.18, .85, 1], i * 3); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    const hm = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 } },
      vertexShader: `attribute vec3 aColor; varying vec3 vColor; uniform float uScale; void main(){ vColor=aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 2.2 * uScale / -mv.z; }`,
      fragmentShader: `varying vec3 vColor; uniform sampler2D uTex; uniform float uI; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vColor * a * a * 0.9 * uI, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    haloLit = new THREE.Points(g, hm); haloLit.frustumCulled = false; haloLit.renderOrder = 9; scene.add(haloLit);
    haloLit.update = (dt, t, camera, h) => { hm.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    P.push(haloLit);
  }

  // ---------- the stirring: a slow grey shimmer (Sloth's weight), a tall soft column that wavers and sinks ----------
  const stirMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uSeed: { value: Math.random() * 50 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uA; uniform float uSeed;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vUv * 2.0 - 1.0;
        float sink = 0.5 + 0.5 * sin(uTime * 0.7);
        float w = n(vec2(vUv.y * 5.0 - uTime * 0.6, uTime * 0.25)) - 0.5;
        float body = 1.0 - smoothstep(0.0, 1.0, length(vec2((p.x + w * 0.35) / (0.55 - 0.18 * (1.0 - vUv.y)), (p.y - 0.12 + 0.05 * sink) / 0.92)));
        float grain = n(vUv * vec2(9.0, 14.0) + vec2(0.0, -uTime * 0.9));
        float a = body * (0.35 + 0.65 * grain) * uA;
        vec3 c = mix(vec3(0.46, 0.48, 0.55), vec3(0.78, 0.80, 0.86), grain * body);
        gl_FragColor = vec4(c, min(1.0, a * 1.15));
      }`,
  });
  const stirGeo = new THREE.PlaneGeometry(4.6, 5.8); stirGeo.translate(0, 2.6, 0);
  const stirs = new Map();                                 // id -> { mesh, a }

  // ---------- light ----------
  const sun = new THREE.DirectionalLight(0xffb070, 2.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  // Cool grazing fill reveals stone edges; only the main key casts shadows.
  const moonFill = new THREE.DirectionalLight('#a1c8ff', 0.65);
  scene.add(moonFill, moonFill.target);
  const hemi = new THREE.HemisphereLight(0x7a70c0, 0x5a4658, 2.5); scene.add(hemi);
  const pmrem = new THREE.PMREMGenerator(engine.renderer);
  const envScene = new THREE.Scene(); envScene.add(createSky());
  let envRT = null, envDirty = true, envTimer = 0;
  const refreshEnv = () => { const old = envRT; envRT = pmrem.fromScene(envScene, 0, 1, 2000); scene.environment = envRT.texture; if (old) old.dispose(); };

  // ---------- hero + Ora ----------
  const sheet = A.atlas, sp0 = sheet.sprite;
  const hero = new SpriteCharacter({ map: sheet.map, emissiveMap: sheet.emissiveMap, cols: sp0.cols, rows: sp0.rows, frameW: sp0.frameW, frameH: sp0.frameH, ppu: sp0.ppu, contactTex: glow });
  hero.applyGear(); attachAtlasRun(hero, sheet);
  hero.group.position.set(0, 0, START - 6); scene.add(hero.group);
  const ora = new Ora({ glow, flare }); scene.add(ora.group, ora.trail);

  const cam = new DioramaCamera(engine.camera, { pitch: 8, dist: 31, fov: 38, height: 2.8, lead: 9 });
  const input = new Input();
  const audio = new RoadAmbience();
  input.onFirstGesture(() => audio.start());
  const day = new DayCycle({ start: time });
  const sunTarget = new THREE.Vector3();
  let baseSat = 1.1, baseExp = 1.5, thin = 0, thinTarget = 0;

  day.onApply((k, moving) => {
    const U = skyUniforms;
    U.uZenith.value.copy(k.zenith); U.uUpper.value.copy(k.upper); U.uHorizon.value.copy(k.horizon); U.uGlow.value.copy(k.glow); U.uBelow.value.copy(k.below);
    U.uSunDir.value.copy(k.skySun); U.uSunColor.value.copy(k.sunColor); U.uSunDisc.value = k.sunDisc;
    U.uMoonDir.value.copy(k.moonDir); U.uMoonColor.value.copy(k.moonColor); U.uMoonGlow.value = k.moonGlow; U.uStars.value = k.stars;
    U.uCloudLit.value.copy(k.cloudLit); U.uCloudDark.value.copy(k.cloudDark); U.uCloudCover.value = k.cloudCover;
    sun.color.copy(k.lightColor); sun.intensity = k.lightInt;
    hemi.color.copy(k.hemiSky); hemi.groundColor.copy(k.hemiGround); hemi.intensity = k.hemiInt * 0.8;
    moonFill.intensity = 0.45 + k.stars * 0.5;
    const H = engine.post.haze.u, F = engine.post.final.u;
    H.uHazeDensity.value = k.haze; H.uFogA.value = k.fogA; H.uFogB.value = k.fogB; H.uFogBase.value = k.fogBase; H.uHazeMax.value = k.hazeMax;
    baseExp = k.exposure; baseSat = k.sat;
    F.uExposure.value = k.exposure; F.uBloom.value = k.bloom * 1.3; F.uSat.value = k.sat; F.uContrast.value = k.contrast; F.uVignette.value = k.vignette;
    F.uShadowTint.value.copy(k.shadowTint); F.uHighTint.value.copy(k.highTint); F.uLift.value.copy(k.lift);
    F.uShaft.value = k.shaft; F.uShaftColor.value.copy(k.shaftColor);
    hero.rim.value.copy(k.rim).multiplyScalar(0.3); hero.tintRim();
    for (const m of roles.lanterns) m.emissiveIntensity = (m.userData.base ?? 1) * k.lanterns;
    for (const m of roles.glyphs) m.emissiveIntensity = (m.userData.base ?? 1) * k.glyphs;
    haloLit.material.uniforms.uI.value = k.lanterns / 3.2;
    cyanScatter.opacity = 0.055 * k.glyphs;
    cyanSpill.opacity = 0.085 * k.glyphs;
    lights.roleScale.lantern = k.lanternLight; lights.roleScale.glyph = k.glyphs / 2.6;
    ora.lightScale = k.oraLight;
    colossus.setDay({ ...k, glow: k.glow.clone().multiplyScalar(0.4), rim: k.rim.clone().multiplyScalar(0.4), colossus: k.colossus * 0.18 }, engine.camera);
    flies.material.uniforms.uAmount.value = Math.min(1, k.fireflies);
    flies.material.uniforms.uIntensity.value = 6 * Math.max(0.5, k.fireflies);
    motes.material.uniforms.uIntensity.value = 4 * k.motes;
    for (const mm of [mistAbyss, mistLow, mistGiant, mistRav]) { mm.material.uniforms.uColor.value.copy(k.horizon).lerp(k.upper, 0.5).multiplyScalar(0.9); mm.material.uniforms.uColor2.value.copy(k.cloudLit).multiplyScalar(0.5).lerp(k.upper, 0.5); mm.material.uniforms.uIntensity.value = k.mist * 0.85; }
    // Mist catches the sky's cool fill while the City beacon warms toward night.
    for (const m of city.group.children) if (m.name === 'city-depth-layer') m.material.color.copy(k.highTint).multiplyScalar(0.55 + k.windows * 0.28);
    if (moving) envDirty = true;
    audio.setNight(Math.max(0, Math.min(1, (k.stars - 0.4) / 0.6)));
  });
  const shaftWorld = new THREE.Vector3(0, 30, -700), focalWorld = new THREE.Vector3();

  // ---------- where Atlas may walk ----------
  const onBridge = (x, z) => z <= RAV_Z0 + 0.5 && z >= RAV_Z1 - 0.5;
  const walkable = (x, z) => {
    if (wildsOpen() && onRiverPath(x,z)) return !(x>37&&x<46&&z< -261&&z> -271);
    if (wildsOpen() && x>25 && z< -250) return false;
    if (z > START + (go ? 3 : -1) || z < (wildsOpen() ? WILDS_END : END)) return false;
    if (quest.snapshot.quest2 !== QUEST2_STATES.CLEARED && z < MID + 3) return false;
    if (onBridge(x, z)) return Math.abs(x) <= 2.7;
    if (Math.abs(x) > WIDE) return false;
    for (const [ox, oz, r] of obstacles) if ((x - ox) * (x - ox) + (z - oz) * (z - oz) < r * r) return false;
    return true;
  };
  const zoneAt = (x, z) => (onBridge(x, z) && Math.abs(x) < 4 ? 'bridge' : Math.abs(x) <= ROAD_HALF + 0.6 ? 'road' : 'in-between');

  // ---------- encounters ----------
  const q = new URLSearchParams(location.search);
  const SLOTH_FIGHT = q.get('slothfight') !== '0';
  const enc = new Encounters({ scene: 'open-road', place: (x, z) => walkable(x, z) && !inRav(z, 10) && z < START - 8 && Math.hypot(x - 0, z - MID) > 14 });
  // The web concept never calls out to a step-count service; encounters run on their own pace there.
  const OFFLINE = isWebConcept(BUILD);
  if (q.has('steps')) enc.setSteps(+q.get('steps')); else if (!OFFLINE) fetchSteps().then((n) => enc.setSteps(n));
  if (!q.has('steps') && !OFFLINE) setInterval(() => fetchSteps().then((n) => enc.setSteps(n)), 300000);
  if (q.has('noenc')) enc.hold(true);
  // the placeholder battle card: a dark overlay with Sloth's silhouette (no words). The real battle replaces this.
  const card = (() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:30;pointer-events:none;opacity:0;transition:opacity .9s ease;background:radial-gradient(ellipse at 50% 58%,#2a2d36 0%,#0c0d12 52%,#030305 100%);display:flex;align-items:center;justify-content:center';
    d.innerHTML = `<svg viewBox="0 0 400 320" style="width:min(62vw,720px);filter:drop-shadow(0 0 28px #5a5f70aa);animation:slothbreath 5s ease-in-out infinite" fill="#07080b" stroke="#07080b" stroke-linecap="round">
      <ellipse cx="205" cy="190" rx="112" ry="104"/><ellipse cx="170" cy="96" rx="40" ry="31"/><path d="M130 112 Q205 70 285 124 L300 190 L110 190Z"/>
      <path d="M118 150 Q70 200 84 290" fill="none" stroke-width="36"/><path d="M296 150 Q338 205 322 292" fill="none" stroke-width="36"/>
      <path d="M72 292l-16 20M86 296l-4 24M100 292l10 22M310 296l-14 22M324 298l-2 24M338 294l14 20" fill="none" stroke-width="7"/>
      <ellipse cx="156" cy="98" rx="6" ry="2.2" fill="#aeb4c4" stroke="none" opacity=".55"/><ellipse cx="184" cy="98" rx="6" ry="2.2" fill="#aeb4c4" stroke="none" opacity=".55"/></svg>
      <style>@keyframes slothbreath{0%,100%{transform:scale(1)}50%{transform:scale(1.025) translateY(3px)}}</style>`;
    document.body.appendChild(d);
    return d;
  })();
  let inCard = false;
  const showCard = (callback) => {
    inCard = true; enc.hold(true); audio.thin(true); card.style.opacity = '1';
    setTimeout(() => { card.style.opacity = '0'; }, 3600);
    setTimeout(() => { inCard = false; enc.hold(q.has('noenc')); audio.thin(false); if (typeof callback === 'function') callback(true); }, 4700);
  };
  const bridgeBattle = callback => {
    inCard = true; enc.hold(true); audio.thin(true); vel.set(0, 0, 0);
    let settled = false;
    const finish = won => {
      if (settled) return;
      settled = true; callback(won);
      inCard = false; enc.hold(q.has('noenc')); audio.thin(false); syncSloth();
    };
    try { if(startBattle)startBattle(finish);else void enterBeat({engine,input,audio,onFinish:result=>{try{const key='atlas.beat.best.sloth',old=JSON.parse(localStorage.getItem(key)||'null');if(!old||result.perfects+result.goods*.7>old.perfects+old.goods*.7)localStorage.setItem(key,JSON.stringify({grade:result.grade,perfects:result.perfects,goods:result.goods,maxCombo:result.maxCombo}));}catch{}finish(true);}}); } catch { finish(false); }
  };
  let approached = false;
  const addStir = (s) => {
    const m = new THREE.Mesh(stirGeo, stirMat()); m.renderOrder = 12; m.position.set(s.x, bridgeY(s.z), s.z); scene.add(m);
    stirs.set(s.id, { mesh: m, a: 0, dying: false, s });
  };

  const vel = new THREE.Vector3(), heroPos = hero.group.position, anchor = new THREE.Vector3();
  if (from === 'gate-road') hero.dir = 'up';
  const zoneFor = (z) => (z <= RAV_Z0 + 6 && z >= RAV_Z1 - 6 ? { pitch: 10, dist: 31, height: 3.2, lead: 9, fov: 36 } : { pitch: 8, dist: 31, height: 2.8, lead: 9, fov: 38 });
  ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
  Object.assign(cam.target, zoneFor(heroPos.z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
  engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
  cam.snap(heroPos); day.update(0); refreshEnv();

  // ---------- before: the road beyond Sloth is dark and fogged; after: it opens past the lantern to the edge of the Wilds ----------
  const wildsOpen = () => quest.snapshot.quest2 === QUEST2_STATES.CLEARED;
  const fogTex = [mistTexture(128, 11), mistTexture(128, 23), mistTexture(128, 37)];
  const fogGroup = new THREE.Group(); scene.add(fogGroup);
  const fogSprites = [];
  for (let i = 0; i < 28; i++) {                       // a bank of heavy grey-blue mist standing across the causeway behind him
    // depthWrite on (with an alpha cut) so the depth haze reads the bank's own distance and does not wash it out to the sky's colour
    const m = new THREE.SpriteMaterial({ map: fogTex[i % 3], color: i % 3 ? '#1a1d2e' : '#2a2d44', transparent: true, opacity: 1, depthWrite: true, alphaTest: 0.1, rotation: (R() - .5) * 0.5 });
    const sp = new THREE.Sprite(m), row = Math.floor(i / 7), col = i % 7;
    sp.position.set((col - 3) * 6.5 + (R() - .5) * 4, 1.6 + R() * 3.2 + row * 2.4, RAV_Z1 - 3 - row * 4 - R() * 2);
    sp.scale.set(26 + R() * 12, 9 + R() * 6, 1); sp.renderOrder = 7;
    sp.userData.drift = R() * 6.28; fogGroup.add(sp); fogSprites.push(sp);
  }
  const wilds = new THREE.Group(); wilds.visible = false; scene.add(wilds);
  const wildsMats = [];
  {
    const W = new Batch(M);
    for (let z = END - 6, i = 0; z > WILDS_END - 3; i++) {   // new road: worn paving that thins out into the heath
      const len = 5 + R() * 4, w = ROAD_HALF * (0.9 - i * 0.07);
      W.box('road', w * 2, 0.12, len, (R() - .5) * .4, 0.06, z - len / 2);
      z -= len + 0.3 + i * 0.25;
    }
    for (const s2 of [-1, 1]) for (let zz = END - 8; zz > WILDS_END; zz -= 2.2 + R() * 2.2) {
      if (R() < 0.3) continue;
      const w = 0.5 + R() * 0.6, h = 0.2 + R() * 0.3;
      W.box(R() < .5 ? 'pale' : 'dark', w, h, .6 + R() * .8, s2 * (ROAD_HALF + 0.3 + R() * 1.1), h / 2 - .02, zz, { rotY: (R() - .5) * .8 });
    }
    // the marker stone: a tall pale slab at the end of the road with a cyan glyph, and a cairn either side
    W.box('pale', 1.5, .5, 1.5, 0, .25, WILDS_END + 1.2); W.box('pale', 1.0, 3.4, .6, 0, 2.2, WILDS_END + 1.2);
    W.box('cyan', .16, 1.1, .08, 0, 2.5, WILDS_END + 1.2 + .32); W.box('cyan', .7, .14, .08, 0, 2.15, WILDS_END + 1.2 + .32);
    for (const [cx, cz, n] of [[-2.8, WILDS_END + 2.2, 4], [3.1, WILDS_END + 0.6, 3]]) for (let i = 0; i < n; i++) W.box(i % 2 ? 'dark' : 'pale', 1.2 - i * .24, .34, 1.1 - i * .2, cx + (R() - .5) * .12, .17 + i * .32, cz, { rotY: R() * 3 });
    W.build(wilds);
    obstacles.push([0, WILDS_END + 1.2, 0.9]);
  }
  // a soft "more to come" vista past the world's old edge: ridges, then the first glimpse of the island beyond
  const ridge = (seed, top, bottom, amp, peak) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const g = c.getContext('2d');
    const rr = rng(seed), ph = [rr() * 6, rr() * 6, rr() * 6];
    const y = (x) => Math.round(128 - (peak + amp * (Math.sin(x * .011 + ph[0]) * .5 + Math.sin(x * .027 + ph[1]) * .3 + Math.sin(x * .061 + ph[2]) * .2 + .5)) * .8);
    g.beginPath(); g.moveTo(0, 128); for (let x = 0; x <= 1024; x++) g.lineTo(x, y(x)); g.lineTo(1024, 128); g.closePath();
    const gr = g.createLinearGradient(0, 128 - (peak + amp) * .8, 0, 128); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
  };
  const vista = new THREE.Group(); vista.visible = false; scene.add(vista);
  const vistaMats = [];
  for (const [z, w, h, seed, top, bottom, amp, peak, yb] of [[-392, 520, 70, 31, '#6a5a84', '#4a4068', 60, 14, -26], [-470, 640, 90, 47, '#9a7a8a', '#6a5a7c', 70, 26, -30], [-560, 760, 96, 61, '#d0a08e', '#a47e88', 60, 38, -34]]) {
    const m = new THREE.MeshBasicMaterial({ map: ridge(seed, top, bottom, amp, peak), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); pl.position.set(0, yb + h / 2, z); pl.renderOrder = -2; vista.add(pl); vistaMats.push(m);
  }
  {                                                       // the island beyond: one far warm light on the last ridge
    const m = new THREE.SpriteMaterial({ map: glow, color: '#ffcf8a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(m); sp.position.set(-34, 21, -559); sp.scale.set(26, 26, 1); vista.add(sp); vistaMats.push(m); sp.userData.warm = true;
  }
  const vistaTint = new THREE.Color(), nightBlue = new THREE.Color('#2a3558');
  let opening = wildsOpen() ? 1 : 0;                      // 0 = dark and fogged behind him, 1 = the road open
  const syncOpening = (dt, t) => {
    const open = wildsOpen(); opening += ((open ? 1 : 0) - opening) * (1 - Math.exp(-dt * 0.9));
    if (Math.abs((open ? 1 : 0) - opening) < 0.004) opening = open ? 1 : 0;
    fogGroup.visible = opening < 0.995; wilds.visible = open; vista.visible = opening > 0.01;
    for (const sp of fogSprites) { sp.material.opacity = 1 - opening; sp.position.x += Math.sin(t * .15 + sp.userData.drift) * dt * .25; }
    const nightK = Math.min(1, Math.max(0, day.current.stars)); vistaTint.set('#ffffff').lerp(nightBlue, nightK * 0.82);   // the ridges go moonlit blue with the night
    for (const m of vistaMats) if (m.map && m.type === 'MeshBasicMaterial') m.color.copy(vistaTint);
    for (const m of vistaMats) m.opacity = (m.map ? 1 : 0.9) * opening * (m === vistaMats[0] ? .95 : 1);
  };
  syncOpening(0, 0);
  const lantern=new THREE.Group();lantern.position.set(2.2,0,END+3);scene.add(lantern);
  const station=new THREE.Mesh(new THREE.BoxGeometry(7,.35,7),M.pale);station.position.set(0,-.18,END+3);scene.add(station);
  for(const [w,h,y] of [[2,.35,.18],[.65,1.4,1.05],[1.25,.2,1.85],[1.6,.3,2.95]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),M.pale);m.position.y=y;lantern.add(m);}
  const lampMat=new THREE.MeshStandardMaterial({color:'#f7d28b',emissive:'#ffc46d',emissiveIntensity:0});
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.75,.85,.75),lampMat);lamp.position.y=2.38;lantern.add(lamp);
  const lampLight=new THREE.PointLight('#ffce89',0,14,2);lampLight.position.y=2.4;lantern.add(lampLight);
  let lanternLit=false;try{lanternLit=localStorage.getItem('atlas.road.lantern')==='1';}catch{}
  const talk=createTalk({input,hero:()=>heroPos,project:(x,y,z)=>{const v=new THREE.Vector3(x,y,z).project(engine.camera);return {x:(v.x*.5+.5)*innerWidth,y:(-.5*v.y+.5)*innerHeight,on:v.z<1};}});
  // Sloth, the Guardian (Daryll, 2026-10-17): woken, he keeps the causeway. First visit: thanks; later: the road, the hour, a hint of the
  // Wilds, and (from the second visit) a quiet offer of one more go. Visits persist in localStorage 'atlas.road.guardian'.
  let guardianVisits = 0;try{guardianVisits=+localStorage.getItem('atlas.road.guardian')||0;}catch{}
  let replayAsked=false;
  talk.register({id:'sloth',name:'Sloth',pos:()=>quest.snapshot.secondDeed?{x:sloth.position.x,y:3,z:sloth.position.z}:null,
    onBefore:()=>{guardianVisits++;replayAsked=false;try{localStorage.setItem('atlas.road.guardian',String(guardianVisits));}catch{}},
    lines:()=>guardianLines({visit:guardianVisits,time:day.name}),
    choices:()=>[{label:GUARDIAN_DECLINE,choose:()=>null},{label:GUARDIAN_REPLAY,choose:()=>{replayAsked=true;return null;}}],   // 'Another time.' is the default: mashing A never restarts the fight
    onEnd:completed=>{if(completed&&replayAsked&&!inCard){replayAsked=false;bridgeBattle(()=>{});}}});
  const river=await createRiver({scene,M,glow,mist,mirror,lights,talk,hero:heroPos,camera:engine.camera,audio,open:wildsOpen,
    fight:done=>{inCard=true;enc.hold(true);vel.set(0,0,0);auto.move=null;void enterMatch({engine,input,audio,onFinish:result=>{done(result);inCard=false;enc.hold(q.has('noenc'));if(shouldShowCheckpoint(BUILD,'current',result))setTimeout(()=>showCheckpointCard({engine,input,id:BUILD.checkpoint}),1600);}});}});
  const auto = { move: null, until: 0 };
  let leaving = false;
  const api = {
    hero, ora, cam, day, lights, input, talk, lantern, river, walkable, zoneAt, encounters: enc, slothHook, quest, sloth, awakeSloth, idleSloth, mossStone, wilds, vista, fogGroup, WILDS_END, guardianVisits: () => guardianVisits, zoneLock: false,
    teleport(x, z, dir = 'up') {
      api.zoneLock = false; cam.yawTarget = 0; heroPos.set(x, bridgeY(z), z); hero.dir = dir;
      Object.assign(cam.target, zoneFor(z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
      engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix(); cam.snap(heroPos); ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
    },
    setTime(name, instant = true) { day.set(name, instant); envDirty = true; },
    autoWalk(dx, dz, seconds, run = false) { auto.move = new THREE.Vector3(dx, 0, dz).normalize(); auto.run = run; auto.until = engine.time + seconds; },
    /** Put a stirring in the world now (test shots). */
    stir(x, z) { const s = enc.spawnAt(x, z); addStir(s); return s; },
    showCard,
    update(dt, t) {
      if(inCard){input.endFrame();return;}
      dt = Math.min(Math.max(dt, 0), 0.05);
      talk.update(dt);
      if (input.consume('KeyT')) day.next();
      if (input.consume('KeyQ')) cam.turn(-1);
      if (input.consume('KeyE')) cam.turn(1);
      const ax = inCard ? { x: 0, y: 0 } : input.axis();
      const fwd = cam.forward(), right = cam.right();
      let move = null, speed = 0;
      if (!talk.active && (ax.x || ax.y)) { move = right.clone().multiplyScalar(ax.x).addScaledVector(fwd, ax.y).normalize(); speed = ax.run ? 10.5 : 5.2; }
      else if (auto.move && t < auto.until && !inCard && !talk.active) { move = auto.move.clone(); speed = auto.run ? 10.5 : 5.2; }
      vel.lerp(move ? move.clone().multiplyScalar(speed) : new THREE.Vector3(), 1 - Math.exp(-dt * 12));
      const nx = heroPos.x + vel.x * dt, nz = heroPos.z + vel.z * dt;
      if (walkable(nx, nz)) { heroPos.x = nx; heroPos.z = nz; }
      else if (walkable(nx, heroPos.z)) { heroPos.x = nx; vel.z = 0; }
      else if (walkable(heroPos.x, nz)) { heroPos.z = nz; vel.x = 0; }
      else vel.set(0, 0, 0);
      heroPos.y = bridgeY(heroPos.z);
      // the way back: walking out past the start returns to the gate road, through the ring gate
      if (go && !leaving && heroPos.z > START + 1.5) { leaving = true; auto.move = new THREE.Vector3(0, 0, 1); auto.run = false; auto.until = t + 3; go('gate-road'); }
      const moving = vel.length() > 0.4;
      hero.update(dt, engine.camera, moving ? vel.clone().setY(0).normalize() : null, vel.length(), right, fwd);
      const off = { down: [0.95, 1.62, 0.25], up: [-0.95, 1.62, 0.25], left: [-0.7, 1.55, 0.3], right: [0.85, 1.6, 0.3] }[hero.dir];
      anchor.copy(heroPos).addScaledVector(right, off[0]).addScaledVector(fwd, -off[2]); anchor.y += off[1];
      if (!api.zoneLock) Object.assign(cam.target, zoneFor(heroPos.z));
      cam.update(dt, heroPos);

      if (zoneAt(heroPos.x, heroPos.z) === 'bridge') quest.reachBridge();
      const nearSloth = Math.hypot(heroPos.x - slothHook.x, heroPos.z - slothHook.z) <= slothHook.radius;
      if (!nearSloth) approached = false;
      // Sloth waits (Daryll, 2026-10-16): he is the first boss, but the fight comes once the battle is designed for real.
      // Until then he sits at the bridge's end, crouched and breathing; ?slothfight=1 keeps the old hook for testing.
      if (SLOTH_FIGHT && nearSloth && !approached && !inCard && quest.snapshot.quest2 === QUEST2_STATES.BRIDGE) {
        approached = true; quest.startBattle(bridgeBattle);
      }
      syncSloth(); syncOpening(dt, t);
      if(!lanternLit&&quest.snapshot.secondDeed&&Math.hypot(heroPos.x-lantern.position.x,heroPos.z-lantern.position.z)<4){lanternLit=true;audio.chime();try{localStorage.setItem('atlas.road.lantern','1');}catch{}}
      lantern.userData.lit=lanternLit;lampMat.emissiveIntensity=lanternLit?2.5:0;lampLight.intensity=lanternLit?9:0;

      // encounters: spawn, drift, meet, decline or engage
      for (const ev of enc.update(dt, heroPos, zoneAt(heroPos.x, heroPos.z))) {
        if (ev.type === 'spawn') { addStir(enc.stirrings.find((s) => s.id === ev.id)); audio.chime(); }
        else if (ev.type === 'engage') showCard();
        else if (ev.type === 'declined') audio.chime();
      }
      thinTarget = enc.stirrings.length || inCard ? 1 : 0;
      thin += (thinTarget - thin) * (1 - Math.exp(-dt * 1.2));
      for (const [id, st] of stirs) {
        const live = enc.stirrings.find((s) => s.id === id);
        st.a += ((live ? 1 : 0) - st.a) * (1 - Math.exp(-dt * (live ? 1.1 : 2.2)));
        if (live) { st.mesh.position.set(live.x, bridgeY(live.z), live.z); st.mesh.rotation.y = Math.atan2(engine.camera.position.x - live.x, engine.camera.position.z - live.z); }
        st.mesh.material.uniforms.uA.value = st.a; st.mesh.material.uniforms.uTime.value = t;
        if (!live && st.a < 0.02) { scene.remove(st.mesh); st.mesh.material.dispose(); stirs.delete(id); }
      }

      day.update(dt);
      const F = engine.post.final.u; F.uSat.value = baseSat * (1 - 0.32 * thin); F.uExposure.value = baseExp * (1 - 0.1 * thin);
      envTimer += dt;
      if (envDirty && envTimer > 0.4) { refreshEnv(); envDirty = false; envTimer = 0; }
      const k = day.current;
      sunTarget.copy(cam.focus);
      const texel = 84 / 2048; sunTarget.x = Math.round(sunTarget.x / texel) * texel; sunTarget.z = Math.round(sunTarget.z / texel) * texel;
      sun.target.position.copy(sunTarget); sun.position.copy(sunTarget).addScaledVector(k.lightDir, 140);
      moonFill.target.position.copy(sunTarget);
      moonFill.position.copy(sunTarget).addScaledVector(k.moonDir, 140);
      river.update(dt,t,k);
      city.update(t);
      ora.update(dt, t, anchor, engine.camera, engine.post.h);
      lights.update(cam.focus, dt, t);
      colossus.update(t); colossus.viewDir(k, engine.camera);
      for (const p of P) p.update && p.update(dt, t, engine.camera, engine.post.h);
      skyUniforms.uTime.value = t;
      const H = engine.post.haze.u, heroDist = engine.camera.position.distanceTo(heroPos);
      H.uFocusDist.value = heroDist - 0.5;
      const sp = heroPos.clone(); sp.y += 1.2; sp.project(engine.camera);
      H.uFocusY.value = sp.y * 0.5 + 0.5;
      const pw = engine.post.w, ph = engine.post.h;
      const hpx = (hero.height / (2 * heroDist * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov) / 2))) * ph;
      occluder.uOcc.value.set((sp.x * 0.5 + 0.5) * pw, (sp.y * 0.5 + 0.5) * ph, heroDist, hpx * 1.15);
      engine.camera.updateMatrixWorld();
      mirror.render(scene, engine.camera, pw, ph);
      F.uGround.value = 0.38;
      const fp = focalWorld.set(0, COLOSSUS.bottom + COLOSSUS.size * 0.55, COLOSSUS.z).project(engine.camera);
      F.uFocalPos.value.set(fp.x * 0.5 + 0.5, fp.y * 0.5 + 0.5); F.uFocal.value = fp.z < 1 ? 0.22 * (1 - opening) : 0;   // the hidden colossus's focal glow would sit as a pale block in the new vista
      const sh = shaftWorld.copy(engine.camera.position).addScaledVector(k.stars > 0.7 ? k.moonDir : k.skySun, 900).project(engine.camera);
      engine.post.final.u.uShaftPos.value.set(sh.x * 0.5 + 0.5, sh.y * 0.5 + 0.5);
      input.endFrame();
    },
  };
  engine.add(api);
  return api;
}
