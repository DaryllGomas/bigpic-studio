import {Music} from '../jam/audio.js';
import {sloth} from './bosses/index.js';
// Same live/offline WebAudio transport and 30ms input compensation as JAM.
export class BeatMusic extends Music {
 constructor(boss=sloth,{endless=false}={}){super();this.endless=endless;this.boss=boss;this.beat=60/boss.song.bpm;this.makeScore();this.cursor=0;this.pieces=[];this.playing=new Set();}
 makeScore(){this.score=[];const {chords,hook,build:buildRange,drop:dropRange,quiet,break:breakRange,roll,lift,intro}=this.boss.song.procedural||{};if(this.boss.song.url||this.boss.song.map)return;
 for(let b=0;b<this.boss.song.beats;b++){const chord=chords[Math.floor(b/8)%chords.length],drop=b>=dropRange[0]&&b<dropRange[1],build=b>=buildRange[0]&&b<buildRange[1],isQuiet=b<quiet[0]||b>=quiet[1];
 const put=(kind,offset=0,extra={})=>this.score.push({kind,time:(b+offset)*this.beat+(this.boss.song.firstBeatOffset??0),...extra});
 if(!(b>=breakRange[0]&&b<breakRange[1])&&(b%2===0||drop&&b%8===7))put('kick');
 if(b%4===2)put('snare');
 if(!isQuiet) {put('hat',.5);if(drop||build)put('hat',0);}
 if(build&&b>=roll){put('snare',.5,{accent:.45});if(b>=breakRange[0])put('snare',.75,{accent:.3});}
 if(b%2===0)put('low',0,{f:chord[(b%8===6)?2:0]/2});
 if(b%2===0||drop)put('lead',.0,{f:chord[hook[Math.floor(b/2)%hook.length]]*(b>=lift?4:2),accent:b<intro?.65:1});
 if(b%8===0)put('chord',0,{chord});
 }
 this.score.sort((a,b)=>a.time-b.time);}
 render(ctx,out,e,at){const a=e.accent??1;
 if(e.kind==='kick'){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(135,at);o.frequency.exponentialRampToValueAtTime(43,at+.16);g.gain.setValueAtTime(.29,at);g.gain.exponentialRampToValueAtTime(.0001,at+.24);o.connect(g);g.connect(out);o.start(at);o.stop(at+.25);if(ctx===this.ctx){this.nodes.add(o);o.onended=()=>this.nodes.delete(o);}return;}
 if(e.kind==='snare'||e.kind==='hat'){const length=e.kind==='snare'?.16:.045,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);let seed=417;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741824-1)*Math.exp(-i/(ctx.sampleRate*length/5));}const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=buffer;f.type='highpass';f.frequency.value=e.kind==='snare'?1100:6500;g.gain.value=(e.kind==='snare'?.12:.045)*a;s.connect(f);f.connect(g);g.connect(out);s.start(at);if(e.kind==='snare')this.tone(ctx,out,at,175,.12,.065*a,'triangle');if(ctx===this.ctx){this.nodes.add(s);s.onended=()=>this.nodes.delete(s);}return;}
 if(e.kind==='low'){this.tone(ctx,out,at,e.f,.45,.14,'triangle');this.tone(ctx,out,at,e.f*2,.2,.025);return;}
 if(e.kind==='lead'){this.tone(ctx,out,at,e.f,.3,.055*a,'triangle');this.tone(ctx,out,at+.16,e.f,.27,.015*a,'sine');return;}
 if(e.kind==='chord'){e.chord.forEach(f=>this.tone(ctx,out,at,f,this.beat*5,.018,'sine'));return;}
 if(e.kind==='good'){this.tone(ctx,out,at,440,.15,.075,'triangle');return;}
 if(e.kind==='miss'){this.tone(ctx,out,at,82.41,.24,.05,'triangle');return;}
 if(e.kind==='sting'){[293.66,349.23,440,587.33].forEach((f,i)=>this.tone(ctx,out,at+i*.065,f,.65,.045,'triangle'));return;}
 super.render(ctx,out,e,at);
 }
 async unlock(time){await super.unlock(time);if(this.boss.song.url||this.boss.song.map){
  const decode=async url=>this.ctx.decodeAudioData(await (await fetch(url).then(r=>{if(!r.ok)throw new Error('Audio load failed: '+url);return r;})).arrayBuffer());
  if(this.boss.song.map){this.buffer=await decode(this.boss.song.map.audio);if((this.boss.song.firstBeatOffset||0)+this.boss.song.beats*this.beat>this.buffer.duration+.01)throw Error('Song map extends past the full WAV');this.endless=false;this.mapSources=new Map();}
  else if(this.boss.song.pieces){const b={};for(const [k,url] of Object.entries(this.boss.song.pieces))b[k]=await decode(url);
   this.buffers=b;let t=0;this.pieces=[{buf:b.intro,time:t}];t+=b.intro.duration;
   while(t<this.boss.song.beats*this.beat+(this.boss.song.firstBeatOffset||0)-.01){this.pieces.push({buf:b.loop,time:t});t+=b.loop.duration;}
   if(!this.endless){this.pieces.push({buf:b.outro,time:t});this.endTime=t+b.outro.duration;}
  }else if(this.boss.song.loopRegion){
   const original=await decode(this.boss.song.url),{start,end,passes}=this.boss.song.loopRegion;
   if(!(end>start&&start>=0&&end<=original.duration))throw Error('Invalid loop points');
   const slice=(a,b)=>{const buf=this.ctx.createBuffer(original.numberOfChannels,Math.max(1,Math.round((b-a)*original.sampleRate)),original.sampleRate);for(let ch=0;ch<original.numberOfChannels;ch++)buf.copyToChannel(original.getChannelData(ch).subarray(Math.round(a*original.sampleRate),Math.round(b*original.sampleRate)),ch);return buf;};
   this.buffers={intro:slice(0,start),loop:slice(start,end),outro:slice(end,original.duration)};let t=0;this.pieces=[{buf:this.buffers.intro,time:0}];t+=this.buffers.intro.duration;for(let i=0;i<passes;i++){this.pieces.push({buf:this.buffers.loop,time:t});t+=this.buffers.loop.duration;}if(!this.endless){this.pieces.push({buf:this.buffers.outro,time:t});this.endTime=t+this.buffers.outro.duration;}
  }else this.buffer ||= await decode(this.boss.song.url);
  this.epoch=this.ctx.currentTime-time;this.resumeTrack(time);
 }}
 playPiece(ctx,out,p,at,offset=0){const source=ctx.createBufferSource();source.buffer=p.buf;const gain=(p.fadeIn||p.stop!==undefined)?ctx.createGain():null;source.connect(gain||out);if(gain)gain.connect(out);if(p.fadeIn){gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+this.beat);}if(p.stop!==undefined){const stop=at+p.stop-p.time-offset;gain.gain.setValueAtTime(1,Math.max(at,stop-this.beat));gain.gain.linearRampToValueAtTime(0,stop);source._stopAt=stop;}source.start(at,offset);if(source._stopAt!==undefined)source.stop(source._stopAt);if(ctx===this.ctx){this.nodes.add(source);source.onended=()=>this.nodes.delete(source);}}
 resumeTrack(time){if(this.boss.song.map){this.syncMap(time);return;}if(this.pieces.length){this.syncTime(time);return;}if(!this.buffer)return;this.playPiece(this.ctx,this.ctx.destination,{buf:this.buffer},this.ctx.currentTime,Math.min(time,this.buffer.duration));}
 cut(){super.cut();this.playing.clear();this.mapSources?.clear();}
 finishAt(time){if(!this.buffers||this.finishTime!==undefined)return;this.finishTime=time;this.cut();let last=this.pieces.at(-1);while(last.time+last.buf.duration<time+this.beat){last={buf:this.buffers.loop,time:last.time+last.buf.duration};this.pieces.push(last);}this.pieces=this.pieces.filter(p=>p.time<time+this.beat);for(const p of this.pieces)if(p.time+p.buf.duration>time-this.beat)p.stop=time+this.beat;this.pieces.push({buf:this.buffers.outro,time,fadeIn:true});this.endTime=time+this.buffers.outro.duration;this.resumeTrack(this.ctx.currentTime-this.epoch);}
 syncTime(time){if(!this.ctx)return;if(this.boss.song.map){this.syncMap(time);return;}
 // Queue separate sources; never use Chromium's problematic loop flag.
 const transport=this.ctx.currentTime-this.epoch;
 if(this.endless&&this.finishTime===undefined&&this.buffers){let last=this.pieces.at(-1);while(last.time+last.buf.duration<transport+1){last={buf:this.buffers.loop,time:last.time+last.buf.duration};this.pieces.push(last);}}
 for(const p of this.pieces){if(this.playing.has(p)||p.time>transport+.5||p.time+p.buf.duration<=transport)continue;this.playing.add(p);const at=Math.max(this.ctx.currentTime,this.epoch+p.time);this.playPiece(this.ctx,this.ctx.destination,p,at,Math.max(0,transport-p.time));}
 while(this.cursor<this.score.length&&this.score[this.cursor].time<=time+.14){const e=this.score[this.cursor++];if(e.time>=time-.15)this.render(this.ctx,this.ctx.destination,e,Math.max(this.ctx.currentTime+.001,this.epoch+e.time));}}
 playMapPiece(ctx,out,p,at,elapsed=0){
 const source=ctx.createBufferSource(),gain=ctx.createGain(),fade=.012;source.buffer=this.buffer;source.connect(gain);gain.connect(out);
 const length=p.duration-elapsed,offset=p.offset+elapsed,tail=Math.max(0,Math.min(fade,this.buffer.duration-offset-length));
 gain.gain.setValueAtTime(elapsed>0?1:0,at);gain.gain.linearRampToValueAtTime(1,at+Math.min(fade,length));gain.gain.setValueAtTime(1,at+Math.max(0,length-(tail?0:fade)));gain.gain.linearRampToValueAtTime(0,at+length+tail);source.start(at,Math.max(0,offset),Math.max(.00001,length+tail));
 if(ctx===this.ctx){this.nodes.add(source);source.onended=()=>this.nodes.delete(source);}source._mapGain=gain;return source;
 }
 mapPlan(){if(!this.mapTimeline||!this.buffer)return [];const offset=this.boss.song.firstBeatOffset||0;
 const plan=this.mapTimeline.plan.map((s,i)=>({key:s.at+':'+s.from+':'+s.to,time:i===0?0:offset+s.at*this.beat,offset:i===0?0:offset+s.from*this.beat,duration:(s.to-s.from)*this.beat+(i===0?offset:0),final:s.to===this.boss.song.beats}));
 // Include the WAV tail after its last complete chart beat.
 const last=plan.at(-1);if(last?.final)last.duration=this.buffer.duration-last.offset;
 return plan;
 }
 syncMap(time){if(!this.ctx||!this.buffer||!this.mapTimeline)return;
 const timeline=this.mapTimeline,transport=this.ctx.currentTime-this.epoch,offset=this.boss.song.firstBeatOffset||0;
 const plan=this.mapPlan();
 for(const [key,item] of this.mapSources)if(item.time>transport&&!plan.some(p=>p.key===key)){try{item.source.stop();}catch{}this.mapSources.delete(key);}
 for(const p of plan){const previous=[...this.mapSources.entries()].find(([key,item])=>key!==p.key&&item.time<=transport&&item.time===p.time);if(previous&&previous[1].offset!==p.offset){const [key,item]=previous;item.source.stop(this.ctx.currentTime);this.mapSources.delete(key);}else if(previous){const [key,item]=previous,stop=this.epoch+p.time+p.duration;item.source._mapGain.gain.cancelScheduledValues(this.ctx.currentTime);item.source._mapGain.gain.setValueAtTime(1,this.ctx.currentTime);item.source._mapGain.gain.setValueAtTime(1,Math.max(this.ctx.currentTime,stop));item.source._mapGain.gain.linearRampToValueAtTime(0,stop+.012);item.source.stop(stop+.012);this.mapSources.delete(key);this.mapSources.set(p.key,item);}if(this.mapSources.has(p.key)||p.time>transport+.5||p.time+p.duration<=transport)continue;const at=Math.max(this.ctx.currentTime,this.epoch+p.time),elapsed=Math.max(0,transport-p.time),source=this.playMapPiece(this.ctx,this.ctx.destination,p,at,elapsed);this.mapSources.set(p.key,{source,time:p.time,offset:p.offset});}
 this.mapPieces=plan;if(Number.isFinite(timeline.endBeat))this.endTime=offset+timeline.endBeat*this.beat+Math.max(0,this.buffer.duration-(offset+this.boss.song.beats*this.beat));
 }
 feedback(kind,time){const e={kind,time};this.fx||=[];this.fx.push(e);if(this.ctx)this.render(this.ctx,this.ctx.destination,e,this.ctx.currentTime+.001);}
 async wav(duration){if(this.boss.song.map){const score=this.score,render=this.render;this.render=(ctx,out,e,at)=>e.kind==='map-piece'?this.playMapPiece(ctx,out,e.p,at):render.call(this,ctx,out,e,at);this.score=[...(this.fx||[]),...this.mapPlan().map(p=>({kind:'map-piece',p,time:p.time}))].map(e=>({...e,time:e.time-.05}));try{return await super.wav(duration);}finally{this.score=score;this.render=render;}}const score=this.score,render=this.render;this.render=(ctx,out,e,at)=>e.kind==='piece'?this.playPiece(ctx,out,e.p,at):render.call(this,ctx,out,e,at);this.score=[...score,...(this.fx||[]),...this.pieces.map(p=>({kind:'piece',p,time:p.time}))].map(e=>({...e,time:e.time-.05}));try{return await super.wav(duration);}finally{this.score=score;this.render=render;}}
}
