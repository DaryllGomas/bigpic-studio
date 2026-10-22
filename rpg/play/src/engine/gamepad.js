import { Journal } from './journal.js'; // JOURNAL integration
// Native gamepad support for the whole game (Xbox layout, "standard" mapping). THE JUNCTION couch standard, 2026-10-16.
//
// One module, two uses:
//   - PadDriver  (every diorama scene, installed from main.js): reads the active pad every step and turns it into the same
//                keyboard events the scenes already listen for, so walking, interacting, turning the view and the House
//                run the exact code the keyboard runs. Menus (the pause card, the House overlay) get focus navigation.
//   - readPad / padEdges / installFakePad / flagNative  (the battle page, src/battle/input.js, has its own event loop).
//
//   Left stick / D-pad   walk (and move the focus in a menu)
//   A                    do / talk / light / confirm (Space)
//   B                    back / cancel (Escape; closes a menu)
//   X (hold)             run (Shift)      Left-stick click: run too
//   Right stick L/R      turn the view (Q / E)            Y: time of day (T)
//   Start                pause / menu
//   Optional duplicates, never needed:  RT = A,  LB/RB = turn the view
//   Never read: button 16 (Xbox / Guide). It belongs to the TV.
//
// Tests: `?padtest` replaces navigator.getGamepads with window.__fakePad (see installFakePad); window.__padSet(...) drives it.

export const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, GUIDE: 16 };
const NBTN = 16; // 0..15 only: 16 is never looked at

/** A scripted pad for tests: `?padtest` replaces navigator.getGamepads with window.__fakePad. */
export function installFakePad() {
  if (!new URLSearchParams(location.search).has('padtest') || window.__fakePad) return;
  const fake = {
    id: 'padtest (Xbox 360 Controller)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), hapticActuators: [],
  };
  window.__fakePad = fake;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
  /** __padSet({ buttons: ['A','START'] | [0,9], axes: [lx, ly, rx, ry] }): replace the whole pad state (omitted = released / centred). */
  window.__padSet = ({ buttons = [], axes = [0, 0, 0, 0] } = {}) => {
    const want = new Set(buttons.map((b) => (typeof b === 'string' ? B[b.toUpperCase()] : b)));
    fake.buttons.forEach((b, i) => { b.pressed = b.touched = want.has(i); b.value = b.pressed ? 1 : 0; });
    fake.axes = [axes[0] || 0, axes[1] || 0, axes[2] || 0, axes[3] || 0];
  };
}

/** True once a pad has been seen: tells the TV launcher the game handles the controller itself. */
export function flagNative() {
  if (window.__nativeGamepad) return;
  window.__nativeGamepad = true;
  document.documentElement.dataset.nativeGamepad = '1';
  window.dispatchEvent(new CustomEvent('nativegamepad'));
}

/** The pad in use: reads every connected pad and prefers whichever is being touched, else the first. */
export function readPad() {
  try {
    const pads = [...(navigator.getGamepads?.() ?? [])].filter((p) => p && p.connected);
    if (!pads.length) return null;
    const busy = (p) => p.buttons.slice(0, NBTN).some((b) => b && b.pressed) || p.axes.slice(0, 4).some((a) => Math.abs(a) > 0.3);
    return pads.find(busy) ?? pads[0];
  } catch { return null; }
}

/** Plain snapshot of the pad (buttons 0..15 only) plus the four stick axes. */
export function snapshot(pad) {
  const buttons = [];
  for (let i = 0; i < NBTN; i++) buttons[i] = !!pad.buttons[i]?.pressed;
  return { buttons, axes: Array.from(pad.axes).slice(0, 4).map((a) => a || 0) };
}

const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true }));

const CSS = `
body.pad-on { cursor: none; }
.pad-focus { outline: 4px solid #ffd986 !important; outline-offset: 4px; box-shadow: 0 0 26px rgba(255,217,134,.65) !important; }
#pad-pause { position: fixed; inset: 0; z-index: 100; display: none; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 50%, rgba(8,10,22,.72), rgba(3,4,10,.9)); font-family: 'Cinzel', 'Times New Roman', serif; color: #f1dcaa; }
#pad-pause.on { display: flex; }
#pad-pause .box { min-width: 520px; max-width: 78vw; padding: 52px 70px 56px; text-align: center; border: 2px solid rgba(212,176,106,.6);
  background: linear-gradient(180deg, rgba(16,18,38,.92), rgba(8,9,20,.92)); box-shadow: 0 0 80px rgba(212,176,106,.18); }
#pad-pause h1 { margin: 0 0 8px; font: 600 40px/1 'Cinzel', 'Times New Roman', serif; letter-spacing: .34em; padding-left: .34em; text-shadow: 0 0 18px rgba(212,176,106,.5); }
#pad-pause .rule { width: 220px; height: 1px; margin: 16px auto 30px; background: linear-gradient(90deg, transparent, #d4b06a 40%, #d4b06a 60%, transparent); }
#pad-pause button { display: block; width: 100%; margin: 14px 0; padding: 18px 24px; font: 600 30px/1 'Cinzel', 'Times New Roman', serif; letter-spacing: .22em;
  color: #f1dcaa; background: rgba(212,176,106,.08); border: 1px solid rgba(212,176,106,.45); cursor: pointer; }
#pad-pause .map { display: none; text-align: left; font: 500 28px/1.55 'Cinzel', 'Times New Roman', serif; letter-spacing: .08em; }
#pad-pause .map b { display: inline-block; min-width: 5.6em; color: #ffd986; }
#pad-pause.controls .map { display: block; }
#pad-pause.controls .list { display: none; }
`;

export class PadDriver {
  /** engine: the diorama Engine (its .paused is flipped by the pause card). */
  constructor(engine) {
    this.engine = engine;
    this.prev = []; this.held = new Set(); this.active = false; this.seen = false;
    this.navCool = 0; this.navLast = null; this.turnLatch = 0; this.pausedByPad = false;
    installFakePad();
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.build();
    // JOURNAL: shared pause ownership and keyboard menu navigation.
    this.journal = new Journal(this);
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const root = this.menuRoot();
      if (e.code === 'KeyJ' && (!root || root === this.pauseEl)) { e.preventDefault(); e.stopImmediatePropagation(); this.journal.show(); return; }
      if (e.code === 'Escape' && !document.getElementById('concept-card') && (this.pauseOpen || (!document.getElementById('house-host') && !window.__diorama?.world?.talk?.active && (!window.__diorama?.world?.fishing || window.__diorama.world.fishing.state === 'idle')))) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (this.journal.open) this.journal.close(); else if (this.pauseEl.classList.contains('controls')) this.pauseEl.querySelector('[data-act=back]').click(); else this.setPause(!this.pauseOpen);
        return;
      }
      if (!root || ![this.pauseEl,this.journal.el].includes(root)) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','KeyF'].includes(e.code)) {
        e.preventDefault();e.stopImmediatePropagation();
        if (this.journal.open && ['ArrowLeft','ArrowRight'].includes(e.code) && document.activeElement?.matches('[data-tab]')) this.journal.select(this.journal.tab+(e.code==='ArrowLeft'?-1:1));
        else if (['Space','Enter','KeyF'].includes(e.code)) document.activeElement?.click();
        else {const items=this.focusables(root);this.focus(this.neighbour(document.activeElement,items,e.code.slice(5).toLowerCase())||items[0]);}
      }
    }, true);
    window.addEventListener('gamepadconnected', flagNative);
    // The mouse moving hands the screen back to the mouse; any pad input takes it again.
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') this.setActive(false); }, true);
    // A pad always has a frame loop while the engine is paused (pause card, the House, a held test frame).
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.1, Math.max(0, (now - (this.last ?? now)) / 1000)); this.last = now;
      if (this.engine.paused) this.update(dt);
    };
    requestAnimationFrame(loop);
    engine.systems.unshift({ update: (dt) => this.update(dt) }); // first in every simulation step
  }

  build() {
    const el = (this.pauseEl = document.createElement('div'));
    el.id = 'pad-pause'; el.setAttribute('data-pad-menu', '');
    el.innerHTML = `<div class="box"><h1>PAUSED</h1><div class="rule"></div>
      <div class="list"><button data-act="resume" class="first">RESUME</button><button data-act="journal">JOURNAL</button><button data-act="controls">CONTROLS</button></div>
      <div class="map"><div><b>STICK</b> walk</div><div><b>A</b> do, light, talk</div><div><b>B</b> back</div><div><b>X</b> hold to run</div>
        <div><b>R-STICK</b> turn the view</div><div><b>START</b> pause</div>
        <button data-act="back" style="margin-top:30px">BACK</button></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'resume') this.setPause(false);
      else if (a === 'journal') this.journal.show();
      else if (a === 'controls') { el.classList.add('controls'); this.focus(el.querySelector('[data-act=back]')); }
      else if (a === 'back') { el.classList.remove('controls'); this.focus(el.querySelector('[data-act=resume]')); }
    });
  }

  get pauseOpen() { return this.pauseEl.classList.contains('on'); }

  setPause(on) {
    if (on === this.pauseOpen) return;
    this.releaseAll();
    window.__diorama?.world?.input?.down.clear(); // JOURNAL/pause: no held movement leaks through
    window.__diorama?.world?.input?.pressed.clear();
    this.pauseEl.classList.toggle('on', on);
    this.pauseEl.classList.remove('controls');
    if (on) { this.pausedByPad = !this.engine.paused; this.engine.paused = true; this.focus(this.pauseEl.querySelector('[data-act=resume]')); }
    else { if (this.pausedByPad) this.engine.paused = false; this.pausedByPad = false; this.clearFocus(); document.getElementById('view')?.focus(); }
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on; document.body.classList.toggle('pad-on', on);
    if (!on) this.clearFocus();
  }

  /** The full-screen thing the pad is steering, if any: the pause card, or the House overlay. */
  menuRoot() {
    if (this.journal?.open) return this.journal.el; // JOURNAL
    if (this.pauseOpen) return this.pauseEl;
    const h = document.getElementById('house-host') || document.getElementById('concept-card');
    if (h) return h;
    return null;
  }

  press(code) { key('keydown', code); key('keyup', code); }
  hold(code, on) {
    if (on && !this.held.has(code)) { this.held.add(code); key('keydown', code); }
    else if (!on && this.held.has(code)) { this.held.delete(code); key('keyup', code); }
  }
  releaseAll() { for (const c of [...this.held]) this.hold(c, false); }

  update(dt) {
    // The battle document owns the physical pad, including Start and all face buttons.
    if(document.getElementById('beat-host')){this.releaseAll();const p=readPad();if(p)this.prev=snapshot(p).buttons;return;}
    this.journal.observe(); // JOURNAL: remember Greenfolk conversations without scene edits
    const pad = readPad();
    if (!pad) { this.releaseAll(); if (this.seen) { this.seen = false; this.setActive(false); } return; }
    this.seen = true; flagNative();
    const s = snapshot(pad);
    const edge = (i) => s.buttons[i] && !this.prev[i];
    const [lx, ly, rx] = s.axes;
    if (s.buttons.some((b, i) => b && !this.prev[i]) || Math.hypot(lx, ly) > 0.4) this.setActive(true);
    const menu = this.menuRoot();
    if (menu) { this.releaseAll(); if (this.active) this.menuFrame(menu, s, edge, dt, lx, ly); }
    else this.playFrame(s, edge, lx, ly, rx);
    this.prev = s.buttons;
  }

  // ------------------------------------------------------------------ play: pad -> the keys the scenes read

  playFrame(s, edge, lx, ly, rx) {
    const b = s.buttons;
    const dir = (neg, pos, v) => { // stick with hysteresis, so a drifting stick never flickers
      const was = this.held.has(neg) || this.held.has(pos);
      const on = Math.abs(v) > (was ? 0.3 : 0.45);
      this.hold(neg, on && v < 0); this.hold(pos, on && v > 0);
    };
    const dx = (b[B.RIGHT] ? 1 : 0) - (b[B.LEFT] ? 1 : 0), dy = (b[B.DOWN] ? 1 : 0) - (b[B.UP] ? 1 : 0);
    if (dx || dy) { this.hold('ArrowLeft', dx < 0); this.hold('ArrowRight', dx > 0); this.hold('ArrowUp', dy < 0); this.hold('ArrowDown', dy > 0); }
    else { dir('ArrowLeft', 'ArrowRight', lx); dir('ArrowUp', 'ArrowDown', ly); }
    this.hold('Space', b[B.A] || b[B.RT]);
    this.hold('ShiftLeft', b[B.X] || b[B.LS]);
    // turn the view: a flick of the right stick (or the optional bumpers)
    if (edge(B.LB)) this.press('KeyQ');
    if (edge(B.RB)) this.press('KeyE');
    if (Math.abs(rx) < 0.3) this.turnLatch = 0;
    else if (!this.turnLatch && Math.abs(rx) > 0.65) { this.turnLatch = Math.sign(rx); this.press(rx < 0 ? 'KeyQ' : 'KeyE'); }
    if (edge(B.Y)) this.press('KeyT');
    if (edge(B.B)) this.press('Escape');
    if (edge(B.START)) this.setPause(true);
  }

  // ------------------------------------------------------------------ menus: focus navigation

  menuFrame(root, s, edge, dt, lx, ly) {
    // JOURNAL: bumpers turn pages; B returns to the existing pause card.
    if (root === this.journal.el) {
      if (edge(B.B) || edge(B.START)) { this.journal.close(); return; }
      if (edge(B.LB) || edge(B.RB)) { this.journal.select(this.journal.tab + (edge(B.LB) ? -1 : 1)); return; }
      if ((edge(B.LEFT) || edge(B.RIGHT) || (Math.abs(lx) > .55 && !this.journalStick)) && document.activeElement?.matches('[data-tab]')) {
        this.journal.select(this.journal.tab + (s.buttons[B.LEFT] || lx < -.55 ? -1 : 1)); this.journalStick = true; return;
      }
      if (Math.abs(lx) < .3) this.journalStick = false;
    }
    this.navCool = Math.max(0, this.navCool - dt);
    const b = s.buttons;
    let dir = null;
    if (b[B.UP] || ly < -0.55) dir = 'up'; else if (b[B.DOWN] || ly > 0.55) dir = 'down';
    else if (b[B.LEFT] || lx < -0.55) dir = 'left'; else if (b[B.RIGHT] || lx > 0.55) dir = 'right';
    const items = this.focusables(root);
    let cur = items.find((e) => e === document.activeElement && e.classList.contains('pad-focus')) ?? null;
    if (!cur) { cur = items.find((e) => e.classList.contains('first')) ?? items[0] ?? null; this.focus(cur); }
    if (dir && cur && (this.navLast !== dir || this.navCool === 0)) {
      this.navCool = this.navLast === dir ? 0.14 : 0.32;
      const next = this.neighbour(cur, items, dir);
      if (next) this.focus(next);
    }
    this.navLast = dir;
    if ((edge(B.A) || edge(B.RT)) && cur) { cur.click(); this.navLast = null; }
    if (edge(B.B) || edge(B.START)) {
      if (root === this.pauseEl) { if (root.classList.contains('controls')) root.querySelector('[data-act=back]').click(); else this.setPause(false); }
      else this.press('Escape'); // the House listens for it
    }
  }

  focusables(root) {
    const out = [];
    root.querySelectorAll('button, a[href], select, [tabindex], [role=button], input[type=range], input[type=checkbox]').forEach((e) => {
      if (e.disabled || e.getAttribute('tabindex') === '-1') return;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      for (let p = e; p && p !== root.parentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05 || cs.pointerEvents === 'none') return;
      }
      out.push(e);
    });
    return out;
  }

  neighbour(cur, items, dir) {
    const c = cur.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    let best = null, bestScore = Infinity;
    for (const e of items) {
      if (e === cur) continue;
      const r = e.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      const along = dir === 'up' ? -dy : dir === 'down' ? dy : dir === 'left' ? -dx : dx;
      const across = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
      if (along <= 2) continue;
      const score = along + across * 2.2;
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  focus(e) { this.clearFocus(); if (!e) return; e.classList.add('pad-focus'); e.focus({ preventScroll: true }); }
  clearFocus() { document.querySelectorAll('.pad-focus').forEach((e) => e.classList.remove('pad-focus')); }
}
