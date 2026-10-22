import { Satchel, giftChoices, isFish } from '../engine/satchel.js';
import { cityGiftReaction } from './plaza/lines.js';
// SCENE: "The City." One plaza for everyone: polished marble with gold inlay, fountains and reflecting pools, gardens,
// a market under string lights, white-gold spires and waterfalls rising in terraces to the Nexus beacon, and at its heart
// the old stone circle, the people's first sacred place, kept. THE HOUSE (gold and brass, an orrery over its doors) on the
// north-east corner; the arches of the three old villages (Ashford, Brambleholt, Stonemere); the City gate out to the road.
// Arrival from the Nexus: Atlas steps out of the temple's great doors onto the top step and is seen. The nearest people
// stop, turn and look up at him for a few seconds (a child points); then life resumes. Nobody kneels, nobody runs.
// Exits: the temple doors -> go('nexus'); the City gate -> go('gate-road'); the House door mounts the House module.
import { sealedWay } from './sealed-way.js';
import { createTalk } from '../engine/talk.js';
import { ELDER, PEOPLE, hasFished, hasSeenGreen, barkPool as cityBarks } from './plaza/lines.js';
import { createFriends, favourReady, homeDone as isHomeDone, mergeCity } from '../engine/friends.js';   // city-quests lane
import * as THREE from 'three';
import { loadAssets } from '../engine/assets.js';
import { MANIFEST as ROAD_MANIFEST } from './manifest.js';
import { Batch } from '../engine/world/builders.js';
import { createSky, skyUniforms } from '../engine/world/sky.js';
import { PlanarReflection, occluder } from '../engine/world/reflection.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { createParticles } from '../engine/fx/particles.js';
import { glowTexture, mistTexture } from '../engine/pixel/world-sprites.js';
import { SpriteCharacter } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { seen, markSeen } from '../engine/once.js';
import { Ora } from '../engine/actors/ora.js';
import { getLegacy, oraGreeting, rememberedVillages, ORA_TONE_TINT } from '../engine/legacy.js';
import { DioramaCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { CityAmbience } from '../engine/audio-city.js';
import { rng } from '../engine/pixel/paint.js';
import { P, WalkGrid, makeHeightAt, frame, faceRot } from './plaza/layout.js';
import { makeMaterials } from './plaza/materials.js';
import { buildWorld, addLocal, lbox, archSlab, archRing } from './plaza/build.js';
import { Billboards, bannerMaterial, makeHelpers, buildProps } from './plaza/props.js';
import * as PT from './plaza/textures.js';
import { recolorTexture } from './plaza/textures.js';
import { PlazaDay } from './plaza/daykeys.js';
import { Crowd } from './plaza/crowd.js';
import { HouseDoor } from './plaza/house-door.js';
import { quests } from '../engine/quests.js';
import { signalHand } from '../engine/actors/signal.js';
import { ELDER_VARIANT, COL } from './plaza/citizens-art.js';
import { Flames } from './plaza/flames.js';
import { stageLife } from './plaza/life.js';

// Atlas's sheet and the banner come from the shared manifest, so the hero is the same everywhere
const MANIFEST = { banner: ROAD_MANIFEST.banner, atlas: ROAD_MANIFEST.atlas };

export async function createPlaza(engine, { time, from = null, go } = {}) {
  const q = new URLSearchParams(location.search);
  if (!q.get('time')) time = 'golden';
  const A = await loadAssets(MANIFEST);
  const scene = engine.scene;
  const quest = quests();
  const deed = quest.snapshot.firstDeed;
  const R = rng(20261011);
  const roles = { windows: [], lanterns: [], glyphs: [], seams: [], banners: [] };
  const mirror = new PlanarReflection(engine.renderer, { y: 0.005, scale: 0.7 });
  engine.camera.layers.enable(1);
  const { M } = makeMaterials(roles, mirror);
  M.pale = M.pale || M.ashlar2; M.dark = M.dark || M.old;   // city.js buildings name these keys
  M.cloth.forEach((m, i) => (M['cloth' + i] = m));
  M.fruit.forEach((m, i) => (M['fruit' + i] = m));
  const B = new Batch(M), Bn = new Batch({ ...M, roof: M.roofNavy });
  const lights = new LightPool(scene, 14);
  const glow = glowTexture(64, 0.0, 0.12), flare = glowTexture(128, 0.9, 0.08), mist = mistTexture(128, 3);

  // walkable ground: the plaza octagon (a margin inside its walls); builders carve and open the rest
  const walk = new WalkGrid();
  walk.open((x, z) => Math.abs(x) <= P.X - 0.7 && z >= P.ZN + 0.6 && z <= P.ZS + 1 && Math.abs(x) - z < P.CHAMFER - 1.0);

  // sprite kinds: garden billboards and the wall vines
  const foliageRim = { value: new THREE.Color(1, 0.75, 0.45) };
  const bb = new Billboards(scene, foliageRim);
  bb.type('cypress', PT.paintCypress(81), 12, { max: 80 });
  bb.type('palm', PT.paintPalm(83), 12, { max: 48 });
  bb.type('ash', PT.paintBroadTree(89), 11, { max: 4, rimK: 0.8 });
  bb.type('bush_white', PT.paintFlowerBush(85, ['#f4efe2', '#dcd3bd']), 14, { max: 60, rimK: 0.7 });
  bb.type('bush_gold', PT.paintFlowerBush(91, ['#f1dcaa', '#d4b06a']), 14, { max: 40, rimK: 0.7 });
  bb.type('bush_lilac', PT.paintFlowerBush(93, ['#b9a8d6', '#8a7aa8']), 14, { max: 40, rimK: 0.7 });
  {
    const v = PT.bakeSprite(PT.paintVines(87));
    M.vine = new THREE.MeshStandardMaterial({ map: v.map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  }
  const lanternPos = [], candles = [], jets = [], mists = [], particles = [], lipTrees = [];
  const ctx = { R, lights, lanternPos, walk, roles, candles, jets, mists, lipTrees, facades: [], stallSlots: [], crowdSeeds: [], particles, firstDeed: deed, vineMat: M.vine };
  makeHelpers(scene, B, M, ctx, bb);
  const flames = (ctx.flames = new Flames(scene, 40));

  // banners: the navy one from the gate road, and an ivory one painted from it
  const windT = { value: 0 };
  const navyTex = A.banner.map, navyEmi = A.banner.emissiveMap;
  const ivoryTex = recolorTexture(navyTex, (r, g, b) => (b > r + 8 && b > 40 && r < 90 ? [Math.min(255, 196 + (b - 40) * 0.45), Math.min(255, 186 + (b - 40) * 0.42), Math.min(255, 160 + (b - 40) * 0.35)] : [r, g, b]));
  const banners = { navy: { map: navyTex, mat: bannerMaterial(navyTex, navyEmi, windT) }, ivory: { map: ivoryTex, mat: bannerMaterial(ivoryTex, navyEmi, windT) } };
  for (const k in banners) { roles.banners.push(banners[k].mat); }

  // ---------- build ----------
  const world = buildWorld(scene, B, Bn, M, ctx);
  const props = buildProps(scene, B, Bn, M, ctx, bb, { windT, banners, glow });
  for (const [x, y, z] of lipTrees) bb.add(R() < 0.6 ? 'cypress' : 'palm', x, y, z, 1.3 + R() * 0.4);
  const houseFrame = props.house.frame;
  const heightAt = makeHeightAt(houseFrame);

  // the temple's face (shown only when the camera turns to look up at the steps: the recognition)
  const facade = new THREE.Group(); facade.visible = false; scene.add(facade);
  {
    const Bt = new Batch(M), L = P.LAND_Y, fr = frame(0, 52.6, Math.PI);
    const slab = archSlab(30, 21, 7.6, 9.2, 2.4); addLocal(Bt, 'ashlar', slab, frame(0, 50.2, 0, L));
    archRing(Bt, frame(0, 50.2, 0, L), 3.95, 9.2, -0.06, 0.22);
    archRing(Bt, frame(0, 50.2, 0, L), 4.5, 9.2, -0.06, 0.08);
    const glowPlane = new THREE.PlaneGeometry(7.6, 13.2); glowPlane.rotateY(Math.PI); glowPlane.translate(0, L + 6.6, 52.5); const gp = new THREE.Mesh(glowPlane, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd89a').multiplyScalar(1.7) })); facade.add(gp);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color('#fff0c8').multiplyScalar(2.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); halo.scale.setScalar(12); halo.position.set(0, L + 5.2, 51.4); facade.add(halo);
    const rays = new THREE.Mesh(new THREE.PlaneGeometry(9, 10), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color('#ffd49a').multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); rays.rotation.x = -Math.PI / 2; rays.position.set(0, L + 0.03, 47.2); facade.add(rays);
    for (const sx of [-1, 1]) { const d = new THREE.BoxGeometry(3.7, 9.1, 0.25); d.translate(-sx * 1.85, 4.55, 0); d.rotateY(sx * 1.15); d.translate(sx * 3.75, L, 50.3); Bt.add('brass', d); }
    for (const sx of [-13.2, -8.2, 8.2, 13.2]) { Bt.box('ashlar', 1.6, 18.5, 0.6, sx, L + 9.25, 49.9); Bt.box('gold', 1.8, 0.4, 0.8, sx, L + 18.4, 49.9, { uv: false }); }
    Bt.box('ashlar', 31, 2.6, 3.2, 0, L + 20.3, 51.2); Bt.box('gold', 31.2, 0.14, 3.3, 0, L + 19.1, 51.2, { uv: false });
    const tri = new THREE.Shape(); tri.moveTo(-15.5, 0); tri.lineTo(15.5, 0); tri.lineTo(0, 6.8); tri.lineTo(-15.5, 0);
    const ped = new THREE.ExtrudeGeometry(tri, { depth: 3, bevelEnabled: false }); ped.translate(0, L + 21.6, 49.8); Bt.add('ashlar', ped);
    const st = new THREE.OctahedronGeometry(1.0); st.scale(0.6, 2.0, 0.3); st.translate(0, L + 15.6, 49.95); Bt.add('goldBright', st, { uv: false });
    const st2 = new THREE.OctahedronGeometry(1.0); st2.scale(2.0, 0.6, 0.3); st2.translate(0, L + 15.6, 49.95); Bt.add('goldBright', st2, { uv: false });
    const ring = new THREE.TorusGeometry(1.75, 0.1, 6, 48); ring.translate(0, L + 15.6, 49.98); Bt.add('gold', ring, { uv: false });
    const dome = new THREE.SphereGeometry(13, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(0, L + 21, 66); Bt.add('roof', dome);
    Bt.cyl('ashlar2', 13.4, 2.6, 0, L + 18.6, 66, 32);
    Bt.build(facade);
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 12, 1, 10), banners.navy.mat); m.position.set(sx * 10.7, L + 11.2, 49.5); m.rotation.y = Math.PI; facade.add(m);
    }
  }

  B.build(scene); Bn.build(scene);
  
  // ---------- the beacon over the City's crown ----------
  const beacon = new THREE.Group(); beacon.position.copy(world.beacon.pos); scene.add(beacon);
  const beaconMats = [];
  {
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#eaf7ff').multiplyScalar(6) }));
    beacon.add(core); beaconMats.push([core.material, new THREE.Color('#eaf7ff'), 6]);
    const sp = (tex, col, k, s) => { const m = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(col).multiplyScalar(k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }); const o = new THREE.Sprite(m); o.scale.setScalar(s); beacon.add(o); beaconMats.push([m, new THREE.Color(col), k]); return o; };
    sp(glow, '#9fdcff', 1.6, 34); sp(flare, '#eaf7ff', 2.4, 22); sp(glow, '#ffffff', 5, 6);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f1dcaa').multiplyScalar(2.2) }); beaconMats.push([ringMat, new THREE.Color('#f1dcaa'), 2.2]);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fdcff').multiplyScalar(2.6) }); beaconMats.push([ringMat2, new THREE.Color('#9fdcff'), 2.6]);
    world.beacon.rings = [];
    for (const [r, tube, tilt, speed, mat] of [[7, 0.2, 0.5, 0.3, ringMat], [10, 0.26, -0.35, -0.18, ringMat], [13.5, 0.16, 1.1, 0.12, ringMat2], [5, 0.12, -1.0, 0.5, ringMat2]]) {
      const piv = new THREE.Group(); piv.rotation.set(Math.PI / 2 + tilt, tilt * 0.4, 0); beacon.add(piv);
      piv.add(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 96), mat));
      const moon = new THREE.Mesh(new THREE.SphereGeometry(tube * 3.2, 10, 8), ringMat); moon.position.set(r, 0, 0);
      const arm = new THREE.Group(); arm.add(moon); piv.add(arm);
      world.beacon.rings.push({ arm, speed, piv });
    }
    // a column of light rising from it
    const pm = new THREE.ShaderMaterial({
      uniforms: { uI: { value: 1 }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uI; uniform float uTime; varying vec2 vUv; void main(){ float a = (1.0 - vUv.y) * pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0); a *= 0.75 + 0.25 * sin(vUv.y * 30.0 - uTime * 2.0); gl_FragColor = vec4(vec3(0.62, 0.86, 1.0) * a * uI * 1.4, 1.0); }',
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.6, 140, 16, 1, true), pm); pillar.position.y = 72; beacon.add(pillar);
    world.beacon.pillar = pm;
  }

  // ---------- the light of the open doors behind him ----------
  const threshold = new THREE.Mesh(new THREE.PlaneGeometry(11, 13), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color('#ffd49a').multiplyScalar(1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  threshold.rotation.x = -Math.PI / 2; threshold.position.set(0, P.LAND_Y + 0.02, 51.5); threshold.renderOrder = 3; scene.add(threshold);
  const doorLight = new THREE.PointLight('#ffd49a', 10, 16, 1.2); doorLight.position.set(0, P.LAND_Y + 3.4, 52); scene.add(doorLight);

  // ---------- particles ----------
  const addP = (o) => { const p = createParticles(o); scene.add(p); particles.push(p); return p; };
  const motes = addP({ preset: 'motes', count: 260, min: new THREE.Vector3(-22, 0.5, -44), max: new THREE.Vector3(22, 12, 34), texture: glow, seed: 5, overrides: { size: 0.07 } });
  const fireflies = addP({ preset: 'fireflies', count: 160, min: new THREE.Vector3(-22, 0.6, -40), max: new THREE.Vector3(22, 4, 30), texture: glow, seed: 3 });
  const skyLanterns = addP({ preset: 'embers', count: 46, min: new THREE.Vector3(-34, 3, -70), max: new THREE.Vector3(34, 70, 26), texture: glow, seed: 13, overrides: { size: 1.1, intensity: 3.2, speed: 0.1, color: '#ffb466', color2: '#ffd690' } });
  const doorMotes = addP({ preset: 'motes', count: 90, min: new THREE.Vector3(-5, P.LAND_Y + 0.2, 45), max: new THREE.Vector3(5, P.LAND_Y + 7, 56), texture: glow, seed: 11, overrides: { color: '#ffe6b0', color2: '#fff4d6', intensity: 5 } });
  // ---------- THE HOUSE (the bazaar): a warm light and a soft shimmer at the doors, so guests find them ----------
  const houseGlow = { mats: [] };
  {
    const hf = houseFrame, gold = new THREE.Color('#ffc878');
    const [gx, gz] = hf.toWorld(0, 1.6);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: gold.clone().multiplyScalar(1.5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.setScalar(9); halo.position.set(gx, 3.0, gz); scene.add(halo); houseGlow.mats.push([halo.material, 1.5]);
    const [px, pz] = hf.toWorld(0, 4.6);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glow, color: gold.clone().multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    pool.rotation.x = -Math.PI / 2; pool.rotation.z = -hf.rot; pool.position.set(px, 0.06, pz); pool.renderOrder = 3; scene.add(pool); houseGlow.mats.push([pool.material, 0.9]);
    // the shimmer: a curtain of gold light across the doorway that you walk through
    const sh = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uI: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; uniform float uI; varying vec2 vUv; void main(){ float e = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.55, vUv.y);'
        + ' float s = 0.55 + 0.45 * sin(vUv.y * 9.0 - uT * 1.6 + sin(vUv.x * 7.0 + uT * 0.7) * 2.2); float a = e * (0.16 + 0.2 * s) * uI; gl_FragColor = vec4(vec3(1.0, 0.8, 0.46) * a, 1.0); }',
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const [cx, cz] = hf.toWorld(0, -0.3);
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.0), sh); curtain.position.set(cx, 0.9 + 2.55, cz); curtain.rotation.y = hf.rot; curtain.renderOrder = 4; scene.add(curtain);
    houseGlow.shimmer = sh;
    lights.add({ pos: new THREE.Vector3(gx, 2.6, gz), color: '#ffc070', intensity: 30, distance: 11, flicker: 0.05, role: 'lantern', priority: 1.5 });
    addP({ preset: 'motes', count: 60, min: new THREE.Vector3(cx - 2.2, 1.0, cz - 2.2), max: new THREE.Vector3(cx + 2.2, 5.2, cz + 2.2), texture: glow, seed: 17, overrides: { color: '#ffd68a', color2: '#fff0c8', intensity: 5, size: 0.09 } });
  }
  // ---------- the east archway: a way out that reads as one (warm lanterns beyond, motes drifting through) ----------
  {
    const fr = frame(P.STONEMERE.x, P.STONEMERE.z, faceRot(P.STONEMERE.face));
    const [ax, az] = fr.toWorld(0, -1.5);
    addP({ preset: 'motes', count: 70, min: new THREE.Vector3(ax - 2, 0.4, az - 2), max: new THREE.Vector3(ax + 2, 6, az + 2), texture: glow, seed: 23, overrides: { color: '#ffe6b0', color2: '#fff4d6', intensity: 5, size: 0.09 } });
    const [gx2, gz2] = fr.toWorld(0, 1.2);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color('#9fe8d8').multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.setScalar(8); halo.position.set(gx2, 3.4, gz2); scene.add(halo); houseGlow.mats.push([halo.material, 0.9]);
  }
  const embers = createParticles({ preset: 'embers', count: 1, min: new THREE.Vector3(), max: new THREE.Vector3(0, 3, 0), texture: glow });
  {
    const src = [...lanternPos.slice(0, 3), new THREE.Vector3(P.CIRCLE.x, 1.0, P.CIRCLE.z), new THREE.Vector3(P.CIRCLE.x, 1.0, P.CIRCLE.z)];
    const n = 220, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const lp = i < 120 ? src[3] : lanternPos[i % lanternPos.length]; pos[i * 3] = lp.x + (Math.random() - 0.5) * (i < 120 ? 0.9 : 0.2); pos[i * 3 + 1] = lp.y + 0.1; pos[i * 3 + 2] = lp.z + (Math.random() - 0.5) * (i < 120 ? 0.9 : 0.2); }
    const sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sd[i] = Math.random();
    embers.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    embers.geometry.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
    scene.add(embers); particles.push(embers);
  }
  const sprays = [];
  for (const [x, z, h, w = 0.06] of jets) sprays.push(addP({ preset: 'spray', count: 70, min: new THREE.Vector3(x - w, 0.3, z - w), max: new THREE.Vector3(x + w, 0.3 + h, z + w), texture: glow, seed: 20 + sprays.length, overrides: { size: 0.28, color: '#f4fbff', color2: '#cfe4ff', intensity: 1.4 } }));
  for (const [x, y, z, w] of mists) sprays.push(addP({ preset: 'spray', count: 50, min: new THREE.Vector3(x - w, y, z - 1), max: new THREE.Vector3(x + w, y + 5, z + 1), texture: mist, seed: 40 + sprays.length, overrides: { size: 4 } }));
  const candleField = (() => {
    const n = candles.length, pos = new Float32Array(n * 3);
    candles.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  })();
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: glow }, uScale: { value: 500 }, uI: { value: 1 }, uK: { value: 2.2 } },
    vertexShader: `uniform float uScale; uniform float uK; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uK * uScale / -mv.z; }`,
    fragmentShader: `uniform sampler2D uTex; uniform float uI; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vec3(1.0, 0.62, 0.28) * a * a * 0.9 * uI, 1.0); }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  {
    const n = lanternPos.length, pos = new Float32Array(n * 3);
    lanternPos.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const halos = new THREE.Points(g, haloMat); halos.frustumCulled = false; halos.renderOrder = 9; scene.add(halos);
    halos.update = (dt, t, camera, h) => { haloMat.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    particles.push(halos);
    const cm = haloMat.clone(); cm.uniforms.uK.value = 0.6; cm.uniforms.uTex.value = glow;
    const cp = new THREE.Points(candleField, cm); cp.frustumCulled = false; cp.renderOrder = 9; scene.add(cp);
    cp.update = (dt, t, camera, h) => { cm.uniforms.uScale.value = h * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
    particles.push(cp); roles.candleHalo = cm;
  }

  // ---------- sun, sky light, environment ----------
  scene.add(createSky());
  const sun = new THREE.DirectionalLight(0xffc27e, 4);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 1; sc.far = 300;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x9fb4e6, 0x6a5a48, 2); scene.add(hemi);
  const pmrem = new THREE.PMREMGenerator(engine.renderer);
  const envScene = new THREE.Scene(); envScene.add(createSky());
  let envRT = null, envDirty = true, envTimer = 0;
  const refreshEnv = () => { const old = envRT; envRT = pmrem.fromScene(envScene, 0, 1, 2000); scene.environment = envRT.texture; if (old) old.dispose(); };

  // ---------- Atlas, Ora, the people ----------
  const sp0 = A.atlas.sprite;
  const hero = new SpriteCharacter({ map: A.atlas.map, emissiveMap: A.atlas.emissiveMap, cols: sp0.cols, rows: sp0.rows, frameW: sp0.frameW, frameH: sp0.frameH, ppu: sp0.ppu, contactTex: glow });
  hero.applyGear();
  attachAtlasRun(hero, A.atlas);   // Shift: the run sheet swaps in
  scene.add(hero.group);
  const ora = new Ora({ glow, flare });
  scene.add(ora.group, ora.trail);
  const arrivalLane = (x,z) => (Math.abs(x)<3 && z>-43) || (z>35 && Math.abs(x)<6);
  const crowd = new Crowd({ scene, glow, rim: foliageRim, walkable: (x, z, agent) => walk.ok(x, z) && (deed || agent?.variant === ELDER_VARIANT || !arrivalLane(x,z)), heightAt, seed: 11, max: 280 });
  crowd.stallSlots = ctx.stallSlots;
  crowd.regions = [[-4, -42, 4, 29], [-22, 24.6, 22, 30.5], [-11, -42, 11, -19], [-22, -30, -15.5, 26], [15.5, -30, 22, 26], [-11, -19, 11, 3], [-11, 3, -4.5, 26], [4.5, 3, 11, 26]];
  {
    for (const s of ctx.crowdSeeds) crowd.add({ ...s });
    const slots = [...ctx.stallSlots].sort(() => R() - 0.5).slice(0, 14);
    for (const [x, z, fx, fz] of slots) crowd.add({ x, z, kind: 'stall', face: [fx, fz] });
    // keepers of the temple, standing by the doors
    for (const [x, z, fx] of [[-6.6, 46.8, 1], [6.6, 46.8, -1], [-10.4, 42.4, 1], [10.4, 42.4, -1]]) crowd.add({ x, z, kind: 'attendant', face: [fx, -0.4], variant: x < 0 ? 11 : 3 });
    // people in the square below the steps (talking, waiting, passing)
    const groups = [[-6.5, 27.4, 3], [5.8, 28.3, 2], [-1.6, 25.6, 2], [15.5, 26.5, 3], [-16, 27.6, 2], [9.8, 26.2, 2], [2.4, -21, 3], [-7.4, -27, 2], [8, -33, 2], [-13.8, 2.6, 2], [13.2, -3.2, 3], [-2.5, -36, 2]];
    for (const [gx, gz, n] of groups) for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + R(), x = gx + Math.cos(a) * 0.75, z = gz + Math.sin(a) * 0.75;
      if (walk.ok(x, z)) crowd.add({ x, z, kind: 'chat', face: [gx - x, gz - z] });
    }
    // a child in front, near the foot of the steps (the one who points), and others darting about
    crowd.add({ x: 1.6, z: 29.2, kind: 'chat', variant: 14, face: [-1, -1] });
    crowd.add({ x: -2.6, z: 28.6, kind: 'child', variant: 6 });
    for (let k = 0; k < 5; k++) { const x = (R() - 0.5) * 30, z = -30 + R() * 50; if (walk.ok(x, z)) crowd.add({ x, z, kind: 'child' }); }
    let n = 0;
    while (n < 135) { const reg = crowd.regions[(R() * crowd.regions.length) | 0]; const x = reg[0] + R() * (reg[2] - reg[0]), z = reg[1] + R() * (reg[3] - reg[1]); if (walk.ok(x, z)) { crowd.add({ x, z, kind: 'wander' }); n++; } }
  }

  // the City at ease: musician, doves, kids, sweeper, friends, a cat (one more instanced mesh; see plaza/life.js)
  const life = stageLife({ scene, glow, crowd, walk, heightAt, R });
  {
    // embers climbing from the old fire toward the beacon, and a second, wider drift of gold sparks over the circle
    const rise = (count, h, o, seed) => { const p = createParticles({ preset: 'embers', count, min: new THREE.Vector3(P.CIRCLE.x - 0.6, 1.1, P.CIRCLE.z - 0.6), max: new THREE.Vector3(P.CIRCLE.x + 0.6, 1.1, P.CIRCLE.z + 0.6), texture: glow, seed, overrides: o }); p.material.uniforms.uBoxMax.value.y = h; scene.add(p); particles.push(p); return p; };
    rise(70, 46, { size: 0.3, intensity: 5.5, speed: 0.34, color: '#ffb060', color2: '#9fdcff' }, 61);
    rise(40, 9, { size: 0.2, intensity: 6, speed: 0.9 }, 62);
  }
  if (!deed) {
    crowd.agents = crowd.agents.filter((a,i) => i % 2 === 0 && !arrivalLane(a.p.x,a.p.z));
    crowd.mesh.count = crowd.shadows.count = crowd.agents.length;
  }
  // An anchored elder uses the citizen sheet, poses, and single crowd draw call.
  const elder = crowd.add({ x: deed ? -5.2 : -3.2, z: deed ? 36 : 38.5,
    kind: 'attendant', variant: ELDER_VARIANT, face: deed ? [0, -1] : [1, 0] });
  const hand = signalHand(scene, glow);
  let exchange = null;
  // The Green is open from the start: the east (Stonemere) and west (Brambleholt) arches both lead out to it; nothing waits on the
  // gate-road lamps any more. Only Ashford, the unfinished district, still ends at real closed leaves.
  const archSeal = sealedWay(scene, { x:P.BRAMBLE.x, z:P.BRAMBLE.z, rotation:faceRot(P.BRAMBLE.face), open:true });
  const districtSeals = [P.ASHFORD].map(a=>sealedWay(scene,{x:a.x,z:a.z,rotation:faceRot(a.face),width:4.8,height:5}));

  // ---------- camera, input, day, sound ----------
  const cam = new DioramaCamera(engine.camera, { pitch: 13, dist: 29, fov: 30, height: 2.2, lead: 6 });
  const input = new Input();
  const audio = new CityAmbience();
  audio.crowdGain = deed ? 1.18 : 1;
  input.onFirstGesture(() => audio.start());
  const day = new PlazaDay({ start: time });
  let bk = 1;
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
    foliageRim.value.copy(k.rim).multiplyScalar(0.55);
    for (const m of roles.windows) m.emissiveIntensity = m.userData.base * k.windows;
    for (const m of roles.lanterns) m.emissiveIntensity = (m.userData.base ?? 1) * k.lanterns;
    for (const m of roles.glyphs) m.emissiveIntensity = (m.userData.base ?? 1) * k.glyphs;
    for (const m of roles.seams) m.emissiveIntensity = (m.userData.base ?? 1) * k.seams;
    for (const m of roles.banners) m.emissiveIntensity = k.banners;
    haloMat.uniforms.uI.value = k.lanterns / 3.2;
    roles.candleHalo.uniforms.uI.value = k.lanterns / 2.4;
    roles.strings.uniforms.uI.value = k.strings;
    lights.roleScale.lantern = k.lanternLight; lights.roleScale.glyph = k.glyphs / 2.6;
    ora.lightScale = k.oraLight;
    life.setLight(k);
    bk = k.beacon * (deed ? 1.65 : 1);
    for (const [m, c, kk] of beaconMats) m.color.copy(c).multiplyScalar(kk * bk);
    world.beacon.pillar.uniforms.uI.value = bk;
    fireflies.material.uniforms.uAmount.value = Math.min(1, k.fireflies);
    skyLanterns.material.uniforms.uAmount.value = Math.max(0, Math.min(1, (k.fireflies - 0.3) * 1.2));
    fireflies.material.uniforms.uIntensity.value = 6 * Math.max(0.5, k.fireflies);
    motes.material.uniforms.uIntensity.value = 2.4 * k.motes;
    flames.uniforms.uI.value = 1.6 + Math.min(1, k.lanterns / 3) * 1.2;
    M.water.color.copy(k.water);
    M.water.emissiveIntensity = Math.max(0, (k.stars - 0.3)) * 0.6;
    for (const w of [...world.falls, ...props.stonemere.falls]) { w.uniforms.uTint.value.copy(k.hemiSky).multiplyScalar(0.55).add(k.lightColor.clone().multiplyScalar(0.12 * k.lightInt / 4)); w.uniforms.uGlow.value = 0.7 + 0.65 * (1 - Math.min(1, k.stars)); }
    if (moving) envDirty = true;
    const night = Math.max(0, Math.min(1, (k.stars - 0.3) / 0.7));
    audio.setNight(night);
  });

  // ---------- walking, height, framing ----------
  const walkable = (x, z) => walk.ok(x, z) && !archSeal.blocks(x,z) && !districtSeals.some(s=>s.blocks(x,z));
  const zoneFor = (x, z) => {
    const L = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
    const sm = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
    // Telor look 2: keep Atlas low in frame and reveal the inhabited skyline during play.
    // (showcase, Claude: halfway back toward the old framing so Atlas stays big enough on a TV)
    const landing = { pitch: 2, dist: 25, height: 4.4, lead: 8.5, fov: 40 };
    const plaza = { pitch: 6, dist: 30, height: 3.8, lead: 8, fov: 37 };
    const gate = { pitch: 5, dist: 27, height: 3.4, lead: 8, fov: 35 };
    const o = {};
    if (z > 22) { const t = sm((z - 24) / 14); for (const k in plaza) o[k] = L(plaza[k], landing[k], t); }
    else if (z < -22) { const t = sm((-22 - z) / 16); for (const k in plaza) o[k] = L(plaza[k], gate[k], t); }
    else Object.assign(o, plaza);
    // by the House: step back a little and look up at its orrery
    const hx = sm((x - 8) / 6) * sm((-24 - z) / 6);
    if (hx > 0) { o.pitch = L(o.pitch, 2, hx); o.dist = L(o.dist, 27, hx); o.height = L(o.height, 7, hx); o.lead = L(o.lead, 5, hx); o.fov = L(o.fov, 44, hx); }
    return o;
  };

  const vel = new THREE.Vector3();
  const heroPos = hero.group.position;
  // ---------- legacy (THE FIRST WORLD): personal touches only; the City itself is canon and identical for all ----------
  const legacy = getLegacy();
  const greeting = oraGreeting(legacy);
  if (greeting) ora.halo.material.color.lerp(new THREE.Color(ORA_TONE_TINT[greeting.tone]), 0.18);
  // TODO(legacy/districts): rememberedVillages(legacy) lists Ashford/Brambleholt/Stonemere the player's people reached;
  //   mark their arches as remembered (a glow), never rebuilt. Hook: the three district arches in the build above.
  // TODO(legacy/elders): legacy.people[] (empty until the god game's event log lands) appear as named elders near the
  //   steps; needs elder citizen art. Hook: crowd (src/scene/plaza/crowd.js) agent pool.
  // TODO(legacy/memorial): legacy.marks.worstAct (or null) becomes a memorial somewhere in the City, seen only by them.
  // ---------- the people who talk (engine/talk.js is the system; every word lives in plaza/lines.js) ----------
  const _pv = new THREE.Vector3();
  const project = (x, y, z) => {
    _pv.set(x, y, z).project(engine.camera);
    const r = engine.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (_pv.x * 0.5 + 0.5) * r.width, y: r.top + (0.5 - _pv.y * 0.5) * r.height, on: _pv.z < 1 && Math.abs(_pv.x) < 1.04 && Math.abs(_pv.y) < 1.04 };
  };
  const store = (() => { try { return localStorage; } catch { return null; } })();
  const satchel = new Satchel(store);
  const friends = createFriends({ storage: store });   // city-quests lane: friendships, favours, the City noticing
  const ctxNow = (id) => {
    const sn = quest.snapshot, tm = day.name;
    const c = { signal: sn.signal, deed: sn.firstDeed, secondDeed: sn.secondDeed, greenSeen: hasSeenGreen(store, sn.greenSeen), fished: hasFished(store), carriedFish: !!satchel.fish,
      homeDone: isHomeDone(store), time: tm, night: tm === 'night' || tm === 'dusk' };
    if (id) { c.lvl = friends.level(id); c.favour = friends.favourDone(id) ? 'done' : favourReady(id, c) ? 'ready' : 'none'; }
    return c;
  };
  const eastArch = new THREE.Vector3(P.STONEMERE.x, 0, P.STONEMERE.z);
  const talk = createTalk({
    input, project, hero: () => heroPos, barks: !q.has('nobarks'), barkPool: () => cityBarks(ctxNow()),
    onOpen: (p) => { if (p.agent) p.agent.faceAt = heroPos; vel.set(0, 0, 0); auto.move = null; },
    onClose: (p) => { if (p.agent) { p.agent.faceAt = null; p.agent.wait = Math.max(p.agent.wait, 0.8); } },
  });
  // city-quests: a first talk of the day is +1 (before the lines are chosen); a finished favour is +2 (when the talk ends); a rise lifts a gold glyph
  const regPerson = (def, agent, extra = {}) => {
    let start = 0, ready = false;
    const { onEnd: extraEnd, ...rest } = extra;
    return talk.register({ id: def.id, name: def.name, agent, seed: talk.people.length * 1.7,
      pos: () => ({ x: agent.p.x, y: agent.p.y, z: agent.p.z }), lines: () => def.lines(ctxNow(def.id)),
      // green-gifts: carried gifts offered after the conversation.
      choices: () => giftChoices(satchel, friends, def.id, (id,taste,item)=>{if(id==='bram' && isFish(item))friends.finishFavour(id);return cityGiftReaction(id,taste);}, id=>talk.rise(id)),
      onBefore: () => { start = friends.level(def.id); friends.touch(def.id); ready = ctxNow(def.id).favour === 'ready'; },
      onEnd: (completed) => {
        extraEnd && extraEnd(completed);
        if (ready && completed && def.id !== 'bram') friends.finishFavour(def.id);
        if (friends.level(def.id) > start) talk.rise(def.id);
      }, ...rest });
  };
  regPerson(ELDER, elder, {
    onLine: (i) => { if (!exchange) return; exchange.line = i; if (i >= 1) quest.accept(); if (i >= 2) elder.faceAt = eastArch; },
    onEnd: () => { if (!quest.snapshot.signal) quest.accept(); exchange = null; elder.pose = undefined; },
  });
  {
    const spotOk = (x, z) => walk.ok(x, z) && (deed || !arrivalLane(x, z)) && !crowd.occupied(x, z, 0.8);
    const spot = (x, z) => {
      if (spotOk(x, z)) return [x, z];
      for (let r = 0.5; r < 6; r += 0.5) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (spotOk(px, pz)) return [px, pz]; }
      return [x, z];
    };
    for (const def of PEOPLE) {
      const [wx, wz] = def.house ? houseFrame.toWorld(def.house[0], def.house[1]) : def.at;
      const [x, z] = spot(wx, wz);
      const agent = crowd.add({ x, z, kind: 'attendant', face: def.face, variant: def.variant });
      if (agent) regPerson(def, agent);
    }
  }
  let barkPool = [], barkT = 0;
  const refreshBarkPool = () => {
    const talkers = new Set(talk.people.map((p) => p.agent));
    barkPool = crowd.agents.filter((a) => !talkers.has(a) && (a.kind === 'wander' || a.kind === 'chat') && !a.child && !a.recog
      && Math.hypot(a.p.x - heroPos.x, a.p.z - heroPos.z) < 16).map((a) => ({ pos: () => ({ x: a.p.x, y: a.p.y, z: a.p.z }) }));
  };
  let talkPx = 0;
  const anchor = new THREE.Vector3();
  const api = {
    talk,
    quest, elder, hand, archSeal, districtSeals, legacy, greeting, hero, ora, cam, day, lights, input, walkable, crowd, audio, heightAt, walk, facade, world, props,
    zoneLock: false, cinematic: null, leaving: false, door: null,
    teleport(x, z, dir = 'up') {
      api.cinematic = null; api.zoneLock = false; facade.visible = false;
      cam.yaw = cam.yawTarget = 0;
      heroPos.set(x, heightAt(x, z), z); hero.dir = dir; vel.set(0, 0, 0);
      Object.assign(cam.target, zoneFor(x, z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
      engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix();
      cam.snap(heroPos); ora.place(heroPos.clone().add(new THREE.Vector3(0.8, 1.7, 0)));
    },
    setTime(name, instant = true) { day.set(name, instant); envDirty = true; },
    autoWalk(dx, dz, seconds, run = false) { auto.move = new THREE.Vector3(dx, 0, dz).normalize(); auto.run = run; auto.until = engine.time + seconds; },
    /** The arrival from the Nexus: out through the doors, onto the top step; seen. */
    arrive(recognize = true) {
      api.teleport(0, 48.8, 'up');
      api.cinematic = { t: 0, recognize, phase: 'walk', fired: false };
    },
    recognize() {
      // a player with a legacy is recognised a little longer and wider: their people remember (no change to the City)
      const mine = legacy ? 1 + Math.min(3, rememberedVillages(legacy).length) * 0.15 : 1;
      const n = crowd.recognize(heroPos, { radius: 30 * mine, max: Math.round(40 * mine), hold: legacy ? 4.6 : undefined }); audio.swell(); return n; },
    enterHouse() { return door.enter(); },
  };
  const auto = { move: null, until: 0 };

  // the House door
  const door = (api.door = new HouseDoor({
    engine, input, audio,
    onInside: () => { api.inHouse = true; vel.set(0, 0, 0); auto.move = null; },
    onOutside: () => {
      api.inHouse = false; hero.applyGear();
      const [x, z] = props.house.door.out; api.teleport(x, z, 'down');
      hero.dir = 'down';
    },
  }));
  // forgiving: anywhere across the top of the House steps and into the doorway enters (any reasonable angle)
  const inHouseTrigger = () => { const [lx, lz] = houseFrame.toLocal(heroPos.x, heroPos.z); return Math.abs(lx) < 3.4 && lz < 1.0 && lz > -0.8; };
  // an archway trigger in the arch's own frame: stepping into the opening from any side of the plaza counts
  const eastFr = frame(P.STONEMERE.x, P.STONEMERE.z, faceRot(P.STONEMERE.face)), westFr = frame(P.BRAMBLE.x, P.BRAMBLE.z, faceRot(P.BRAMBLE.face));
  const inGateway = (fr) => { const [lx, lz] = fr.toLocal(heroPos.x, heroPos.z); return Math.abs(lx) < 2.1 && lz < 0.3 && lz > -6; };
  const leaveToGreen = (via) => {
    api.leaving = true; quest.markGreen();
    try { sessionStorage.setItem('atlas.city.via', via); } catch {}
    mergeCity(store, { greenSeen: true });   // merge: the old code overwrote the whole key and would wipe friendships
    go && go('green');
  };

  // the cinematic arrival: walk out, stop on the top step, the city sees him; a reverse shot from the square; back to play
  const runCinematic = (c, dt) => {
    c.t += dt;
    const T = c.t;
    let move = null;
    if (c.phase === 'walk') {
      if (T > 0.5 && heroPos.z > 41.2) move = new THREE.Vector3(0, 0, -1);
      if (heroPos.z <= 41.2 && T > 0.5) { c.phase = 'seen'; c.t0 = T; if (c.recognize) api.recognize(); }
    }
    if (c.phase === 'seen') {
      const k = T - c.t0;
      if (c.recognize && k > 1.5 && k < 6.6) {
        // the reverse shot: from the square among the people, looking up the steps at him, the temple's open doors behind
        if (!c.rev) { c.rev = true; facade.visible = true; for (const u of uplights) u.visible = true; engine.camera.fov = 33; engine.camera.updateProjectionMatrix(); }
        const u = Math.min(1, (k - 1.5) / 5.1), e = u * u * (3 - 2 * u);
        revPos.set(2.2 - 1.2 * e, 3.1 + 0.25 * e, 14.6 + 2.6 * e);
        revLook.set(heroPos.x + 0.35 - 0.2 * e, heroPos.y + 2.3 - 0.3 * e, heroPos.z);
      } else if (c.rev) {
        c.rev = false; facade.visible = false; for (const u of uplights) u.visible = false; cam.yaw = cam.yawTarget = 0;
        Object.assign(cam.target, zoneFor(heroPos.x, heroPos.z)); Object.assign(cam, { pitch: cam.target.pitch, dist: cam.target.dist, height: cam.target.height, lead: cam.target.lead });
        engine.camera.fov = cam.target.fov; engine.camera.updateProjectionMatrix(); cam.snap(heroPos);
      }
      if (k > (c.recognize ? 7.4 : 1.0)) api.cinematic = null;
    }
    return move;
  };

  const shaftWorld = new THREE.Vector3(), focalWorld = new THREE.Vector3();
  const revPos = new THREE.Vector3(), revLook = new THREE.Vector3(), revFwd = new THREE.Vector3();
  const uplights = [-1, 1].map((sx) => { const l = new THREE.PointLight('#ffcf90', 26, 22, 1.3); l.position.set(sx * 6.5, P.LAND_Y + 1.2, 46.5); l.visible = false; scene.add(l); return l; });
  api.update = (dt, t) => {
    // the engine's first rAF frame can hand us a negative dt (timestamp older than start()); time only runs forward here
    dt = Math.min(Math.max(dt, 0), 0.05);
    if (api.inHouse) { input.endFrame(); return; }
    archSeal.update(dt,t,heroPos,true);
    districtSeals.forEach(s=>s.update(dt,t,heroPos,false));
    if (!quest.snapshot.signal && !exchange && heroPos.z > 30) {
      // The elder notices Atlas at the doors and meets him on the clear landing.
      elder.home.set(heroPos.x - 1.8,0,Math.min(46,Math.max(32,heroPos.z)));
      elder.speed = 3.4;
    }
    // the elder meets him on the landing and speaks (the Signal comes at the second line, the way out to the Green at the third)
    if (!api.cinematic && !api.leaving && !quest.snapshot.signal && !exchange && !talk.active && heroPos.distanceTo(elder.p) < 2.8) {
      exchange = { t: 0, line: 0 }; vel.set(0, 0, 0); auto.move = null; talk.open('elder');
    }
    if (exchange) { exchange.t += dt; elder.pose = exchange.line >= 2 ? COL.point : undefined; }
    if (!api.cinematic && !api.leaving && door.state === 'out') talk.update(dt);
    if (!api.cinematic && input.consume('KeyT')) day.next();
    if (!api.cinematic && input.consume('KeyQ')) cam.turn(-1);
    if (!api.cinematic && input.consume('KeyE')) cam.turn(1);
    const rev = api.cinematic && api.cinematic.rev;
    let fwd = cam.forward(), right = cam.right();
    if (rev) { revFwd.subVectors(revLook, revPos).setY(0).normalize(); fwd = revFwd.clone(); right = new THREE.Vector3(-fwd.z, 0, fwd.x); }
    let move = null, speed = 0;
    if (api.cinematic) { move = runCinematic(api.cinematic, dt); speed = move ? 3.0 : 0; }
    else if (!exchange && !talk.active) {
      const ax = input.axis();
      if (ax.x || ax.y) { move = right.clone().multiplyScalar(ax.x).addScaledVector(fwd, ax.y).normalize(); speed = ax.run ? 10.5 : 5.2; }
      else if (auto.move && t < auto.until) { move = auto.move.clone(); speed = auto.run ? 10.5 : 5.2; }
    }
    const want = move ? move.clone().multiplyScalar(speed) : new THREE.Vector3();
    vel.lerp(want, 1 - Math.exp(-dt * 12));
    const nx = heroPos.x + vel.x * dt, nz = heroPos.z + vel.z * dt;
    if (walkable(nx, nz)) { heroPos.x = nx; heroPos.z = nz; }
    else if (walkable(nx, heroPos.z)) { heroPos.x = nx; vel.z = 0; }
    else if (walkable(heroPos.x, nz)) { heroPos.z = nz; vel.x = 0; }
    else vel.set(0, 0, 0);
    heroPos.y += (heightAt(heroPos.x, heroPos.z) - heroPos.y) * (1 - Math.exp(-dt * 20));
    const moving = vel.length() > 0.4;
    hero.update(dt, engine.camera, moving ? vel.clone().setY(0).normalize() : null, vel.length(), right, fwd);
    if (api.cinematic && api.cinematic.rev) { hero.dir = 'down'; hero.setFrame(); }
    if (talk.active && talk.speaker && talk.speaker.agent) {
      // Atlas turns to whoever he is talking with
      const sp = talk.speaker.agent.p, dx = sp.x - heroPos.x, dz = sp.z - heroPos.z, lx = dx * right.x + dz * right.z, ly = dx * fwd.x + dz * fwd.z;
      hero.dir = Math.abs(lx) > Math.abs(ly) * 1.05 ? (lx > 0 ? 'right' : 'left') : ly > 0 ? 'up' : 'down'; hero.setFrame();
    }
    const off = { down: [0.95, 1.62, 0.25], up: [-0.95, 1.62, 0.25], left: [-0.7, 1.55, 0.3], right: [0.85, 1.6, 0.3] }[hero.dir];
    anchor.copy(heroPos).addScaledVector(right, off[0]).addScaledVector(fwd, -off[2]); anchor.y += off[1];
    // exits and the House door
    if (!api.cinematic && !api.leaving) {
      if (heroPos.z > P.DOOR_Z && Math.abs(heroPos.x) < 5) { api.leaving = true; go && go('nexus'); }
      else if (heroPos.z < P.GATE.exitZ) { api.leaving = true; go && go('gate-road'); }
      // the east (Stonemere) archway is the way out to the Green, open from the start; the west (Brambleholt) one curves round to it too
      else if (!talk.active && inGateway(eastFr)) leaveToGreen('east');
      else if (!talk.active && inGateway(westFr)) leaveToGreen('west');
      else if (!talk.active && inHouseTrigger() && door.state === 'out') door.enter();
    }
    if (api.cinematic && api.cinematic.rev) { engine.camera.position.copy(revPos); engine.camera.lookAt(revLook); engine.camera.updateMatrixWorld(); }
    else { if (!api.zoneLock) Object.assign(cam.target, zoneFor(heroPos.x, heroPos.z)); cam.update(dt, heroPos); }
    {
      // while talking, the picture rises so Atlas and the one he talks with sit above the dialogue box (which fills the lowest ~30%)
      const cv = engine.renderer.domElement, vw = cv.clientWidth || innerWidth, vh = cv.clientHeight || innerHeight;
      let want = 0;
      if (talk.active && !api.cinematic) {
        const sp = talk.speaker && talk.speaker.agent ? talk.speaker.agent.p : heroPos;
        const yh = project(heroPos.x, heroPos.y, heroPos.z).y + talkPx, ys = project(sp.x, sp.y, sp.z).y + talkPx;
        want = Math.min(vh * 0.5, Math.max(vh * 0.1, Math.max(yh, ys) - vh * 0.56));
      }
      talkPx += (want - talkPx) * (1 - Math.exp(-dt * 5));
      if (talkPx > 0.5) engine.camera.setViewOffset(vw, vh, 0, talkPx, vw, vh);
      else if (engine.camera.view && engine.camera.view.enabled) engine.camera.clearViewOffset();
    }
    hand.update(anchor, quest.snapshot.signal, t);
    if (!quest.snapshot.signal && !exchange) anchor.copy(elder.p).add(new THREE.Vector3(0,2.4,0));
    if (exchange) {
      const a = exchange.t * Math.PI * 1.2;
      anchor.set(elder.p.x + Math.cos(a) * 1.1, elder.p.y + 2 + Math.sin(a * 2) * 0.22, elder.p.z + Math.sin(a) * 1.1);

    }
    ora.update(dt, t, anchor, engine.camera, engine.post.h);
    if (exchange) ora.halo.scale.multiplyScalar(1 + Math.sin(exchange.t * 9) * 0.2);
    crowd.update(dt, t, engine.camera, right, fwd, heroPos);
    if ((barkT -= dt) <= 0) { barkT = 0.7; refreshBarkPool(); }
    talk.barkUpdate(dt, barkPool, heroPos);
    life.update(dt, t, engine.camera, right, heroPos, engine.post.h);
    {
      // the beacon breathes: a slow swell with a quicker shimmer on top, light and halo together
      const pul = 1 + 0.09 * Math.sin(t * 0.85) + 0.035 * Math.sin(t * 2.7 + 1.3);
      for (const [m, c, kk] of beaconMats) m.color.copy(c).multiplyScalar(kk * bk * pul);
      world.beacon.pillar.uniforms.uI.value = bk * (0.9 + 0.2 * (pul - 0.9));
      beacon.children.forEach((o, i) => { if (o.isSprite) { o.userData.s0 = o.userData.s0 || o.scale.x; o.scale.setScalar(o.userData.s0 * (1 + (pul - 1) * (1.2 + (i % 3) * 0.3))); } });
    }
    bb.update(engine.camera);
    flames.update(t, engine.camera);
    day.update(dt);
    envTimer += dt;
    if (envDirty && envTimer > 0.4) { refreshEnv(); envDirty = false; envTimer = 0; }
    const k = day.current;
    sunTarget.copy(cam.focus);
    const texel = 96 / 4096;
    sunTarget.x = Math.round(sunTarget.x / texel) * texel; sunTarget.z = Math.round(sunTarget.z / texel) * texel;
    sun.target.position.copy(sunTarget);
    sun.position.copy(sunTarget).addScaledVector(k.lightDir, 150);
    lights.update(cam.focus, dt, t);
    // the door light: bright as he comes through, then the steady glow of the open doors
    const arr = api.cinematic ? Math.max(0, 1 - api.cinematic.t / 6) : 0;
    doorLight.intensity = (6 + 14 * arr) * (0.7 + k.lanternLight * 0.3);
    threshold.material.color.setRGB(1, 0.83, 0.6).multiplyScalar(0.25 + arr * 0.45);
    // animate: water, falls, banners, beacon, orrery
    windT.value = t;
    const rip = M.water.userData.ripple; rip.offset.set(t * 0.012, t * 0.02);
    for (const w of [...world.falls, ...props.stonemere.falls]) w.uniforms.uTime.value = t;
    for (const r of world.beacon.rings) { r.piv.rotation.z += dt * r.speed; r.arm.rotation.z += dt * r.speed * 2.2; }
    world.beacon.pillar.uniforms.uTime.value = t;
    houseGlow.shimmer.uniforms.uT.value = t;
    const orr = props.house.orrery; orr.group.children[0].rotation.z = t * 0.05;
    for (const o of orr.orbits) o.arm.rotation.z += dt * o.speed;
    for (const p of particles) p.update && p.update(dt, t, engine.camera, engine.post.h);
    skyUniforms.uTime.value = t;
    // depth of field on Atlas; shafts from the bright sky
    const H = engine.post.haze.u;
    const heroDist = engine.camera.position.distanceTo(heroPos);
    H.uFocusDist.value = heroDist - 0.5;
    const spp = heroPos.clone(); spp.y += 1.2; spp.project(engine.camera);
    H.uFocusY.value = spp.y * 0.5 + 0.5;
    const pw = engine.post.w, ph = engine.post.h;
    const hpx = (hero.height / (2 * heroDist * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov) / 2))) * ph;
    occluder.uOcc.value.set((spp.x * 0.5 + 0.5) * pw, (spp.y * 0.5 + 0.5) * ph, heroDist, hpx * 1.15);
    engine.camera.updateMatrixWorld();
    mirror.render(scene, engine.camera, pw, ph);
    const sd = k.skySun; shaftWorld.set(sd.x, sd.y - 0.12, sd.z).normalize().multiplyScalar(900).add(engine.camera.position);
    const sh = shaftWorld.project(engine.camera);
    engine.post.final.u.uShaftPos.value.set(sh.x * 0.5 + 0.5, sh.y * 0.5 + 0.5);
    if (sh.z > 1) engine.post.final.u.uShaft.value = 0;
    { const F = engine.post.final.u; F.uGround.value = api.cinematic && api.cinematic.rev ? 0 : 0.34; const fp = focalWorld.copy(world.beacon.pos).project(engine.camera);
      F.uFocalPos.value.set(fp.x * 0.5 + 0.5, Math.min(0.92, fp.y * 0.5 + 0.5)); F.uFocal.value = fp.z < 1 ? 0.14 : 0; }
    input.endFrame();
  };

  // ---------- start ----------
  day.update(0);
  refreshEnv();
  if (from === 'gate-road') api.teleport(0, P.GATE.z + 2.2, 'down');
  else if (from === 'green') {
    // back from the Green: just inside the arch he left by (east by default), facing into the plaza, clear of its trigger
    let via = 'east'; try { via = sessionStorage.getItem('atlas.city.via') || 'east'; } catch {}
    if (via === 'west') api.teleport(P.BRAMBLE.x + 3.6, P.BRAMBLE.z + 2, 'right');
    else api.teleport(P.STONEMERE.x - 3.6, P.STONEMERE.z + 2.2, 'left');
  }
  else {
    const firstTime = (from === 'nexus' || from === null) && !seen('recognition');
    api.arrive(firstTime);        // the recognition plays once; after that you just walk out
    if (firstTime) markSeen('recognition');
  }
  engine.add(api);
  return api;
}
