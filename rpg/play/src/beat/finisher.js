// Both movies share input, skip and replay machinery. Only the last move ends a fight.
export function updateFinisher(g){
 const f=g.boss.finisher;if(!f||g.finisherUsed||g.endingTime!==null)return;
 const b=(g.time-g.offset-g.latency)/g.beat,m=g.summons.at(-1);
 if(m&&!m.skipped&&g.time<m.time+m.beats*g.beat)return;
 const songBeat=g.mapTimeline?g.mapTimeline.songBeat(b):b;
 if(songBeat<f.minBeat-4)return;
 if(g.finisherRing!==null&&b>g.finisherRing+Math.max(g.goodWindow,f.window)/g.beat+1e-8){g.finisherRing=null;g.emit({type:'finisher-miss'});}
 if(g.finisherRing===null){g.finisherRing=Math.ceil(Math.max(b+3,(b-songBeat)+f.minBeat)/4-1e-8)*4;g.summonRing=null;
 for(const n of g.notes)if(n.status==='pending'&&n.beat>=g.finisherRing-2&&n.beat<=g.finisherRing){n.status='summoned';}}
}
export function finishMove(g,time){
 const m=g.summons.at(-1);if(!m||m.ended)return;m.ended=true;
 if(m.kind!=='finisher'){
  if(!m.awakened){m.awakened=true;const previous=g.stage;g.stage=Math.min((g.boss.wakeStages?.poses.length||2)-2,g.stage+1);g.wake=Math.min(1,g.wake+g.boss.summon.wake);const e={type:'stage',previous,stage:g.stage,time};g.stageChanges.push(e);g.emit(e);g.emit({type:'summon-impact',time});}
  if(g.mapTimeline)g.mapTimeline.releaseBeat=Math.ceil(((time-g.offset)/g.beat-1e-8)/4)*4;
  return;
 }
 if(g.endingTime!==null)return;
 g.endingTime=time;g.panelIndex=g.boss.sections.length;const previous=g.stage;g.stage=(g.boss.wakeStages?.poses.length||1)-1;g.wake=1;
 for(const n of g.notes)if(n.status==='pending')n.status='summoned';
 const e={type:'stage',previous,stage:g.stage,time};g.stageChanges.push(e);g.emit(e);g.emit({type:'finisher-impact',time});
 const p=g.boss.sections.at(-1),panel={...p,caption:p.caption||p.good,time};g.panels.push(panel);g.emit({type:'panel',...panel});
 // Mapped songs keep their full audio tail; legacy transports switch to their outro.
 if(!g.mapTimeline)g.emit({type:'outro',time});
}
