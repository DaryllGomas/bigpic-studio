// Seconds; carried forward from the Opus battle test. Positive delta = early.
export const DEFAULTS = Object.freeze({ bpm: 60, latency: .03, perfectEarly: .10, perfectLate: .08, goodEarly: .30, goodLate: .16, lockout: .28, grip: 1050, damage: 14, strike: 12 });
export const PHRASES = Object.freeze({ YAAA: 'RISE', XXAA: 'LIGHT', BYAX: 'BALANCE' });
export function parryGrade(delta, c = DEFAULTS) {
  if (delta <= c.perfectEarly && delta >= -c.perfectLate) return 'perfect';
  if (delta <= c.goodEarly && delta >= -c.goodLate) return 'good';
  return 'miss';
}
export function noteScore(delta) { return Math.abs(delta) <= .10 ? 1.5 : Math.abs(delta) <= .22 ? 1.2 : 1; }
export class Jam {
  constructor(config = {}) { this.c = { ...DEFAULTS, ...config }; this.reset(); }
  reset() {
    this.time = 0; this.hp = 72; this.grip = this.c.grip; this.shell = 6; this.kindle = 0;
    this.calls = 0; this.breaks = 0; this.last = ''; this.seen = new Set(); this.events = []; this.history = [];
    this.paused = false; this.begin('ready');
  }
  get beat() { return 60 / this.c.bpm; }
  event(type, data = {}) { const e = { type, time: this.time, ...data }; this.events.push(e); this.history.push(e); }
  begin(phase) {
    this.phase = phase; this.start = this.time; this.notes = []; this.grades = []; this.parried = false; this.hit = false; this.lockUntil = -1; this.tick = -1;
    if (phase === 'call') this.calls++;
    this.late = phase === 'call' && this.calls % 3 === 0;
    this.duration = (phase === 'ready' ? 0 : phase === 'silence' ? 1 : phase === 'call' && this.late ? 5 : 4) * this.beat;
    if (phase === 'answer') { this.kindled = this.kindle >= 4; if (this.kindled) this.kindle = 0; }
    if (phase === 'solo') this.kindled = false;
    this.event('phase', { phase });
  }
  targets() {
    if (this.phase === 'call') return [this.start + .5*this.beat, this.start + 1.5*this.beat, this.contact];
    const count = this.phase === 'solo' ? 8 : 4, step = this.beat * (count === 8 ? .5 : 1);
    return Array.from({ length: count }, (_, i) => this.start + (i + .5) * step);
  }
  get contact() { return this.start + (this.late ? 3.5 : 2.5) * this.beat; }
  press(button) {
    if (button === 'START') { if (this.phase !== 'ready' && this.phase !== 'win') { this.paused = !this.paused; this.event('pause', { paused: this.paused }); } return; }
    if (this.paused) return;
    if (this.phase === 'ready' || this.phase === 'win') { if (button === 'A') { this.reset(); this.begin('call'); } return; }
    if (this.phase === 'call') {
      if (button !== 'A' || this.parried || this.hit || this.time < this.lockUntil) return;
      const delta = this.contact - (this.time - this.c.latency), grade = parryGrade(delta, this.c);
      if (grade === 'miss') { this.lockUntil = this.time + this.c.lockout; this.event('early'); return; }
      this.parried = true; this.parry = grade;
      if (grade === 'perfect') this.shell = Math.max(0, this.shell - 1);
      this.event('parry', { grade }); return;
    }
    if (!['answer','solo','duet'].includes(this.phase) || !'AXYB'.includes(button)) return;
    const targets = this.targets();
    const idx = Math.round((this.time - this.start) / (this.beat * (this.phase === 'solo' ? .5 : 1)) - .5);
    const i = Math.max(0, Math.min(targets.length - 1, idx));
    if (this.notes[i]) return; // one edge per slot; no held-button/mash reward
    this.notes[i] = button; this.grades[i] = noteScore(this.time - this.c.latency - targets[i]);
    this.event('note', { button, index: i, score: this.grades[i] });
  }
  update(dt) {
    if (this.paused || ['ready','win'].includes(this.phase)) return;
    // Split at a fine resolution so scripted stepping uses exactly the live rules.
    let remaining = dt;
    while (remaining > 1e-8) {
      const step = Math.min(remaining, .01); this.time += step; remaining -= step;
      const b = Math.floor((this.time - this.start) / this.beat);
      if (b > this.tick && this.phase !== 'silence') { this.tick = b; this.event('beat', { index: b }); }
      if (this.phase === 'call' && !this.hit && this.time >= this.contact + this.c.goodLate + this.c.latency) {
        this.hit = true; const grade = this.parried ? this.parry : 'miss';
        if (grade !== 'perfect') this.hp -= this.c.damage * (this.late ? 1.5 : 1) * (grade === 'good' ? .5 : 1);
        if (this.hp <= 0) { this.hp = 36; this.kindle = Math.min(4, this.kindle + 1); this.event('bent'); }
        this.event('contact', { grade });
      }
      if (this.time + 1e-8 >= this.start + this.duration) this.finish();
    }
  }
  finish() {
    if (this.phase === 'call') { this.begin('answer'); return; }
    if (this.phase === 'silence') { this.begin('solo'); return; }
    if (this.phase === 'duet') {
      this.bonus = this.notes.filter((n,i) => n === 'YAXA'[i]).length === 4;
      this.event('duet', { bonus: this.bonus }); this.begin('win'); return;
    }
    if (this.phase === 'answer' || this.phase === 'solo') {
      this.resolve();
      if (this.grip <= 0) this.begin('duet');
      else if (this.phase === 'answer' && this.shell === 0) { this.breaks++; this.event('break'); this.begin('silence'); }
      else { if (this.phase === 'solo') this.shell = 6; this.begin('call'); }
    }
  }
  resolve() {
    const solo = this.phase === 'solo', count = solo ? 8 : 4;
    const notes = Array.from({ length: count }, (_, i) => this.notes[i] || '-'), key = notes.join('');
    const repeat = !solo && key === this.last, spark = !solo && !repeat && !this.seen.has(key) && !key.includes('-');
    const name = solo ? '' : PHRASES[key] || '';
    const mult = (repeat ? .5 : spark ? 1.25 : 1) * (solo ? 1.5 : this.kindled ? 1.5 : 1);
    if (repeat) { this.shell = Math.min(6, this.shell + 1); this.grip = Math.min(this.c.grip, this.grip + 12); }
    let damage = 0, cracks = 0, strikes = 0;
    for (let i = 0; i < count; i++) {
      const n = notes[i], timing = this.grades[i] || 1; let d = 0;
      if (n === 'X') { if (this.shell > 0) { this.shell--; cracks++; } d = 3; }
      if (n === 'Y') { this.kindle = Math.min(4, this.kindle + 1); d = 4.5; }
      if (n === 'B') { this.hp = Math.min(72, this.hp + 6); if (!solo) this.shell = Math.min(6, this.shell + 1); }
      if (n === 'A') {
        d = this.c.strike * (this.shell > 0 && !solo ? .5 : 1);
        if (name === 'RISE') d *= [1,1.2,1.4][strikes++];
        if (name === 'LIGHT' && cracks === 2) d *= 1.5;
      }
      damage += d * timing * mult;
    }
    if (name === 'BALANCE') this.kindle = Math.min(4, this.kindle + 1);
    this.grip = Math.max(0, this.grip - damage);
    if (!solo) { this.last = key; this.seen.add(key); }
    this.event('resolve', { key, name, repeat, spark, damage, solo, kindled: this.kindled });
  }
}
