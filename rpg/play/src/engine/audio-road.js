// The open road's bed: the gate road's wind and temple drone (Ambience) with an adventurous turn, more open sky and a
// walking pulse. A wider wind, a bare open fifth that lifts to a sus second, and now and then a small plucked phrase from
// a D-major pentatonic (rising more often than falling: somewhere to go). Plus the encounter chime and a hush for when the
// light goes thin. All synthesized. Starts on the first key or click.
import { Ambience } from './audio.js';
const PENT = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];   // D4 E4 F#4 A4 B4 D5 E5 F#5 A5
export class RoadAmbience extends Ambience {
  start() {
    if (this.ctx) return;
    super.start();
    const ctx = this.ctx, master = this.master, verb = this._reverb(ctx);
    this._verbOut2 = this._verbOut; this._verbOut2.connect(master);
    // a broad open-air wind, a second voice over the gate road's
    const len = ctx.sampleRate * 5, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = last * 3; } }
    const w = ctx.createBufferSource(); w.buffer = buf; w.loop = true; w.start(0, Math.random() * 4);
    const wf = ctx.createBiquadFilter(), wg = ctx.createGain(); wf.type = 'bandpass'; wf.frequency.value = 700; wf.Q.value = 0.35; wg.gain.value = 0.12;
    const l1 = ctx.createOscillator(), l1g = ctx.createGain(); l1.frequency.value = 0.045; l1g.gain.value = 0.07; l1.connect(l1g).connect(wg.gain); l1.start();
    w.connect(wf).connect(wg).connect(master);
    // the open fifth, lifting to a sus second and back
    const dl = ctx.createBiquadFilter(), dg = ctx.createGain(); dl.type = 'lowpass'; dl.frequency.value = 520; dg.gain.value = 0.03;
    const lift = ctx.createGain(); lift.gain.value = 0; const l2 = ctx.createOscillator(), l2g = ctx.createGain(); l2.frequency.value = 0.03; l2g.gain.value = 0.5; l2.connect(l2g).connect(lift.gain); l2.start();
    for (const f of [146.83, 220]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(dl); o.start(); }
    { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 164.81; o.connect(lift).connect(dl); o.start(); }
    dl.connect(dg).connect(master);
    // the small plucked phrase: 3 to 5 notes, a drift up the scale, long tails; then a long rest
    const pluck = (f, at, vel = 0.045) => {
      const g = ctx.createGain(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), pan = ctx.createStereoPanner();
      o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.003;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vel, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
      pan.pan.value = Math.random() * 0.8 - 0.4; o.connect(g); o2.connect(g); g.connect(pan); pan.connect(verb); pan.connect(master);
      o.start(at); o2.start(at); o.stop(at + 3.4); o2.stop(at + 3.4);
    };
    let at = 0;
    const phrase = () => {
      const n = 3 + ((Math.random() * 3) | 0); let i = (Math.random() * 4) | 0; const t0 = ctx.currentTime + 0.1;
      for (let k = 0; k < n; k++) { pluck(PENT[Math.max(0, Math.min(PENT.length - 1, i))], t0 + k * (0.55 + Math.random() * 0.25)); i += Math.random() < 0.65 ? 1 + ((Math.random() * 2) | 0) : -1; }
      this._t = setTimeout(phrase, 14000 + Math.random() * 16000);
    };
    this._t = setTimeout(phrase, 3500);
    this._pluck = pluck; this._hush = ctx.createGain(); this._hush.gain.value = 1;
  }
  /** The encounter chime: two low bell strokes, the second a fourth under the first. */
  chime() { if (!this.ctx) return; const t = this.ctx.currentTime + 0.02; this._pluck(587.33, t, 0.07); this._pluck(440, t + 0.5, 0.06); }
  /** The light goes thin: pull the whole bed down while a meeting is on, then back up. */
  thin(on) { if (this.master) this.master.gain.setTargetAtTime(on ? 0.2 : 0.55, this.ctx.currentTime, on ? 0.4 : 1.5); }
}
