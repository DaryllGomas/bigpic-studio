// Encounters, the mechanic only (the battle is designed elsewhere). A "stirring" (a slow grey shimmer, Sloth's weight) rises
// near Atlas on the open road or the in-between and drifts toward him. Pure logic, no three.js, no DOM: node can test it.
//   - Only on the open road and the wild ground either side of it. Never in the City, the Green, the lane between them.
//   - THE RUN RULE: at STEP_LINE (3,000) steps today Atlas can always step away from a meeting (walk off and it dissolves).
//     Under the line a meeting engages. Steps come from the System; if it cannot be reached steps are 0 (fail soft).
export const STEP_LINE = 3000;
export const ENCOUNTER_SCENES = Object.freeze(['open-road']);          // the registry names where meetings may happen
export const ENCOUNTER_ZONES = Object.freeze(['road', 'in-between']);   // not 'bridge' (Sloth waits there), not anywhere else
export const FACE_URL = 'https://system.bigpicsolutions.com/api/face';

/** Pull today's steps out of whatever shape the System answers with. Anything unusable is 0. */
export function parseSteps(j) {
  const pick = (o) => {
    if (!o || typeof o !== 'object') return undefined;
    for (const k of ['steps', 'steps_today', 'stepsToday', 'step_count', 'stepCount']) if (k in o) return o[k];
    return undefined;
  };
  let v = pick(j);
  if (v === undefined && j && typeof j === 'object') for (const k of ['today', 'face', 'data', 'stats']) { v = pick(j[k]); if (v !== undefined) break; }
  if (v && typeof v === 'object') v = v.today ?? v.count ?? v.value;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
/** GET the System's face and return today's steps. Never throws, never hangs past timeoutMs; 0 on any failure. */
export async function fetchSteps(fetchFn = globalThis.fetch, { url = FACE_URL, timeoutMs = 3500 } = {}) {
  try {
    if (typeof fetchFn !== 'function') return 0;
    let timer; const t = new Promise((r) => { timer = setTimeout(() => r(null), timeoutMs); });
    const run = (async () => { const res = await fetchFn(url, { cache: 'no-store' }); if (!res || res.ok === false) return null; return parseSteps(await res.json()); })();
    const out = await Promise.race([run.catch(() => null), t]); clearTimeout(timer);
    return out || 0;
  } catch { return 0; }
}
export const canDecline = (steps) => Number.isFinite(steps) && steps >= STEP_LINE;
/** The spawn rule: where a meeting may begin. */
export const canSpawn = (scene, zone) => ENCOUNTER_SCENES.includes(scene) && ENCOUNTER_ZONES.includes(zone);

const TUNE = {
  firstGrace: 9, minGap: 16, maxGap: 34, after: 26,   // seconds: before the first, between, after one resolves
  spawnMin: 20, spawnMax: 30,                          // metres from Atlas
  speedDecl: 1.3, speedFight: 1.7,                     // drift speed (m/s); Atlas walks 5.2, runs 10.5
  contact: 1.7, escape: 5.5, grace: 2.4, lose: 70, life: 75,
};

export class Encounters {
  /** opts: scene, rng () => [0,1), steps, place(x, z) => bool (is the ground walkable), tune overrides */
  constructor({ scene = 'open-road', rng = Math.random, steps = 0, place = () => true, tune = {} } = {}) {
    this.scene = scene; this.rng = rng; this.steps = steps; this.place = place; this.T = { ...TUNE, ...tune };
    this.stirrings = []; this.nextId = 1; this.busy = false;
    this.timer = this.T.firstGrace; this.meeting = null;
  }
  setSteps(n) { this.steps = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
  get declinable() { return canDecline(this.steps); }
  /** Advance. hero {x, z}; zone from the scene ('road'|'in-between'|'bridge'|other). Returns events:
   *  {type:'spawn'|'met'|'declined'|'engage'|'lost', ...}. 'engage' = go to the battle card. */
  update(dt, hero, zone) {
    const ev = [];
    if (this.busy) return ev;
    const allowed = canSpawn(this.scene, zone);
    if (!this.meeting) {
      this.timer -= dt;
      if (this.timer <= 0 && allowed && this.stirrings.length === 0) {
        const s = this._spawn(hero);
        if (s) ev.push({ type: 'spawn', id: s.id, x: s.x, z: s.z });
        this.timer = this.T.minGap + this.rng() * (this.T.maxGap - this.T.minGap);
      } else if (this.timer <= 0 && !allowed) this.timer = 1;
    }
    const speed = this.declinable ? this.T.speedDecl : this.T.speedFight;
    for (const s of this.stirrings) {
      s.age += dt;
      const dx = hero.x - s.x, dz = hero.z - s.z, d = Math.hypot(dx, dz);
      if (!this.meeting) {
        if (d > 0.01) { const k = Math.min(d, speed * dt) / d; const nx = s.x + dx * k, nz = s.z + dz * k; if (this.place(nx, nz)) { s.x = nx; s.z = nz; } else { s.x += dx * 0.2 * dt / Math.max(d, 1); } }
        if (d <= this.T.contact && allowed) {
          if (this.declinable) { this.meeting = { id: s.id, t: this.T.grace }; ev.push({ type: 'met', id: s.id, declinable: true }); }
          else { ev.push({ type: 'engage', id: s.id, steps: this.steps, declinable: false }); this._end(s, this.T.after); }
        } else if (s.age > this.T.life || d > this.T.lose) { s.dead = true; ev.push({ type: 'lost', id: s.id }); }
      } else if (this.meeting.id === s.id) {
        // the grace: walking off dissolves it; staying lets it close
        if (d >= this.T.escape) { ev.push({ type: 'declined', id: s.id }); this._end(s, this.T.after); this.meeting = null; }
        else { this.meeting.t -= dt; if (this.meeting.t <= 0) { ev.push({ type: 'engage', id: s.id, steps: this.steps, declinable: true }); this._end(s, this.T.after); this.meeting = null; } }
      }
    }
    this.stirrings = this.stirrings.filter((s) => !s.dead);
    return ev;
  }
  _end(s, wait) { s.dead = true; this.timer = wait; }
  _spawn(hero) {
    for (let i = 0; i < 8; i++) {
      const a = this.rng() * Math.PI * 2, r = this.T.spawnMin + this.rng() * (this.T.spawnMax - this.T.spawnMin);
      const x = hero.x + Math.cos(a) * r, z = hero.z + Math.sin(a) * r;
      if (!this.place(x, z)) continue;
      const s = { id: this.nextId++, x, z, age: 0, dead: false }; this.stirrings.push(s); return s;
    }
    return null;
  }
  /** Place a stirring by hand (tests, the scene's first-look shot). */
  spawnAt(x, z) { const s = { id: this.nextId++, x, z, age: 0, dead: false }; this.stirrings.push(s); return s; }
  /** Called by the scene while the battle card is up / returning. */
  hold(on) { this.busy = on; }
}
