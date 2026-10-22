import { sealedWay } from './sealed-way.js';
// SCENE: "Leaving the City at dusk." A causeway with gold-inlaid seams runs through the City, past lanterns and navy banners,
// across a plaza with a gold compass, through the colossal ring gate, and out over the abyss on a bridge toward the colossus.
// Coordinates: the road runs along -Z (toward the gate). Plaza level y = 0, road surface y = 0.4. 1 unit ~ 1 m.
import * as THREE from 'three';
import { roadLamps } from './road-lamps.js';
import { MANIFEST } from './manifest.js';
import { loadAssets } from '../engine/assets.js';
import { Batch } from '../engine/world/builders.js';
import { createSky, skyUniforms } from '../engine/world/sky.js';
import { buildGate } from '../engine/world/gate.js';
import { buildColossus } from '../engine/world/colossus.js';
import { building, spire } from '../engine/world/city.js';
import { waterfallMaterial, canalMaterial } from '../engine/world/water.js';
import { PlanarReflection, addOccluderFade, occluder } from '../engine/world/reflection.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { DayCycle } from '../engine/lighting/daycycle.js';
import { createParticles } from '../engine/fx/particles.js';
import { glowTexture, mistTexture } from '../engine/pixel/world-sprites.js';
import { SpriteCharacter, addSpriteRim } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { Ora } from '../engine/actors/ora.js';
import { DioramaCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { Ambience } from '../engine/audio.js';
import { rng } from '../engine/pixel/paint.js';
import { firstDeedDone } from '../engine/green-plot.js';

const ROAD_Y = 0.4, ROAD_HALF = 3.5;
const ROAD_START = 76, PLAZA_Z0 = -33, GATE_Z = -52, EDGE_Z = -55, BRIDGE_END = -262;
const COLOSSUS = { z: -430, bottom: -58, size: 152, scale: 0.92 };

export async function createGateRoad(engine, { time = 'dusk', from = null, go = null } = {}) {
  const A = await loadAssets(MANIFEST);
  const scene = engine.scene;
  const R = rng(20261010);
  const roles = { windows: [], lanterns: [], glyphs: [], seams: [], banners: [] };
  const std = (o, tile, role, base = 1) => {
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.tile = tile;
    if (role) { roles[role].push(m); m.userData.base = base; }
    return m;
  };
  const tex = (k) => A[k];
  const M = {
    road: std({ map: A.road.map, normalMap: A.road.normalMap, roughnessMap: A.road.ormMap, metalnessMap: A.road.ormMap, emissiveMap: A.road.emissiveMap, emissive: 0xffffff, roughness: 1, metalness: 1, envMapIntensity: 1.0, normalScale: new THREE.Vector2(1.2, 1.2) }, A.road.tile, 'seams', 1),
    pale: std({ map: A.pale.map, normalMap: A.pale.normalMap, roughness: 0.92, envMapIntensity: 0.3 }, A.pale.tile),
    dark: std({ map: A.dark.map, normalMap: A.dark.normalMap, roughness: 0.85, envMapIntensity: 0.35 }, A.dark.tile),
    pave: std({ map: A.pave.map, normalMap: A.pave.normalMap, roughness: 0.6, envMapIntensity: 0.6 }, A.pave.tile),
    roof: std({ map: A.roof.map, normalMap: A.roof.normalMap, roughness: 0.55, envMapIntensity: 0.6 }, A.roof.tile),
    cliff: std({ map: A.cliff.map, normalMap: A.cliff.normalMap, roughness: 0.95, envMapIntensity: 0.2 }, A.cliff.tile),
    grass: std({ map: A.grass.map, normalMap: A.grass.normalMap, roughness: 1, envMapIntensity: 0.15 }, A.grass.tile),
    iron: std({ map: A.iron.map, roughnessMap: A.iron.ormMap, metalnessMap: A.iron.ormMap, roughness: 1, metalness: 1 }, 1),
    brass: std({ map: A.brass.map, roughnessMap: A.brass.ormMap, metalnessMap: A.brass.ormMap, roughness: 1, metalness: 1, envMapIntensity: 1.2 }, 1),
    gold: std({ color: '#d4b06a', metalness: 1, roughness: 0.28, envMapIntensity: 1.4, emissive: '#7a5c2c', emissiveIntensity: 0.4 }, 1, 'seams', 0.8),
    cyan: std({ color: '#0d3333', emissive: '#3fd3c8', emissiveIntensity: 2.5, roughness: 0.4 }, 1, 'glyphs', 1),
    signal: std({ color: '#0b2020', emissive: '#3fd3c8', emissiveIntensity: 0.6, roughness: 0.5 }, 1, 'glyphs', 0.14),
    glass: std({ map: A.lantern.map, emissiveMap: A.lantern.emissiveMap, emissive: 0xffffff, emissiveIntensity: 3, roughness: 0.3 }, 1, 'lanterns', 1),
    flame: std({ color: '#ffb060', emissive: '#ffa040', emissiveIntensity: 6 }, 1, 'lanterns', 2),
  };
  for (const k of ['win0', 'win1', 'win2'])
    M[k] = std({ map: A[k].map, normalMap: A[k].normalMap, emissiveMap: A[k].emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.88, envMapIntensity: 0.3 }, A[k].tile, 'windows', 1);
  const WIN = ['win0', 'win1', 'win2'];
  const B = new Batch(M);
  const mirror = new PlanarReflection(engine.renderer, { y: ROAD_Y + 0.005, scale: 0.75 });
  mirror.apply(M.road, { base: 0.68, streak: 0.009 });
  M.road.roughness = 0.72;
  M.road.envMapIntensity = 0.35;
  engine.camera.layers.enable(1);
  for (const k of ['pale', 'dark', 'roof', 'iron', 'brass', 'gold', 'cyan', 'signal', 'glass', 'flame', 'win0', 'win1', 'win2']) addOccluderFade(M[k]);
  const lights = new LightPool(scene, 12);
  const lanternPos = [];

  // ---------- sky + env ----------
  scene.add(createSky());

  // ---------- ground: plateau grass, cliff, road, paving ----------
  {
    const g = new THREE.BoxGeometry(260, 2, EDGE_Z * -1 + 120); g.translate(0, -1, (120 + EDGE_Z) / 2 + 0.0);
    B.add('grass', g);
    // the cliff face under the plateau edge, and its strata
    B.box('cliff', 300, 150, 6, 0, -75, EDGE_Z - 3);
    // the causeway body (city section)
    B.box('pale', ROAD_HALF * 2 + 0.6, ROAD_Y, ROAD_START - EDGE_Z, 0, ROAD_Y / 2, (ROAD_START + EDGE_Z) / 2);
    // terraces of paving beside the road
    for (const s of [-1, 1]) B.box('pave', 5.5, 0.06, ROAD_START - PLAZA_Z0, s * (ROAD_HALF + 3.25), 0.03, (ROAD_START + PLAZA_Z0) / 2);
    // the gate plaza (raised to road level)
    B.box('pave', 24, ROAD_Y, PLAZA_Z0 - EDGE_Z, 0, ROAD_Y / 2, (PLAZA_Z0 + EDGE_Z) / 2);
    B.box('dark', 24.6, 0.25, 0.6, 0, ROAD_Y + 0.12, PLAZA_Z0 + 0.3);
  }
  // road surface (city + bridge): one strip with its own UVs (7 units across, 8 per tile along)
  {
    const len = ROAD_START - BRIDGE_END;
    const g = new THREE.PlaneGeometry(ROAD_HALF * 2, len, 1, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(0, ROAD_Y + 0.005, (ROAD_START + BRIDGE_END) / 2);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + ROAD_HALF) / (ROAD_HALF * 2), -p.getZ(i) / 8);
    const road = new THREE.Mesh(g, M.road);
    road.receiveShadow = true;
    road.layers.set(1);
    scene.add(road);
  }
  // the compass inlay on the plaza
  {
    const cm = new THREE.MeshStandardMaterial({ map: A.compass.map, emissiveMap: A.compass.emissiveMap, emissive: 0xffffff, roughnessMap: A.compass.ormMap, metalnessMap: A.compass.ormMap, transparent: true, alphaTest: 0.5, roughness: 1.6, metalness: 0.85, envMapIntensity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 });
    roles.seams.push(cm); cm.userData.base = 0.9;
    const c = new THREE.Mesh(new THREE.CircleGeometry(7.5, 96), cm);
    c.rotation.x = -Math.PI / 2; c.position.set(0, ROAD_Y + 0.012, -42.5);
    c.receiveShadow = true;
    scene.add(c);
  }

  // ---------- balustrades, pillars, lanterns (city road + bridge) ----------
  const lantern = (x, y, z, scale = 1) => {
    B.box('iron', 0.44 * scale, 0.08, 0.44 * scale, x, y + 0.04, z);
    const g = new THREE.BoxGeometry(0.3 * scale, 0.44 * scale, 0.3 * scale); g.translate(x, y + 0.08 + 0.22 * scale, z);
    B.add('glass', g, { uv: false });
    B.pyramid('iron', 0.48 * scale, 0.48 * scale, 0.22 * scale, x, y + 0.08 + 0.44 * scale, z);
    B.cone('gold', 0.05, 0.22, x, y + 0.08 + 0.44 * scale + 0.2 * scale, z, 4);
    const p = new THREE.Vector3(x, y + 0.08 + 0.22 * scale, z);
    lanternPos.push(p);
    lights.add({ pos: p, color: '#ffa04a', intensity: 26 * scale, distance: 13, flicker: 0.12, role: 'lantern' });
  };
  const balustrade = (z0, z1, step, yBase, lanterns = true) => {
    for (const s of [-1, 1]) {
      const x = s * (ROAD_HALF + 0.25);
      B.box('pale', 0.42, 0.75, Math.abs(z1 - z0), x, yBase + 0.375, (z0 + z1) / 2);
      B.box('pale', 0.6, 0.14, Math.abs(z1 - z0), x, yBase + 0.82, (z0 + z1) / 2);
      for (let z = z0; z >= z1; z -= step) {
        B.box('pale', 0.85, 1.55, 0.85, x, yBase + 0.775, z);
        B.box('dark', 1.0, 0.18, 1.0, x, yBase + 1.64, z);
        B.box('gold', 0.86, 0.05, 0.86, x, yBase + 1.47, z);
        if (lanterns) lantern(x, yBase + 1.73, z);
      }
    }
  };
  balustrade(ROAD_START - 4, PLAZA_Z0 + 1, 8, ROAD_Y);
  balustrade(EDGE_Z - 2, BRIDGE_END + 2, 12, ROAD_Y);
  // plaza side walls and the parapet at the edge
  for (const s of [-1, 1]) {
    B.box('pale', 0.42, 0.75, PLAZA_Z0 - EDGE_Z, s * 12, ROAD_Y + 0.375, (PLAZA_Z0 + EDGE_Z) / 2);
    B.box('pale', 0.6, 0.14, PLAZA_Z0 - EDGE_Z, s * 12, ROAD_Y + 0.82, (PLAZA_Z0 + EDGE_Z) / 2);
    B.box('pale', 8, 0.75, 0.42, s * 8, ROAD_Y + 0.375, EDGE_Z + 0.2);
    B.box('pale', 8, 0.14, 0.6, s * 8, ROAD_Y + 0.82, EDGE_Z + 0.2);
  }

  // ---------- the bridge over the abyss ----------
  {
    B.box('pale', ROAD_HALF * 2 + 1.2, 1.6, EDGE_Z - BRIDGE_END, 0, ROAD_Y - 0.8, (EDGE_Z + BRIDGE_END) / 2);
    B.box('dark', ROAD_HALF * 2 + 1.5, 0.3, EDGE_Z - BRIDGE_END, 0, ROAD_Y - 1.75, (EDGE_Z + BRIDGE_END) / 2);
    const span = 22;
    for (let z = EDGE_Z - 12; z > BRIDGE_END; z -= span) {
      B.box('pale', 6.5, 160, 5, 0, -1.2 - 80, z);
      B.box('dark', 7.5, 1.2, 6, 0, -12, z);
      // arch between this pier and the next
      const sh = new THREE.Shape();
      const L = span - 5;
      sh.moveTo(0, 0); sh.lineTo(L, 0); sh.lineTo(L, -9);
      sh.absellipse(L / 2, -9, L / 2, 6.5, 0, Math.PI, false);
      sh.lineTo(0, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false, curveSegments: 24 });
      g.rotateY(-Math.PI / 2);
      g.translate(3, -1.2, z - 2.5 - L);
      B.add('pale', g);
    }
  }

  // ---------- the City ----------
  const front = [], mid = [], back = [];
  const lightSites = [];   // [x, z, halfWidth, base, height] for the distant twinkle field
  for (const s of [-1, 1]) {
    let z = ROAD_START + 2;
    while (z > PLAZA_Z0 + 4) {
      const wz = 7 + R() * 5, d = 8 + R() * 4;
      const cz = z - wz / 2, cx = s * (12 + d / 2);
      if (R() < 0.28) spire(B, R, { x: cx, z: cz, r: 2.2 + R() * 0.6, h: 18 + R() * 12, win: WIN[(R() * 3) | 0], signal: R() < 0.4, cyanKey: 'signal' });
      else building(B, R, { x: cx, z: cz, w: d, d: wz, floors: 2 + ((R() * 2) | 0), roof: R() < 0.7 ? 'hip' : 'dome', win: WIN[(R() * 3) | 0] });
      front.push([cx, cz]);
      z -= wz + 0.6 + R() * 1.6;
    }
    z = ROAD_START + 6;
    while (z > PLAZA_Z0 - 4) {
      const wz = 9 + R() * 6, d = 10 + R() * 5;
      const cz = z - wz / 2, cx = s * (26 + d / 2);
      if (R() < 0.4) spire(B, R, { x: cx, z: cz, r: 2.8 + R() * 0.8, h: 26 + R() * 18, win: WIN[(R() * 3) | 0], signal: R() < 0.5, cyanKey: 'signal' });
      else building(B, R, { x: cx, z: cz, w: d, d: wz, floors: 3 + ((R() * 3) | 0), roof: R() < 0.6 ? 'hip' : 'dome', win: WIN[(R() * 3) | 0] });
      mid.push([cx, cz]);
      z -= wz + 1 + R() * 2;
    }
    z = ROAD_START + 10;
    while (z > PLAZA_Z0 - 10) {
      const wz = 10 + R() * 8, d = 12 + R() * 6;
      const cz = z - wz / 2, cx = s * (44 + d / 2 + R() * 6);
      if (R() < 0.55) spire(B, R, { x: cx, z: cz, r: 3.2 + R(), h: 34 + R() * 26, win: WIN[(R() * 3) | 0], signal: R() < 0.5, cyanKey: 'signal' });
      else building(B, R, { x: cx, z: cz, w: d, d: wz, floors: 4 + ((R() * 4) | 0), roof: 'hip', win: WIN[(R() * 3) | 0] });
      back.push([cx, cz]);
      z -= wz + 1 + R() * 3;
    }
  }
  // hero spires on the skyline near the edge (they frame the gate)
  for (const [x, z, h, r] of [[-30, -40, 52, 3.4], [33, -44, 60, 3.8], [-52, -30, 66, 4.2], [58, -24, 48, 3.4], [-20, -48, 30, 2.4], [22, -50, 34, 2.6]])
    spire(B, R, { x, z, r, h, win: WIN[(R() * 3) | 0], signal: true, cyanKey: 'signal' });

  // ---------- gate plaza: the gate, its feet, obelisks, shrines ----------
  const gate = buildGate({ stone: M.dark, brass: M.brass, cyanMat: M.cyan });
  gate.group.position.set(0, 7.2, GATE_Z);
  scene.add(gate.group);
  for (const s of [-1, 1]) {
    B.box('dark', 4.2, 2.2, 5.6, s * 12.4, ROAD_Y + 1.1, GATE_Z);
    B.box('gold', 4.3, 0.08, 5.7, s * 12.4, ROAD_Y + 1.9, GATE_Z);
    B.box('dark', 5.2, 0.5, 6.6, s * 12.4, ROAD_Y + 0.25, GATE_Z);
    // obelisks
    const ox = s * 16.5, oz = GATE_Z + 2;
    B.box('dark', 2.6, 1.4, 2.6, ox, ROAD_Y + 0.7 - 0.4, oz);
    B.cyl('dark', 0.95, 15, ox, ROAD_Y + 1.0, oz, 4, 0.62);
    B.pyramid('gold', 1.25, 1.25, 1.6, ox, ROAD_Y + 16, oz, Math.PI / 4);
    B.box('signal', 0.08, 11, 0.08, ox + 0.0, ROAD_Y + 8, oz + 0.86, { uv: false });
    lights.add({ pos: new THREE.Vector3(ox, ROAD_Y + 6, oz + 1.6), color: '#3fd3c8', intensity: 18, distance: 10, flicker: 0.04, role: 'glyph', priority: 1.2 });
    // shrine brazier beside the steps (the prototype's warm gold shrine)
    const bx = s * 8.6, bz = GATE_Z + 6.5;
    B.box('dark', 1.6, 0.5, 1.6, bx, ROAD_Y + 0.25, bz);
    B.cyl('brass', 0.32, 1.3, bx, ROAD_Y + 0.5, bz, 8, 0.24);
    B.cyl('brass', 0.45, 0.35, bx, ROAD_Y + 1.8, bz, 8, 0.75);
    const fl = new THREE.SphereGeometry(0.42, 8, 6); fl.scale(1, 1.3, 1); fl.translate(bx, ROAD_Y + 2.35, bz);
    B.add('flame', fl, { uv: false });
    lanternPos.push(new THREE.Vector3(bx, ROAD_Y + 2.4, bz));
    lights.add({ pos: new THREE.Vector3(bx, ROAD_Y + 2.7, bz), color: '#ff9a3c', intensity: 46, distance: 15, flicker: 0.22, role: 'lantern', priority: 1.6 });
  }
  for (const gp of gate.gems.slice(0, 6)) lights.add({ pos: gp.clone().add(gate.group.position), color: '#3fd3c8', intensity: 8, distance: 7, flicker: 0.05, role: 'glyph' });
  lights.add({ pos: new THREE.Vector3(0, ROAD_Y + 1.5, GATE_Z), color: '#3fd3c8', intensity: 22, distance: 14, flicker: 0.05, role: 'glyph', priority: 1.4 });

  // ---------- banners on poles ----------
  const bannerMats = [];
  const bannerGeo = new THREE.PlaneGeometry(1.7, 4.25, 1, 10);
  const bannerMat = new THREE.MeshStandardMaterial({ map: A.banner.map, emissiveMap: A.banner.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.4, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
  roles.banners.push(bannerMat); bannerMat.userData.base = 1;
  const windT = { value: 0 };
  bannerMat.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = windT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float hang = 1.0 - uv.y;
        float ph = modelMatrix[3][2] * 0.13 + modelMatrix[3][0] * 0.7;
        transformed.z += (sin(uWind * 1.7 + ph + hang * 2.2) * 0.22 + sin(uWind * 3.1 + ph * 1.3 + hang * 4.0) * 0.06) * hang;
        transformed.x += sin(uWind * 1.1 + ph) * 0.05 * hang;`);
  };
  const bannerDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: A.banner.map, alphaTest: 0.5 });
  for (const s of [-1, 1]) for (let z = ROAD_START - 8; z > PLAZA_Z0; z -= 16) {
    const px = s * (ROAD_HALF + 3.4);
    B.cyl('iron', 0.09, 7.2, px, 0, z, 6);
    B.box('iron', 2.1, 0.1, 0.1, px - s * 0.95, 6.95, z);
    const star = new THREE.OctahedronGeometry(0.28); star.scale(0.7, 1.4, 0.7); star.translate(px, 7.45, z); B.add('gold', star, { uv: false });
    const m = new THREE.Mesh(bannerGeo, bannerMat);
    m.position.set(px - s * 0.95, 6.9 - 2.12, z);
    m.castShadow = true; m.customDepthMaterial = bannerDepth;
    scene.add(m);
  }
  // great banners hanging from the obelisk line toward the gate
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 6.0, 1, 12), bannerMat);
    m.position.set(s * 9.8, ROAD_Y + 4.2, PLAZA_Z0 - 1.2);
    B.cyl('iron', 0.12, 8.6, s * 11.2, ROAD_Y, PLAZA_Z0 - 1.2, 6);
    B.cyl('iron', 0.12, 8.6, s * 8.4, ROAD_Y, PLAZA_Z0 - 1.2, 6);
    B.box('iron', 3.2, 0.12, 0.12, s * 9.8, ROAD_Y + 7.3, PLAZA_Z0 - 1.2);
    m.castShadow = true; m.customDepthMaterial = bannerDepth;
    scene.add(m);
  }

  // ---------- canals and waterfalls ----------
  const waters = [];
  for (const s of [-1, 1]) {
    const cx = s * 17, z0 = PLAZA_Z0 + 6, z1 = EDGE_Z;
    B.box('dark', 0.5, 0.6, z0 - z1, cx - 1.6, 0.3, (z0 + z1) / 2);
    B.box('dark', 0.5, 0.6, z0 - z1, cx + 1.6, 0.3, (z0 + z1) / 2);
    const cm = canalMaterial({ width: 2.7, length: z0 - z1 });
    const g = new THREE.PlaneGeometry(2.7, z0 - z1); g.rotateX(-Math.PI / 2);
    // uv.y must grow toward the edge (-z): PlaneGeometry's v grows toward -z after this rotation
    const canal = new THREE.Mesh(g, cm); canal.position.set(cx, 0.18, (z0 + z1) / 2); scene.add(canal); waters.push(cm);
    const fm = waterfallMaterial({ width: 2.7, height: 60, speed: 9 });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 60), fm);
    fall.position.set(cx, 0.15 - 30, EDGE_Z - 6.4);
    scene.add(fall); waters.push(fm);
  }
  // far waterfalls off the far cliffs (facing the camera)
  const farCliffs = [
    [-170, -96, -120, -330, -6], [-104, -76, -150, -250, -16], [96, 170, -120, -330, -4], [78, 106, -160, -260, -20],
    [-220, -150, -100, -380, 4], [150, 220, -100, -380, 8],
  ];
  for (const [x0, x1, z0, z1, top] of farCliffs) {
    // the core mass, then pillars and shoulders of rock breaking its silhouette
    B.box('cliff', (x1 - x0) * 0.8, 170 + top - 8, (z0 - z1) * 0.8, (x0 + x1) / 2, top - 8 - (170 + top - 8) / 2, (z0 + z1) / 2);
    const n = Math.max(4, Math.round((x1 - x0) / 14));
    for (let k = 0; k < n; k++) {
      const px = x0 + (k + 0.5) * (x1 - x0) / n + (R() - 0.5) * 6, pz = z0 - 4 - R() * (z0 - z1 - 8);
      const r = 7 + R() * 9, h = 170 + top + (R() - 0.6) * 22;
      const g = new THREE.CylinderGeometry(r * (0.55 + R() * 0.25), r, h, 5 + ((R() * 3) | 0), 1);
      g.rotateY(R() * 6.28); g.translate(px, -170 + h / 2, pz);
      B.add('cliff', g);
    }
    // a lip at the front edge where the falls pour
    B.box('dark', x1 - x0, 1.2, 3, (x0 + x1) / 2, top - 0.6, z0 + 0.5);
  }
  for (const [x, w, top, z] of [[-112, 9, -6, -119.6], [-140, 6, -6, -119.6], [-88, 11, -16, -149.6], [118, 10, -4, -119.6], [146, 6, -4, -119.6], [90, 12, -20, -159.6]]) {
    const h = 110;
    const fm = waterfallMaterial({ width: w, height: h, tpu: 4, speed: 12 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fm);
    m.position.set(x, top - h / 2 + 0.2, z);
    scene.add(m); waters.push(fm);
  }
  // spires on the far cliffs (the far quarters of the City, hazed by distance)
  for (let k = 0; k < 30; k++) {
    const left = k % 2 === 0;
    const c = farCliffs[left ? (k % 4 === 0 ? 0 : 1) : (k % 4 === 1 ? 2 : 3)];
    const x = c[0] + 6 + R() * (c[1] - c[0] - 12), z = c[2] - 6 - R() * (c[2] - c[3] - 20);
    if (R() < 0.6) { const r = 2.5 + R() * 2, h = 20 + R() * 40; spire(B, R, { x, z, base: c[4], r, h, win: WIN[(R() * 3) | 0], signal: R() < 0.3, cyanKey: 'signal' }); lightSites.push([x, z + r, r, c[4] + 1.4, h]); }
    else { const w = 8 + R() * 8, d = 8 + R() * 8, fl = 2 + ((R() * 4) | 0); building(B, R, { x, z, base: c[4], w, d, floors: fl, roof: 'hip', win: WIN[(R() * 3) | 0] }); lightSites.push([x, z + d / 2, w / 2, c[4] + 1.2, fl * 4]); }
  }

  // the colossus's seat: a broken crag rising out of the abyss mist, a few fallen blocks at its rim
  {
    const g = new THREE.CylinderGeometry(70, 104, 240, 28, 12);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x);
      const k = 1 + (Math.sin(a * 5 + y * 0.031) * 0.09 + Math.sin(a * 11 + y * 0.09) * 0.06 + Math.sin(a * 23 - y * 0.2) * 0.03) * (y > 119 ? 0.35 : 1);
      pa.setX(i, x * k); pa.setZ(i, z * k);
      if (y > 119) pa.setY(i, y + Math.sin(a * 7) * 2.5 - 2);
    }
    g.translate(0, COLOSSUS.bottom - 120.5, COLOSSUS.z + 6);
    g.computeVertexNormals();
    B.add('cliff', g);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (0.15 + 0.7 * R()) * (k % 2 ? 1 : -1) + Math.PI / 2, r = 62 + R() * 18, s = 6 + R() * 9;
      const b = new THREE.DodecahedronGeometry(s, 0); b.scale(1, 0.7, 1.1); b.rotateY(R() * 6); b.rotateX(R() * 0.6);
      b.translate(Math.cos(a) * r, COLOSSUS.bottom + s * 0.3 - 1, COLOSSUS.z + 6 + Math.sin(a) * r * 0.9);
      B.add('cliff', b);
    }
  }
  B.build(scene);

  // ---------- trees and bushes (billboards) ----------
  const billboards = [];
  const spriteMat = (t) => { t.map.magFilter = THREE.NearestFilter; return new THREE.MeshStandardMaterial({ map: t.map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }); };
  const treeMats = [spriteMat(A.tree), spriteMat(A.tree2)];
  const bushMat = spriteMat(A.bush);
  const foliageRim = { value: new THREE.Color(1, 0.7, 0.4) };
  addSpriteRim(treeMats[0], new THREE.Vector2(1 / 48, 1 / 72), foliageRim, 1);
  addSpriteRim(treeMats[1], new THREE.Vector2(1 / 48, 1 / 72), foliageRim, 1);
  addSpriteRim(bushMat, new THREE.Vector2(1 / 32, 1 / 18), foliageRim, 0.8);
  for (const m of [...treeMats, bushMat, bannerMat]) addOccluderFade(m);
  const addBillboard = (mat, w, h, x, z, y = 0) => {
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = false;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: 0.5 });
    scene.add(m); billboards.push(m);
  };
  for (const s of [-1, 1]) {
    for (let z = ROAD_START - 2; z > PLAZA_Z0 + 2; z -= 9 + R() * 6) addBillboard(treeMats[(R() * 2) | 0], 4.4, 6.6, s * (ROAD_HALF + 6.6 + R() * 0.8), z);
    for (let z = ROAD_START; z > PLAZA_Z0; z -= 4 + R() * 5) addBillboard(bushMat, 2.6, 1.46, s * (ROAD_HALF + 4.2 + R() * 1.2), z);
    for (let k = 0; k < 7; k++) addBillboard(treeMats[k % 2], 4.4, 6.6, s * (20 + R() * 16), PLAZA_Z0 - 2 - R() * 18);
  }

  // ---------- the colossus, far beyond: a mourning robed stone giant, seated, head bowed, with its broken halo ----------
  const colossus = buildColossus({ gold: M.brass });
  colossus.group.scale.setScalar(COLOSSUS.scale);
  colossus.group.position.set(0, COLOSSUS.bottom, COLOSSUS.z);
  scene.add(colossus.group);
  {
    const head = colossus.headLocal.clone().multiplyScalar(COLOSSUS.scale).add(colossus.group.position);
    const halo = new THREE.Group();
    halo.position.set(0, head.y + COLOSSUS.size * 0.05, head.z - 24);
    halo.rotation.z = 0.1;
    const arcs = [[0.25, 0.95], [1.32, 0.7], [2.15, 0.62], [2.95, 0.8], [3.95, 0.45], [4.55, 0.85], [5.55, 0.55]];
    for (const [a0, len] of arcs) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(COLOSSUS.size * 0.17, COLOSSUS.size * 0.012, 6, 40, len), M.brass);
      t.rotation.z = a0; halo.add(t);
      const g = new THREE.Mesh(new THREE.SphereGeometry(COLOSSUS.size * 0.008, 8, 6), M.cyan);
      g.position.set(Math.cos(a0 + len / 2) * COLOSSUS.size * 0.17, Math.sin(a0 + len / 2) * COLOSSUS.size * 0.17, 2.4); halo.add(g);
    }
    const inner = new THREE.Mesh(new THREE.TorusGeometry(COLOSSUS.size * 0.135, COLOSSUS.size * 0.005, 4, 64, 4.4), M.brass); inner.rotation.z = 2.6; halo.add(inner);
    scene.add(halo);
  }

  // ---------- particles ----------
  const glow = glowTexture(64, 0.0, 0.12), flare = glowTexture(128, 0.9, 0.08), mist = mistTexture(128, 3);
  const P = [];
  const addP = (o) => { const p = createParticles(o); scene.add(p); P.push(p); return p; };
  const fireflies = addP({ preset: 'fireflies', count: 220, min: new THREE.Vector3(-22, 0.6, PLAZA_Z0 - 22), max: new THREE.Vector3(22, 5, ROAD_START), texture: glow, seed: 3 });
  const motes = addP({ preset: 'motes', count: 260, min: new THREE.Vector3(-16, 0.5, EDGE_Z - 4), max: new THREE.Vector3(16, 18, PLAZA_Z0 + 30), texture: glow, seed: 5 });
  const embers = createParticles({ preset: 'embers', count: 1, min: new THREE.Vector3(), max: new THREE.Vector3(0, 3, 0), texture: glow });
  {
    // embers rise from each lantern and brazier
    const n = 360, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const lp = lanternPos[i % lanternPos.length]; pos[i * 3] = lp.x + (Math.random() - 0.5) * 0.2; pos[i * 3 + 1] = lp.y + 0.1; pos[i * 3 + 2] = lp.z + (Math.random() - 0.5) * 0.2; }
    const sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sd[i] = Math.random();
    embers.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    embers.geometry.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
    scene.add(embers); P.push(embers);
  }
  const mistAbyss = addP({ preset: 'mist', count: 70, min: new THREE.Vector3(-260, -70, -70), max: new THREE.Vector3(260, -30, -300), texture: mist, seed: 7, overrides: { size: 70 } });
  const mistGiant = addP({ preset: 'mist', count: 16, min: new THREE.Vector3(-150, COLOSSUS.bottom - 34, COLOSSUS.z - 40), max: new THREE.Vector3(150, COLOSSUS.bottom - 12, COLOSSUS.z + 110), texture: mist, seed: 12, overrides: { size: 80 } });
  const mistLow = addP({ preset: 'mist', count: 40, min: new THREE.Vector3(-60, -10, EDGE_Z - 4), max: new THREE.Vector3(60, -2, -90), texture: mist, seed: 8, overrides: { size: 34 } });
  const spray = addP({ preset: 'spray', count: 80, min: new THREE.Vector3(-18.5, -14, EDGE_Z - 8), max: new THREE.Vector3(-15.5, -2, EDGE_Z - 5), texture: mist, seed: 9 });
  const spray2 = addP({ preset: 'spray', count: 80, min: new THREE.Vector3(15.5, -14, EDGE_Z - 8), max: new THREE.Vector3(18.5, -2, EDGE_Z - 5), texture: mist, seed: 10 });
  // the far City's lit windows: a field of warm points (a few cyan) on the camera-facing faces of distant buildings
  {
    const pts = [], col = [];
    for (const [x, z, hw, base, h] of lightSites) {
      const n = Math.round(hw * h * 0.35);
      for (let i = 0; i < n; i++) {
        pts.push(x + (R() * 2 - 1) * hw * 0.9, base + 1 + R() * (h - 2), z + 0.3);
        const cy = R() < 0.1; col.push(cy ? 0.25 : 1.0, cy ? 0.83 : 0.66 + R() * 0.2, cy ? 0.8 : 0.32);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const tm = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `attribute vec3 color; varying vec3 vC; varying float vT; uniform float uScale; uniform float uTime;
        void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float h = fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453);
          vT = 0.55 + 0.45 * sin(uTime * (0.6 + h * 1.8) + h * 40.0); gl_PointSize = max(2.0, 1.4 * uScale / -mv.z); }`,
      fragmentShader: `uniform sampler2D uTex; uniform float uI; varying vec3 vC; varying float vT;
        void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vC * a * 3.0 * uI * vT, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    const field = new THREE.Points(g, tm); field.frustumCulled = false; field.renderOrder = 8;
    field.update = (dt, t, camera, h) => { tm.uniforms.uTime.value = t; tm.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    scene.add(field); P.push(field); roles.field = tm;
  }
  let haloLit;
  // lantern halos: one soft sprite each, one draw call
  {
    const n = lanternPos.length, pos = new Float32Array(n * 3);
    lanternPos.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    haloLit = new THREE.BufferAttribute(new Float32Array(n), 1); g.setAttribute('aLit', haloLit);
    const hm = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 } },
      vertexShader: `attribute float aLit; varying float vLit; uniform float uScale; void main(){ vLit=aLit; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 2.2 * uScale / -mv.z; }`,
      fragmentShader: `varying float vLit; uniform sampler2D uTex; uniform float uI; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vec3(1.0, 0.62, 0.28) * a * a * 0.9 * uI * vLit, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    const halos = new THREE.Points(g, hm); halos.frustumCulled = false; halos.renderOrder = 9;
    scene.add(halos);
    halos.update = (dt, t, camera, h) => { hm.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    P.push(halos);
    roles.halos = hm;
  }

  // ---------- sun / moon light + ambient ----------
  const sun = new THREE.DirectionalLight(0xffb070, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x6a63b0, 0x3a2a2a, 1.8);
  scene.add(hemi);

  // ---------- environment map from the sky (gold and wet stone reflect the dusk) ----------
  const pmrem = new THREE.PMREMGenerator(engine.renderer);
  const envScene = new THREE.Scene(); envScene.add(createSky());
  let envRT = null, envDirty = true, envTimer = 0;
  const refreshEnv = () => {
    const old = envRT;
    envRT = pmrem.fromScene(envScene, 0, 1, 2000);
    scene.environment = envRT.texture;
    if (old) old.dispose();
  };

  // ---------- hero + Ora ----------
  const sheet = A.atlas;
  const sp0 = sheet.sprite;
  const hero = new SpriteCharacter({ map: sheet.map, emissiveMap: sheet.emissiveMap, cols: sp0.cols, rows: sp0.rows, frameW: sp0.frameW, frameH: sp0.frameH, ppu: sp0.ppu, contactTex: glow });
  hero.applyGear();
  attachAtlasRun(hero, sheet);   // Shift: the run sheet swaps in (same layout, longer stride)
  // arriving from the plaza: he enters at the City end of the street, facing the gate
  hero.group.position.set(0, ROAD_Y, from === 'plaza' ? ROAD_START - 3 : from === 'open-road' ? GATE_Z - 1.2 : 30);
  if (from === 'open-road') hero.dir = 'down';   // coming back through the ring gate, facing the City
  scene.add(hero.group);
  const ora = new Ora({ glow, flare });
  scene.add(ora.group, ora.trail);

  // ---------- camera, input, day cycle ----------
  const cam = new DioramaCamera(engine.camera, { pitch: 15, dist: 34, fov: 30, height: 2.2, lead: 6 });
  const input = new Input();
  const audio = new Ambience();
  input.onFirstGesture(() => audio.start());
  const day = new DayCycle({ start: time });
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
    for (const m of roles.banners) m.emissiveIntensity = k.banners;
    for (const gm of gate.glyphMats) gm.uniforms.uIntensity.value = k.glyphs * 0.95;
    roles.halos.uniforms.uI.value = k.lanterns / 3.2;
    roles.field.uniforms.uI.value = k.windows / 2.3;
    lights.roleScale.lantern = k.lanternLight; lights.roleScale.glyph = k.glyphs / 2.6;
    ora.lightScale = k.oraLight;
    colossus.setDay(k, engine.camera);
    fireflies.material.uniforms.uAmount.value = Math.min(1, k.fireflies);
    fireflies.material.uniforms.uIntensity.value = 6 * Math.max(0.5, k.fireflies);
    motes.material.uniforms.uIntensity.value = 4 * k.motes;
    for (const mm of [mistAbyss, mistLow, mistGiant]) { mm.material.uniforms.uColor.value.copy(k.horizon).lerp(k.upper, 0.5).multiplyScalar(0.9); mm.material.uniforms.uColor2.value.copy(k.cloudLit).multiplyScalar(0.5).lerp(k.upper, 0.5); mm.material.uniforms.uIntensity.value = k.mist * 1.1; }
    for (const w of waters) if (w.uniforms.uTint) w.uniforms.uTint.value.copy(k.hemiSky).multiplyScalar(0.7).add(new THREE.Color(0.35, 0.35, 0.4));
    if (moving) envDirty = true;
    audio.setNight(Math.max(0, Math.min(1, (k.stars - 0.4) / 0.6)));
  });

  // where the shafts come from: the bright sky behind the gate
  const shaftWorld = new THREE.Vector3(0, 30, -600);

  const lampQuest = roadLamps({ scene, materials: M, lights, gate, engine, glow });

  const ringSeal = sealedWay(scene,{x:0,z:GATE_Z,width:12,height:7,open:lampQuest.quest.snapshot.firstDeed,sound:()=>audio.wake()});

  // Stop at the ring overlook: the colossus is seen on the horizon, never approached.
  const walkable = (x, z) => {
    if (ringSeal.blocks(x,z)) return false;
    if (Math.abs(x) <= ROAD_HALF - 0.45 && z <= ROAD_START + (go ? 4 : -1) && z >= GATE_Z - 4) return true;
    if (z <= PLAZA_Z0 + 0.5 && z >= EDGE_Z + 0.9 && Math.abs(x) <= 11.2) {
      if (z < GATE_Z + 2.3 && z > GATE_Z - 2.3) return Math.abs(x) <= 6.3;
      if (Math.abs(Math.abs(x) - 12.4) < 2.7 && Math.abs(z - GATE_Z) < 3.4) return false;
      if (Math.abs(Math.abs(x) - 8.6) < 1.0 && Math.abs(z - (GATE_Z + 6.5)) < 1.0) return false;
      return true;
    }
    return false;
  };

  // zone framing: the City street (diorama 3/4), the plaza (lower, wider: the gate and the colossus), the bridge
  const zoneFor = (z) => {
    const L = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
    const street = { pitch: 16, dist: 32, height: 2.2, lead: 6, fov: 30 };
    const vista = { pitch: 6.5, dist: 36, height: 3.6, lead: 9, fov: 36 };
    const t = (12 - z) / (12 - (PLAZA_Z0 + 4));          // 0 in the street, 1 at the plaza
    const e = t * t * (3 - 2 * Math.min(1, Math.max(0, t)));
    const o = {};
    for (const k in street) o[k] = L(street[k], vista[k], z > 12 ? 0 : e);
    if (z < EDGE_Z - 6) { o.pitch = 8; o.dist = 32; o.height = 3.0; o.lead = 10; o.fov = 34; }
    return o;
  };

  const vel = new THREE.Vector3();
  const heroPos = hero.group.position;
  const anchor = new THREE.Vector3();
  ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
  Object.assign(cam.target, zoneFor(heroPos.z));
  Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
  engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
  cam.snap(heroPos);
  day.update(0);
  refreshEnv();

  const auto = { move: null, until: 0 };
  let leaving = false;
  const api = {
    hero, ora, cam, day, lights, input, walkable, ringSeal, lampQuest, quest: lampQuest.quest,
    zoneLock: false,
    teleport(x, z, dir = 'up') {
      api.zoneLock = false; cam.yawTarget = 0;
      heroPos.set(x, ROAD_Y, z); hero.dir = dir;
      Object.assign(cam.target, zoneFor(z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
      engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
      cam.snap(heroPos); ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
    },
    setTime(name, instant = true) { day.set(name, instant); envDirty = true; },
    autoWalk(dx, dz, seconds, run = false) { auto.move = new THREE.Vector3(dx, 0, dz).normalize(); auto.run = run; auto.until = engine.time + seconds; },
    update(dt, t) {
      dt = Math.min(Math.max(dt, 0), 0.05);
      // input
      if (input.consume('KeyT')) { day.next(); }
      if (input.consume('KeyQ')) cam.turn(-1);
      if (input.consume('KeyE')) cam.turn(1);
      const ax = input.axis();
      const fwd = cam.forward(), right = cam.right();
      let move = null, speed = 0;
      if (ax.x || ax.y) { move = right.clone().multiplyScalar(ax.x).addScaledVector(fwd, ax.y).normalize(); speed = ax.run ? 10.5 : 5.2; }
      else if (auto.move && t < auto.until) { move = auto.move.clone(); speed = auto.run ? 10.5 : 5.2; }
      const want = move ? move.clone().multiplyScalar(speed) : new THREE.Vector3();
      vel.lerp(want, 1 - Math.exp(-dt * 12));
      const nx = heroPos.x + vel.x * dt, nz = heroPos.z + vel.z * dt;
      if (walkable(nx, nz)) { heroPos.x = nx; heroPos.z = nz; }
      else if (walkable(nx, heroPos.z)) { heroPos.x = nx; vel.z = 0; }
      else if (walkable(heroPos.x, nz)) { heroPos.z = nz; vel.x = 0; }
      else vel.set(0, 0, 0);
      // the way back: walking out past the start of the street (the City end) returns to the plaza
      if (go && !leaving && heroPos.z > ROAD_START - 2) {
        leaving = true;
        auto.move = new THREE.Vector3(0, 0, 1); auto.run = vel.length() > 7; auto.until = t + 3;
        go('plaza');
      }
      // the way out: through the woken ring gate (only after the first deed) onto the open road
      if (go && !leaving && heroPos.z < GATE_Z - 3.6 && firstDeedDone(globalThis.localStorage)) {
        leaving = true;
        auto.move = new THREE.Vector3(0, 0, -1); auto.run = vel.length() > 7; auto.until = t + 3;
        go('open-road');
      }
      const moving = vel.length() > 0.4;
      hero.update(dt, engine.camera, moving ? vel.clone().setY(0).normalize() : null, vel.length(), right, fwd);
      // Ora at the open hand: where the hand is depends on which way he faces (screen space)
      const off = { down: [0.95, 1.62, 0.25], up: [-0.95, 1.62, 0.25], left: [-0.7, 1.55, 0.3], right: [0.85, 1.6, 0.3] }[hero.dir];
      anchor.copy(heroPos).addScaledVector(right, off[0]).addScaledVector(fwd, -off[2]); anchor.y += off[1];
      // camera framing by zone
      if (!api.zoneLock) Object.assign(cam.target, zoneFor(heroPos.z));
      cam.update(dt, heroPos);
      // day cycle
      day.update(dt);
      envTimer += dt;
      if (envDirty && envTimer > 0.4) { refreshEnv(); envDirty = false; envTimer = 0; }
      // sun follows the focus (shadow map stays dense where we look), snapped to texels to avoid shimmer
      const k = day.current;
      sunTarget.copy(cam.focus);
      const texel = 92 / 4096;
      sunTarget.x = Math.round(sunTarget.x / texel) * texel; sunTarget.z = Math.round(sunTarget.z / texel) * texel;
      sun.target.position.copy(sunTarget);
      sun.position.copy(sunTarget).addScaledVector(k.lightDir, 140);
      lampQuest.update(dt,t,hero,input,anchor,k);
      ringSeal.update(dt,t,heroPos,lampQuest.quest.snapshot.firstDeed);
      ora.update(dt, t, anchor, engine.camera, engine.post.h);
      for(let i=0;i<lanternPos.length;i++) haloLit.setX(i,lampQuest.litAt(lanternPos[i]));
      haloLit.needsUpdate=true;
      embers.visible=lampQuest.quest.snapshot.firstDeed;
      // lights, water, glyphs, banners, billboards
      lights.update(cam.focus, dt, t);
      for (const w of waters) w.uniforms.uTime.value = t;
      for (const gm of gate.glyphMats) gm.uniforms.uTime.value = t;
      windT.value = t;
      colossus.update(t); colossus.viewDir(k, engine.camera);
      for (const b of billboards) b.rotation.y = Math.atan2(engine.camera.position.x - b.position.x, engine.camera.position.z - b.position.z);
      for (const p of P) p.update && p.update(dt, t, engine.camera, engine.post.h);
      skyUniforms.uTime.value = t;
      // depth of field focuses on Atlas; light shafts originate from the glow beyond the gate
      const H = engine.post.haze.u;
      const heroDist = engine.camera.position.distanceTo(heroPos);
      H.uFocusDist.value = heroDist - 0.5;
      const sp = heroPos.clone(); sp.y += 1.2; sp.project(engine.camera);
      H.uFocusY.value = sp.y * 0.5 + 0.5;
      const pw = engine.post.w, ph = engine.post.h;
      const hpx = (hero.height / (2 * heroDist * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov) / 2))) * ph;
      occluder.uOcc.value.set((sp.x * 0.5 + 0.5) * pw, (sp.y * 0.5 + 0.5) * ph, heroDist, hpx * 1.15);
      engine.camera.updateMatrixWorld();
      mirror.render(scene, engine.camera, pw, ph);
      const sh = shaftWorld.clone().project(engine.camera);
      engine.post.final.u.uShaftPos.value.set(sh.x * 0.5 + 0.5, sh.y * 0.5 + 0.5);
      input.endFrame();
    },
  };
  engine.add(api);
  return api;
}
