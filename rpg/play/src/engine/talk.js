// The dialogue system, reusable by every scene. No three.js in here (so node can test it): the scene hands in a
// project(x, y, z) -> {x, y, on} function and a hero position, and registers its talkable people.
//
//   const talk = createTalk({ input, project, hero: () => ({ x, z }) , onOpen, onClose });
//   talk.register({ id, name, pos: () => ({ x, y, z }), lines: () => ['...', '...'], onLine(i), onEnd(completed) });
//   each frame:  talk.update(dt, camera?)      talk.active  -> the scene freezes Atlas while true
//
// Play: walk near a person and a soft gold sparkle shows over them. A (Space / F / Enter / a click; the controller's A sends
// Space) opens the box and types the line quickly; A again finishes the line, then goes to the next; after the last line A
// closes. B (Escape) closes at once. The box is dark navy glass with a thin gold rule, Cinzel for the name, big plain text
// low on the screen, and a small Xbox-style "A" in its corner (the only hint).
//
// The pure parts (Dialogue, nearestTalkable, pickBark, BarkClock) never touch the DOM.

export const TALK_RANGE = 2.9;       // how close to talk
export const MARK_RANGE = 9;         // how close the sparkle starts to show

/** One conversation: a speaker, a list of lines, a typing cursor. */
export class Dialogue {
  constructor({ cps = 75 } = {}) { this.cps = cps; this.reset(); }
  reset() { this.speaker = null; this.lines = []; this.index = 0; this.shown = 0; this.open = false; this.t = 0; }
  get active() { return this.open; }
  get line() { return this.lines[this.index] ?? ''; }
  get complete() { return this.shown >= this.line.length; }
  get text() { return this.line.slice(0, Math.floor(this.shown)); }
  get last() { return this.index >= this.lines.length - 1; }
  start(speaker, lines) {
    const ls = (lines || []).filter((l) => typeof l === 'string' && l.length);
    if (!ls.length) return false;
    this.speaker = speaker; this.lines = ls; this.index = 0; this.shown = 0; this.open = true; this.t = 0;
    return true;
  }
  update(dt) {
    if (!this.open) return;
    this.t += dt;
    if (!this.complete) this.shown = Math.min(this.line.length, this.shown + dt * this.cps);
  }
  /** A pressed. 'none' | 'finish' (rest of the line shown) | 'next' | 'close'. */
  advance() {
    if (!this.open) return 'none';
    if (!this.complete) { this.shown = this.line.length; return 'finish'; }
    if (!this.last) { this.index++; this.shown = 0; return 'next'; }
    this.open = false; return 'close';
  }
  /** B pressed. */
  cancel() { if (!this.open) return false; this.open = false; return true; }
}

/** The nearest talkable within range of (hx, hz). people: [{ id, pos() -> {x, z} }]. */
export function nearestTalkable(people, hx, hz, range = TALK_RANGE) {
  let best = null, bd = range * range;
  for (const p of people) {
    const q = p.pos(); if (!q) continue;
    const d = (q.x - hx) ** 2 + (q.z - hz) ** 2;
    if (d <= bd) { bd = d; best = p; }
  }
  return best;
}

export const BARKS = [
  'Look how the light sits on the water.', 'The figs are good today.', 'Mind the doves, they have no manners.',
  'Is that the beacon? Brighter than yesterday.', 'Nothing to hurry for. Lovely.', 'I could listen to that fountain all day.',
  'Did you hear the lute earlier?', 'Another good day for the City.', 'Walk with me a little?', 'The bread smells wonderful.',
  'Off to the market, back by supper.', 'Careful, the little ones are racing again.', 'Someone left a lantern burning. Leave it.',
  'What an evening for the square.',
];
export function pickBark(rng, last = -1, pool = BARKS) {
  let i = Math.floor(rng() * pool.length); if (i === last) i = (i + 1) % pool.length;
  return [i, pool[i]];
}
/** Schedules ambient barks: one at a time, a few seconds apart. */
export class BarkClock {
  constructor(rng = Math.random, { min = 6, max = 10, life = 3.4 } = {}) { Object.assign(this, { rng, min, max, life }); this.wait = 3 + rng() * 3; this.left = 0; this.last = -1; }
  /** Returns true when a new bark should start now. */
  tick(dt, quiet = false) {
    if (this.left > 0) { this.left -= dt; return false; }
    if (quiet) return false;
    this.wait -= dt;
    if (this.wait > 0) return false;
    this.wait = this.min + this.rng() * (this.max - this.min); this.left = this.life; return true;
  }
}

// ---------------------------------------------------------------------------------------------- the view

const CSS = `
#talk { position: fixed; left: 50%; bottom: 4.2vh; transform: translate(-50%, 14px); width: min(1240px, 86vw); box-sizing: border-box;
  padding: 2.2vh 2.6vw 2.6vh; opacity: 0; pointer-events: none; z-index: 30; transition: opacity .22s ease, transform .22s ease;
  background: linear-gradient(180deg, rgba(15,22,50,.88), rgba(7,10,26,.93)); border: 1px solid rgba(212,176,106,.34);
  border-top: 1px solid rgba(241,220,170,.8); box-shadow: 0 14px 60px rgba(0,0,0,.55), 0 0 40px rgba(212,176,106,.08), inset 0 1px 0 rgba(255,236,190,.12);
  -webkit-backdrop-filter: blur(9px); backdrop-filter: blur(9px); color: #f6efe0; user-select: none; }
#talk.on { opacity: 1; transform: translate(-50%, 0); }
#talk .nm { font: 600 3.4vh/1 'Cinzel', 'Times New Roman', serif; letter-spacing: .2em; color: #f1dcaa; text-shadow: 0 0 14px rgba(212,176,106,.45); }
#talk .rule { height: 1px; margin: 1.3vh 0 1.6vh; background: linear-gradient(90deg, #d4b06a, rgba(212,176,106,.55) 55%, transparent); width: 46%; }
#talk .tx { font: 500 3.9vh/1.38 Georgia, 'Iowan Old Style', 'Times New Roman', serif; min-height: 2.84lh; padding-right: 5.2vh; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
#talk .tx i { font-style: normal; visibility: hidden; }
#talk .choices { display:flex; gap:1.4vw; font:500 3.9vh/1.38 Georgia,serif; }
#talk .choices:empty { display:none; }
#talk .choices > button { flex:1; display:flex; align-items:center; gap:1.3vw; min-height:8vh; padding:1.2vh 1.5vw; font:inherit; text-align:left; color:#c3c0b5; background:#101b30; border:2px solid #716342; border-radius:6px; opacity:.65; cursor:pointer; }
#talk .choices > .selected { opacity:1; color:#fff0cc; border-color:#f1dcaa; background:#3b3429; box-shadow:inset 0 0 16px #d4b06a22,0 0 12px #d4b06a33; }
#talk .choices .ab { position:static; flex-shrink:0; visibility:hidden; opacity:1; animation:none; }
#talk .choices .selected .ab { visibility:visible; opacity:1; animation:none; }
#talk.choosing > .ab { display:none; }
#talk .ab { position: absolute; right: 1.8vh; bottom: 1.6vh; width: 4.4vh; height: 4.4vh; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font: 700 2.5vh/1 'Cinzel', 'Times New Roman', serif; color: #1b1608; background: radial-gradient(circle at 35% 30%, #fff1c4, #d4b06a 70%); box-shadow: 0 0 0 2px rgba(7,10,26,.8), 0 0 14px rgba(241,220,170,.6); }
#talk .ab.rdy { animation: talkpulse 1.1s ease-in-out infinite; }
#talk .ab:not(.rdy) { opacity: .35; animation: none; }
@keyframes talkpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.14); } }
.tk-mark { position: fixed; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; pointer-events: none; z-index: 20; opacity: 0; will-change: transform, opacity;
  background: radial-gradient(circle, rgba(255,240,196,.95) 0 14%, rgba(241,220,170,.0) 15%), #f1dcaa;
  clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%); filter: drop-shadow(0 0 5px #d4b06a) drop-shadow(0 0 12px rgba(255,200,110,.8)); }
.tk-rise { position: fixed; left: 0; top: 0; width: 46px; height: 46px; margin: -23px 0 0 -23px; pointer-events: none; z-index: 21; opacity: 0; will-change: transform, opacity; }
.tk-rise svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 0 6px #f1c866) drop-shadow(0 0 16px rgba(255,190,90,.85)); }
.tk-bark { position: fixed; left: 0; top: 0; max-width: 24vw; padding: .9vh 1.2vw; transform: translate(-50%, -100%); pointer-events: none; z-index: 19; opacity: 0; transition: opacity .5s ease;
  font: 500 2.9vh/1.3 Georgia, 'Times New Roman', serif; color: #f4ecda; text-align: center; background: rgba(12,18,42,.78); border: 1px solid rgba(212,176,106,.4); border-radius: 12px;
  -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); text-shadow: 0 1px 2px rgba(0,0,0,.6); }
.tk-bark.on { opacity: 1; }
@media (prefers-reduced-motion: reduce) { #talk, .tk-bark { transition: none; } #talk .ab.rdy { animation: none; } }
`;

export function createTalk({ input, project, hero, onOpen, onClose, cps, barks = true, barkPool = null, rng = Math.random, root = (typeof document !== 'undefined' ? document.body : null) } = {}) {
  const people = [];
  const dlg = new Dialogue({ cps });
  let choices = [], selected = 0, giftIndex = 0, choosing = false, offered = false;
  let current = null, cooldown = 0, clicked = false;
  const dom = !!root && typeof document !== 'undefined';
  let box, nameEl, textEl, abEl, choiceEl, st;
  const marks = new Map();
  if (dom) {
    st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'talk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<div class="nm"></div><div class="rule"></div><div class="tx"></div><div class="choices"></div><div class="ab">A</div>';
    root.appendChild(box); choiceEl = box.querySelector('.choices');
    nameEl = box.querySelector('.nm'); textEl = box.querySelector('.tx'); abEl = box.querySelector('.ab');
    box.addEventListener('pointerdown', (e) => { e.stopPropagation(); const choice=e.target.closest('[data-choice]'); if(choice)selected=Number(choice.dataset.choice); clicked = true; });
    addEventListener('pointerdown', (e) => { if (e.button === 0 && (e.target?.id === 'view' || e.target?.id === 'talk' || box.contains(e.target))) clicked = true; });
  }
  const clock = new BarkClock(rng);
  let barkEl = null, barkWho = null;
  if (dom && barks) { barkEl = document.createElement('div'); barkEl.className = 'tk-bark'; root.appendChild(barkEl); }

  const setText = () => {
    if (!dom) return;
    const full = dlg.line, n = Math.floor(dlg.shown);
    textEl.replaceChildren();
    textEl.append(document.createTextNode(full.slice(0, n)));
    const rest = document.createElement('i'); rest.textContent = full.slice(n); textEl.append(rest);
    abEl.classList.toggle('rdy', dlg.complete);
    choiceEl.replaceChildren();
    box.classList.toggle('choosing', choosing);
    if (choosing) choices.forEach((c,i)=>{
      if(i!==giftIndex && i!==choices.length-1)return;
      const el=document.createElement('button');el.type='button';el.dataset.choice=i;el.className=i===selected?'selected':'';
      el.setAttribute('aria-pressed',String(i===selected));
      const glyph=document.createElement('span');glyph.className='ab';glyph.textContent='A';glyph.setAttribute('aria-hidden','true');
      el.append(glyph,document.createTextNode(c.label));choiceEl.appendChild(el);
    });
  };
  const open = (p) => {
    if (dlg.active) return false;
    p.onBefore && p.onBefore();   // e.g. friendship +1 for today, so the lines below already know the new level
    const lines = typeof p.lines === 'function' ? p.lines() : p.lines;
    if (!dlg.start(p, lines)) return false;
    choosing = false; offered = false; choices = [];
    current = p; p.onLine && p.onLine(0, dlg.line);
    if (dom) { nameEl.textContent = p.name || ''; box.classList.add('on'); setText(); }
    onOpen && onOpen(p);
    return true;
  };
  const close = (completed) => {
    const p = current; current = null; cooldown = 0.3; choosing = false; choices = [];
    if (dom) box.classList.remove('on');
    p && p.onEnd && p.onEnd(completed);
    onClose && onClose(p, completed);
  };
  const advance = () => {
    if (choosing) {
      const lines = choices[selected].choose(); choosing = false;
      if (lines?.length) { dlg.start(current, lines); setText(); return 'reaction'; }
      dlg.cancel(); close(true); setText(); return 'close';
    }
    if (dlg.active && dlg.complete && dlg.last && !offered) {
      offered = true; choices = current.choices?.() || [];
      if (choices.length) { choosing = true; selected = 0; giftIndex = 0; setText(); return 'choice'; }
    }
    const r = dlg.advance();
    if (r === 'next') { current.onLine && current.onLine(dlg.index, dlg.line); }
    if (r === 'close') close(true);
    setText();
    return r;
  };
  // friendship rising: a small gold heart-like glyph lifts off the person with a soft chime (nothing numeric on screen)
  const rises = [];
  const HEART = '<svg viewBox="0 0 32 32"><path d="M16 28 C6 20 3 14 3 10 C3 6 6 3.5 9.5 3.5 C12.5 3.5 14.8 5.2 16 7.6 C17.2 5.2 19.5 3.5 22.5 3.5 C26 3.5 29 6 29 10 C29 14 26 20 16 28 Z" fill="#f4cf74" stroke="#fff1c4" stroke-width="1.6"/>'
    + '<path d="M26 2 L27.2 5 L30 6 L27.2 7 L26 10 L24.8 7 L22 6 L24.8 5 Z" fill="#fff6d6"/></svg>';
  let actx = null;
  const chime = () => {
    try {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime;
      [[659.3, 0], [987.8, 0.13], [1318.5, 0.27]].forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(0.05, t0 + d + 0.03); g.gain.exponentialRampToValueAtTime(0.0008, t0 + d + 1.1);
        o.connect(g).connect(actx.destination); o.start(t0 + d); o.stop(t0 + d + 1.2);
      });
    } catch {}
  };
  let nearest = null;
  const api = {
    /** A friendship level just rose: lift the glyph over person `id` and chime. */
    rise(id, quiet = false) {
      const p = typeof id === 'string' ? people.find((q) => q.id === id) : id;
      if (!p) return false;
      api.risen++;
      if (!quiet) chime();
      if (dom) { const el = document.createElement('div'); el.className = 'tk-rise'; el.innerHTML = HEART; root.appendChild(el); rises.push({ p, el, t: 0 }); }
      return true;
    },
    risen: 0,
    dialogue: dlg,
    get active() { return dlg.active; },
    get choosing() { return choosing; },
    get choices() { return choices.map(c=>c.label); },
    get speaker() { return current; },
    get nearest() { return nearest; },
    register(p) { people.push(p); return p; },
    people,
    open: (id) => { const p = typeof id === 'string' ? people.find((q) => q.id === id) : id; return p ? open(p) : false; },
    close: (completed = false) => { if (dlg.active) { dlg.cancel(); close(completed); } },
    advance,
    /** Per frame. Call before the scene reads walk input, so `active` freezes Atlas this very frame. */
    update(dt) {
      cooldown = Math.max(0, cooldown - dt);
      for (let i = rises.length - 1; i >= 0; i--) {
        const r = rises[i]; r.t += dt; const k = r.t / 2.4, q = r.p.pos(), s = q && project ? project(q.x, (q.y || 0) + 2.6 + k * 1.5, q.z) : null;
        if (k >= 1 || !s) { r.el.remove(); rises.splice(i, 1); continue; }
        const a = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1, sc = 0.6 + Math.min(k * 5, 1) * 0.55 + Math.sin(k * 14) * 0.04;
        r.el.style.opacity = s.on ? String(a) : '0'; r.el.style.transform = `translate(${s.x + Math.sin(k * 7) * 6}px, ${s.y}px) scale(${sc})`;
      }
      const h = hero();
      const a = [input.consume('Space'), input.consume('KeyF'), input.consume('Enter')].some(Boolean) || clicked;
      const b = input.consume('Escape');
      clicked = false;
      if (dlg.active) {
        const left = [input.consume('ArrowLeft'),input.consume('KeyA')].some(Boolean);
        const right = [input.consume('ArrowRight'),input.consume('KeyD')].some(Boolean);
        const up = [input.consume('ArrowUp'),input.consume('KeyW')].some(Boolean);
        const down = [input.consume('ArrowDown'),input.consume('KeyS')].some(Boolean);
        if(choosing && (left || right)) selected = selected===choices.length-1 ? giftIndex : choices.length-1;
        if(choosing && (up || down)) { giftIndex=(giftIndex+(down?1:choices.length-2))%(choices.length-1); selected=giftIndex; }
        if (b) { dlg.cancel(); close(false); }
        else if (a) advance();
        dlg.update(dt);
        if (dlg.active) setText();
      } else {
        nearest = nearestTalkable(people.filter((p) => !p.disabled), h.x, h.z);
        if (a && nearest && cooldown === 0) open(nearest);
      }
      if (!dlg.active) nearest = nearest || null; else nearest = current;
      // sparkles over nearby people
      if (dom && project) {
        for (const p of people) {
          let el = marks.get(p.id);
          const q = p.pos();
          const d = q ? Math.hypot(q.x - h.x, q.z - h.z) : 99;
          const show = !dlg.active && q && d < MARK_RANGE && !p.disabled && p.marker !== false;
          if (!show) { if (el) el.style.opacity = '0'; continue; }
          if (!el) { el = document.createElement('div'); el.className = 'tk-mark'; root.appendChild(el); marks.set(p.id, el); }
          const s = project(q.x, (q.y || 0) + 2.55, q.z);
          if (!s.on) { el.style.opacity = '0'; continue; }
          const near = d < TALK_RANGE, tt = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
          const k = near ? 1 : 0.38 + 0.4 * Math.max(0, 1 - (d - TALK_RANGE) / (MARK_RANGE - TALK_RANGE));
          const bob = Math.sin(tt * 2.4 + (p.seed || 0)) * 4;
          el.style.opacity = String(k * (0.8 + 0.2 * Math.sin(tt * 3 + (p.seed || 0))));
          el.style.transform = `translate(${s.x}px, ${s.y + bob}px) scale(${near ? 1.15 : 0.8}) rotate(${Math.sin(tt) * 8}deg)`;
        }
      } else if (dom) for (const el of marks.values()) el.style.opacity = '0';
    },
    /** Ambient barks: candidates = [{ id, pos() -> {x, y, z} }] (people on screen). One bubble at a time. */
    barkUpdate(dt, candidates, h) {
      if (!barkEl || !project) return;
      if (barkWho) {
        const q = barkWho.pos(), s = q && project(q.x, (q.y || 0) + 2.6, q.z);
        if (!s || !s.on || dlg.active) { barkEl.classList.remove('on'); }
        else barkEl.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
      }
      const go = clock.tick(dt, dlg.active || !candidates.length);
      if (go) {
        const near = candidates.filter((c) => { const q = c.pos(); return q && Math.hypot(q.x - h.x, q.z - h.z) < 15; });
        if (!near.length) { clock.left = 0; clock.wait = 1.5; return; }
        barkWho = near[Math.floor(rng() * near.length)];
        const [i, line] = pickBark(rng, clock.last, barkPool ? barkPool() : BARKS); clock.last = i;
        barkEl.textContent = line; barkEl.classList.add('on');
      } else if (clock.left <= 0.5 && barkEl.classList.contains('on')) barkEl.classList.remove('on');
    },
  };
  return api;
}
