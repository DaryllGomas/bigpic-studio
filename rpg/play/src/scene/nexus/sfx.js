// The Nexus's own voices on top of the temple bed (engine/audio.js Ambience, used as-is): a low hum from a sealed gate
// when you stand near it, a bright shimmer from the living gate, bells when Atlas takes form, a breath when a gate takes
// you. All synthesized; it waits for the Ambience to start (first key or click) and plays through its master gain.
export class NexusSfx {
  constructor(ambience) { this.amb = ambience; this.ready = false; }
  _build() {
    const ctx = this.amb.ctx, master = this.amb.master;
    if (!ctx || !master) return false;
    this.ctx = ctx;
    // a small hall reverb of our own
    const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.5; this.verb.connect(vg).connect(master);
    // sealed hum: slow-beating low sines under a lowpass
    this.hum = ctx.createGain(); this.hum.gain.value = 0;
    this.humPan = ctx.createStereoPanner();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    for (const [f, det, a] of [[55, -5, 1], [55, 6, 1], [82.41, 2, 0.6], [110, -3, 0.35], [164.8, 4, 0.12]]) {
      const o = ctx.createOscillator(); o.frequency.value = f; o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = a * 0.5; o.connect(g).connect(lp); o.start();
    }
    lp.connect(this.hum).connect(this.humPan).connect(master);
    this.humPan.connect(this.verb);
    // living gate shimmer: high partials with a tremolo
    this.shim = ctx.createGain(); this.shim.gain.value = 0;
    this.shimPan = ctx.createStereoPanner();
    const trem = ctx.createGain(); trem.gain.value = 0.7;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 4.7; lfoG.gain.value = 0.3; lfo.connect(lfoG).connect(trem.gain); lfo.start();
    for (const [f, a] of [[587.33, 0.5], [880, 0.4], [1174.66, 0.3], [1760, 0.16], [2349.3, 0.08]]) {
      for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.frequency.value = f; o.detune.value = det; const g = ctx.createGain(); g.gain.value = a * 0.08; o.connect(g).connect(trem); o.start(); }
    }
    trem.connect(this.shim).connect(this.shimPan).connect(master);
    this.shimPan.connect(this.verb);
    this.ready = true;
    return true;
  }
  /** near: 0..1 proximity; pan: -1..1 where it is on screen. */
  update({ sealedNear = 0, sealedPan = 0, aliveNear = 0, alivePan = 0 }) {
    if (!this.ready && !this._build()) return;
    const t = this.ctx.currentTime;
    this.hum.gain.setTargetAtTime(sealedNear * 0.22, t, 0.35);
    this.humPan.pan.setTargetAtTime(Math.max(-1, Math.min(1, sealedPan)), t, 0.3);
    this.shim.gain.setTargetAtTime(aliveNear * 0.5, t, 0.4);
    this.shimPan.pan.setTargetAtTime(Math.max(-1, Math.min(1, alivePan)), t, 0.3);
  }
  bell(freq, { gain = 0.06, decay = 7, pan = 0, delay = 0 } = {}) {
    if (!this.ready && !this._build()) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.02 + delay;
    const g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    for (const [m, a] of [[1, 1], [2.76, 0.32], [5.4, 0.1], [0.5, 0.25]]) { const o = ctx.createOscillator(); o.frequency.value = freq * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + decay + 0.2); }
    g.connect(p); p.connect(this.verb); p.connect(this.amb.master);
  }
  /** Atlas takes form: a chord of bells, low to high. */
  formChord() { [146.83, 220, 293.66, 369.99, 440, 587.33].forEach((f, i) => this.bell(f, { gain: 0.05, decay: 9, pan: (i / 5) * 1.2 - 0.6, delay: i * 0.12 })); }
  /** A gate takes you: a rising breath of noise. */
  breath() {
    if (!this.ready && !this._build()) return;
    const ctx = this.ctx, t = ctx.currentTime, len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 1.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 1.4);
    s.connect(f).connect(g); g.connect(this.verb); g.connect(this.amb.master); s.start(t); s.stop(t + 2);
  }
}
