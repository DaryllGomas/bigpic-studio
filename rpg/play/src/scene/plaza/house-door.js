// THE HOUSE door: the seam between the diorama City and the House module (contract v1.1, see THE HOUSE/INTEGRATION.md).
// THE HOUSE pays Light into THE SYSTEM's one ledger (INTEGRATION.md v1.2). The server prices it by
// reason and caps it per day; event_id makes a replay harmless. Fails soft: the House plays on.
const LIGHT_EARN = 'https://system.bigpicsolutions.com/api/light/earn';
function forwardLight(e) {
  if (isWebConcept(BUILD)) return; // the web concept keeps Light local; no outside ledger calls
  fetch(LIGHT_EARN, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'house', reason: e.reason, event_id: e.event_id }) })
    .catch((err) => console.warn('[house] light not forwarded', err));
}
// Enter: fade to black -> pause the engine and our input -> a full-screen host over the canvas -> mountHouse(game mode).
// Leave (the House's door glyph or Esc): unmount -> remove the host -> unpause -> Atlas stands just outside -> fade back.
// Saves go through a localStorage adapter, one slot per House key under 'atlas.house.v1:'. Light events are logged for
// now; they will be forwarded to THE SYSTEM's ledger when its earn endpoint exists.

import { gear } from '../../engine/gear.js';
import { BUILD } from '../../build-config.js';
import { isWebConcept } from '../../checkpoint.js';

const KEY = 'atlas.house.v1:';
export const houseStore = {
  get: async (k) => JSON.parse(localStorage.getItem(KEY + k) ?? 'null'),
  set: async (k, v) => localStorage.setItem(KEY + k, JSON.stringify(v)),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class HouseDoor {
  /** onInside(): we are in (input frozen); onOutside(): put Atlas outside the door (before the fade back). */
  constructor({ engine, input, audio, onInside, onOutside }) {
    Object.assign(this, { engine, input, audio, onInside, onOutside });
    this.state = 'out'; this.host = null; this.handle = null; this.events = [];
  }
  _fade() {
    let f = document.getElementById('fade');
    if (!f) { f = document.createElement('div'); f.id = 'fade'; document.body.appendChild(f); }
    f.style.zIndex = '60';
    return f;
  }
  async _to(black, ms = 480) {
    const f = this._fade();
    f.style.transition = `opacity ${ms}ms ease`;
    if (black) f.classList.remove('off'); else f.classList.add('off');
    await wait(ms + 40);
  }
  _clearKeys() { if (this.input) { this.input.down.clear(); this.input.pressed.clear(); } }
  async enter() {
    if (this.state !== 'out') return;
    this.state = 'entering';
    this.onInside && this.onInside();
    this._clearKeys();
    this.audio && this.audio.duck(true);
    await this._to(true);
    this.engine.paused = true;
    const host = (this.host = document.createElement('div'));
    host.id = 'house-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:40;background:#04050a;overflow:hidden;';
    document.body.appendChild(host);
    try {
      const { mountHouse } = await import('../../../vendor/house/house.js');
      this.handle = await mountHouse(host, {
        mode: 'game',
        store: houseStore,
        track: false,
        onEvent: (e) => { this.events.push(e); if (e.type === 'light_earned') forwardLight(e); else if (e.type === 'relic_forged') gear().onRelicForged(e); },
        onExit: () => this.leave(),
      });
      try { gear().sync(this.handle.getRelics && this.handle.getRelics()); } catch {}
      this.state = 'in';
    } catch (err) {
      console.error('[house] mount failed', err);
      this.state = 'in';
      await this.leave();
      return;
    }
    await this._to(false, 520);
  }
  async leave() {
    if (this.state !== 'in') return;
    this.state = 'leaving';
    await this._to(true, 420);
    try { this.handle && this.handle.unmount(); } catch (err) { console.error('[house] unmount', err); }
    this.handle = null;
    if (this.host) { this.host.remove(); this.host = null; }
    this._clearKeys();
    this.onOutside && this.onOutside();
    this.engine.paused = false;
    this.audio && this.audio.duck(false);
    document.getElementById('view')?.focus();
    await this._to(false, 620);
    this.state = 'out';
  }
}
