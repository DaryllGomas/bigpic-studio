// The City's ambience: the gate road's bed (wind through the spires, distant falls, a low drone, temple chimes), made a
// little more cheerful. The drone moves to a warm major chord under a brighter filter, the chimes come more often and in
// small rising phrases, and there is life in it: a soft murmur of the crowd, the fountains, birds by day, now and then a
// few plucked notes from a player in the market, crickets after dark. All synthesized, quiet by design.
export class CityAmbience {
  constructor() { this.ctx = null; this.night = 0; this.crowdGain = 1; this.timers = []; }
  start() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const master = (this.master = ctx.createGain());
    master.gain.value = 0; master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 5);
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; } }
    const wbuf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = wbuf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    const noise = (b = buf) => { const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, Math.random() * 5); return s; };
    const lfo = (f, amt, target) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = amt; o.connect(g).connect(target); o.start(); return o; };
    const verb = this._reverb(ctx); this._verbOut.connect(master); this.verb = verb;
    // wind, softer and brighter than out on the road
    { const s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 720; f.Q.value = 0.5; g.gain.value = 0.13; lfo(0.06, 300, f.frequency); lfo(0.1, 0.05, g.gain); s.connect(f).connect(g).connect(master); }
    // the falls far off, and the fountains near: a brighter splash that breathes
    { const s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 0.5; g.gain.value = 0.045; s.connect(f).connect(g).connect(master); }
    { const s = noise(wbuf), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 0.7; g.gain.value = 0.012; lfo(0.9, 0.004, g.gain); lfo(0.23, 600, f.frequency); s.connect(f).connect(g).connect(master); }
    // the crowd: two formant bands of soft noise, syllable-slow swells (a murmur, never words)
    this.murmur = ctx.createGain(); this.murmur.gain.value = this.crowdGain; this.murmur.connect(master);
    for (const [fq, q, amt, rate] of [[420, 1.6, 0.03, 2.3], [1150, 2.2, 0.014, 3.1]]) {
      const s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = q; g.gain.value = amt;
      lfo(rate, amt * 0.55, g.gain); lfo(rate * 0.37, amt * 0.3, g.gain); lfo(0.13, fq * 0.12, f.frequency);
      s.connect(f).connect(g).connect(this.murmur);
    }
    // drone: D major (D, A, D, F#, A), slow beating, under a warm and brighter filter that drifts
    { const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 560; f.Q.value = 0.4; g.gain.value = 0.026; lfo(0.045, 160, f.frequency);
      for (const [fr, det, type] of [[73.42, -3, 'sawtooth'], [73.42, 4, 'sawtooth'], [110, 2, 'sawtooth'], [146.83, -2, 'triangle'], [185.0, 3, 'triangle'], [220, -1, 'triangle']]) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(); }
      f.connect(g).connect(master); }
    const later = (f, ms) => { this.timers.push(setTimeout(f, ms)); };
    const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98];
    const bell = (f, t, amp = 0.045, pan = 0) => {
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      for (const [m, a] of [[1, 1], [2.76, 0.3], [5.4, 0.1]]) { const o = ctx.createOscillator(); o.frequency.value = f * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 5.2); }
      g.connect(p); p.connect(verb); p.connect(master);
    };
    // chimes: often, sometimes a little rising phrase
    const chime = () => {
      const t = ctx.currentTime + 0.05, pan = Math.random() * 1.6 - 0.8;
      const i = (Math.random() * 5) | 0, n = Math.random() < 0.4 ? 3 : Math.random() < 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) bell(PENTA[i + k], t + k * 0.32, 0.04, pan);
      later(chime, 3500 + Math.random() * 6000);
    };
    later(chime, 2000);
    // a player in the market: a few plucked notes, far off
    const pluck = (f, t, amp) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.002;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.6);
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      p.pan.value = this._lutePan;
      o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(p); p.connect(verb); p.connect(master);
      o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
    };
    const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99];
    const lute = () => {
      if (this.night < 0.8 || Math.random() < 0.3) {
        this._lutePan = Math.random() * 1.2 - 0.6;
        let t = ctx.currentTime + 0.1, idx = 2 + ((Math.random() * 3) | 0);
        const n = 6 + ((Math.random() * 6) | 0);
        for (let k = 0; k < n; k++) {
          pluck(SCALE[idx], t, 0.035);
          if (k % 3 === 0) pluck(SCALE[Math.max(0, idx - 3)] / 2, t, 0.025);
          idx = Math.max(0, Math.min(SCALE.length - 1, idx + [-1, 1, 1, 2, -2, 0][(Math.random() * 6) | 0]));
          t += [0.24, 0.24, 0.48, 0.36][(Math.random() * 4) | 0];
        }
      }
      later(lute, 14000 + Math.random() * 16000);
    };
    later(lute, 6000);
    // birds by day: quick bright chirps in twos and threes
    const bird = () => {
      if (this.night < 0.4) {
        const t0 = ctx.currentTime + 0.02, p = ctx.createStereoPanner(); p.pan.value = Math.random() * 2 - 1; p.connect(master);
        const base = 2600 + Math.random() * 1600, n = 2 + ((Math.random() * 3) | 0);
        for (let k = 0; k < n; k++) {
          const t = t0 + k * (0.09 + Math.random() * 0.05), o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.05);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.012 * (1 - this.night), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
          o.connect(g).connect(p); o.start(t); o.stop(t + 0.08);
        }
      }
      later(bird, 1800 + Math.random() * 4500);
    };
    later(bird, 1200);
    // crickets after dark
    this.cricketGain = ctx.createGain(); this.cricketGain.gain.value = 0; this.cricketGain.connect(master);
    const cricket = () => {
      if (this.night > 0.05) {
        const t = ctx.currentTime + 0.02, f = 4200 + Math.random() * 600, p = ctx.createStereoPanner(); p.pan.value = Math.random() * 2 - 1;
        for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + k * 0.09); g.gain.linearRampToValueAtTime(0.018, t + k * 0.09 + 0.01); g.gain.linearRampToValueAtTime(0, t + k * 0.09 + 0.05); o.connect(g).connect(p); o.start(t + k * 0.09); o.stop(t + k * 0.09 + 0.06); }
        p.connect(this.cricketGain);
      }
      later(cricket, 300 + Math.random() * 900);
    };
    cricket();
    this.bell = bell;
  }
  _reverb(ctx) {
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    const c = ctx.createConvolver(); c.buffer = ir; const g = ctx.createGain(); g.gain.value = 0.55; c.connect(g);
    const input = ctx.createGain(); input.connect(c);
    this._verbOut = g;
    return input;
  }
  /** 0 = day, 1 = deep night: crickets in, birds out, the crowd quieter. */
  setNight(n) {
    this.night = n;
    if (!this.ctx) return;
    this.cricketGain.gain.setTargetAtTime(n, this.ctx.currentTime, 1.0);
    this.murmur.gain.setTargetAtTime((1 - n * 0.6) * this.crowdGain, this.ctx.currentTime, 1.5);
  }
  /** A soft swell when he is recognised: a high open chord in the chimes, nothing louder than the bed. */
  swell() {
    if (!this.ctx || !this.bell) return;
    const t = this.ctx.currentTime + 0.1;
    [587.33, 739.99, 880, 1174.66].forEach((f, k) => this.bell(f, t + k * 0.45, 0.03, (k - 1.5) * 0.3));
  }
  /** Fade out and stop (on leaving through the House door the House has its own sound; we keep ours, quieter). */
  duck(on) { if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.12 : 0.55, this.ctx.currentTime, 0.5); }
}
