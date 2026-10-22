// Minimal readable HUD. All DOM.
const $ = (t, c, p, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; if (p) p.appendChild(e); return e; };
export const TYPE = { force: { ic: '◆', col: '#d8d2c4', name: 'FORCE' }, light: { ic: '✦', col: '#9fd8ff', name: 'LIGHT' }, echo: { ic: '◎', col: '#e6b8ff', name: 'ECHO' }, balm: { ic: '✚', col: '#8cffb0', name: 'BALM' } };

export class UI {
  constructor(root, trained) {
    this.root = root; this.trained = trained; this.nums = [];
    // Atlas plate
    const a = this.aP = $('div', 'plate atlas', root);
    $('div', 'nm', a, 'ATLAS <span>+ ORA</span>'); const hb = $('div', 'bar hp', a); this.aHp = $('i', '', hb); this.aHpT = $('b', '', hb);
    this.boostRow = $('div', 'boost', a); this.pips = [];
    this.trainedTag = trained ? $('div', 'trained', a, 'TRAINED TODAY · +1 BOOST CAP') : null;
    // Sloth plate
    const s = this.sP = $('div', 'plate sloth', root);
    $('div', 'nm', s, 'SLOTH <span>the first force</span>'); const sb = $('div', 'bar hp', s); this.sHp = $('i', '', sb); this.sHpT = $('b', '', sb);
    this.shRow = $('div', 'shield', s); this.shards = []; for (let i = 0; i < 6; i++) this.shards.push($('span', 'sh', this.shRow, '◆'));
    this.weakRow = $('div', 'weak', s); this.weakIcons = {};
    for (const k of ['force', 'light', 'echo']) { const w = $('span', 'wk', this.weakRow, TYPE[k].ic); w.style.setProperty('--c', TYPE[k].col); w.title = TYPE[k].name; this.weakIcons[k] = w; }
    // strip
    this.strip = $('div', 'strip', root); this.stripEls = new Map();
    // menu
    this.menu = $('div', 'menu', root); this.menu.style.display = 'none';
    // banner + ring + cue
    this.banner = $('div', 'banner', root); this.cue = $('div', 'cue', root);
    this.ringO = $('div', 'pring o', root); this.ringI = $('div', 'pring i', root); this.ringO.style.display = this.ringI.style.display = 'none';
    this.flash = $('div', 'whiteflash', root); this.sub = $('div', 'subtitle', root);
  }
  setBoostCap(cap) { this.pips.forEach(p => p.remove()); this.pips = []; for (let i = 0; i < cap; i++) this.pips.push($('span', 'pip', this.boostRow)); this.cap = cap; }
  setBoost(have, pend = 0) { this.pips.forEach((p, i) => { p.className = 'pip' + (i < have ? ' on' : '') + (i < have && i >= have - pend ? ' spend' : ''); }); }
  setHp(side, hp, max) { const el = side === 'a' ? this.aHp : this.sHp, t = side === 'a' ? this.aHpT : this.sHpT; el.style.width = (100 * Math.max(0, hp) / max) + '%'; t.textContent = Math.max(0, Math.ceil(hp)); }
  setShield(n, broken) { this.shards.forEach((s, i) => s.classList.toggle('gone', i >= n)); this.shRow.classList.toggle('broken', !!broken); this.sP.classList.toggle('broken', !!broken); }
  flashWeak(k) { const w = this.weakIcons[k]; if (!w) return; w.classList.remove('hit'); void w.offsetWidth; w.classList.add('hit'); }
  setWeak(weak) { for (const k in this.weakIcons) this.weakIcons[k].classList.toggle('lit', weak.includes(k)); }
  // turn strip: entries {id, who, stun, tag}
  setStrip(q) {
    const seen = new Set();
    q.slice(0, 6).forEach((e, i) => {
      seen.add(e.id); let el = this.stripEls.get(e.id);
      if (!el) { el = $('div', 'tk ' + (e.who === 'A' ? 'a' : 's'), this.strip, e.who === 'A' ? 'A' : 'S'); el.style.left = (i * 54 + 60) + 'px'; el.style.opacity = 0; this.stripEls.set(e.id, el); requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = 1; })); }
      el.style.left = (i * 54) + 'px'; el.classList.toggle('now', i === 0); el.classList.toggle('stun', !!e.stun); el.classList.toggle('slowed', !!e.slowed); el.style.opacity = 1; el.style.transform = i === 0 ? 'scale(1.25)' : 'scale(1)'; el.firstChild && (el.dataset.lbl = e.stun ? '❄' : e.who === 'A' ? 'A' : 'S');
      el.textContent = e.stun ? '❄' : (e.lesser ? 's' : e.who === 'A' ? 'A' : 'S');
    });
    for (const [id, el] of this.stripEls) if (!seen.has(id)) { el.style.opacity = 0; el.style.top = '-18px'; setTimeout(() => el.remove(), 400); this.stripEls.delete(id); }
  }
  showMenu(items, sel, boostHave, pend) {
    this.menu.style.display = 'block'; this.menu.innerHTML = '';
    items.forEach((it, i) => {
      const r = $('div', 'row' + (i === sel ? ' sel' : '') + (it.dim ? ' dim' : ''), this.menu); r.dataset.i = i;
      const t = TYPE[it.type]; $('span', 'ic', r, t.ic).style.color = t.col; $('span', 'lb', r, it.label); if (it.sub) $('span', 'sb', r, it.sub);
      if (it.weak) $('span', 'wkm', r, '▲');
      if (i === sel && it.boostable) $('span', 'bst', r, pend ? '◀ +' + pend + ' ▶' : '◀ ▶');
    });
  }
  hideMenu() { this.menu.style.display = 'none'; }
  say(text, cls = '', ms = 1100) { const b = this.banner; b.textContent = text; b.className = 'banner show ' + cls; clearTimeout(this._bt); this._bt = setTimeout(() => b.className = 'banner', ms); }
  subtitle(t, ms = 2200) { this.sub.textContent = t; this.sub.classList.add('on'); clearTimeout(this._st); this._st = setTimeout(() => this.sub.classList.remove('on'), ms); }
  cueShow(t) { this.cue.textContent = t; this.cue.classList.add('on'); }
  cueHide() { this.cue.classList.remove('on'); }
  ring(x, y, k, drag) {
    const base = Math.max(54, innerHeight * .1), o = this.ringO, i = this.ringI;
    o.style.display = i.style.display = 'block'; const so = base * (1 + 2.4 * k);
    o.style.width = o.style.height = so + 'px'; o.style.left = x + 'px'; o.style.top = y + 'px'; i.style.width = i.style.height = base + 'px'; i.style.left = x + 'px'; i.style.top = y + 'px';
    o.classList.toggle('drag', !!drag); i.classList.toggle('drag', !!drag);
    o.style.opacity = Math.min(1, (1 - k) * 3 + .35);
  }
  ringBeat() { const i = this.ringI; i.classList.remove('beat'); void i.offsetWidth; i.classList.add('beat'); }
  ringOff() { this.ringO.style.display = this.ringI.style.display = 'none'; }
  ringResult(cls) { const i = this.ringI; i.classList.add(cls); setTimeout(() => i.classList.remove(cls), 350); }
  pop(text, x, y, cls = '') {
    const e = $('div', 'dmg ' + cls, this.root, text); e.style.left = x + 'px'; e.style.top = y + 'px'; setTimeout(() => e.remove(), 1100);
  }
  whiteFlash(a = 1) { this.flash.style.transition = 'none'; this.flash.style.opacity = a; void this.flash.offsetWidth; this.flash.style.transition = 'opacity .22s ease-out'; this.flash.style.opacity = 0; }
}
