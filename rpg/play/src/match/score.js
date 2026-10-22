// D3.1 alternative full mixes at 110 BPM share one sample clock; never sum their full gains.
const root='../beat/art/current/music/undertow-ascendant/';
// Shared by all score layers and accents; effects have their own unchanged graph.
export const MUSIC_BUS_GAIN = 10 ** (-14 / 20); // Daryll 10-21: quieter again (was -9)
export class SirenScore {
 constructor(){this.context=null;this.nodes=[];this.events=[];this.round=1;this.ready=null;}
 async start(){
  if(this.ready)return this.ready;
  this.context=new AudioContext();void this.context.resume();
  this.ready=(async()=>{
   const c=this.context;
   // A resumed context can expose a nonzero loop sample, too.
   this.output=c.createGain();this.output.connect(c.destination);
   const resumeFade=()=>{
    const t=c.currentTime,g=this.output.gain;
    g.cancelScheduledValues(t);g.setValueAtTime(0,t);
    if(c.state==='running')g.linearRampToValueAtTime(MUSIC_BUS_GAIN,t+.05);
   };
   c.addEventListener('statechange',resumeFade);resumeFade();
   const load=async name=>c.decodeAudioData(await(await fetch(root+name+'.flac')).arrayBuffer());
   const [buffers,transition,wake,stingers]=await Promise.all([
    Promise.all(['D31-round1','D31-round2','D31-round3'].map(async name=>({buffer:await load(name),meta:await(await fetch(root+name+'.loop.json')).json()}))),load('D31-round-transition'),load('D2M-she-wakes'),Promise.all(['C-move-cast','C-round-won'].map(load))]);
   this.transition=transition;this.wake=wake;this.stingers=stingers;this.bar=60/110*4;
   const start=c.currentTime+.06;
   this.nodes=buffers.map(({buffer,meta},i)=>{
    const gain=c.createGain(),sources=new Set();
    const offset=meta.loop_start_frame/meta.sample_rate;
    const duration=(meta.loop_end_frame_exclusive-meta.loop_start_frame)/meta.sample_rate;
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(i===this.round-1?.23:0,start+.05);gain.connect(this.output);
    const lane={gain,meta,sources,ended:false};
    // Keep two passes queued on the audio clock, including while the tab sleeps.
    const queue=pass=>{
     if(lane.ended)return;
     const source=c.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);
     source.onended=()=>{sources.delete(source);source.disconnect();queue(pass+2);};
     source.start(start+pass*duration,offset,duration);
    };
    queue(0);queue(1);return lane;
   });
   this.startedAt=start;this.events.push({type:'start',time:performance.now(),round:this.round});
  })();return this.ready;
 }
 setRound(round){
  if(this.round===round)return;this.round=round;if(!this.nodes.length)return;
  const now=this.context.currentTime,t=this.startedAt+Math.ceil((now-this.startedAt)/this.bar)*this.bar;
  this.nodes.forEach(({gain},i)=>{gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(i===round-1?.23:0,t+this.bar);});
  this.oneShot(this.transition,t,.3);this.events.push({type:'round',round,time:performance.now(),scheduledAt:t,bar:this.bar});
 }
 oneShot(buffer,time=this.context.currentTime,gainValue=.3){if(!buffer)return;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(gainValue,time+.05);source.connect(gain).connect(this.output);source.start(time);}
 // Both shipped C accents are explicitly D minor; retain the original wiring.
 sting(win=false){if(!this.context)return;this.oneShot(this.stingers?.[win?1:0]);this.events.push({type:win?'win':'cast',time:performance.now()});}
 ending(){
  if(!this.context||!this.wake)return;const t=this.context.currentTime;
  this.nodes.forEach(lane=>{const {gain}=lane;lane.ended=true;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(0,t+.8);lane.sources.forEach(source=>source.stop(t+.81));});
  this.oneShot(this.wake,t,.3);this.events.push({type:'wake',time:performance.now()});
 }
}
