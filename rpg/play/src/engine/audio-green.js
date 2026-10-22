// The Green's ambience: the calm half of the game. Built the way the City's bed is (src/engine/audio-city.js), but softer and
// slower: a low warm open chord that barely moves, a breath of wind in the grass, a trickle at the pond, and now and then a
// single soft harp note (never a tune) with a long tail. Birds at a lazy pace by day, crickets after dark. All synthesized.
// Starts on the first key or click. Test: "I could just sit here and listen."
export class GreenAmbience {
  constructor() { this.ctx = null; this.night = 0; this.timers = []; }
  start() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const master = (this.master = ctx.createGain());
    master.gain.value = 0; master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 8);   // a slow fade in
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; } }
    const wbuf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = wbuf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    const noise = (b = buf) => { const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(0, Math.random() * 5); return s; };
    const lfo = (f, amt, target) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = amt; o.connect(g).connect(target); o.start(); return o; };
    // a long, soft room tail
    const irLen = ctx.sampleRate * 4.5, ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.2); }
    const conv = ctx.createConvolver(); conv.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.6; conv.connect(vg).connect(master);
    const verb = ctx.createGain(); verb.connect(conv);
    // wind in the grass: slow breathing, never a gust
    { const s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.4; g.gain.value = 0.1; lfo(0.035, 200, f.frequency); lfo(0.05, 0.04, g.gain); s.connect(f).connect(g).connect(master); }
    // leaves: a faint high hush that swells with the wind
    { const s = noise(wbuf), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.6; g.gain.value = 0.006; lfo(0.07, 0.004, g.gain); s.connect(f).connect(g).connect(master); }
    // the pond: a soft trickle, a little water over stones
    { const s = noise(wbuf), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.1; g.gain.value = 0.007; lfo(0.4, 0.003, g.gain); lfo(0.13, 400, f.frequency); s.connect(f).connect(g).connect(master); }
    // the bed: C major spread wide (C, G, C, E, G), pure and slow, under a closed filter
    { const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 0.3; g.gain.value = 0.03; lfo(0.025, 90, f.frequency); lfo(0.04, 0.008, g.gain);
      for (const [fr, det, type] of [[65.41, -2, 'sine'], [65.41, 3, 'triangle'], [98, 2, 'sine'], [130.81, -3, 'triangle'], [164.81, 2, 'sine'], [196, -2, 'sine']]) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(); }
      f.connect(g).connect(master); }
    const later = (f, ms) => { this.timers.push(setTimeout(f, ms)); };
    // a single soft harp note, now and then: C major pentatonic, long decay, wide and far
    const PENTA = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
    const note = (f, t, amp = 0.03, pan = 0) => {
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 5, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 1.2);
      for (const [m, a] of [[1, 1], [2, 0.18], [3, 0.06]]) { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(lp); o.start(t); o.stop(t + 6.7); }
      lp.connect(g); g.connect(p); p.connect(verb); p.connect(master);
    };
    const harp = () => {
      const t = ctx.currentTime + 0.05, pan = Math.random() * 1.2 - 0.6, i = (Math.random() * 7) | 0, n = Math.random() < 0.35 ? 2 : 1;
      for (let k = 0; k < n; k++) note(PENTA[Math.min(8, i + k * 2)], t + k * 0.9, 0.028, pan);
      later(harp, 9000 + Math.random() * 11000);
    };
    later(harp, 3500);
    // birds, lazily: a pair of soft whistles, a long pause
    const bird = () => {
      if (this.night < 0.4) {
        const t0 = ctx.currentTime + 0.02, p = ctx.createStereoPanner(); p.pan.value = Math.random() * 2 - 1; p.connect(master); p.connect(verb);
        const base = 2100 + Math.random() * 1200, n = 2 + ((Math.random() * 2) | 0);
        for (let k = 0; k < n; k++) {
          const t = t0 + k * (0.17 + Math.random() * 0.07), o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(base * (k % 2 ? 1.12 : 1), t); o.frequency.exponentialRampToValueAtTime(base * (1.18 + Math.random() * 0.25), t + 0.11);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.009 * (1 - this.night), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
          o.connect(g).connect(p); o.start(t); o.stop(t + 0.17);
        }
      }
      later(bird, 3500 + Math.random() * 8500);
    };
    later(bird, 2000);
    // crickets after dark, slow
    this.cricketGain = ctx.createGain(); this.cricketGain.gain.value = 0; this.cricketGain.connect(master);
    const cricket = () => {
      if (this.night > 0.05) {
        const t = ctx.currentTime + 0.02, f = 4300 + Math.random() * 400, p = ctx.createStereoPanner(); p.pan.value = Math.random() * 2 - 1;
        for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + k * 0.1); g.gain.linearRampToValueAtTime(0.012, t + k * 0.1 + 0.012); g.gain.linearRampToValueAtTime(0, t + k * 0.1 + 0.06); o.connect(g).connect(p); o.start(t + k * 0.1); o.stop(t + k * 0.1 + 0.07); }
        p.connect(this.cricketGain);
      }
      later(cricket, 500 + Math.random() * 1400);
    };
    cricket();
    this.note = note;
  }
  /** 0 = day, 1 = deep night. */
  setNight(n) { this.night = n; if (this.ctx) this.cricketGain.gain.setTargetAtTime(n, this.ctx.currentTime, 1.5); }
  /** A little rising phrase when a seed goes in the ground: three soft notes. */
  planted() { if (this.ctx && this.note) { const t = this.ctx.currentTime + 0.05; [392, 523.25, 659.25].forEach((f, k) => this.note(f, t + k * 0.22, 0.03, 0)); } }
  fishingSound(state) {
    if (!this.ctx) return;
    const ctx=this.ctx, t=ctx.currentTime;
    if (state==='catch') { [523.25,659.25,783.99].forEach((f,i)=>this.note?.(f,t+i*.13,.055,0)); return; }
    const frequencies={wait:[380,90],bite:[880,1320],reel:[660,880],escape:[220,80]};
    const pair=frequencies[state]; if(!pair)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(pair[0],t);o.frequency.exponentialRampToValueAtTime(pair[1],t+.17);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.3);
  }
  gathered() { if(this.ctx) this.note?.(523.25,this.ctx.currentTime,.035,0); }
  built() { if(this.ctx) [261.63,329.63,392,523.25].forEach((f,i)=>this.note?.(f,this.ctx.currentTime+i*.18,.055,0)); }
  home() { if(this.ctx) [130.81,196,329.63].forEach(f=>this.note?.(f,this.ctx.currentTime,.045,0)); }
  duck(on) { if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.1 : 0.5, this.ctx.currentTime, 0.6); }
}
