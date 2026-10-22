// The plaza's materials: polished marble and the processional causeway (both mirror the world), white-gold walls,
// old stone, timber, market canvas, gold, brass, glass and flame, and the water. Emissive materials are sorted into roles
// so the time of day can turn them up and down together.
import * as THREE from 'three';
import * as Tex from '../../engine/pixel/textures.js';
import { PixelCanvas, hash2 } from '../../engine/pixel/paint.js';
import { plazaOccluderFade as addOccluderFade } from '../../engine/world/telor-occlusion.js';
import * as PT from './textures.js';

const bake = (r) => {
  const o = { tile: r.size && r.tpu ? [r.size[0] / r.tpu, r.size[1] / r.tpu] : 4 };
  for (const k of ['map', 'normalMap', 'ormMap', 'emissiveMap']) if (r[k]) o[k] = r[k].isTexture ? r[k] : r[k].texture();
  return o;
};

/** Small gold carvings for the old stones: a ringed four-point star, an axis with a chevron, three points, a crescent of dots. */
function paintMarks() {
  const S = 64, pc = new PixelCanvas(S, S), emi = new PixelCanvas(S, S);
  const g = (x, y, k = 4) => { pc.set(x, y, Tex.GOLD[k]); emi.set(x, y, k >= 5 ? [255, 226, 160] : [200, 160, 90]); };
  // quadrant 0: four-point star in a ring
  for (let a = 0; a < 6.283; a += 0.05) g(Math.round(16 + Math.cos(a) * 11), Math.round(16 + Math.sin(a) * 11), 3);
  for (let k = -8; k <= 8; k++) { const w = Math.max(0, 2 - Math.abs(k) * 0.25); for (let o = -w; o <= w; o++) { g(16 + k, 16 + Math.round(o), Math.abs(k) < 2 ? 5 : 4); g(16 + Math.round(o), 16 + k, Math.abs(k) < 2 ? 5 : 4); } }
  // quadrant 1: the axis and a swept chevron
  for (let y = 4; y < 29; y++) g(48, y, y < 8 ? 5 : 4);
  for (let k = 0; k < 10; k++) { g(48 - k, 10 + k, 4); g(48 + k, 10 + k, 4); }
  // quadrant 2: three points in a line, rising
  for (const [x, y] of [[8, 54], [16, 46], [24, 38]]) for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) g(x + ox, y + oy, ox || oy ? 4 : 5);
  // quadrant 3: an arc of dots around a point
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.15 + k * 0.12); g(Math.round(48 + Math.cos(a) * 10), Math.round(52 - Math.sin(a) * 10), 4); }
  g(48, 50, 5); g(47, 50, 4); g(49, 50, 4);
  const t = pc.texture({ repeat: false, mips: false }), e = emi.texture({ repeat: false, mips: false });
  return { map: t, emissiveMap: e };
}

export function makeMaterials(roles, mirror) {
  const std = (o, tile, role, base = 1) => {
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.tile = tile;
    if (role) { roles[role].push(m); m.userData.base = base; }
    return m;
  };
  const T = {
    marble: bake(PT.paintMarbleFloor(31)),
    road: bake(Tex.paintRoad(11)),
    ashlar: bake(PT.paintWhiteAshlar(43)),
    ashlar2: bake(PT.paintWhiteAshlar(47, { blockW: 32, blockH: 16 })),
    sand: bake(Tex.paintAshlar(5, ['#3d3326', '#4f4331', '#62533c', '#766548', '#8a7755', '#9d8963'], { blockW: 24, blockH: 12, joint: '#231d15', speck: 0.02 })),
    win0: bake(PT.paintWhiteWindowWall(41, { litChance: 0.65 })),
    win1: bake(PT.paintWhiteWindowWall(53, { litChance: 0.5, cyanChance: 0.15 })),
    win2: bake(PT.paintWhiteWindowWall(67, { litChance: 0.8 })),
    roof: bake(Tex.paintRoof(4)),
    old: bake(PT.paintOldStone(51)),
    oldflags: bake(PT.paintOldFlags(53)),
    wood: bake(PT.paintWood(63)),
    iron: bake(Tex.paintMetal('iron', 2)),
    brass: bake(Tex.paintMetal('brass', 3)),
    lantern: bake(Tex.paintLantern()),
    ripples: bake(PT.paintRipples(71)),
    compass: Tex.paintCompass(),
    marks: paintMarks(),
  };
  // the white-gold roofs: the navy slate recoloured to champagne gold (navy stays for a few, the palette's anchor)
  const roofGold = PT.recolorTexture(T.roof.map, (r, g, b) => { const l = (r + g + b) / 3 / 70; return [Math.min(255, 70 + l * 175), Math.min(255, 55 + l * 140), Math.min(255, 30 + l * 80)]; });
  const M = {
    marble: std({ map: T.marble.map, normalMap: T.marble.normalMap, roughnessMap: T.marble.ormMap, metalnessMap: T.marble.ormMap, emissiveMap: T.marble.emissiveMap, emissive: 0xffffff, roughness: 1, metalness: 1, envMapIntensity: 0.7, normalScale: new THREE.Vector2(0.8, 0.8) }, T.marble.tile, 'seams', 0.7),
    road: std({ map: T.road.map, normalMap: T.road.normalMap, roughnessMap: T.road.ormMap, metalnessMap: T.road.ormMap, emissiveMap: T.road.emissiveMap, emissive: 0xffffff, roughness: 1, metalness: 1, envMapIntensity: 0.35, normalScale: new THREE.Vector2(1.2, 1.2) }, T.road.tile, 'seams', 1),
    ashlar: std({ map: T.ashlar.map, normalMap: T.ashlar.normalMap, roughness: 0.85, envMapIntensity: 0.35 }, T.ashlar.tile),
    ashlar2: std({ map: T.ashlar2.map, normalMap: T.ashlar2.normalMap, roughness: 0.8, envMapIntensity: 0.35 }, T.ashlar2.tile),
    sand: std({ map: T.sand.map, normalMap: T.sand.normalMap, roughness: 0.9, envMapIntensity: 0.3 }, T.sand.tile),
    roof: std({ map: roofGold, normalMap: T.roof.normalMap, roughness: 0.42, metalness: 0.55, envMapIntensity: 1.0 }, T.roof.tile),
    roofNavy: std({ map: T.roof.map, normalMap: T.roof.normalMap, roughness: 0.55, envMapIntensity: 0.6 }, T.roof.tile),
    old: std({ map: T.old.map, normalMap: T.old.normalMap, roughness: 0.95, envMapIntensity: 0.25, normalScale: new THREE.Vector2(1.4, 1.4) }, T.old.tile),
    oldflags: std({ map: T.oldflags.map, normalMap: T.oldflags.normalMap, roughness: 0.9, envMapIntensity: 0.3 }, T.oldflags.tile),
    wood: std({ map: T.wood.map, roughness: 0.85 }, T.wood.tile),
    iron: std({ map: T.iron.map, roughnessMap: T.iron.ormMap, metalnessMap: T.iron.ormMap, roughness: 1, metalness: 1 }, 1),
    brass: std({ map: T.brass.map, roughnessMap: T.brass.ormMap, metalnessMap: T.brass.ormMap, roughness: 1, metalness: 1, envMapIntensity: 1.3 }, 1),
    gold: std({ color: '#d4b06a', metalness: 1, roughness: 0.26, envMapIntensity: 1.5, emissive: '#7a5c2c', emissiveIntensity: 0.4 }, 1, 'seams', 0.8),
    goldBright: std({ color: '#f1dcaa', metalness: 1, roughness: 0.2, envMapIntensity: 1.6, emissive: '#d4a050', emissiveIntensity: 1 }, 1, 'glyphs', 0.55),
    skyglass: std({ color: '#304858', roughness: .38, metalness: .45, emissive: '#244350', emissiveIntensity: .28 }, 1),
    cyan: std({ color: '#0d3333', emissive: '#3fd3c8', emissiveIntensity: 2.5, roughness: 0.4 }, 1, 'glyphs', 1),
    signal: std({ color: '#0b2020', emissive: '#3fd3c8', emissiveIntensity: 0.6, roughness: 0.5 }, 1, 'glyphs', 0.16),
    glass: std({ map: T.lantern.map, emissiveMap: T.lantern.emissiveMap, emissive: 0xffffff, emissiveIntensity: 3, roughness: 0.3 }, 1, 'lanterns', 1),
    flame: std({ color: '#ffb060', emissive: '#ffa040', emissiveIntensity: 6 }, 1, 'lanterns', 2),
    warm: std({ color: '#3a2410', emissive: '#ffb45a', emissiveIntensity: 2 }, 1, 'windows', 0.9),
    doorGlow: std({ color: '#3a2a10', emissive: '#ffd08a', emissiveIntensity: 3 }, 1, 'windows', 1.6),
    candle: std({ color: '#efe6d2', emissive: '#ffcf7a', emissiveIntensity: 3 }, 1, 'lanterns', 1.2),
    cloth: [['#e6dcc4', 1], ['#1d2b4f', 1], ['#2c6a68', 1], ['#b39864', 1], ['#3b3563', 1], ['#5b7254', 1]].map(([c]) => std({ color: c, roughness: 0.9 }, 1)),
    fruit: [['#c98a3c'], ['#d4b06a'], ['#4f4a7a'], ['#7a9a4a'], ['#a8643c']].map(([c]) => std({ color: c, roughness: 0.6 }, 1)),
    pot: std({ color: '#8a5a3c', roughness: 0.8 }, 1),
    leafy: std({ color: '#2a4a30', roughness: 0.9 }, 1),
    navy: std({ color: '#121c38', roughness: 0.55, metalness: 0.2, emissive: '#0a1430', emissiveIntensity: 0.4 }, 1),
  };
  for (const k of ['win0', 'win1', 'win2'])
    M[k] = std({ map: T[k].map, normalMap: T[k].normalMap, emissiveMap: T[k].emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.82, envMapIntensity: 0.35 }, T[k].tile, 'windows', 1);
  const awn = [['#ece4cf', '#1d2b4f'], ['#ece4cf', '#2c6a68'], ['#ccb47f', '#3b3563'], ['#ece4cf', '#b48d4a'], ['#e6dcc4', '#5b7254']];
  awn.forEach(([a, b], i) => { const t = bake(PT.paintAwning(a, b, 61 + i)); M['awn' + i] = std({ map: t.map, roughness: 0.92, side: THREE.DoubleSide }, t.tile); });
  M.marks = new THREE.MeshStandardMaterial({ map: T.marks.map, emissiveMap: T.marks.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1, transparent: true, alphaTest: 0.5, roughness: 0.4, metalness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  roles.glyphs.push(M.marks); M.marks.userData.base = 0.5;
  M.compass = new THREE.MeshStandardMaterial({ map: T.compass.map, emissiveMap: T.compass.emissiveMap, emissive: 0xffffff, roughnessMap: T.compass.ormMap, metalnessMap: T.compass.ormMap, transparent: true, alphaTest: 0.5, roughness: 1.4, metalness: 0.9, envMapIntensity: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  roles.seams.push(M.compass); M.compass.userData.base = 0.9;
  // water: a dark mirror stirred by scrolling pixel ripples
  const rip = T.ripples.normalMap; rip.wrapS = rip.wrapT = THREE.RepeatWrapping;
  M.water = new THREE.MeshStandardMaterial({ color: '#2b5a68', roughness: 0.05, metalness: 0.35, normalMap: rip, normalScale: new THREE.Vector2(0.45, 0.45), envMapIntensity: 1.0, emissive: '#0c3a44', emissiveIntensity: 0.0 });
  M.water.userData.ripple = rip;
  M.marbleDry = new THREE.MeshStandardMaterial({ map: T.marble.map, normalMap: T.marble.normalMap, roughnessMap: T.marble.ormMap, metalnessMap: T.marble.ormMap, emissiveMap: T.marble.emissiveMap, emissive: 0xffffff, roughness: 1.4, metalness: 1, envMapIntensity: 0.9, normalScale: new THREE.Vector2(0.8, 0.8) });
  roles.seams.push(M.marbleDry); M.marbleDry.userData.base = 0.7;
  M.waterFar = new THREE.MeshStandardMaterial({ color: '#30506a', roughness: 0.12, metalness: 0.2, envMapIntensity: 1.4 });
  // mirrors: each patched material gets its own program key (the patch bakes its constants into the shader)
  const mirrorOn = (m, base, streak, tag) => { mirror.apply(m, { base, streak }); m.customProgramCacheKey = () => 'planar-refl-' + tag; };
  mirrorOn(M.marble, 0.32, 0.004, 'marble');
  mirrorOn(M.road, 0.62, 0.008, 'road');
  mirrorOn(M.water, 1.0, 0.003, 'water');
  M.road.roughness = 0.75;
  for (const k of ['ashlar', 'ashlar2', 'sand', 'roof', 'roofNavy', 'old', 'wood', 'iron', 'brass', 'gold', 'goldBright', 'cyan', 'signal', 'glass', 'flame', 'win0', 'win1', 'win2', 'warm', 'doorGlow'])
    addOccluderFade(M[k]);
  for (const m of [...M.cloth, ...Object.keys(M).filter(k => /^awn/.test(k)).map(k => M[k]), M.skyglass]) addOccluderFade(m);
  return { M, T };
}

/** A stable small hash for placing things. */
export const h2 = (a, b, s = 0) => hash2(a * 13 + 7, b * 7 + 3, s);
