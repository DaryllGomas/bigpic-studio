// The scene registry. Each scene is its own page load (simple, no teardown bugs): exits call go(),
// which fades out and reloads with ?scene=<name>&from=<where you came from>. Each lane owns its scene file.
export const SCENES = {
  home: () => import('./home.js').then(m => m.createHome), // cottage-inside
  'gate-road': () => import('./gate-road.js').then((m) => m.createGateRoad),
  green: () => import('./green.js').then((m) => m.createGreen),
  'open-road': () => import('./open-road.js').then((m) => m.createOpenRoad),
  nexus: () => import('./nexus.js').then((m) => m.createNexus),
  plaza: () => import('./plaza.js').then((m) => m.createPlaza),
};
export const DEFAULT_SCENE = 'nexus';
