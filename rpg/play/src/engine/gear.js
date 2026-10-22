// Atlas's gear: relics forged in THE HOUSE (INTEGRATION.md v1.3), one per slot. Relics are tools and cosmetics only:
// never Light, never a combat edge. The newest relic per slot is worn unless the player chose another.
// Reads the House store key, listens to relic_forged, persists to 'atlas.gear.v1'. Never throws on bad data.
export const SLOTS = ['HEAD', 'GAUNTLET', 'SIGIL RING', 'CLOAK CLASP', 'LANTERN', 'CLOAK', 'FIELD DEVICE'];
export const HOUSE_RELICS_KEY = 'atlas.house.v1:paper-arena:v0:relics';
export const GEAR_KEY = 'atlas.gear.v1';
export const AURAS = { gold: [1.0, 0.78, 0.3], signal: [0.35, 0.9, 1.0], moon: [0.72, 0.8, 1.0], harmonic: [0.95, 0.55, 1.0] };

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** One raw entry -> a clean relic, or null. */
export function cleanRelic(r) {
  if (!r || typeof r !== 'object' || !isStr(r.id) || !isStr(r.slot)) return null;
  const slot = r.slot.toUpperCase();
  if (!SLOTS.includes(slot)) return null;
  const t = Date.parse(r.forged_at);
  return { id: r.id, name: isStr(r.name) ? r.name : r.id, slot, forged_at: Number.isFinite(t) ? new Date(t).toISOString() : null,
    rank: isStr(r.rank) ? r.rank : '', grants: isStr(r.grants) ? r.grants : '' };
}
/** Anything -> clean relic[] (deduped by id, the later entry wins). */
export function parseRelics(raw) {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(raw)) return [];
  const m = new Map();
  for (const e of raw) { const r = cleanRelic(e); if (r) m.set(r.id, r); }
  return [...m.values()];
}
const ts = (r) => (r.forged_at ? Date.parse(r.forged_at) : -Infinity);

export class Gear {
  /** storage: a localStorage-like {getItem,setItem} (optional; pass null to go memory-only). */
  constructor(storage = null) {
    this.storage = storage; this.relics = []; this.chosen = {}; this.listeners = new Set();
    this.load();
  }
  _read(key) { try { return this.storage ? this.storage.getItem(key) : null; } catch { return null; } }
  /** Own saved state first, then the House store (the House is the source of relics). */
  load() {
    let own = null; try { own = JSON.parse(this._read(GEAR_KEY)); } catch {}
    if (!own || typeof own !== 'object') own = {};
    this.chosen = {};
    if (own.chosen && typeof own.chosen === 'object') for (const s of SLOTS) if (isStr(own.chosen[s])) this.chosen[s] = own.chosen[s];
    this._merge(parseRelics(own.relics)); this._merge(parseRelics(this._read(HOUSE_RELICS_KEY)));
    this._emit();
    return this;
  }
  _merge(list) { const m = new Map(this.relics.map((r) => [r.id, r])); for (const r of list) m.set(r.id, r); this.relics = [...m.values()]; }
  save() { try { this.storage && this.storage.setItem(GEAR_KEY, JSON.stringify({ relics: this.relics, chosen: this.chosen })); } catch {} }
  /** The relic_forged event path (also takes a handle.getRelics() array via sync). */
  onRelicForged(e) {
    const r = cleanRelic(e);
    if (!r) return false;
    this._merge([r]); this.save(); this._emit();
    return true;
  }
  sync(list) { this._merge(parseRelics(list)); this.save(); this._emit(); }
  /** Player choice for a slot (null clears back to newest). Unknown ids are ignored. */
  choose(slot, id) {
    if (!SLOTS.includes(slot)) return false;
    if (id == null) delete this.chosen[slot];
    else if (this.relics.some((r) => r.id === id && r.slot === slot)) this.chosen[slot] = id;
    else return false;
    this.save(); this._emit(); return true;
  }
  /** slot -> relic worn. */
  equipped() {
    const out = {};
    for (const s of SLOTS) {
      const here = this.relics.filter((r) => r.slot === s);
      if (!here.length) continue;
      out[s] = here.find((r) => r.id === this.chosen[s]) || here.reduce((a, b) => (ts(b) >= ts(a) ? b : a));
    }
    return out;
  }
  has(id) { return Object.values(this.equipped()).some((r) => r.id === id); }
  /** Worn auras, newest first (names in AURAS). */
  auras() {
    const worn = Object.values(this.equipped()).sort((a, b) => ts(b) - ts(a));
    const out = [];
    for (const r of worn) { const m = /^aura\s+(\w+)/i.exec(r.grants); const a = m && m[1].toLowerCase(); if (a in AURAS && !out.includes(a)) out.push(a); }
    return out;
  }
  aura() { return this.auras()[0] || null; }
  /** Total rearm slots granted by worn relics (for the field device). */
  rearmSlots() { let n = 0; for (const r of Object.values(this.equipped())) { const m = /rearm_slots\s*\+(\d+)/i.exec(r.grants); if (m) n += +m[1]; } return n; }
  hasLantern() { return !!this.equipped().LANTERN; }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _emit() { for (const f of this.listeners) { try { f(this); } catch {} } }
}

let shared = null;
/** The shared instance, backed by the browser's localStorage when there is one. */
export function gear() {
  if (!shared) { let st = null; try { st = typeof localStorage !== 'undefined' ? localStorage : null; } catch {} shared = new Gear(st); }
  return shared;
}
/** Test hook. */
export function _resetGear() { shared = null; }
