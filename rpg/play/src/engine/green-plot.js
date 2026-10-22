// Your plot in the Green: a small grid of soil tiles, a seed per tile, and growth by REAL elapsed time. Pure state (no
// three.js, no DOM): storage is injected, so node can test it. Persisted at localStorage 'atlas.green.v1'.
//   { v: 1, plots: { "c,r": { t: <planted at, ms>, k: <crop kind 0..N-1> } }, saved: <ms> }
// It grows while you are away: the stage is a pure function of (now - planted), never of frames played.
export const GREEN_KEY = 'atlas.green.v1';
export const QUESTS_KEY = 'atlas.quests.v1';
export const COLS = 6, ROWS = 5, TILE = 1.5;          // the plot: 6 x 5 tiles of 1.5 m
export const KINDS = 4;                                // wheat, greens, tomatoes, flowers (art lives in the scene)
const MIN = 60e3, HOUR = 3600e3;
/** Elapsed time at which each stage begins: 0 sprout, 1 leafy, 2 budding, 3 grown (tomorrow it is all grown). */
export const STAGE_AT = [0, 10 * MIN, 2 * HOUR, 8 * HOUR];
export const STAGES = STAGE_AT.length;

export function stageFor(elapsedMs) {
  let s = 0;
  for (let i = 1; i < STAGES; i++) if (elapsedMs >= STAGE_AT[i]) s = i;
  return s;
}

const isInt = (n) => Number.isInteger(n);

export class GreenPlot {
  constructor(storage = null, now = () => Date.now(), { fastgrow = false } = {}) {
    this.storage = storage; this.now = now;
    this.plots = new Map(); this.fastgrow = fastgrow; this.firstPlanted = false;
    this._load();
  }
  _load() {
    let raw = null;
    try { raw = this.storage && this.storage.getItem(GREEN_KEY); } catch { raw = null; }
    if (!raw) return;
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (!d || typeof d !== 'object' || !d.plots || typeof d.plots !== 'object') return;
    this.firstPlanted = !!d.firstPlanted || Object.keys(d.plots).length > 0;
    const t0 = this.now();
    for (const [key, v] of Object.entries(d.plots)) {
      const m = /^(\d+),(\d+)$/.exec(key);
      if (!m || !v || typeof v !== 'object') continue;
      const c = +m[1], r = +m[2];
      if (c >= COLS || r >= ROWS) continue;
      let t = +v.t; if (!Number.isFinite(t)) continue;
      if (t > t0) t = t0;                              // a clock that went backwards never plants in the future
      const k = isInt(v.k) && v.k >= 0 && v.k < KINDS ? v.k : (c + r) % KINDS;
      this.plots.set(key, { t, k, fast: v.fast === true });
    }
  }
  _save() {
    if (!this.storage) return false;
    const plots = {}; for (const [k, v] of this.plots) plots[k] = v;
    try { this.storage.setItem(GREEN_KEY, JSON.stringify({ v: 1, plots, firstPlanted: this.firstPlanted, saved: this.now() })); return true; } catch { return false; }
  }
  inBounds(c, r) { return isInt(c) && isInt(r) && c >= 0 && r >= 0 && c < COLS && r < ROWS; }
  has(c, r) { return this.plots.has(c + ',' + r); }
  get count() { return this.plots.size; }
  /** Plant one seed. false if out of bounds or the tile is already planted. */
  plant(c, r, kind) {
    if (!this.inBounds(c, r) || this.has(c, r)) return false;
    const k = isInt(kind) && kind >= 0 && kind < KINDS ? kind : (this.count + c) % KINDS;
    this.plots.set(c + ',' + r, { t: this.now(), k, fast: this.fastgrow && !this.firstPlanted });
    this.firstPlanted = true;
    this._save();
    return true;
  }
  /** Growth stage 0..3 of a planted tile, or -1 when empty. */
  stage(c, r) {
    const p = this.plots.get(c + ',' + r);
    return p ? stageFor(Math.max(0, this.now() - p.t) * (p.fast ? 240 : 1)) : -1;
  }
  harvest(c, r) {
    if (this.stage(c, r) !== 3) return null;
    const kind = this.kind(c, r); this.plots.delete(c + ',' + r); this._save(); return kind;
  }
  kind(c, r) { const p = this.plots.get(c + ',' + r); return p ? p.k : -1; }
  /** Every planted tile as { c, r, stage, kind }. */
  planted() {
    const out = [];
    for (const [key, p] of this.plots) {
      const [c, r] = key.split(',').map(Number);
      out.push({ c, r, stage: stageFor(Math.max(0, this.now() - p.t) * (p.fast ? 240 : 1)), kind: p.k });
    }
    return out;
  }
}

/** Plot-local metres (x along columns, z along rows, origin at the plot's centre) -> tile, or null outside the soil. */
export function tileAt(lx, lz) {
  const c = Math.floor(lx / TILE + COLS / 2), r = Math.floor(lz / TILE + ROWS / 2);
  return c >= 0 && r >= 0 && c < COLS && r < ROWS ? { c, r } : null;
}
/** Centre of a tile in plot-local metres. */
export function tileCentre(c, r) { return { x: (c + 0.5 - COLS / 2) * TILE, z: (r + 0.5 - ROWS / 2) * TILE }; }

/** Has the first deed been done? Reads 'atlas.quests.v1' loosely (the quest lane owns the exact shape). */
export function firstDeedDone(storage) {
  try {
    const q = JSON.parse(storage.getItem(QUESTS_KEY));
    if (!q || typeof q !== 'object') return false;
    return !!(q.firstDeed || q.first_deed || q.firstDeedDone || (q.flags && (q.flags.firstDeed || q.flags.first_deed)) || (q.done && (q.done.firstDeed || q.done.first_deed)));
  } catch { return false; }
}
