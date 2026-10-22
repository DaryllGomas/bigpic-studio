import {updateFinisher,finishMove} from './finisher.js';
import {updateMapGame,resetMapGame,endMapSummon} from './song-map-game.js';
import {nextSummonBeat,clearSummonChart} from './summon.js';
import {sloth,validateBoss} from './bosses/index.js';
export class BeatGame {
 constructor({assist=false,latency=.03,boss=sloth,summon='on'}={}) {this.summonMode=summon;this.boss=validateBoss(boss);this.beat=60/boss.song.bpm;this.offset=boss.song.firstBeatOffset??0;this.assist=assist;this.latency=latency;this.reset();}
 reset(){this.time=0;this.phase='ready';this.notes=this.boss.chart.map(n=>({...n,status:'pending'}));this.down=false;this.active=null;this.combo=0;this.maxCombo=0;this.perfects=0;this.goods=0;this.misses=0;this.wake=this.boss.wake.initial;this.events=[];this.history=[];this.panels=[];this.panelIndex=0;this.stage=0;this.stageIndex=0;this.stageChanges=[];this.cutins=[];this.cutinIndex=0;this.summonMeter=this.summonMode==='full'?1:0;this.summonRing=null;this.summons=[];this.summonUsed=false;this.finisherRing=null;this.finisherUsed=false;this.endingTime=null;this.extendedTo=this.boss.song.beats;if(this.boss.song.map)resetMapGame(this);}
 get perfectWindow(){return .07*(this.assist?2:1);}
 get goodWindow(){return .15*(this.assist?2:1);}
 get summonWindow(){return Math.max(this.goodWindow,this.boss.summon?.window||0);}
 emit(e){e={time:this.time,...e};this.events.push(e);this.history.push(e);this.boss.twist?.onEvent?.(e,this);}
 start(){this.reset();this.phase='play';this.update(0);}
 press(){if(this.down)return;if(this.phase==='ready'||this.phase==='end'){this.start();this.down=true;return;}this.down=true;if(this.phase!=='play')return;
 const t=this.time-this.latency;
 if(this.finisherRing!==null && Math.abs(t-(this.offset+this.finisherRing*this.beat))<=Math.max(this.goodWindow,this.boss.finisher.window)+1e-8){this.fireFinisher();return;}
 if(this.summonRing!==null && Math.abs(t-(this.offset+this.summonRing*this.beat))<=this.summonWindow+1e-8){this.fireSummon();return;}
 if(this.summons.some(c=>!c.skipped&&this.time>=c.time&&this.time<c.time+c.beats*this.beat))return;
 const n=this.notes.find(n=>n.status==='pending'&&Math.abs(n.beat*this.beat+this.offset-t)<=this.goodWindow+1e-8);
 if(!n)return;
 n.ms=(t-(n.beat*this.beat+this.offset))*1000;
 const grade=Math.abs(n.beat*this.beat+this.offset-t)<=this.perfectWindow+1e-8?'perfect':'good';
 if(n.type==='tap')this.finish(n,grade);else {n.status='holding';n.startGrade=grade;this.active=n;this.emit({type:'hold',note:this.notes.indexOf(n)});}
 }
 release(){if(!this.down)return;this.down=false;if(!this.active)return;
 const n=this.active,end=(n.beat+n.duration)*this.beat+this.offset;
 this.finish(n,this.time-this.latency>=end-(n.type==='charge'?0:this.beat/2)-1e-8?n.startGrade:'good');this.active=null;
 }
 finish(n,grade){n.status=grade;n.grade=grade;if(grade==='miss')n.ms=null;this.combo=grade==='miss'?0:this.combo+1;this.maxCombo=Math.max(this.maxCombo,this.combo);this[grade==='perfect'?'perfects':grade==='good'?'goods':'misses']++;this.wake=Math.max(this.boss.wake.min,Math.min(1,this.wake+this.boss.wake[grade]));if(this.boss.summon && this.summonMode!=='off' && !this.summonUsed && this.summonMeter<1){const m=this.boss.summon.meter,b=(this.time-this.offset)/this.beat;this.summonMeter=Math.max(0,Math.min(b<Math.max(this.boss.summon.fullBeat||0,this.boss.summon.minBeat) ? .95 : 1,this.summonMeter+m[grade]*(grade==='miss'?1:1+Math.max(0,Math.floor((b-this.boss.song.beats)/(this.boss.song.loopBeats||16)))*.3)));}
 this.emit({type:'grade',grade,note:this.notes.indexOf(n),beat:n.beat,ms:n.ms,parry:n.parry,burst:n.type==='charge'&&grade==='perfect'});}
 fireSummon(){const beat=this.summonRing,s=this.boss.summon;this.summonRing=null;this.summonUsed=true;this.summonMeter=0;const cue={beat,time:beat*this.beat+this.offset,beats:s.beats,cleared:clearSummonChart(this.notes,beat,s.beats,!!this.boss.finisher)};this.summons.push(cue);if(this.mapTimeline)this.mapTimeline.releaseBeat=Math.ceil((beat+s.beats-1e-8)/4)*4;this.emit({type:'summon',...cue});}
 fireFinisher(){const s=this.boss.finisher,beat=this.finisherRing;this.finisherRing=null;this.finisherUsed=true;const cue={kind:'finisher',beat,time:this.offset+beat*this.beat,beats:s.beats,cleared:clearSummonChart(this.notes,beat,s.beats)};this.summons.push(cue);this.emit({type:'finisher',...cue});}
 endSummon(atTime=this.time){if(this.boss.finisher){finishMove(this,atTime);return;}if(this.boss.song.map){endMapSummon(this,atTime);return;}if(this.endingTime!==null)return;const b=(atTime-this.offset)/this.beat;this.panelIndex=this.boss.sections.length-1;this.endingTime=this.offset+Math.ceil((b-1e-8)/4)*4*this.beat;const movie=this.summons.at(-1);if(movie&&!movie.awakened){movie.awakened=true;this.emit({type:'summon-impact',time:atTime});}this.stage= (this.boss.wakeStages?.poses.length||1)-1;this.wake=1;const change={type:'stage',previous:0,stage:this.stage,time:this.time};this.stageChanges.push(change);this.emit(change);this.emit({type:'outro',time:this.endingTime});}
 skipSummon(){const c=this.summons.at(-1);if(!c||c.skipped||this.time>=c.time+c.beats*this.beat)return false;c.skipped=true;this.endSummon();this.emit({type:'summon-skip'});return true;}
 update(dt){if(this.phase!=='play')return;if(this.boss.song.map){updateMapGame(this,dt);return;}this.time+=Math.max(0,dt);updateFinisher(this);
 const endless=this.boss.summon&&this.summonMode!=='off';
 if(endless&&!this.summonUsed&&!this.finisherUsed){while(this.time+8*this.beat>=this.offset+this.extendedTo*this.beat){const start=this.boss.song.loopStartBeat??132,len=this.boss.song.loopBeats??16;const phraseStart=start+(Math.floor((this.extendedTo-start)/len)%3)*len;const phrase=this.boss.chart.filter(n=>n.beat>=phraseStart&&n.beat<phraseStart+len);this.notes.push(...phrase.map(n=>({...n,beat:n.beat-phraseStart+this.extendedTo,status:'pending'})));this.extendedTo+=len;}
 const extra=Math.max(0,(this.time-this.offset)/this.beat-this.boss.song.beats);if(extra>0)this.summonMeter=Math.min(1,this.summonMeter+dt/(40*this.beat));}
 const movie=this.summons.at(-1);if(movie&&!movie.skipped&&this.time>=movie.time+movie.beats*this.beat)this.endSummon(movie.time+movie.beats*this.beat);
 if(this.boss.summon&&this.summonMode!=='off'&&!this.summonUsed&&!this.finisherUsed&&this.finisherRing===null){const b=(this.time-this.offset-this.latency)/this.beat;if(this.summonRing!==null&&b>this.summonRing+this.summonWindow/this.beat+1e-8){this.summonRing=null;this.emit({type:'summon-miss'});}if(this.summonMeter>=1&&this.summonRing===null){this.summonRing=nextSummonBeat(this.boss,b+this.boss.summon.leadBeats);for(const n of this.notes)if(n.status==='pending'&&n.beat===this.summonRing){n.status='summoned';n.summonRing=true;}}}
 if(endless&&!this.summonUsed&&!this.boss.finisher&&(this.time-this.offset)/this.beat>=this.boss.song.beats+3*(this.boss.song.loopBeats||16)){this.summonRing=this.boss.song.beats+3*(this.boss.song.loopBeats||16);this.fireSummon();}
 for(const c of this.summons)if(c.kind!=='finisher'&&!c.awakened&&this.time>=c.time+this.boss.summon.wakeBeat*this.beat){c.awakened=true;this.wake=Math.min(1,this.wake+this.boss.summon.wake);const previous=this.stage;this.stage=Math.min((this.boss.wakeStages?.poses.length||1)-(this.boss.finisher?2:1),this.stage+1);const change={type:'stage',previous,stage:this.stage,beat:c.beat+this.boss.summon.wakeBeat,time:c.time+this.boss.summon.wakeBeat*this.beat};this.stageChanges.push(change);this.emit(change);this.emit({type:'summon-impact',time:change.time});}
 for(const n of this.notes){if(n.status==='pending'&&this.time-this.latency>n.beat*this.beat+this.offset+this.goodWindow+1e-8)this.finish(n,'miss');if(n.status==='holding'&&this.time-this.latency>=(n.beat+n.duration)*this.beat+this.offset){this.finish(n,n.startGrade);this.active=null;}}
 for(const cue of (this.boss.wakeStages?.cues||[]).slice(this.stageIndex)){
 if(this.endingTime!==null||this.summonUsed)break;
 if(this.time<cue.beat*this.beat+this.offset)break;
 this.stageIndex++;const notes=this.notes.filter(n=>n.status!=='summoned'&&n.beat>=cue.start&&n.beat<cue.beat),ratio=notes.length?notes.filter(n=>['perfect','good'].includes(n.status)).length/notes.length:0;
 const previous=this.stage;this.stage=ratio>=this.boss.wakeStages.threshold?Math.max(previous,Math.min(previous+1,cue.stage)):Math.max(0,previous-1);
 if(this.boss.finisher)this.stage=Math.min(this.stage,Math.max(0,this.boss.wakeStages.poses.length-3));const change={type:'stage',previous,stage:this.stage,beat:cue.beat,ratio,time:cue.beat*this.beat+this.offset};this.stageChanges.push(change);this.emit(change);
 }
 while((!this.summonUsed||this.boss.finisher&&!this.finisherUsed)&&this.cutinIndex<(this.boss.cutins?.length||0)&&this.time>=this.boss.cutins[this.cutinIndex].beat*this.beat+this.offset){const cue=this.boss.cutins[this.cutinIndex++];const event={...cue,time:cue.beat*this.beat+this.offset};this.cutins.push(event);this.emit({type:'cutin',...event});}
 while((!this.summonUsed||this.boss.finisher||this.endingTime!==null)&&this.panelIndex<this.boss.sections.length&&this.time>=(endless&&this.panelIndex===this.boss.sections.length-1?(this.endingTime??Infinity):this.boss.sections[this.panelIndex].beat*this.beat+this.offset)){const p=this.boss.sections[this.panelIndex++],section=this.notes.filter(n=>n.status!=='summoned'&&n.beat>=p.start&&n.beat<p.beat),ratio=section.filter(n=>['good','perfect'].includes(n.status)).length/section.length,good=ratio>=.7;const panel={...p,id:p.caption?p.id:p.id+(good?'-good':'-stumble'),caption:p.caption||(good?p.good:p.stumble),ratio,time:endless&&p===this.boss.sections.at(-1)?this.endingTime:p.beat*this.beat+this.offset};this.panels.push(panel);this.emit({type:'panel',...panel});}
 if(this.time>=(endless?(this.endingTime??Infinity)+4:this.boss.song.beats*this.beat+this.offset+4)){this.phase='end';this.emit({type:'end'});}}
 get grade(){const ratio=(this.perfects+this.goods*.7)/this.notes.filter(n=>n.status!=='summoned').length;return ratio>=.95?'S':ratio>=.8?'A':ratio>=.6?'B':'C';}
 snapshot(){return {...(this.mapTimeline?{songBeat:this.mapTimeline.songBeat((this.time-this.offset)/this.beat),holds:this.mapTimeline.segments.map(s=>({...s}))}:{}),finisherRing:this.finisherRing,finisherUsed:this.finisherUsed,endingTime:this.endingTime,summonMeter:this.summonMeter,summonRing:this.summonRing,summons:this.summons,time:this.time,phase:this.phase,combo:this.combo,maxCombo:this.maxCombo,perfects:this.perfects,goods:this.goods,misses:this.misses,wake:this.wake,grade:this.grade,notes:this.notes,panels:this.panels,history:this.history,stage:this.stage,stageChanges:this.stageChanges,cutins:this.cutins};}
}
