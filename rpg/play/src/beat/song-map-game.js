import {updateFinisher,finishMove} from './finisher.js';
import {SongTimeline,barBeat} from './song-map.js';
const eps=1e-8;
export function resetMapGame(g){g.mapTimeline=new SongTimeline(g.boss.song);g.mapTimeline.summonOff=g.summonMode==='off'||!g.boss.summon;g.notes=[];g.mapSeen=new Set();g.mapPlanKey=null;g.mapMovieEnded=false;syncNotes(g);}
function syncNotes(g){
 const plan=g.mapTimeline.plan,key=plan.map(s=>`${s.at}:${s.from}:${s.to}`).join(',')+':'+g.summonUsed+':'+g.endingTime;if(g.mapPlanKey===key)return;g.mapPlanKey=key;
 // Preserve identities and judgments; only replace unplayed forecast notes.
 const wanted=new Map();for(const s of plan)for(const n of g.boss.chart)if(n.beat>=s.from&&n.beat<s.to){const beat=s.at+n.beat-s.from,key=beat+':'+n.beat;wanted.set(key,{...n,songBeat:n.beat,beat,duration:Math.min(n.duration,s.to-n.beat),status:g.summonUsed&&!g.boss.finisher||g.finisherUsed||g.endingTime!==null?'summoned':'pending',mapKey:key});}
 const old=new Map(g.notes.map(n=>[n.mapKey,n]));g.notes=[...wanted].map(([key,n])=>old.get(key)||n);for(const n of old.values())if(!wanted.has(n.mapKey)&&n.status!=='pending')g.notes.push(n);g.notes.sort((a,b)=>a.beat-b.beat);
}
export function endMapSummon(g,time){if(g.boss.finisher){finishMove(g,time);return;}if(g.mapMovieEnded)return;g.mapMovieEnded=true;const b=(time-g.offset)/g.beat;g.mapTimeline.releaseBeat=Math.ceil((b-eps)/4)*4;g.mapTimeline.advance((g.time-g.offset)/g.beat);syncNotes(g);
 // The summon ends the fight (Daryll, 2026-10-17): in a song that plays straight through, every ring after the movie rests.
 if(!g.mapTimeline.holds.length)for(const n of g.notes)if(n.status==='pending'&&n.beat>=b-eps)n.status='summoned';}
function cues(g,b){const timeline=g.mapTimeline;
 for(const s of timeline.segments){const fire=(kind,cue,fn)=>{const key=kind+':'+cue.beat;if(g.mapSeen.has(key)||cue.beat<s.from||cue.beat>=s.to)return;const at=s.at+cue.beat-s.from;if(at>b+eps)return;g.mapSeen.add(key);fn(at);};
  for(const cue of g.boss.wakeStages?.cues||[])fire('wake',cue,at=>{if(g.boss.finisher&&g.summonUsed)return;const notes=g.notes.filter(n=>n.status!=='summoned'&&n.beat<at&&n.songBeat>=cue.start&&n.songBeat<cue.beat),ratio=notes.length?notes.filter(n=>['perfect','good'].includes(n.status)).length/notes.length:0,previous=g.stage;g.stage=ratio>=g.boss.wakeStages.threshold?Math.max(previous,Math.min(previous+1,cue.stage)):Math.max(0,previous-1);if(g.boss.finisher)g.stage=Math.min(g.stage,Math.max(0,g.boss.wakeStages.poses.length-3));const change={type:'stage',previous,stage:g.stage,beat:at,ratio,time:g.offset+at*g.beat};g.stageChanges.push(change);g.emit(change);});
  for(const cue of g.boss.cutins||[])fire('cutin',cue,at=>{const e={...cue,beat:at,time:g.offset+at*g.beat};g.cutins.push(e);g.emit({type:'cutin',...e});});
  for(const p of g.boss.sections.slice(0,-1))fire('panel',p,at=>{const notes=g.notes.filter(n=>n.status!=='summoned'&&n.beat<at&&n.songBeat>=p.start&&n.songBeat<p.beat),ratio=notes.length?notes.filter(n=>['perfect','good'].includes(n.status)).length/notes.length:0,good=ratio>=.7;const panel={...p,id:p.caption?p.id:p.id+(good?'-good':'-stumble'),caption:p.caption||(good?p.good:p.stumble),ratio,time:g.offset+at*g.beat};g.panels.push(panel);g.emit({type:'panel',...panel});});
 }
}
export function updateMapGame(g,dt){
 // Resolve boundaries in chronological order even during a seek or slow frame.
 const target=g.time+Math.max(0,dt);do{const elapsed=Math.min(.025,target-g.time);g.time=Math.min(target,g.time+.025);const b=(g.time-g.offset)/g.beat,t=g.mapTimeline,movie=g.summons.at(-1);
 if(movie&&!movie.ended&&!g.mapMovieEnded&&(movie.skipped||g.time>=movie.time+movie.beats*g.beat))endMapSummon(g,movie.skipped?g.time:movie.time+movie.beats*g.beat);
 updateFinisher(g);t.meterFull=g.summonMeter>=1;t.advance(b);syncNotes(g);
 if(g.boss.summon&&g.summonMode!=='off'&&!g.summonUsed&&!g.finisherUsed&&g.finisherRing===null){const s=t.locate(b),h=t.holds.find(h=>h.id===s.hold),afterMeter=t.holds.some(h=>h.release==='meter'&&t.segments.some(s=>s.hold===h.id)&&t.songBeat(b)>=barBeat(h.endBar));const finaleBeat=Number.isFinite(g.boss.summon.minBeat)?g.boss.summon.minBeat:barBeat(g.boss.song.map?.finaleBar||1),straight=!t.holds.length&&t.songBeat(b)>=finaleBeat-(g.boss.finisher?8:0);   // no holds: the song plays straight through and the summon comes on the final crescendo (Daryll, 2026-10-18)
 if(straight&&g.summonMeter<1)g.summonMeter=Math.min(1,g.summonMeter+(g.boss.finisher?elapsed/(4*g.beat):1/(60*8)));   // never stuck: the meter tops itself up over the finale's first bars
 const allowed=h?.release==='summon'||afterMeter||straight;
 if(g.summonRing!==null&&b-g.latency/g.beat>g.summonRing+g.summonWindow/g.beat+eps){g.summonRing=null;g.emit({type:'summon-miss'});}
 if(allowed&&g.summonMeter>=1&&g.summonRing===null){const ring=Math.ceil(Math.max(b+g.boss.summon.leadBeats,g.boss.finisher?g.boss.summon.minBeat:0)/4)*4;const songRing=t.songBeat(b)+ring-b;const protectedCue=g.boss.sections.slice(0,-1).some(p=>!g.mapSeen.has('panel:'+p.beat)&&(g.boss.finisher?songRing<p.beat+3&&songRing+g.boss.summon.beats>p.beat:Math.abs(p.beat-songRing)<g.boss.summon.beats+4))||(g.boss.cutins||[]).some(c=>!g.mapSeen.has('cutin:'+c.beat)&&(g.boss.finisher?songRing<c.beat+c.duration/g.beat+3&&songRing+g.boss.summon.beats>c.beat:Math.abs(c.beat-songRing)<g.boss.summon.beats+4));if(!protectedCue&&!g.notes.some(n=>n.status==='holding'&&n.beat+n.duration>=ring-1)&&(h?.release==='summon'||ring<t.endBeat-g.boss.summon.beats)){g.summonRing=ring;}}
 // A quiet hold with no authored hits must still be completable.
 if(h&&(h.release==='summon'||h.release==='meter')&&g.time>g.offset+(s.at+4)*g.beat)g.summonMeter=Math.min(1,g.summonMeter+elapsed/(40*g.beat));
 }
 for(const n of g.notes){if(n.status==='pending'&&n.beat===g.summonRing){n.status='summoned';n.summonRing=true;}if(n.status==='pending'&&g.time-g.latency>n.beat*g.beat+g.offset+g.goodWindow+eps)g.finish(n,'miss');if(n.status==='holding'&&g.time-g.latency>=(n.beat+n.duration)*g.beat+g.offset){g.finish(n,n.startGrade);g.active=null;}}
 if(movie&&movie.kind!=='finisher'&&!movie.awakened&&g.time>=movie.time+g.boss.summon.wakeBeat*g.beat){movie.awakened=true;const previous=g.stage;g.wake=Math.min(1,g.wake+g.boss.summon.wake);g.stage=Math.min(g.boss.wakeStages.poses.length-(g.boss.finisher?2:1),g.stage+1);const change={type:'stage',previous,stage:g.stage,time:movie.time+g.boss.summon.wakeBeat*g.beat};g.stageChanges.push(change);g.emit(change);g.emit({type:'summon-impact',time:change.time});}
 if(g.endingTime===null)cues(g,b);
 const finale=g.boss.song.map.finaleBar,finaleSong=finale?barBeat(finale):g.boss.song.beats;let ending=Infinity;
 for(const s of t.segments)if(finaleSong>=s.from&&(finaleSong<s.to||s.to===g.boss.song.beats&&finaleSong===s.to))ending=Math.min(ending,s.at+finaleSong-s.from);
 if(!g.boss.finisher&&b>=ending&&g.endingTime===null){g.endingTime=g.offset+ending*g.beat;for(const n of g.notes)if(n.status==='pending')n.status='summoned';const p=g.boss.sections.at(-1);g.panels.push({...p,caption:p.caption||p.good,time:g.endingTime});g.emit({type:'panel',...g.panels.at(-1)});g.stage=g.boss.wakeStages.poses.length-1;g.wake=1;}
 if((!g.boss.finisher||g.finisherUsed&&g.endingTime!==null||b>=t.endBeat+2)&&b>=t.endBeat&&g.time>=Math.max(g.offset+t.endBeat*g.beat,(g.endingTime??0)+4)){g.phase='end';g.emit({type:'end'});break;}
 }while(g.time<target-eps);
}
