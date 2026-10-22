// Atlas Veyr: boots the diorama engine and one scene (?scene=nexus|plaza|gate-road, &from=<previous scene>).
import { Engine } from './engine/core.js';
import { quests } from './engine/quests.js';
import { SCENES, DEFAULT_SCENE } from './scene/registry.js';
import { PadDriver } from './engine/gamepad.js';

const q = new URLSearchParams(location.search);
quests(); // Reset replay once at entry, including the Nexus; go() carries the resulting save.
const canvas = document.getElementById('view');
const engine = new Engine(canvas, { maxPixelRatio: +(q.get('pr') || 1.5), samples: +(q.get('msaa') ?? 4) });
const pad = new PadDriver(engine); // native controller support for every scene (Xbox layout; ?padtest = scripted fake pad)
const sceneName = SCENES[q.get('scene')] ? q.get('scene') : DEFAULT_SCENE;
/** Leave this scene: fade to black, then load the next one, telling it where we came from. */
function go(scene, extra = {}) {
  const f = document.getElementById('fade') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'fade' });
  f.style.transition = 'opacity .6s ease'; f.classList.remove('off');
  const p = new URLSearchParams({ scene, from: sceneName, ...extra });
  for (const k of ['pr', 'msaa', 'nopost', 'padtest', 'concept']) if (q.has(k)) p.set(k, q.get(k));
  setTimeout(() => { location.search = p.toString(); }, 650);
}
const TITLES = { home: 'Atlas’s Cottage', /* cottage-inside */ 'gate-road': 'The Gate Road', nexus: 'The Nexus', plaza: 'The City', green: 'The Green', 'open-road': 'The Open Road' };
document.title = 'Atlas Veyr: ' + (TITLES[sceneName] || sceneName);
canvas.setAttribute('aria-label', 'Atlas Veyr, ' + (TITLES[sceneName] || sceneName));
const create = await SCENES[sceneName]();
const world = await create(engine, { time: q.get('time') || 'dusk', from: q.get('from') || null, go });
if (q.has('x') || q.has('z')) world.teleport(+(q.get('x') || 0), +(q.get('z') || 30), q.get('dir') || 'up');
if (q.has('nopost')) engine.post.enabled = false;

// warm up: compile every shader before the curtain lifts
engine.renderer.compile(engine.scene, engine.camera);
engine.step(1 / 60);
engine.start();
canvas.focus();

const card = document.getElementById('card'), fade = document.getElementById('fade');
if (q.has('nocard')) fade.remove(); else requestAnimationFrame(() => fade.classList.add('off'));
if (!q.has('nocard')) {
  setTimeout(() => card.classList.add('on'), 900);
  setTimeout(() => card.classList.remove('on'), 5200);
}

// test hooks for the headless check harness
window.__diorama = {
  engine, world, scene: sceneName, go, pad,
  stats: () => engine.stats(),
  setTime: (n) => world.setTime(n, true),
  teleport: (x, z, dir) => world.teleport(x, z, dir),
  /** Advance the simulation deterministically (n frames of dt), rendering each. */
  run: (n = 60, dt = 1 / 60) => { engine.paused = true; for (let i = 0; i < n; i++) engine.step(dt); },
  resume: () => { engine.paused = false; },
};
window.__ready = true;
