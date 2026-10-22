// THE FIRST WORLD -> the RPG: the Legacy record (contract: Studio/Atlas Veyr/THE FIRST WORLD/HANDOFF TO THE RPG.md, AGREED v1).
// CANON ruling 10: one City for everyone. The legacy only adds personal touches that only that player sees.
// Everything here fails soft: missing or invalid = null, never a throw. No DOM/global access at import time (node-testable).
export const KIND = 'atlas.first-world.legacy';
export const STORAGE_KEY = 'save.legacy';
export const PULSE = 'https://pulse.bigpicsolutions.com';
export const VILLAGES = ['Ashford', 'Brambleholt', 'Stonemere'];
const STAGES = ['totem', 'stone_circle', 'pyramid', 'temple', 'nexus'];
const LOOKS = ['good', 'neutral', 'evil'];

const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const num = (x, lo, hi, d) => { const n = typeof x === 'number' && Number.isFinite(x) ? x : d; return Math.min(hi, Math.max(lo, n)); };
const str = (x, d = null, max = 120) => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : d);

/** Validate + normalize a record. Returns a clean v1 record, or null. Unknown extra fields are dropped (additive minors are fine). */
export function validateLegacy(raw) {
  try {
    if (typeof raw === 'string') raw = JSON.parse(raw);
    if (isObj(raw) && !raw.kind && isObj(raw.legacy)) raw = raw.legacy;   // a whole save object
    if (!isObj(raw) || raw.kind !== KIND) return null;
    if (!Number.isInteger(raw.v) || raw.v !== 1) return null;             // a major bump needs a reader update
    const w = isObj(raw.world) ? raw.world : {};
    const g = isObj(raw.golem) ? raw.golem : null;
    const h = g && isObj(g.habits) ? g.habits : {};
    const bal = isObj(raw.balance) ? raw.balance : {};
    const marks = isObj(raw.marks) ? raw.marks : {};
    return {
      kind: KIND, v: 1,
      completedAt: str(raw.completedAt, null, 40),
      world: { godName: str(w.godName, null, 40), islandName: str(w.islandName, null, 60), peopleName: str(w.peopleName, null, 60), seed: Number.isFinite(w.seed) ? w.seed : 0 },
      villages: (Array.isArray(raw.villages) ? raw.villages : []).filter((x) => isObj(x) && VILLAGES.includes(x.name))
        .map((x) => ({ name: x.name, joined: x.joined === true, stagesReached: (Array.isArray(x.stagesReached) ? x.stagesReached : []).filter((s) => STAGES.includes(s)) })),
      balance: { final: num(bal.final, 0, 1, 0.5), lowest: num(bal.lowest, 0, 1, 0.5) },
      alignment: num(raw.alignment, -1, 1, 0),
      golem: g ? {
        name: str(g.name, null, 40), alignment: num(g.alignment, -1, 1, 0), size: num(g.size, 0, 1, 0.5),
        look: LOOKS.includes(g.look) ? g.look : 'neutral',
        habits: Object.fromEntries(['eatsFoodPiles', 'eatsCrops', 'eatsVillagers', 'eatsRocks', 'throwsRocks'].map((k) => [k, num(h[k], -1, 1, 0)])),
      } : null,
      people: (Array.isArray(raw.people) ? raw.people : []).filter((p) => isObj(p) && str(p.name)).slice(0, 24)
        .map((p) => ({ name: str(p.name), village: VILLAGES.includes(p.village) ? p.village : null, role: str(p.role, 'elder', 40), story: str(p.story, null, 240) })),
      marks: { worstAct: str(marks.worstAct, null, 240), bestAct: str(marks.bestAct, null, 240) },
      vexahl: { outcome: str(isObj(raw.vexahl) ? raw.vexahl.outcome : null, 'reintegrated', 40) },
    };
  } catch { return null; }
}

function b64json(s) {
  const t = String(s).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');   // url-safe tolerant
  const bin = typeof atob === 'function' ? atob(t) : Buffer.from(t, 'base64').toString('binary');
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** ?legacy=<base64 json> dev override (also accepts raw JSON). */
export function legacyFromOverride(search) {
  try {
    const v = new URLSearchParams(search || '').get('legacy');
    if (!v) return null;
    return validateLegacy(v.trim().startsWith('{') ? v : b64json(v));
  } catch { return null; }
}

/** localStorage `save.legacy` (same origin as THE FIRST WORLD on studio.bigpicsolutions.com). */
export function legacyFromStorage(storage) {
  try { const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null); return s ? validateLegacy(s.getItem(STORAGE_KEY)) : null; } catch { return null; }
}

/** Pulse fallback: GET /v1/island?code=… -> {name, save, updated_at}; the record is save.legacy. Fails soft (null). */
export async function legacyFromPulse(code, { fetchFn, base = PULSE, timeoutMs = 4000 } = {}) {
  let timer;
  try {
    const f = fetchFn ?? (typeof fetch === 'function' ? fetch : null);
    if (!f || !str(code, null, 64)) return null;
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    if (ctl) timer = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await f(`${base}/v1/island?code=${encodeURIComponent(code.trim())}`, { signal: ctl?.signal, headers: { accept: 'application/json' } });
    if (!res || !res.ok) return null;
    const body = await res.json();
    return validateLegacy(typeof body?.save === 'string' ? JSON.parse(body.save) : body?.save);
  } catch { return null; } finally { if (timer) clearTimeout(timer); }
}

let cached; // undefined = not looked yet
/** Synchronous read (override, then storage). Cached for the page; scenes call this. */
export function getLegacy({ search, storage, refresh = false } = {}) {
  if (cached !== undefined && !refresh) return cached;
  cached = legacyFromOverride(search ?? (typeof location !== 'undefined' ? location.search : '')) || legacyFromStorage(storage) || null;
  return cached;
}
/** Async: sync sources first, then Pulse if the URL carries ?code=… (or one is passed). */
export async function loadLegacy({ search, storage, code, fetchFn } = {}) {
  const sync = getLegacy({ search, storage, refresh: true });
  if (sync) return sync;
  try {
    const c = code ?? new URLSearchParams(search ?? (typeof location !== 'undefined' ? location.search : '')).get('code');
    const r = c ? await legacyFromPulse(c, { fetchFn }) : null;
    if (r) cached = r;
    return r;
  } catch { return null; }
}
export function _resetLegacyCache() { cached = undefined; }

/** How Ora greets: balance colours the tone (never the City). Rare voice, never instructs. `text` is for future VO/captions, not drawn. */
export function oraGreeting(legacy) {
  if (!legacy) return null;
  const b = legacy.balance.final;
  const tone = b >= 0.66 ? 'bright' : b >= 0.33 ? 'steady' : 'tender';
  const text = { bright: 'You remember the island. It remembers you.', steady: 'The island is here, in you.', tender: 'The island held on. So did you.' }[tone];
  return { tone, id: `ora.greet.${tone}`, text, godName: legacy.world.godName };
}

/** Villages the player's people reached: remembered (a glow), never rebuilt. */
export function rememberedVillages(legacy) { return legacy ? legacy.villages.filter((v) => v.joined).map((v) => v.name) : []; }
/** Elders: the villagers they saved, to appear in the City as elders (art does not exist yet). */
export function elders(legacy) { return legacy ? legacy.people.slice() : []; }
/** Ora's halo leans a little toward this per tone (a 0.18 lerp: felt, not noticed). */
export const ORA_TONE_TINT = { bright: '#ffe9b8', steady: '#9fdcff', tender: '#7fa8ff' };
