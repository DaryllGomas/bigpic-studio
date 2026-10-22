import {validateMap} from '../song-map.js';
import sloth from './sloth.js';
export function validateBoss(boss) {
 if(!boss?.id || !boss.name || !Number.isFinite(boss.song?.bpm) || !(boss.song?.bpm>0) || !Number.isFinite(boss.song.beats) || !(boss.song.beats>0) || !Number.isFinite(boss.song.firstBeatOffset??0)) throw new TypeError('Invalid boss song');
 validateMap(boss.song);
 if(!boss.song.url && !boss.song.map && !boss.song.procedural) throw new TypeError('Boss needs audio URL or procedural music');
 if(!boss.art?.background || !['idle','windup','slam'].every(k=>boss.art.boss?.[k]) || !['ready','strike','parry'].every(k=>boss.art.atlas?.[k])) throw new TypeError('Invalid boss art');
 if(!boss.art.fallback?.good || !boss.art.fallback?.stumble || !boss.wake || !['initial','min','perfect','good','miss'].every(k=>Number.isFinite(boss.wake[k])) || boss.wake.colour?.length!==3) throw new TypeError('Invalid boss wake or fallback art');
 const watching=typeof location!=='undefined'&&new URLSearchParams(location.search).get('watch')==='1';   // Fight Studio's preview may show a fight with no rings yet
 if(!Array.isArray(boss.chart)||(!boss.chart.length&&!watching)||boss.chart.some((n,i)=>!['tap','hold','charge'].includes(n.type)||!Number.isFinite(n.beat)||n.beat<0||n.beat+(n.duration||0)>=boss.song.beats||(i&&n.beat<=boss.chart[i-1].beat)||!Number.isFinite(n.duration)||n.duration<0)) throw new TypeError('Invalid boss chart');
 if(boss.sections?.length!==4 || boss.sections.some((s,i)=>!s.id||!s.art?.good||!s.art?.stumble||!(s.beat>s.start)||s.start!==(i?boss.sections[i-1].beat:0)||(!s.caption&&(!s.good||!s.stumble))) || boss.sections[3].beat!==boss.song.beats) throw new TypeError('Invalid boss sections');
 if(boss.summon){const s=boss.summon;if(!Array.isArray(s.art)||s.art.length!==8||s.art.some(a=>typeof a!=='string'||!a)||!s.icon||!['beats','minBeat','downbeat','leadBeats','window','wakeBeat','wake'].every(k=>Number.isFinite(s[k]))||s.beats<=0||s.minBeat<0||s.downbeat<=0||s.leadBeats<3||s.window<=0||s.wakeBeat<0||s.wakeBeat>=s.beats||!['perfect','good','miss'].every(k=>Number.isFinite(s.meter?.[k]))||s.meter.perfect<=s.meter.good||s.meter.good<=0||s.meter.miss>=0)throw new TypeError('Invalid boss summon');}
 if(boss.finisher){const f=boss.finisher;if(!f.id||!f.name||!f.icon||!Array.isArray(f.art)||f.art.length!==8||f.art.some(a=>typeof a!=='string'||!a)||!['minBeat','beats','window'].every(k=>Number.isFinite(f[k]))||f.minBeat<0||f.minBeat+f.beats>=boss.song.beats||f.beats<=0||f.window<=0)throw new TypeError('Invalid boss finisher');}
 return boss;
}
export async function loadBoss(id='sloth') {
 // Explicit registry: no arbitrary module paths from URL parameters.
 if(!/^[a-z][a-z0-9-]{0,47}$/.test(id)) throw new RangeError('Unknown boss: '+id);
 if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('chart')==='draft'){
  const draft=JSON.parse(localStorage.getItem('atlas.charter.'+id)||'null');if(draft?.boss)return validateBoss(draft.boss);
 }
 const boss=id==='sloth'?sloth:await fetch('/rpg/play/src/beat/charts/'+id+'.json').then(r=>{if(!r.ok)throw new Error('Unknown fight');return r.json();});
 return validateBoss(boss);
}
export {sloth};
