// Ambience, synthesized (no audio files): wind through the spires, the far falls, a low drone, sparse temple chimes,
// crickets after dark. Starts on the first key or click (browsers require a gesture). Quiet by design.
export class Ambience {
  constructor() { this.ctx = null; this.night = 0; }
  wake() {
    if (!this.ctx) return;
    const ctx=this.ctx, t=ctx.currentTime;
    [587.33,739.99,880].forEach((f,i)=>{
      const o=ctx.createOscillator(), g=ctx.createGain(), at=t+i*.18;
      o.frequency.value=f; g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.035,at+.02); g.gain.exponentialRampToValueAtTime(.0001,at+2);
      o.connect(g).connect(this.master);o.start(at);o.stop(at+2.1);
    });
  }
  start() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const master = (this.master = ctx.createGain());
    master.gain.value = 0; master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 5);
    // brown-ish noise, stereo, looped
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; } }
    const noise = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random() * 5); return s; };
    // wind: a lowpass that breathes
    const wind = noise(), wf = ctx.createBiquadFilter(), wg = ctx.createGain();
    wf.type = 'lowpass'; wf.frequency.value = 500; wf.Q.value = 0.6; wg.gain.value = 0.22;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 260; lfo.connect(lfoG).connect(wf.frequency); lfo.start();
    const lfo2 = ctx.createOscillator(), lfo2G = ctx.createGain(); lfo2.frequency.value = 0.11; lfo2G.gain.value = 0.09; lfo2.connect(lfo2G).connect(wg.gain); lfo2.start();
    wind.connect(wf).connect(wg).connect(master);
    // the falls: a steady band of hiss, far away
    const falls = noise(), ff = ctx.createBiquadFilter(), fg = ctx.createGain();
    ff.type = 'bandpass'; ff.frequency.value = 900; ff.Q.value = 0.5; fg.gain.value = 0.05;
    falls.connect(ff).connect(fg).connect(master);
    // drone: D and A, slow beating, under a lowpass
    const dl = ctx.createBiquadFilter(), dg = ctx.createGain(); dl.type = 'lowpass'; dl.frequency.value = 320; dg.gain.value = 0.035;
    for (const [f, det] of [[73.42, -3], [73.42, 4], [110, 2], [146.83, -2]]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(dl); o.start(); }
    dl.connect(dg).connect(master);
    // crickets (night)
    this.cricketGain = ctx.createGain(); this.cricketGain.gain.value = 0; this.cricketGain.connect(master);
    const verb = this._reverb(ctx); this._verbOut.connect(master);
    const chime = () => {
      const t = ctx.currentTime + 0.05;
      const notes = [587.33, 739.99, 880, 987.77, 1174.66, 1318.5];
      const f = notes[(Math.random() * notes.length) | 0];
      const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
      for (const [m, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) { const o = ctx.createOscillator(); o.frequency.value = f * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 6.2); }
      g.connect(pan); pan.connect(verb); pan.connect(master);
      setTimeout(chime, 5000 + Math.random() * 9000);
    };
    setTimeout(chime, 2500);
    const cricket = () => {
      if (this.night > 0.05) {
        const t = ctx.currentTime + 0.02, f = 4200 + Math.random() * 600;
        const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1;
        for (let k = 0; k < 3; k++) {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
          g.gain.setValueAtTime(0, t + k * 0.09); g.gain.linearRampToValueAtTime(0.02, t + k * 0.09 + 0.01); g.gain.linearRampToValueAtTime(0, t + k * 0.09 + 0.05);
          o.connect(g).connect(pan); o.start(t + k * 0.09); o.stop(t + k * 0.09 + 0.06);
        }
        pan.connect(this.cricketGain);
      }
      setTimeout(cricket, 300 + Math.random() * 900);
    };
    cricket();
  }
  _reverb(ctx) {
    const len = ctx.sampleRate * 3.5, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const c = ctx.createConvolver(); c.buffer = ir; const g = ctx.createGain(); g.gain.value = 0.6; c.connect(g);
    const input = ctx.createGain(); input.connect(c);
    this._verbOut = g;
    return input;
  }
  setNight(n) { this.night = n; if (this.cricketGain) this.cricketGain.gain.setTargetAtTime(n, this.ctx.currentTime, 1.0); }
}
