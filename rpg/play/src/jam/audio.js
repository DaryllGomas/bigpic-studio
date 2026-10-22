// A quiet D-minor ostinato. AudioContext is the live transport; scheduling is
// ahead of the render loop. The same score can be rendered offline for the clip.
export class Music {
  constructor() { this.score = []; this.scheduled = new Set(); this.nodes = new Set(); this.epoch = 0; }
  async unlock(time) {
    this.ctx ||= new AudioContext(); await this.ctx.resume(); this.epoch = this.ctx.currentTime - time;
  }
  tone(ctx, out, at, frequency, length, volume, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(frequency, at);
    if (type === 'triangle') o.frequency.exponentialRampToValueAtTime(frequency*.98, at + length);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(volume, at + .008); g.gain.exponentialRampToValueAtTime(.0001, at + length);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + length + .01);
    if (ctx === this.ctx) { this.nodes.add(o); o.onended = () => this.nodes.delete(o); }
  }
  render(ctx, out, event, at) {
    const {kind, note = 'A', accent = 1} = event;
    if (kind === 'bass') { this.tone(ctx,out,at,73.416,.72,.065,'triangle'); this.tone(ctx,out,at,110,.6,.025); }
    if (kind === 'tick') this.tone(ctx,out,at,880,.075,.085);
    if (kind === 'kick') { this.tone(ctx,out,at,55,.19,.17,'triangle'); this.tone(ctx,out,at,146.83,.12,.08); }
    if (kind === 'note' || kind === 'hum' || kind === 'ghost') {
      const f = { A:146.83, X:220, Y:293.66, B:174.61 }[note]; if (!f) return;
      this.tone(ctx,out,at,kind === 'hum' ? f*.5 : f,kind === 'hum' ? .65 : .32,(kind === 'ghost' ? .035 : .085)*accent,'triangle');
      if (kind === 'note') this.tone(ctx,out,at,f*2,.19,.025*accent);
    }
    if (kind === 'parry') [587.33,880,1174.66].forEach((f,i) => this.tone(ctx,out,at+i*.025,f,.3,.05));
    if (kind === 'bent') this.tone(ctx,out,at,69.3,.8,.1,'triangle');
  }
  add(kind,time,note,accent=1) {
    const event = {kind,time,note,accent}; this.score.push(event);
    if (this.ctx?.state === 'running') this.render(this.ctx,this.ctx.destination,event,Math.max(this.ctx.currentTime+.001,this.epoch+time));
  }
  cut() {
    for (const node of this.nodes) { try { node.stop(); } catch {} } this.nodes.clear();
  }
  sync(jam) {
    const s = jam, b = s.beat;
    if (!['call','answer','solo','duet'].includes(s.phase) || s.paused) return;
    const schedule = (id,t,kind,note) => {
      const key = `${s.start}:${s.phase}:${id}`;
      if (t <= s.time+.12 && !this.scheduled.has(key)) { this.scheduled.add(key); this.add(kind,t,note); }
    };
    if (s.phase !== 'solo') for (let i=0;i<s.duration/b;i++) {
      schedule('bass'+i,s.start+i*b,'bass');
      if (s.phase !== 'call') schedule('pulse'+i,s.start+(i+.5)*b,'tick');
    }
    if (s.phase === 'call') s.targets().forEach((t,i) => schedule('call'+i,t,i===2?'kick':'tick'));
    if (s.phase === 'duet') s.targets().forEach((t,i) => schedule('ghost'+i,t,'ghost','YAXA'[i]));
  }
  event(e,s) {
    if (e.type === 'note') this.add('note',e.time,e.button,e.score/1.5);
    if (e.type === 'parry') this.add('parry',e.time);
    if (e.type === 'bent') this.add('bent',e.time);
    if (e.type === 'break') this.cut();
    if (e.type === 'resolve' && e.repeat) [...e.key].forEach((note,i) => this.add('hum',e.time+i*s.beat,note));
  }
  async wav(duration) {
    const rate = 24000, ctx = new OfflineAudioContext(1,Math.ceil(duration*rate),rate);
    // Break mutes all tails, including the bass/drone, until the solo.
    const bus = ctx.createGain(); bus.connect(ctx.destination);
    for (const e of this.score) this.render(ctx,bus,e,e.time+.05);
    for (const t of this.breakTimes || []) { bus.gain.setValueAtTime(1,t); bus.gain.setValueAtTime(0,t+.001); bus.gain.setValueAtTime(1,t+this.beat); }
    const samples = (await ctx.startRendering()).getChannelData(0), data = new ArrayBuffer(44+samples.length*2), v = new DataView(data);
    const str = (offset,s) => [...s].forEach((c,i) => v.setUint8(offset+i,c.charCodeAt(0)));
    str(0,'RIFF');v.setUint32(4,data.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
    samples.forEach((s,i) => v.setInt16(44+i*2,Math.max(-1,Math.min(1,s))*32767,true));
    const bytes = new Uint8Array(data); let binary=''; for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192)); return btoa(binary);
  }
}
