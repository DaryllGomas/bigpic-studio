// Musical scheduling is independent of rendering and the audio transport.
export function eligibleSummon(boss, beat) {
 const s=boss.summon;
 return !!s && beat>=s.minBeat && beat%s.downbeat===0
  && !boss.chart.some(n=>n.duration&&n.beat<beat&&n.beat+n.duration>beat-1)
  && !boss.sections.slice(0,-1).some(p=>beat-3<p.beat+4 && beat+s.beats+2>p.beat-2)
  && !(boss.cutins||[]).some(c=>beat-3<c.beat+4 && beat+s.beats+2>c.beat-2);
}
export function nextSummonBeat(boss, after) {
 for(let b=Math.ceil(after/boss.summon.downbeat)*boss.summon.downbeat;b<Math.max(boss.song.beats,after+128);b+=boss.summon.downbeat)if(eligibleSummon(boss,b))return b;
 return null;
}
export function clearSummonChart(notes, start, beats, bounded=false) {
 // These are musical rests, never misses. Keep their identities in the log.
 const cleared=[];
 for(const n of notes)if(n.status==='pending' && n.beat+(n.duration||0)>=start-2 && (!bounded||n.beat<start+beats+3)){n.status='summoned';cleared.push(n.beat);}
 return cleared;
}
export function summonFrame(cue, time, beat, count=8) {
 if(!cue || cue.skipped || time<cue.time || time>=cue.time+cue.beats*beat)return null;
 const progress=(time-cue.time)/beat,frameBeats=cue.beats/count,index=Math.min(count-1,Math.floor((progress+1e-9)/frameBeats));
 return {index,age:(progress-index*frameBeats)*beat,duration:frameBeats*beat};
}
