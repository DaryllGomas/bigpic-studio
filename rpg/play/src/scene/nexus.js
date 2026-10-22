// SCENE: "The Nexus." The temple between worlds at the heart of the City (storyboard frames 6-8): a round hall of
// night-stone and gold, seven gates to past lives around the rim (one, 1982, alive and burning), a golden orrery turning
// over the dais, the great doors standing open onto the City at dusk, a window onto the cosmos, the oculus pouring light.
// First arrival plays "Atlas Takes Form" on the dais; arriving from the City (or back from THE PATH) skips it.
// Coordinates: hall centre at the origin, floor y = 0, north (-Z) is the doors. 1 unit ~ 1 m.
import * as THREE from 'three';
import { MANIFEST } from './manifest.js';
import { loadAssets } from '../engine/assets.js';
import { Batch } from '../engine/world/builders.js';
import { createSky, skyUniforms } from '../engine/world/sky.js';
import { PlanarReflection, addOccluderFade, occluder } from '../engine/world/reflection.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { DayCycle } from '../engine/lighting/daycycle.js';
import { createParticles } from '../engine/fx/particles.js';
import { glowTexture } from '../engine/pixel/world-sprites.js';
import { paintCompass } from '../engine/pixel/textures.js';
import { SpriteCharacter } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { seen, markSeen } from '../engine/once.js';
import { Ora } from '../engine/actors/ora.js';
import { getLegacy, oraGreeting, ORA_TONE_TINT } from '../engine/legacy.js';
import { Input } from '../engine/input.js';
import { Ambience } from '../engine/audio.js';
import * as L from './nexus/layout.js';
import { RotundaCamera } from './nexus/camera.js';
import { paintNexusFloor, paintMark, paintDoorLeaf, paintBand } from './nexus/paint.js';
import { buildHall } from './nexus/architecture.js';
import { buildOrrery } from './nexus/orrery.js';
import { createBeams, createHalos, lightPool } from './nexus/fx.js';
import { createForming, FORM } from './nexus/forming.js';
import { NexusSfx } from './nexus/sfx.js';

const THE_PATH = 'https://thepath.bigpicsolutions.com/play/';
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const NEXUS_MANIFEST = {
  stone: { painter: 'paintAshlar', args: [12, ['#0f111a', '#151823', '#1b1f2c', '#222736', '#2a2f41', '#333a4f'], { blockW: 24, blockH: 12, joint: '#07080c', speck: 0.02 }] },
  stoneDark: { painter: 'paintAshlar', args: [19, ['#090a0f', '#0d0f16', '#12141d', '#171a25', '#1d212e', '#252a3a'], { blockW: 32, blockH: 16, joint: '#040508', speck: 0.015 }] },
  trim: { painter: 'paintAshlar', args: [23, ['#1a1d29', '#222635', '#2b3043', '#353b51', '#40475f', '#4c546e'], { blockW: 16, blockH: 32, joint: '#0b0c12', speck: 0.01 }] },
  pale: MANIFEST.pale, dark: MANIFEST.dark, pave: MANIFEST.pave, roof: MANIFEST.roof,
  win0: MANIFEST.win0, win1: MANIFEST.win1, win2: MANIFEST.win2, iron: MANIFEST.iron,
  atlas: MANIFEST.atlas,
};

export async function createNexus(engine, { time = 'dusk', from = null, go } = {}) {
  const A = await loadAssets(NEXUS_MANIFEST);
  A.marks = {}; for (const g of L.GATES) A.marks[g.world] = paintMark(g.world);
  A.door = paintDoorLeaf();
  const band = paintBand();
  const scene = engine.scene;
  const glow = glowTexture(64, 0.0, 0.12), flare = glowTexture(128, 0.9, 0.08), soft = glowTexture(128, 0.0, 0.5);

  // ---------- materials ----------
  const roles = { windows: [], flames: [] };
  const std = (o, tile = 4) => { const m = new THREE.MeshStandardMaterial(o); m.userData.tile = tile; return m; };
  const M = {
    stone: std({ map: A.stone.map, normalMap: A.stone.normalMap, roughness: 0.74, envMapIntensity: 0.55 }, A.stone.tile),
    stoneDark: std({ map: A.stoneDark.map, normalMap: A.stoneDark.normalMap, roughness: 0.6, envMapIntensity: 0.6 }, A.stoneDark.tile),
    trim: std({ map: A.trim.map, normalMap: A.trim.normalMap, roughness: 0.55, envMapIntensity: 0.7 }, A.trim.tile),
    gold: std({ color: '#d4b06a', metalness: 1, roughness: 0.3, envMapIntensity: 1.5, emissive: '#7a5c2c', emissiveIntensity: 0.35 }, 1),
    goldGlow: std({ color: '#3a2a10', emissive: '#ffcf7a', emissiveIntensity: 2.4, roughness: 0.4, metalness: 0.4 }, 1),
    flame: std({ color: '#ffb060', emissive: '#ffa040', emissiveIntensity: 6 }, 1),
    iron: std({ map: A.iron.map, roughnessMap: A.iron.ormMap, metalnessMap: A.iron.ormMap, roughness: 1, metalness: 1 }, 1),
    daisRing: std({ color: '#141724', roughness: 0.16, metalness: 0.2, envMapIntensity: 1.1 }, 6),
    // the City glimpsed through the doors
    pale: std({ map: A.pale.map, normalMap: A.pale.normalMap, roughness: 0.92, envMapIntensity: 0.3 }, A.pale.tile),
    dark: std({ map: A.dark.map, normalMap: A.dark.normalMap, roughness: 0.85, envMapIntensity: 0.35 }, A.dark.tile),
    pave: std({ map: A.pave.map, normalMap: A.pave.normalMap, roughness: 0.6, envMapIntensity: 0.6 }, A.pave.tile),
    roof: std({ map: A.roof.map, normalMap: A.roof.normalMap, roughness: 0.55, envMapIntensity: 0.6 }, A.roof.tile),
    signal: std({ color: '#0b2020', emissive: '#3fd3c8', emissiveIntensity: 0.6, roughness: 0.5 }, 1),
  };
  for (const k of ['win0', 'win1', 'win2']) { M[k] = std({ map: A[k].map, normalMap: A[k].normalMap, emissiveMap: A[k].emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.88, envMapIntensity: 0.3 }, A[k].tile); roles.windows.push(M[k]); }
  roles.flames.push(M.flame);
  for (const k of ['stone', 'stoneDark', 'trim', 'gold', 'goldGlow', 'flame', 'iron']) addOccluderFade(M[k]);
  const B = new Batch(M);

  // ---------- the floor: inlaid night-stone, a planar mirror ----------
  const F = paintNexusFloor();
  const floorMat = new THREE.MeshStandardMaterial({ map: F.map, normalMap: F.normalMap, roughnessMap: F.ormMap, metalnessMap: F.ormMap, emissiveMap: F.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.7, roughness: 1, metalness: 1, envMapIntensity: 0.55, normalScale: new THREE.Vector2(0.32, 0.32) });
  const mirror = new PlanarReflection(engine.renderer, { y: 0.004, scale: 0.5 });
  mirror.apply(floorMat, { base: 0.5, streak: 0.0015 });
  const floorU = { uRippleR: { value: 0 }, uRippleA: { value: 0 }, uLaneAng: { value: L.rad(L.ALIVE.deg) }, uNTime: { value: 0 }, uLaneI: { value: 1 }, uAssemble: { value: 1 },
    uLaneAngs: { value: L.GATES.map((g) => L.rad(g.deg)) }, uLaneHead: { value: L.GATES.map(() => -100) }, uLaneLit: { value: L.GATES.map(() => 0) } };
  {
    const prev = floorMat.onBeforeCompile;
    floorMat.onBeforeCompile = (sh, r) => {
      prev(sh, r);
      Object.assign(sh.uniforms, floorU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vNW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvNW = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vNW; uniform float uRippleR, uRippleA, uLaneAng, uNTime, uLaneI, uAssemble; uniform float uLaneAngs[7], uLaneHead[7], uLaneLit[7];')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float rr = length(vNW);
          float rip = uRippleA * exp(-pow((rr - uRippleR) / 1.3, 2.0));
          vec2 dir = vec2(sin(uLaneAng), -cos(uLaneAng));
          float al = dot(vNW, dir), ac = abs(dot(vNW, vec2(-dir.y, dir.x)));
          float lane = step(ac, 0.75) * smoothstep(7.0, 8.0, al) * (1.0 - smoothstep(19.5, 20.5, al));
          float ph = fract(al * 0.075 - uNTime * 0.22);
          float pulse = lane * exp(-pow(ph - 0.5, 2.0) * 90.0) * 3.0 * uLaneI;
          // the seven marks' light running inward along their lanes (the opening), and each lane left lit behind it
          float run = 0.0;
          for (int i = 0; i < 7; i++) {
            vec2 d = vec2(sin(uLaneAngs[i]), -cos(uLaneAngs[i]));
            float a = dot(vNW, d), c = abs(dot(vNW, vec2(-d.y, d.x)));
            if (c < 0.85 && a > 6.4 && a < 21.0 && uLaneHead[i] > -50.0) {
              run += exp(-pow((a - uLaneHead[i]) / 0.8, 2.0)) * 7.0 + step(uLaneHead[i], a) * uLaneLit[i] * 1.6;
            }
          }
          totalEmissiveRadiance *= uAssemble + rip + pulse + run;
        }`);
    };
    floorMat.customProgramCacheKey = () => 'planar-refl|nexus-floor';
    const g = new THREE.PlaneGeometry(F.size, F.size); g.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(g, floorMat);
    floor.receiveShadow = true; floor.layers.set(1);
    scene.add(floor);
    engine.camera.layers.enable(1);
  }

  // ---------- the hall ----------
  const hall = buildHall({ scene, B, M, A });
  // the compass on the dais top
  {
    const top = L.DAIS_TOP;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(L.DAIS[2][0], 96), M.daisRing); disc.rotation.x = -Math.PI / 2; disc.position.y = top + 0.002; disc.receiveShadow = true; scene.add(disc);
    const C = paintCompass(224);
    const cm = new THREE.MeshStandardMaterial({ map: C.map, emissiveMap: C.emissiveMap, emissive: 0xffffff, emissiveIntensity: 2.2, roughnessMap: C.ormMap, metalnessMap: C.ormMap, transparent: true, alphaTest: 0.5, roughness: 1.4, metalness: 0.85, envMapIntensity: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
    const c = new THREE.Mesh(new THREE.CircleGeometry(L.DAIS[2][0] - 0.12, 96), cm); c.rotation.x = -Math.PI / 2; c.position.y = top + 0.01; c.receiveShadow = true; scene.add(c);
    M.compass = cm;
  }
  B.build(scene);
  const orrery = buildOrrery({ glow, flare, band });
  scene.add(orrery.group);

  // ---------- sky (the outside: through the doors, the open dome, the cosmos window) ----------
  scene.add(createSky());
  roles.cosmos = hall.windowInfo.paneMat;

  // ---------- lights ----------
  let assembled = 1, hemiBase = 0.75;
  const hemi = new THREE.HemisphereLight('#5d52b0', '#2a1c16', 0.75);
  scene.add(hemi);
  const key = new THREE.SpotLight('#ffe0b0', 5.2, 0, 0.44, 0.75, 0);
  key.position.set(2.2, 34, 1.4); key.target.position.set(0, 0, -0.5);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 12; key.shadow.camera.far = 50;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.04; key.shadow.radius = 4;
  scene.add(key, key.target);
  const coreLight = new THREE.PointLight('#ffcc80', 70, 30, 2);
  coreLight.position.set(0, L.ORRERY_Y, 0); scene.add(coreLight);
  const lights = new LightPool(scene, 10);
  for (const g of hall.gates) lights.add({ pos: g.lightPos, color: g.alive ? '#ffbe78' : '#8a76ff', intensity: g.alive ? 70 : 12, distance: g.alive ? 18 : 9, flicker: g.alive ? 0.05 : 0.02, role: g.alive ? 'alive' : 'veil', priority: g.alive ? 2.5 : 1 });
  for (const p of hall.lamps) lights.add({ pos: p, color: '#ff9e48', intensity: 30, distance: 12, flicker: 0.18, role: 'flame' });
  for (const p of hall.braziers) lights.add({ pos: p, color: '#ff9a3c', intensity: 44, distance: 14, flicker: 0.22, role: 'flame', priority: 1.3 });
  lights.add({ pos: hall.doorsInfo.lightPos, color: '#ffb070', intensity: 70, distance: 22, flicker: 0.03, role: 'city', priority: 2.2 });
  lights.add({ pos: hall.windowInfo.lightPos, color: '#8a70ff', intensity: 40, distance: 16, flicker: 0.02, role: 'cosmos', priority: 1.5 });

  // ---------- beams, halos, pools, motes ----------
  const shaftDir = new THREE.Vector3(0.32, -1, 0.42).normalize();
  const slanted = [[-58, 13.5], [-22, 16], [24, 15], [62, 13.5], [-90, 12], [92, 11.5]].map(([d, r], i) => {
    const a = L.polar(d, r, 25 - (i % 3) * 0.8), t = -a.y / shaftDir.y, b = a.clone().addScaledVector(shaftDir, t * 0.97);
    return { a, b, w0: 0.7 + (i % 2) * 0.3, w1: 1.9 + (i % 3) * 0.5, color: i % 2 ? '#9fb2ff' : '#c2b2ff', i: 0.16 };
  });
  const beams = createBeams([
    { a: new THREE.Vector3(0, L.DOME.top, 0), b: new THREE.Vector3(0, 0.75, 0), w0: 3.4, w1: 4.4, color: '#ffe2b0', i: 0.21 },
    { a: new THREE.Vector3(0.2, L.DOME.top, 0.1), b: new THREE.Vector3(0, 0.75, 0), w0: 0.9, w1: 1.3, color: '#fff2d8', i: 0.27 },
    ...slanted,
  ]);
  scene.add(beams);
  const halos = [];
  for (const p of hall.lamps) halos.push({ p, color: '#ff9f50', size: 2.6, i: 1.1 });
  for (const p of hall.braziers) halos.push({ p, color: '#ff9a40', size: 3.6, i: 1.2 });
  for (const p of hall.flames) halos.push({ p, color: '#ff9f50', size: 2.4, i: 1.0 });
  const medHaloStart = halos.length;
  for (const g of hall.gates) halos.push({ p: g.markPos.clone().addScaledVector(g.inward, 0.4), color: g.alive ? '#ffd890' : '#b8a0ff', size: g.alive ? 7.5 : 3.8, i: g.alive ? 1.2 : 0.32 });
  const haloPts = createHalos(halos, glow);
  scene.add(haloPts);
  const pools = [];
  const addPool = (p, radius, color, i) => { const m = lightPool({ radius, color, i, texture: soft }); m.position.set(p.x, 0.02, p.z); scene.add(m); pools.push(m); return m; };
  const alive = hall.gates.find((g) => g.alive);
  const alivePool = addPool(alive.front.clone().addScaledVector(alive.inward, 1.5), 6.5, '#ffb868', 0.5);
  addPool(L.polar(0, L.R - 1), 7, '#ff9d5c', 0.32);
  { const p = L.polar(0, L.R + L.WALL_T + 4.5); const m = addPool(p, 7.5, '#ffb070', 0.5); m.position.y = 0.03; }
  addPool(hall.windowInfo.center.clone().setY(0).addScaledVector(L.polar(hall.windowInfo.bay.deg, 1), -2.2), 6, '#7c66ff', 0.32);
  for (const s of slanted) addPool(s.b, s.w1 * 1.2, s.color, 0.1);
  // Small gold catches rotate with the machinery; one point draw, no additional light/shadow map.
  const glintList = Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI * 2 / 12, r = 2.5 + (i % 3) * 0.8;
    return { p: new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.8, Math.sin(a) * r), color: '#fff0bd', size: 0.45, i: 1.4 };
  });
  const glints = createHalos(glintList, flare); orrery.group.add(glints);
  const P = [haloPts, beams, glints];
  const addP = (o) => { const p = createParticles(o); scene.add(p); P.push(p); return p; };
  const motes = addP({ preset: 'motes', count: 420, min: new THREE.Vector3(-18, 0.4, -19), max: new THREE.Vector3(18, 15, 15), texture: glow, seed: 5 });
  const colMotes = addP({ preset: 'motes', count: 200, min: new THREE.Vector3(-3.2, 1, -3.2), max: new THREE.Vector3(3.2, 24, 3.2), texture: glow, seed: 11, overrides: { color: '#fff0c8', color2: '#ffe0a0', size: 0.13, intensity: 3 } });
  const violetMotes = addP({ preset: 'fireflies', count: 70, min: new THREE.Vector3(-17, 0.5, -18), max: new THREE.Vector3(17, 8, 10), texture: glow, seed: 13, overrides: { color: '#a890ff', color2: '#9fdcff', size: 0.2, intensity: 4 } });
  {
    // embers rising from every flame
    const flames = [...hall.lamps, ...hall.braziers, ...hall.flames];
    const e = createParticles({ preset: 'embers', count: 1, min: new THREE.Vector3(), max: new THREE.Vector3(0, 3, 0), texture: glow });
    const n = 240, pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const lp = flames[i % flames.length]; pos.set([lp.x + (Math.random() - 0.5) * 0.3, lp.y + 0.1, lp.z + (Math.random() - 0.5) * 0.3], i * 3); }
    for (let i = 0; i < n * 4; i++) sd[i] = Math.random();
    e.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); e.geometry.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
    scene.add(e); P.push(e);
  }
  {
    // the City's lit windows, far below the doors: a field of warm points
    const pts = [], col = [];
    let s = 3; const Rn = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (const [x, z, hw, base, h] of hall.cityLights) {
      const n = Math.round(hw * h * 0.3);
      for (let i = 0; i < n; i++) { pts.push(x + (Rn() * 2 - 1) * hw * 0.9, base + 1 + Rn() * (h - 2), z + 0.3); const cy = Rn() < 0.1; col.push(cy ? 0.25 : 1.0, cy ? 0.83 : 0.66 + Rn() * 0.2, cy ? 0.8 : 0.32); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
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
    field.update = (dt, t, camera, h) => { tm.uniforms.uTime.value = t; tm.uniforms.uScale.value = (h * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    scene.add(field); P.push(field); roles.field = tm;
  }

  // ---------- environment map: the hall's gold and the open sky, for every metal ----------
  const pmrem = new THREE.PMREMGenerator(engine.renderer);
  const envScene = new THREE.Scene();
  envScene.add(createSky());
  {
    const bayAngles = L.BAYS.map((b) => L.rad(b.deg));
    const em = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uBays: { value: bayAngles }, uAlive: { value: L.rad(L.ALIVE.deg) } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uBays[9]; uniform float uAlive; varying vec3 vP;
        void main(){ float a = atan(vP.x, -vP.z); float y = vP.y;
          vec3 c = vec3(0.025, 0.022, 0.05);
          for (int i = 0; i < 9; i++) { float d = abs(mod(a - uBays[i] + 3.14159, 6.28318) - 3.14159);
            c += vec3(0.9, 0.62, 0.3) * exp(-d * d * 260.0) * smoothstep(-14.0, -4.0, y) * (1.0 - smoothstep(4.0, 12.0, y)) * 0.6; }
          float dl = abs(mod(a - uAlive + 3.14159, 6.28318) - 3.14159);
          c += vec3(1.0, 0.75, 0.42) * exp(-dl * dl * 80.0) * 3.0 * smoothstep(-14.0, -6.0, y) * (1.0 - smoothstep(2.0, 9.0, y));
          c += vec3(1.0, 0.7, 0.35) * 0.5 * smoothstep(13.0, 13.5, y + 15.0) * (1.0 - smoothstep(13.6, 14.0, y + 15.0));
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 34, 96, 1, true), em); wall.position.y = 6; envScene.add(wall);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshBasicMaterial({ color: '#05050a' })); fl.rotation.x = -Math.PI / 2; fl.position.y = -10; envScene.add(fl);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd890').multiplyScalar(14) })); sun.position.set(0, 10, 0); envScene.add(sun);
  }
  let envRT = null, envDirty = true, envTimer = 0;
  const refreshEnv = () => { const old = envRT; envRT = pmrem.fromScene(envScene, 0.02, 0.1, 400); scene.environment = envRT.texture; if (old) old.dispose(); };

  // ---------- hero + Ora ----------
  const sheet = A.atlas, sp0 = sheet.sprite;
  const hero = new SpriteCharacter({ map: sheet.map, emissiveMap: sheet.emissiveMap, cols: sp0.cols, rows: sp0.rows, frameW: sp0.frameW, frameH: sp0.frameH, ppu: sp0.ppu, contactTex: glow });
  hero.applyGear();
  attachAtlasRun(hero, sheet);   // Shift: the run sheet swaps in
  hero.dir = 'down';
  const heroPos = hero.group.position;
  heroPos.set(0, L.DAIS_TOP, 0);
  scene.add(hero.group);
  const ora = new Ora({ glow, flare });
  scene.add(ora.group, ora.trail);

  // ---------- legacy (THE FIRST WORLD): personal touches only, seen only by this player (CANON ruling 10) ----------
  // null when the player skipped the god game; the Nexus is identical for everyone.
  const legacy = getLegacy();
  const greeting = oraGreeting(legacy);
  // Ora's greeting variant: balance colours the tone. There is no voice/caption system yet and no on-screen text is wanted,
  // so for now it is carried by Ora's halo; greeting.id / greeting.text are ready for the VO pass.
  if (greeting) ora.halo.material.color.lerp(new THREE.Color(ORA_TONE_TINT[greeting.tone]), 0.18);
  // TODO(legacy/golem): the player's golem stands at the Nexus, seen only by them (legacy.golem.look good|neutral|evil:
  //   moss + teal runes / grey stone / obsidian with lava seams; legacy.golem.habits drive its idle). No art exists yet.
  //   Hook point: add a group near the dais rim here, gated on `legacy?.golem`. Never block the gates or the walkable ring.

  // ---------- camera, input, sound, time ----------
  const ZONE = { pitch: 16.5, dist: 37, height: 3.6, lead: 3.0, fov: 31 };
  const cam = new RotundaCamera(engine.camera, ZONE);
  const input = new Input();
  const audio = new Ambience();
  const sfx = new NexusSfx(audio);
  input.onFirstGesture(() => audio.start());
  const day = new DayCycle({ start: ['dusk', 'night', 'dawn'].includes(time) ? time : 'dusk' });
  const H = engine.post.haze.u, Fu = engine.post.final.u;
  day.onApply((k, moving) => {
    const U = skyUniforms;
    U.uZenith.value.copy(k.zenith).lerp(new THREE.Color('#090420'), 0.7); U.uUpper.value.copy(k.upper).lerp(new THREE.Color('#25185a'), 0.6);
    U.uHorizon.value.copy(k.horizon); U.uGlow.value.copy(k.glow); U.uBelow.value.copy(k.below);
    U.uSunDir.value.copy(k.skySun); U.uSunColor.value.copy(k.sunColor); U.uSunDisc.value = k.sunDisc;
    U.uMoonDir.value.copy(k.moonDir); U.uMoonColor.value.copy(k.moonColor); U.uMoonGlow.value = k.moonGlow; U.uStars.value = Math.max(0.9, k.stars);
    U.uCloudLit.value.copy(k.cloudLit); U.uCloudDark.value.copy(k.cloudDark); U.uCloudCover.value = k.cloudCover * 0.55;
    // the interior is out of time: its grade barely follows the sky outside
    const night = Math.max(0, Math.min(1, (k.stars - 0.45) / 0.55)), dawn = Math.max(0, 1 - k.stars / 0.2) * 0.6;
    H.uHazeDensity.value = 0.0035; H.uFogA.value = 0.0; H.uFogB.value = 0.08; H.uFogBase.value = -20; H.uHazeMax.value = 0.55;
    H.uNearScale.value = 0.8; H.uTilt.value = 0.42;
    Fu.uExposure.value = 1.55 + dawn * 0.15 - night * 0.05; Fu.uBloom.value = 0.29; Fu.uSat.value = 1.12; Fu.uContrast.value = 1.12; Fu.uVignette.value = 0.52;
    Fu.uShadowTint.value.set('#a6aef8'); Fu.uHighTint.value.set('#ffe6c4').multiplyScalar(1.05); Fu.uLift.value.set('#05041a');
    Fu.uShaft.value = 0.32 - night * 0.12; Fu.uShaftColor.value.copy(k.shaftColor);
    hero.rim.value.set('#c9a8ff').multiplyScalar(0.18).lerp(k.rim.clone().multiplyScalar(0.25), 0.4); hero.tintRim();
    for (const m of roles.windows) m.emissiveIntensity = k.windows;
    roles.field.uniforms.uI.value = k.windows / 2.3;
    lights.roleScale.city = 0.6 + 0.4 * k.lightInt / 4.6; lights.roleScale.flame = 1; lights.roleScale.alive = 1; lights.roleScale.cosmos = 1;
    hemiBase = 0.75 + night * 0.1; hemi.intensity = hemiBase * (0.45 + 0.55 * assembled);
    if (moving) envDirty = true;
    audio.setNight(0);
  });

  // ---------- walking ----------
  const doorF = L.bayFrame(L.BAYS.find((b) => b.kind === 'doors'));
  const aliveF = L.bayFrame(L.ALIVE);
  hall.doorsInfo.group.updateMatrixWorld(true);
  const leafSegs = hall.doorsInfo.leaves.map((pv) => {
    const leaf = pv.children[0], h0 = new THREE.Vector3(), e = new THREE.Vector3();
    pv.getWorldPosition(h0);
    leaf.localToWorld(e.set(Math.sign(leaf.position.x) * L.DOOR.w / 4, 0, 0));
    return [h0, e];
  });
  const segDist = (x, z, a, b) => { const vx = b.x - a.x, vz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - a.x - vx * t, z - a.z - vz * t); };
  const walkable = (x, z) => {
    const r = Math.hypot(x, z), d = L.angleOf(x, z);
    for (const s of leafSegs) if (segDist(x, z, s[0], s[1]) < 0.6) return false;
    if (r <= L.R - 1.1) {
      for (const p of hall.lamps) if (Math.hypot(x - p.x, z - p.z) < 0.85) return false;
      for (const p of hall.braziers) if (Math.hypot(x - p.x, z - p.z) < 1.3) return false;
      return true;
    }
    const dd = L.dAng(d, 0), lat = r * Math.sin(L.rad(dd));
    if (Math.abs(dd) < 30 && Math.abs(lat) < L.DOOR.w / 2 - 0.6 && r < doorF.Rp + L.WALL_T + 8) return true;
    const da = L.dAng(d, L.ALIVE.deg), lat2 = r * Math.sin(L.rad(da));
    if (Math.abs(da) < 20 && Math.abs(lat2) < L.GATE.w / 2 - 0.55 && r < aliveF.Rp + 1.25) return true;
    return false;
  };

  // ---------- the opening: Atlas takes form ----------
  // the temple assembles from its marks: before they wake, the hall's gold is cold
  const assemble = (a) => {
    M.goldGlow.emissiveIntensity = 2.4 * (0.08 + 0.92 * a);
    M.gold.emissiveIntensity = 0.35 * (0.3 + 0.7 * a);
    floorU.uAssemble.value = 0.2 + 0.8 * a;
    M.compass.emissiveIntensity = 2.2 * (0.25 + 0.75 * a);
    lights.roleScale.veil = 0.2 + 0.8 * a;
    key.intensity = 5.2 * (0.3 + 0.7 * a); hemi.intensity = hemiBase * (0.45 + 0.55 * a); assembled = a;
  };
  const forming = createForming({ scene, hero, sheet, ora, orrery, gates: hall.gates, glow, sfx, floorU, beams, base: new THREE.Vector3(0, L.DAIS_TOP, 0), assemble });
  const INTRO_CAM = { a: { pitch: 6.5, dist: 46, height: 8.2, lead: 0, fov: 37 }, b: { pitch: 11, dist: 27, height: 2.6, lead: 0, fov: 30 } };

  const vel = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const auto = { move: null, until: 0 };
  let exiting = null, introCam = 0;
  const handAnchor = () => {
    const right = cam.right(), fwd = cam.forward(), hs = hero.height / 2.4;
    const off = { down: [0.95, 1.62, 0.25], up: [-0.95, 1.62, 0.25], left: [-0.7, 1.55, 0.3], right: [0.85, 1.6, 0.3] }[hero.dir];
    return anchor.copy(heroPos).addScaledVector(right, off[0] * hs).addScaledVector(fwd, -off[2]).setY(heroPos.y + off[1] * hs);
  };
  const zoneFor = (p) => {
    const o = { ...ZONE };
    // toward the doors the lens lowers to look out over the City
    const dz = sstep(-6, -14, p.z) * sstep(9, 4, Math.abs(p.x));
    o.pitch += (5.5 - o.pitch) * dz; o.height += (3.3 - o.height) * dz; o.lead += (5 - o.lead) * dz; o.dist += (32 - o.dist) * dz;
    // on and around the dais the lens drops so the orrery stays overhead in frame
    const dais = sstep(9, 4, Math.hypot(p.x, p.z)) * (1 - dz);
    o.pitch -= 4.5 * dais; o.height += 2.2 * dais; o.lead -= 1.5 * dais;
    // near the rim, a touch lower so the marks above the gates stay in frame
    const rim = sstep(11, 16, Math.hypot(p.x, p.z)) * (1 - dz);
    o.pitch -= 3 * rim; o.height += 1.4 * rim;
    return o;
  };
  const place = (x, z, dir) => {
    heroPos.set(x, L.groundY(x, z), z); hero.dir = dir; vel.set(0, 0, 0);
    Object.assign(cam.target, zoneFor(heroPos)); cam.snap(heroPos);
    ora.place(handAnchor().clone()); ora.group.visible = ora.trail.visible = true; ora.lightScale = 1;
  };

  const api = {
    hero, ora, cam, day, lights, input, walkable, forming, orrery, hall, sfx, legacy, greeting,
    zoneLock: false, exitsEnabled: true,
    teleport(x, z, dir = 'up') {
      if (forming.running) forming.skip();
      api.zoneLock = false; introCam = 0; cam.yawTarget = 0; cam.auto = 1;
      place(x, z, dir);
    },
    setTime(name, instant = true) { day.set(name, instant); envDirty = true; },
    autoWalk(dx, dz, seconds, run = false) { auto.move = new THREE.Vector3(dx, 0, dz).normalize(); auto.run = run; auto.until = engine.time + seconds; },
    /** Play the opening again from its first frame (the shot harness uses this). */
    replayIntro() {
      forming.restart(); forming.state.oraPlaced = false; forming.state.chimed = false;
      heroPos.set(0, L.DAIS_TOP, 0); hero.dir = 'down'; vel.set(0, 0, 0);
      introCam = 1; api.zoneLock = true; cam.auto = 0; cam.yawTarget = 0;
      Object.assign(cam.target, INTRO_CAM.a); cam.snap(heroPos);
    },
    update(dt, t) {
      // the engine's first real frame can hand us a negative dt (rAF stamp older than the loop's start): never go backwards
      dt = Math.max(0, Math.min(dt, 0.1));
      // the opening (any key hurries it)
      let oraAt = null;
      if (forming.running) {
        const hurry = input.axis().x || input.axis().y ? 2.5 : 1;
        oraAt = forming.update(dt * hurry, handAnchor().clone());
        const T = forming.state.t;
        if (introCam) {
          const k = sstep(4.1, 8.0, T);
          for (const key of ['pitch', 'dist', 'height', 'lead', 'fov']) cam.target[key] = INTRO_CAM.a[key] + (INTRO_CAM.b[key] - INTRO_CAM.a[key]) * k;
          cam.zoomRate = 2.5;
          if (T >= FORM.control) { introCam = 0; api.zoneLock = false; cam.auto = 1; cam.zoomRate = 0.6; }
        }
      } else if (cam.zoomRate < 0.9) cam.zoomRate = Math.min(0.9, cam.zoomRate + dt * 0.1);
      const control = !forming.running || forming.control;
      if (input.consume('KeyT')) day.next();
      if (input.consume('KeyQ')) cam.turn(-1);
      if (input.consume('KeyE')) cam.turn(1);
      const ax = control && !exiting ? input.axis() : { x: 0, y: 0, run: false };
      const fwd = cam.forward(), right = cam.right();
      let move = null, speed = 0;
      if (exiting) { move = exiting.dir.clone(); speed = 3.2; }
      else if (ax.x || ax.y) { move = right.clone().multiplyScalar(ax.x).addScaledVector(fwd, ax.y).normalize(); speed = ax.run ? 10.5 : 5.2; }
      else if (auto.move && t < auto.until) { move = auto.move.clone(); speed = auto.run ? 10.5 : 5.2; }
      const want = move ? move.clone().multiplyScalar(speed) : new THREE.Vector3();
      vel.lerp(want, 1 - Math.exp(-dt * 12));
      const nx = heroPos.x + vel.x * dt, nz = heroPos.z + vel.z * dt;
      if (exiting) { heroPos.x = nx; heroPos.z = nz; }
      else if (walkable(nx, nz)) { heroPos.x = nx; heroPos.z = nz; }
      else if (walkable(nx, heroPos.z)) { heroPos.x = nx; vel.z = 0; }
      else if (walkable(heroPos.x, nz)) { heroPos.z = nz; vel.x = 0; }
      else vel.set(0, 0, 0);
      heroPos.y += (L.groundY(heroPos.x, heroPos.z) - heroPos.y) * (1 - Math.exp(-dt * 16));
      const moving = vel.length() > 0.4;
      hero.update(dt, engine.camera, moving ? vel.clone().setY(0).normalize() : null, vel.length(), right, fwd);
      // exits: the great doors to the City; the living gate to 1982
      if (!exiting && control && api.exitsEnabled) {
        const r = Math.hypot(heroPos.x, heroPos.z), d = L.angleOf(heroPos.x, heroPos.z);
        if (Math.abs(L.dAng(d, 0)) < 12 && r > L.R + 0.9) { exiting = { dir: L.polar(0, 1), t: 0 }; go && go('plaza'); }
        else if (Math.abs(L.dAng(d, L.ALIVE.deg)) < 8 && r > aliveF.Rp + 0.35) {
          exiting = { dir: L.polar(L.ALIVE.deg, 1), t: 0, gate: alive };
          sfx.breath();
          const ret = encodeURIComponent(location.origin + '/?scene=nexus&from=path');
          const url = `${THE_PATH}?world=80s&return=${ret}`;
          const f = document.getElementById('fade') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'fade' });
          f.style.transition = 'opacity 1.1s ease'; f.style.background = '#fff6e4';
          setTimeout(() => { f.classList.remove('off'); f.style.opacity = '1'; }, 250);
          setTimeout(() => { location.href = url; }, 1450);
        }
      }
      if (exiting) { exiting.t += dt; if (exiting.gate) exiting.gate.veilMat.uniforms.uFlare.value = Math.min(1, exiting.t / 1.1); }
      // Ora at the open hand
      handAnchor();
      if (!api.zoneLock && !introCam) Object.assign(cam.target, zoneFor(heroPos));
      cam.update(dt, heroPos);
      handAnchor();
      ora.update(dt, t, oraAt || anchor, engine.camera, engine.post.h);
      // the gates answer when you come near: sealed ones stir and hum, the living one brightens and sings
      let sealedNear = 0, sealedPan = 0, aliveNear = 0, alivePan = 0;
      const sp = new THREE.Vector3();
      for (const g of hall.gates) {
        const dist = Math.hypot(heroPos.x - g.front.x, heroPos.z - g.front.z), k = control ? sstep(7.5, 2.2, dist) : 0;
        const u = g.veilMat.uniforms; u.uNear.value += (k - u.uNear.value) * (1 - Math.exp(-dt * 3)); u.uTime.value = t;
        sp.copy(g.front).project(engine.camera);
        if (g.alive) { aliveNear = Math.max(aliveNear, sstep(12, 2, dist)); alivePan = sp.x; }
        else if (k > sealedNear) { sealedNear = k; sealedPan = sp.x; }
        if (!forming.running) g.medMat.emissiveIntensity = (g.alive ? 3.2 + Math.sin(t * 1.4) * 0.4 : 0.9) + u.uNear.value * (g.alive ? 1.5 : 1.4);
      }
      sfx.update({ sealedNear, sealedPan, aliveNear, alivePan });
      // living light
      orrery.update(dt, t, forming.running && forming.state.t < FORM.end ? 1 + 2.2 * sstep(FORM.flare - 1.0, FORM.flare + 0.4, forming.state.t) * (1 - sstep(FORM.ripple - 0.5, FORM.control, forming.state.t)) : 1);
      coreLight.intensity = 30 + 60 * Math.min(1.6, orrery.halo.material.color.r / 1.7);
      glintList.forEach((_, i) => glints.setColor(i, '#fff0bd', assembled * Math.pow(Math.max(0, Math.sin(t * 0.7 + i * 2.4)), 12) * 2.2));
      if (!forming.running) hall.gates.forEach((g, i) => haloPts.setColor(medHaloStart + i, g.alive ? '#ffd890' : '#b8a0ff', g.alive ? 1.2 : 0.32 + g.veilMat.uniforms.uNear.value * 0.25));
      floorU.uNTime.value = t;
      for (const th of forming.threads) th.m.uniforms.uTime.value = t;
      if (roles.cosmos) roles.cosmos.uniforms.uTime.value = t;
      alivePool.material.color.set('#ffb868').multiplyScalar(0.45 + 0.08 * Math.sin(t * 1.3) + aliveNear * 0.25);
      lights.update(cam.focus, dt, t);
      day.update(dt);
      envTimer += dt;
      if (envDirty && envTimer > 0.4) { refreshEnv(); envDirty = false; envTimer = 0; }
      for (const p of P) p.update && p.update(dt, t, engine.camera, engine.post.h);
      for (const p of forming.threads) p.mesh.visible = true;
      if (forming.swarm.visible) {
        forming.swarm.update(dt, t, engine.camera, engine.post.h);
        const su = forming.swarm.material.uniforms;
        su.uBase.value.copy(heroPos); su.uRight.value.set(Math.cos(hero.mesh.rotation.y), 0, -Math.sin(hero.mesh.rotation.y)); su.uFwd.value.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y));
      }
      skyUniforms.uTime.value = t;
      // depth of field on Atlas; the dither fade for anything between him and the lens; the mirror; shafts from the doors
      const heroDist = engine.camera.position.distanceTo(heroPos);
      H.uFocusDist.value = heroDist - 0.5;
      const hp = heroPos.clone(); hp.y += 1.2; hp.project(engine.camera);
      H.uFocusY.value = hp.y * 0.5 + 0.5;
      const pw = engine.post.w, ph = engine.post.h;
      const hpx = (hero.height / (2 * heroDist * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov) / 2))) * ph;
      occluder.uOcc.value.set((hp.x * 0.5 + 0.5) * pw, (hp.y * 0.5 + 0.5) * ph, heroDist, hpx * 1.15);
      engine.camera.updateMatrixWorld();
      mirror.render(scene, engine.camera, pw, ph);
      const sh = L.polar(0, L.R + 60, 8).project(engine.camera);
      Fu.uShaftPos.value.set(sh.x * 0.5 + 0.5, sh.y * 0.5 + 0.5);
      input.endFrame();
    },
  };

  // ---------- where we arrive ----------
  day.update(0);
  refreshEnv();
  if ((from === null || from === 'first-world') && !seen('form')) {
    api.replayIntro();            // Atlas takes form: the first time only
    markSeen('form');
  } else if (from === null || from === 'first-world') {
    forming.settle();             // already formed: stand on the dais
  } else {
    forming.settle();
    if (from === 'path') { const p = L.polar(L.ALIVE.deg, 16.2); place(p.x, p.z, 'down'); }
    else { const p = L.polar(0, 16.6); place(p.x, p.z, 'down'); }
  }
  engine.add(api);
  return api;
}
