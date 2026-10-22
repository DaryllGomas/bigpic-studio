// Bars are one based, with an exclusive endBar (1–5 is four bars).
export const barBeat = bar => (bar-1)*4;
export function validateMap(song){
 const m=song.map;if(!m)return;
 if(typeof m.audio!=='string'||!m.audio.startsWith('/')||m.audio.startsWith('//')||m.audio.includes('..')||m.audio.length>1024||m.bpm!==song.bpm||m.firstBeatOffset!==song.firstBeatOffset||m.firstBeatOffset<0||!Array.isArray(m.holds)||m.holds.length>256)throw Error('Invalid song map');
 let end=1;const ids=new Set();
 for(const h of m.holds){if(!h||typeof h.id!=='string'||!h.id||h.id.length>80||ids.has(h.id)||!Number.isInteger(h.startBar)||!Number.isInteger(h.endBar)||h.startBar<end||h.endBar<=h.startBar||barBeat(h.endBar)>song.beats||!(h.release==='summon'||h.release==='meter'||Number.isInteger(h.release?.passes)&&h.release.passes>=1&&h.release.passes<=64))throw Error('Invalid or overlapping song-map holds');ids.add(h.id);end=h.endBar;}
 if(m.finaleBar!==undefined&&(!Number.isInteger(m.finaleBar)||m.finaleBar<end||barBeat(m.finaleBar)>=song.beats))throw Error('Finale must follow the holds and lie inside the song');
 if(song.pieces||song.loopRegion)throw Error('A song map uses one full WAV');
}
// A shared deterministic itinerary: transport beats never jump; song beats can.
export class SongTimeline {
 constructor(song){this.song=song;this.holds=song.map.holds;this.segments=[];this.passes={};this.released=new Set();this.releaseBeat=Infinity;this.meterFull=false;this.summonOff=false;this.append(0,0);}
 append(at,from){
  if(from>=this.song.beats)return;
  const hold=this.holds.find(h=>from>=barBeat(h.startBar)&&from<barBeat(h.endBar));
  const end=hold?barBeat(hold.endBar):Math.min(this.song.beats,...this.holds.filter(h=>barBeat(h.startBar)>from).map(h=>barBeat(h.startBar)));
  const s={at,from,to:end,hold:hold?.id,pass:hold?(this.passes[hold.id]=(this.passes[hold.id]||0)+1):0};this.segments.push(s);return s;
 }
 next(s){const at=s.at+s.to-s.from,h=this.holds.find(h=>h.id===s.hold);let from=this.released.has(s.hold)&&h?barBeat(h.endBar):s.to;
  if(h&&!this.released.has(h.id)){
   const release=this.summonOff&&typeof h.release==='string'||h.release==='meter'&&this.meterFull||h.release==='summon'&&this.releaseBeat<=at||typeof h.release==='object'&&s.pass>=h.release.passes;
   if(!release)from=barBeat(h.startBar);
  }return {at,from};
 }
 advance(beat){
  // A summoned movie can leave a hold at the next bar, even mid-pass.
  const last=this.segments.at(-1);
  if(last?.hold&&this.releaseBeat<last.at+last.to-last.from&&this.releaseBeat>=last.at){const h=this.holds.find(h=>h.id===last.hold);if(h.release==='summon'){last.to=last.from+this.releaseBeat-last.at;this.released.add(h.id);if(beat>=this.releaseBeat){this.append(this.releaseBeat,barBeat(h.endBar));}}}
  while(this.segments.length){const s=this.segments.at(-1),end=s.at+s.to-s.from;if(beat<end||s.to>=this.song.beats)break;const n=this.next(s);if(!this.append(n.at,n.from))break;}
 }
 forecast(){const s=this.segments.at(-1);if(!s||s.to>=this.song.beats)return [];const h=this.holds.find(h=>h.id===s.hold);const n=this.released.has(s.hold)&&h?{at:s.at+s.to-s.from,from:barBeat(h.endBar)}:this.next(s);if(n.from>=this.song.beats)return [];const hold=this.holds.find(h=>n.from>=barBeat(h.startBar)&&n.from<barBeat(h.endBar));let to=hold?barBeat(hold.endBar):Math.min(this.song.beats,...this.holds.filter(h=>barBeat(h.startBar)>n.from).map(h=>barBeat(h.startBar)));if(hold?.release==='summon'&&this.releaseBeat>=n.at&&this.releaseBeat<n.at+to-n.from)to=n.from+this.releaseBeat-n.at;return [{...n,to,hold:hold?.id,pass:hold?(this.passes[hold.id]||0)+1:0,tentative:true}];}
 locate(beat){return this.segments.findLast(s=>beat>=s.at)||this.segments[0];}
 songBeat(beat){const s=this.locate(beat);return Math.min(this.song.beats,s.from+beat-s.at);}
 get endBeat(){const s=this.segments.at(-1);return s.to>=this.song.beats?s.at+s.to-s.from:Infinity;}
 get plan(){return [...this.segments,...this.forecast()];}
}
export function barLoudness(channels,rate,song){const duration=channels[0].length/rate,beat=60/song.bpm,bars=[];for(let bar=1;barBeat(bar)*beat+(song.firstBeatOffset||0)<duration;bar++){const start=Math.max(0,Math.round(((song.firstBeatOffset||0)+barBeat(bar)*beat)*rate)),end=Math.min(channels[0].length,Math.round(((song.firstBeatOffset||0)+barBeat(bar+1)*beat)*rate));let sum=0;for(const c of channels)for(let i=start;i<end;i++)sum+=c[i]*c[i];bars.push({bar,time:start/rate,rms:Math.sqrt(sum/Math.max(1,(end-start)*channels.length))});}return bars;}
export function suggestHolds(bars){const sorted=bars.map(b=>b.rms).sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)]||0,holds=[];let start=null;for(let i=0;i<=bars.length;i++){if(i<bars.length&&bars[i].rms<median*.6){start??=i;}else if(start!==null){if(i-start>=2)holds.push({id:'quiet-'+bars[start].bar,startBar:bars[start].bar,endBar:bars[i-1].bar+1,release:'meter'});start=null;}}
 const late=bars.filter(b=>b.bar>bars.length*.65);let best=null,score=0;for(let i=1;i<late.length;i++){const rise=late[i].rms-late[i-1].rms;if(rise>score){score=rise;best=late[i].bar;}}return {holds,finaleBar:best};}
// Studio audition: two complete passes per hold, independent of game state.
export function previewPlan(song,duration){const beat=60/song.bpm,offset=song.firstBeatOffset||0,plan=[];let source=0,time=0;const add=(from,to)=>{if(to<=from)return;plan.push({time,from,to});time+=to-from;};for(const h of song.map.holds){const start=offset+barBeat(h.startBar)*beat,end=offset+barBeat(h.endBar)*beat;add(source,start);add(start,end);add(start,end);source=end;}add(source,duration);return plan;}
export function renderPreview(channels,rate,plan){const frames=Math.round(plan.reduce((sum,p)=>sum+p.to-p.from,0)*rate),samples=channels.map(()=>new Float32Array(frames)),fade=Math.round(rate*.012);for(let k=0;k<plan.length;k++){const p=plan[k],start=Math.round(p.time*rate),from=Math.round(p.from*rate),length=Math.round((p.to-p.from)*rate);for(let ch=0;ch<channels.length;ch++){const src=channels[ch],out=samples[ch];for(let i=0;i<length&&start+i<frames;i++)out[start+i]+=src[from+i]*(k&&i<fade?i/fade:1);if(k<plan.length-1)for(let i=0;i<fade&&start+length+i<frames;i++)out[start+length+i]+=(src[from+length+i]||0)*(1-i/fade);}}return samples;}
