// THE JUNCTION · the aisle's sound (2026-10-16). Uses THE PATH's chip-sound modules, unchanged, from the same place the aisle
// already takes its cabinet engine: ./cabinet/sound/ (Chip, GameSound, the palettes).
//
//   * The cabinet you are PLAYING makes its sound: Starvector its own palette (zaps, engine, music); the other 25 a generic
//     palette built from the engine's eight cues (Coin Start Hit Miss Die Win Bonus Tick), each game in its own key.
//   * Cabinets you only walk past stay SILENT (their attract screens never reach the chip).
//   * The room: a soft tick as the aisle slides, a whoosh between rows and when you walk up / step back, a quiet hum.
//   * Starts with no click: at once when the browser already allows audio (the TV launch), else on the first key, click, touch or
//     controller button (navigator.getGamepads() is polled: a pad press is not a DOM event). M mutes.
//   * Quiet by design: the chip's own default volume (what the SEVEN pages use); the room sounds sit well under the games.
//   * If any of this fails to load, the aisle runs on in silence (index.html wraps the import).
//
// API (index.html): const AS = await createAisleSound(); AS.tick(); AS.whoosh(); AS.enter(runner); AS.leave();
//                   AS.frame(runner, dt, wonValue); AS.room(inAisle, dt)
const BASE = new URL('./cabinet/sound/', import.meta.url).href;
const { Chip, GameSound, PALETTES, hz, penta } = await import(BASE + 'index.js');
const { cabinetVoice } = await import(BASE + 'palettes/cabinet.js');

// ------------------------------------------------------------------ the generic cabinet palette (one per game: its own key)
const KEYS = ['D4', 'A3', 'E4', 'G3', 'B3', 'F#4', 'C4', 'Bb3', 'F4'];
const hashId = (id) => { let h = 2166136261; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return h >>> 0; };
const GENERIC = new Map();
function genericPalette(id) {
  let P = GENERIC.get(id); if (P) return P;
  const R = hz(KEYS[hashId(id) % KEYS.length]);
  P = {
    id: 'junction.' + id, title: id, root: R, generic: true, mix: 0,
    sounds: {
      ...cabinetVoice(R),
      hit: {
        label: 'A hit', group: 'play', desc: 'a short bright blip, a pentatonic step up the longer you keep hitting',
        layers: [
          { wave: 'pulse', duty: 0.25, f: R * 2, env: { a: 0.001, d: 0.07, v: 0.085 }, lp: 3400 },
          { wave: 'tri', f: R, env: { a: 0.001, d: 0.06, v: 0.1 } },
        ], max: 3, gap: 0.045, vary: { pitch: 25, level: 0.1, time: 0.004 },
      },
      miss: {
        label: 'A miss', group: 'play', desc: 'a dull little drop',
        layers: [
          { wave: 'tri', f: R, sweep: { to: 0.55, t: 0.14 }, env: { a: 0.002, d: 0.16, v: 0.11 } },
          { wave: 'noise', f: 1400, lp: { f: 900, to: 300, t: 0.12 }, env: { a: 0.002, d: 0.1, v: 0.04 } },
        ], max: 2, gap: 0.08,
      },
      win: {
        label: 'Cleared', group: 'end', desc: 'a rising major arpeggio and a held root',
        layers: [
          { wave: 'pulse', duty: 0.25, f: R * 2, arp: { n: [0, 4, 7, 12, 16, 19], step: 0.085 }, env: { a: 0.003, d: 0.08, s: 0.6, h: 0.5, r: 0.5, v: 0.09 }, lp: 3400 },
          { wave: 'tri', f: R, env: { a: 0.01, d: 1.2, v: 0.17 } },
          { wave: 'tri', f: R * 1.5, at: 0.2, env: { a: 0.01, d: 1.0, v: 0.08 } },
        ], max: 1, gap: 2,
      },
      bonus: {
        label: 'A bonus', group: 'play', desc: 'a quick sparkle up',
        layers: [{ wave: 'pulse', duty: 0.125, f: R * 4, arp: { n: [0, 7, 12, 19], step: 0.05 }, env: { a: 0.002, d: 0.05, s: 0.5, h: 0.12, r: 0.2, v: 0.06 }, lp: 4200 }],
        max: 1, gap: 0.2,
      },
      tick: {
        label: 'A tick', group: 'play', desc: 'a faint clock tick (a timer running)',
        layers: [{ wave: 'pulse', duty: 0.5, f: R * 8, env: { a: 0.001, d: 0.02, v: 0.03 }, lp: 2600 }],
        max: 1, gap: 0.2,
      },
    },
    cues: {
      Coin: (s) => s.play('coin'),
      Start: (s) => { if (!s.st.went) { s.st.went = true; s.play('start'); } },
      Hit: (s) => { const n = s.now(); s.st.combo = n - (s.st.lastHit || -9) < 0.9 ? Math.min(7, (s.st.combo || 0) + 1) : 0; s.st.lastHit = n; s.play('hit', { pitch: penta(s.st.combo) }); },
      Miss: (s) => s.play('miss'),
      Die: (s) => s.play('lifeLost'),
      Win: (s) => s.play('win'),
      Bonus: (s) => s.play('bonus'),
      Tick: (s) => s.play('tick'),
    },
    events: { out: (s) => s.play('die'), clear: null },     // the round's end, sent by the adapter below
    silent: {},
  };
  GENERIC.set(id, P); return P;
}

// ------------------------------------------------------------------ the room
const D = hz('D4');
const ROOM = {
  id: 'junction.room', title: 'THE JUNCTION', root: D, mix: 0,
  sounds: {
    tick: {
      label: 'Between cabinets', group: 'room', desc: 'a soft wooden tick as the aisle slides one cabinet',
      layers: [{ wave: 'tri', f: hz('D5'), env: { a: 0.001, d: 0.045, v: 0.05 } }, { wave: 'noise', f: 3000, lp: 1800, env: { a: 0.001, d: 0.012, v: 0.022 } }],
      max: 2, gap: 0.05, vary: { pitch: 90, level: 0.15, time: 0.003 },
    },
    whoosh: {
      label: 'A whoosh', group: 'room', desc: 'air moving: a row change, walking up, stepping back',
      layers: [{ wave: 'noise', f: 900, lp: { f: 500, to: 3200, t: 0.18 }, env: { a: 0.08, d: 0.3, v: 0.07 } },
        { wave: 'tri', f: hz('D3'), sweep: { to: 2, t: 0.3 }, env: { a: 0.06, d: 0.3, v: 0.03 } }],
      max: 1, gap: 0.25,
    },
    hum: {
      loop: true, label: 'The room', group: 'loop', drive: 'present (1 in the aisle, 0 while you play)', db: -4, attack: 2.5, release: 1.2, glide: 0.5,
      desc: 'a very quiet low room tone',
      layers: [
        { wave: 'tri', f: hz('D2'), level: [0.0, 0.028] },
        { wave: 'pulse', duty: 0.5, f: hz('A2'), lp: [300, 420], level: [0.0, 0.007] },
        { wave: 'noise', f: [220, 260], lp: [260, 340], level: [0.0, 0.006] },
      ],
    },
  },
  cues: {}, events: {}, silent: {},
};

// ------------------------------------------------------------------ the aisle's sound
export async function createAisleSound() {
  const api = { chip: null, room: null, gs: null, muted: false, ready: false, notes: 0 };
  let vol = 0.8, lastWhoosh = -9, lastRound = null, lastPhase = 'attract';

  function make() {
    if (api.chip) return;
    const chip = Chip.live();
    api.chip = chip; api.room = new GameSound(chip, ROOM);
    chip.volume = api.muted ? 0 : vol;
    api.ready = true;
    api.room.drive('hum', 1);
  }

  // start: at once when the browser allows audio (the TV launch), else on the first key / click / touch / controller button.
  // Browsers that can say (getAutoplayPolicy) are asked; the rest are tried: a blocked context just stays suspended (one console
  // warning) and the first key / click / touch / pad press resumes it.
  const policy = navigator.getAutoplayPolicy ? navigator.getAutoplayPolicy('audiocontext') : null;
  if (policy === 'allowed' || policy === null) make();
  {
    let padWatch = 0;
    const go = (e) => {
      if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'CapsLock', 'Tab', 'Fn', 'OS'].includes(e.key)) return;
      if (!api.chip) make(); else if (api.chip.ctx.state !== 'running') api.chip.ctx.resume();
      if (api.chip && api.chip.ctx.state === 'running') {
        clearInterval(padWatch);
        for (const t of ['pointerdown', 'keydown', 'touchend']) removeEventListener(t, go, true);
      }
    };
    for (const t of ['pointerdown', 'keydown', 'touchend']) addEventListener(t, go, true);
    padWatch = setInterval(() => {      // a controller press is no DOM event: poll
      if (api.chip && api.chip.ctx.state === 'running') { clearInterval(padWatch); return; }
      for (const p of (navigator.getGamepads ? navigator.getGamepads() : [])) {
        if (p && p.buttons.some((b, i) => i !== 16 && b.pressed)) { go({ type: 'gamepad' }); return; }
      }
    }, 100);
  }
  // a context the browser left suspended (a tab that lost focus) comes back on the next key / pad press
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && !e.repeat && !e.target.matches?.('input')) {
      api.muted = !api.muted; if (api.chip) api.chip.volume = api.muted ? 0 : vol;
    }
    if (api.chip && api.chip.ctx.state === 'suspended') api.chip.ctx.resume();
  });

  const nowS = () => performance.now() / 1000;
  api.tick = () => {
    if (!api.room || nowS() - lastWhoosh < 0.5) return;       // a row change slides many cabinets: one whoosh, no tick rattle
    api.room.play('tick');
  };
  api.whoosh = () => { if (!api.room) return; lastWhoosh = nowS(); api.room.play('whoosh'); };

  // the cabinet being played: its palette on a GameSound of its own; the adapter is what GameSound reads
  let gs = null, adapter = null, runnerNow = null;
  api.enter = (runner) => {
    api.whoosh();
    runnerNow = runner; gs = null; lastRound = null; lastPhase = runner.phase;
    const id = runner.cabinetId.replace(/^junction_/, '');
    adapter = {
      id, pending: [],
      get mode() { return runner.phase === 'playing' ? 'play' : 'attract'; },
      get sim() { return runner.sim; },
      get events() {
        const out = [];
        for (const name of runner.cues) out.push({ kind: 'cue', name });
        const s = runner.sim;
        if (s && 'recordEvents' in s) { s.recordEvents = true; out.push(...s.events.splice(0)); }   // Starvector's own events
        out.push(...this.pending.splice(0));
        return out;
      },
    };
  };
  api.leave = () => {
    if (gs) gs.stopAll(0.5);
    gs = null; adapter = null; runnerNow = null;
    api.whoosh();
  };
  api.frame = (runner, dt, WON) => {
    if (!api.chip || !adapter || runner !== runnerNow) return;
    if (!gs) gs = new GameSound(api.chip, PALETTES[adapter.id] || genericPalette(adapter.id));
    api.gs = gs;
    // a generic game's round ends: tell the palette, the way a sim's 'out' event does for Starvector
    if (runner.phase !== lastPhase) {
      if (runner.phase === 'over' && !PALETTES[adapter.id] && runner.sim) adapter.pending.push({ kind: runner.sim.result === WON ? 'clear' : 'out' });
      lastPhase = runner.phase;
    }
    gs.frame(adapter, Math.min(Math.max(+dt || 0, 0), 0.1));
  };
  // the room's tone: present in the aisle, away while a game plays
  api.hum = (inAisle) => { if (api.room) api.room.drive('hum', inAisle ? 1 : 0); };
  api.counts = () => ({ game: gs ? Object.fromEntries(gs.counts) : {}, room: api.room ? Object.fromEntries(api.room.counts) : {}, missing: gs ? Object.fromEntries(gs.missing) : {}, played: api.chip ? api.chip.stats.played : 0 });
  return api;
}
