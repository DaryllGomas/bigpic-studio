// Game clock: real dt vs game dt (slow-mo + hit-stop), game-time timers and tweens.
export const ease = {
  lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  slam: t => t * t * t * t,
};
export class Clock {
  constructor() { this.real = 0; this.g = 0; this.dt = 0; this.dtReal = 0; this.scale = 1; this.hold = 0; this.slowT = 0; this.slowScale = 1; this.timers = []; this.tweens = []; this.preds = []; }
  tick(raw) {
    raw = Math.min(raw, 0.05); this.dtReal = raw; this.real += raw;
    if (this.slowT > 0) { this.scale = this.slowScale; this.slowT -= raw; } else this.scale += (1 - this.scale) * Math.min(1, raw * 7);
    if (this.hold > 0) { this.hold -= raw; this.dt = 0; } else this.dt = raw * this.scale;
    this.g += this.dt;
    for (const tw of this.tweens) {
      tw.t += this.dt; const k = Math.min(1, tw.t / tw.dur), e = tw.ease(k);
      for (const key in tw.to) tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
      if (k >= 1) { tw.done = true; tw.res(); }
    }
    this.tweens = this.tweens.filter(t => !t.done);
    const due = this.timers.filter(t => t.t <= this.g); if (due.length) { this.timers = this.timers.filter(t => t.t > this.g); due.forEach(t => t.r()); }
    const ps = this.preds; this.preds = [];
    for (const p of ps) { if (p.fn()) p.r(); else this.preds.push(p); }
  }
  freeze(ms) { this.hold = Math.max(this.hold, ms / 1000); }
  slow(scale, realSec) { this.slowScale = scale; this.slowT = realSec; this.scale = scale; }
  sleep(s) { return new Promise(r => this.timers.push({ t: this.g + s, r })); }
  until(fn) { return new Promise(r => this.preds.push({ fn, r })); }
  tween(obj, to, dur, e = ease.io) {
    const from = {}; for (const k in to) from[k] = obj[k];
    return new Promise(res => this.tweens.push({ obj, to, from, dur: Math.max(dur, 1e-4), ease: e, t: 0, res }));
  }
}
