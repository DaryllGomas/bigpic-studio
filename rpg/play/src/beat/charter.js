import {validateBoss} from './bosses/index.js';
// Shared, DOM-free authoring operations. Tags deliberately never enter gameplay.
export const clone = value => JSON.parse(JSON.stringify(value));
export const snap = (beat, step=.5) => Math.max(0,Math.round(beat/step)*step);
export const draftKey = id => 'atlas.charter.'+id;
export function tagsForSave(tags,song){return tags.map(t=>({beat:t.beat,endBeat:Math.max(t.beat,t.endBeat??t.beat),bar:Math.floor(t.beat/4)+1,time:(song.firstBeatOffset||0)+t.beat*60/song.bpm,text:t.text||''}));}
export function tagsMarkdown(tags,song){return '# Animation shot list\n\n'+tagsForSave(tags,song).map((t,i)=>`${i+1}. **${t.time.toFixed(2)} s · bar ${t.bar} · beat ${t.beat}${t.endBeat>t.beat?'–'+t.endBeat:''}** — ${t.text||'(description to follow)'}`).join('\n\n')+'\n';}
export function replaceStretch(original,marks,start,end){return [...original.filter(n=>n.beat<start||n.beat>end),...marks].sort((a,b)=>a.beat-b.beat).map((n,i)=>({...n,number:i%4+1}));}
export function warnings(boss){const notes=boss.chart,issues=[];let run=1;
 for(let i=1;i<notes.length;i++){const gap=notes[i].beat-notes[i-1].beat;if(gap<2&&notes[i].type==='tap'&&notes[i-1].type==='tap')issues.push(`Beat ${notes[i].beat}: taps less than 2 beats apart`);run=gap<=2?run+1:1;if(run===5)issues.push(`Beat ${notes[i].beat}: more than 4 notes in a row`);}
 for(const p of boss.sections.slice(0,-1))if(notes.some(n=>n.beat>=p.beat&&n.beat<p.beat+4||n.beat<p.beat&&n.beat+n.duration>p.beat))issues.push(`Bar ${Math.floor(p.beat/4)+1}: leave 4 beats clear after the panel`);
 if(boss.summon?.movieBeat!=null&&notes.some(n=>n.beat+n.duration>=boss.summon.movieBeat&&n.beat<boss.summon.movieBeat+boss.summon.beats))issues.push('Notes overlap the planned summon movie');
 return issues;
}
export function scaffold(base,{id,name,bpm,firstBeatOffset=0,url,pieces,loopStartBeat=132,loopBeats=16,passes=4,beats=196}){const b=clone(base);Object.assign(b,{id,name,chart:[]});b.song={bpm,firstBeatOffset,beats,url:pieces?.intro||url,...(pieces?{pieces,passes,loopStartBeat,loopBeats}:{})};const boundaries=[Math.round(beats*.16/4)*4,Math.round(beats*.49/4)*4,Math.round(beats*.67/4)*4,beats];b.sections.forEach((p,i)=>{p.beat=boundaries[i];p.start=i?boundaries[i-1]:0;});b.cutins.forEach((c,i)=>c.beat=boundaries[i+1]);b.wakeStages.cues.forEach((c,i)=>{c.beat=i===2?beats-16:boundaries[i];c.start=i===2?beats-32:i?boundaries[i-1]:0;});b.summon.minBeat=Math.round(beats*.51/4)*4;b.summon.fullBeat=Math.round(beats*.65/4)*4;return b;}
export function validateDocument(data){
 const b=data?.boss,t=data?.tags;if(!b||!/^[a-z][a-z0-9-]{0,47}$/.test(b.id)||typeof b.name!=='string'||!b.name.trim()||b.name.length>120)throw Error('Invalid fight name or id');
 const finite=n=>Number.isFinite(n),beat=n=>finite(n)&&n>=0&&n<=100000;
 if(!finite(b.song?.bpm)||b.song.bpm<20||b.song.bpm>400||!beat(b.song.beats)||b.song.beats<4||!finite(b.song.firstBeatOffset)||Math.abs(b.song.firstBeatOffset)>3600)throw Error('Invalid song timing');
 if(b.song.loopRegion){const {start,end,passes}=b.song.loopRegion;if(!finite(start)||!finite(end)||start<0||end<=start||!Number.isInteger(passes)||passes<1||passes>64)throw Error('Invalid loop region');}
 if(b.song.pieces&&(!finite(b.song.loopStartBeat)||!finite(b.song.loopBeats)||b.song.loopBeats<=0||!Number.isInteger(b.song.passes)||b.song.passes<1||b.song.passes>64))throw Error('Invalid loop timing');
 const audio=p=>typeof p==='string'&&p.startsWith('/')&&!p.startsWith('//')&&!p.includes('..')&&p.length<1024;
 if(!audio(b.song.map?.audio||b.song.url)||b.song.pieces&&!['intro','loop','outro'].every(k=>audio(b.song.pieces[k])))throw Error('Use a served absolute song path');
 if(!Array.isArray(b.chart)||b.chart.length>20000||b.chart.some((n,i)=>!beat(n.beat)||n.beat>=b.song.beats||!['tap','hold','charge'].includes(n.type)||!beat(n.duration)||n.beat+n.duration>=b.song.beats||typeof n.parry!=='boolean'||i&&n.beat<=b.chart[i-1].beat))throw Error('Invalid or duplicate notes');
 if(b.sections?.length!==4||b.sections.some((s,i)=>!beat(s.beat)||s.beat<=s.start||s.start!==(i?b.sections[i-1].beat:0)||!s.art?.good||!s.art?.stumble)||b.sections[3].beat!==b.song.beats)throw Error('Keep four ordered story sections ending at the fight end');
 if(!b.art?.boss?.idle||!b.wake||!Array.isArray(b.cutins)||b.cutins.some(c=>!beat(c.beat)||!finite(c.duration)||c.duration<=0||typeof c.art!=='string')||!Array.isArray(b.wakeStages?.cues)||b.wakeStages.cues.some(c=>!beat(c.beat)||!beat(c.start)||c.start>=c.beat))throw Error('Invalid sequence');
 if(b.cutins.some(c=>c.beat>b.song.beats)||b.wakeStages.cues.some(c=>c.beat>b.song.beats)||b.wakeStages.poses?.some(p=>typeof p!=='string')||!Array.isArray(b.ending?.shots)||b.ending.shots.some(s=>!beat(s.bar))||!beat(b.ending.scoreBar))throw Error('Invalid story timing');
 if(!Array.isArray(t)||t.length>10000||t.some(x=>!beat(x.beat)||!beat(x.endBeat)||x.endBeat<x.beat||x.endBeat>b.song.beats||typeof x.text!=='string'||x.text.length>20000))throw Error('Invalid animation tags');
 validateBoss(b.chart.length?b:{...b,chart:[{beat:0,type:'tap',duration:0,parry:false}]});
 return {boss:b,tags:tagsForSave(t,b.song)};
}
