// Procedural WebAudio: everything is synthesized, nothing is loaded.
export class Sfx {
  constructor() { this.ctx = null; }
  init() {
    if (this.ctx) { this.ctx.state === 'suspended' && this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 12000;
    this.comp = c.createDynamicsCompressor(); this.master = c.createGain(); this.master.gain.value = .8;
    this.master.connect(this.lp); this.lp.connect(this.comp); this.comp.connect(c.destination);
    const n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = buf;
    this.drone();
  }
  get t() { return this.ctx.currentTime; }
  tone({ f = 440, f2, dur = .3, type = 'sine', gain = .3, at = 0, attack = .005, curve = 'exp' }) {
    if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t0 = this.t + at;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + .05);
  }
  noise({ dur = .2, type = 'lowpass', f = 800, f2, q = 1, gain = .3, at = 0, attack = .004 }) {
    if (!this.ctx) return; const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t0 = this.t + at;
    s.buffer = this.noiseBuf; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t0); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t0, Math.random()); s.stop(t0 + dur + .05);
  }
  drone() {
    const c = this.ctx, g = this.droneG = c.createGain(); g.gain.value = .0001; g.gain.linearRampToValueAtTime(.16, c.currentTime + 4); g.connect(this.master);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.connect(g);
    this.droneOsc = [[55, 'sawtooth'], [55.4, 'sawtooth'], [82.4, 'sine'], [110.3, 'triangle']].map(([f, t]) => { const o = c.createOscillator(); o.type = t; o.frequency.value = f; o.connect(lp); o.start(); return o; });
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .08; lg.gain.value = 90; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const s = c.createBufferSource(), f = c.createBiquadFilter(), wg = c.createGain(); s.buffer = this.noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = .6; wg.gain.value = .03;
    const l2 = c.createOscillator(), l2g = c.createGain(); l2.frequency.value = .11; l2g.gain.value = 220; l2.connect(l2g); l2g.connect(f.frequency); l2.start();
    s.connect(f); f.connect(wg); wg.connect(this.master); s.start();
  }
  slowmo(on) { if (!this.ctx) return; const t = this.t; this.lp.frequency.cancelScheduledValues(t); this.lp.frequency.setTargetAtTime(on ? 700 : 12000, t, on ? .03 : .25); this.droneOsc && this.droneOsc.forEach(o => o.detune.setTargetAtTime(on ? -500 : 0, t, .1)); }
  thud(p = 1) { this.tone({ f: 130, f2: 28, dur: .9, gain: .9 * p, type: 'sine' }); this.tone({ f: 70, f2: 24, dur: 1.2, gain: .6 * p, type: 'triangle' }); this.noise({ dur: .7, f: 900, f2: 70, gain: .8 * p }); this.noise({ dur: .15, type: 'highpass', f: 2500, gain: .3 * p }); }
  ring() { [1320, 1976, 2637, 3520].forEach((f, i) => this.tone({ f, dur: 1.4 - i * .18, gain: .22 / (1 + i * .5), at: i * .012, type: 'sine' })); this.tone({ f: 660, dur: .9, gain: .2, type: 'triangle' }); this.noise({ dur: .08, type: 'highpass', f: 5000, gain: .3 }); }
  goodParry() { this.tone({ f: 880, dur: .5, gain: .22 }); this.tone({ f: 1320, dur: .4, gain: .12 }); this.noise({ dur: .1, type: 'bandpass', f: 3000, gain: .25 }); }
  crack() { this.noise({ dur: .22, type: 'highpass', f: 1800, q: 2, gain: .55 }); this.tone({ f: 1800, f2: 200, dur: .15, type: 'square', gain: .18 }); this.noise({ dur: .3, f: 400, f2: 90, gain: .3, at: .02 }); }
  shatter() { for (let i = 0; i < 9; i++) this.noise({ dur: .25, type: 'highpass', f: 1500 + Math.random() * 3000, gain: .3, at: i * .035 }); this.tone({ f: 90, f2: 30, dur: 1.4, gain: .8 }); this.ring(); }
  punch() { this.tone({ f: 190, f2: 55, dur: .25, gain: .6 }); this.noise({ dur: .12, f: 1500, f2: 200, gain: .5 }); }
  whoosh(d = .3) { this.noise({ dur: d, type: 'bandpass', f: 400, f2: 2500, q: 1.5, gain: .25, attack: d * .6 }); }
  hurt() { this.tone({ f: 220, f2: 70, dur: .4, gain: .5, type: 'sawtooth' }); this.noise({ dur: .3, f: 1200, f2: 150, gain: .5 }); }
  heal() { [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, dur: .6, gain: .16, at: i * .07 })); }
  signal() { this.tone({ f: 600, f2: 1800, dur: .35, gain: .2, type: 'triangle' }); this.tone({ f: 900, f2: 2700, dur: .35, gain: .1, at: .03 }); }
  wake() { [220, 330, 440].forEach((f, i) => this.tone({ f, dur: 1.2, gain: .22, at: i * .12, type: 'triangle' })); this.tone({ f: 110, f2: 220, dur: 1.2, gain: .3 }); }
  tick() { this.tone({ f: 1400, dur: .05, gain: .08, type: 'square' }); }
  select() { this.tone({ f: 700, dur: .12, gain: .14, type: 'triangle' }); this.tone({ f: 1050, dur: .14, gain: .1, at: .04 }); }
  deny() { this.tone({ f: 160, dur: .15, gain: .15, type: 'square' }); }
  rumble(d = 1.6) { this.tone({ f: 38, f2: 60, dur: d, gain: .5, attack: d * .8, type: 'sawtooth' }); this.noise({ dur: d, f: 120, f2: 400, gain: .22, attack: d * .8 }); }
  // a rising whine that peaks right at the slam: the audible tell
  whine(dur) {
    if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t0 = this.t, f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(420, t0 + dur); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(2200, t0 + dur);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.18, t0 + dur); g.gain.linearRampToValueAtTime(0, t0 + dur + .04);
    o.connect(f); f.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + .1);
  }
  // count-in beat: a dry woodblock tok (the rhythm you parry on). drag = lower, slower-feeling.
  beat(n, drag) { const f = (drag ? [330, 392] : [523, 698])[n] || 698; this.tone({ f, f2: f * .7, dur: .09, gain: .34, type: 'triangle' }); this.tone({ f: f * 2.01, dur: .04, gain: .12, type: 'sine' }); this.noise({ dur: .03, type: 'bandpass', f: 2600, q: 3, gain: .35 }); }
  // the silence before the hit: duck the drone through the count-in
  duck(on, dur = 1) { if (!this.ctx || !this.droneG) return; const t = this.t, g = this.droneG.gain; g.cancelScheduledValues(t); g.setTargetAtTime(on ? .035 : .16, t, .12); if (on) g.setTargetAtTime(.16, t + dur + .25, .4); }
  // timed-hit chime: rises a step with every timed hit in a combo
  chime(step = 0) { const f = 784 * Math.pow(2, [0, 2, 4, 7, 9, 12][Math.min(5, step)] / 12); this.tone({ f, dur: .35, gain: .16, type: 'sine' }); this.tone({ f: f * 2, dur: .2, gain: .06, at: .01 }); }
  // boost pip: rising pitch per pip
  pip(n) { const f = 440 * Math.pow(2, n * 4 / 12); this.tone({ f, dur: .18, gain: .14, type: 'triangle' }); this.tone({ f: f * 1.5, dur: .12, gain: .06, at: .02 }); }
  breath() { this.noise({ dur: 1.6, type: 'lowpass', f: 150, f2: 500, gain: .25, attack: .7 }); }
  victory() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone({ f, dur: 2, gain: .15, at: i * .18, type: 'sine' })); }
  bent() { this.tone({ f: 330, f2: 300, dur: 1.2, gain: .2, type: 'triangle' }); this.tone({ f: 392, f2: 350, dur: 1.2, gain: .12, at: .05 }); }
}
