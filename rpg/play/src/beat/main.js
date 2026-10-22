import {summonFrame} from './summon.js';
import {FightTape,FightPlayback} from './replay.js';
import {BeatGame} from './rules.js';
import {BeatMusic} from './audio.js';
import {loadBoss} from './bosses/index.js';
import {readPad,snapshot,installFakePad,flagNative} from '../jam/pad-reader.js';
import {createCutin} from '../duel/cutin.js';
const Q=new URLSearchParams(location.search),boss=await loadBoss(Q.get('boss')||'sloth'),BEAT=60/boss.song.bpm,END=boss.song.beats,PANELS=boss.sections,embedded=Q.get('embedded')==='1'&&parent!==window,manual=Q.get('test')==='1';let game=new BeatGame({boss,assist:Q.get('assist')==='1',summon:Q.get('summon')||'on'});
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),cut=document.querySelector('#cutin'),transition=await createCutin(cut,{...(boss.art.cutins||{base:boss.art.background,charge:boss.art.fallback.stumble,strike:boss.art.fallback.good}),...Object.fromEntries((boss.finisher?.art||[]).map((art,i)=>['finisher'+i,art])),...Object.fromEntries((boss.cutins||[]).map((c,i)=>['burst'+i,c.art])),...Object.fromEntries((Q.get('summon')==='off'?[]:boss.summon?.art||[]).map((art,i)=>['summon'+i,art]))});
const pearlIcon=document.createElement('img');pearlIcon.style.cssText='display:none;position:absolute;z-index:8;left:47%;top:9%;width:6%;pointer-events:none;filter:drop-shadow(0 0 12px #ffe3a0)';if(boss.finisher)pearlIcon.src=boss.finisher.icon;canvas.parentElement.append(pearlIcon);
const burstCaption=document.createElement('div');burstCaption.id='burst-caption';canvas.parentElement.append(burstCaption);
let ringDraws=0;
let tape=new FightTape(game),playback=null,original=null,choice=0,menu=false;
let completed=false,logged=false,skippedCutin=-1,streakWarm=0;
let music=new BeatMusic(boss,{endless:game.summonMode!=='off'}),previousPad=false,paused=false,lastGrade=null,beginning=false;
const held=new Set(),images={},panelAssets={};
async function load(key,url){const im=new Image();im.src=url;try{await im.decode();images[key]=im;return true;}catch{return false;}}
const art={'bg.png':boss.art.background,'charge.jpg':boss.art.fallback.stumble,'strike.jpg':boss.art.fallback.good};
for(const [pose,url] of Object.entries(boss.art.boss))art['sloth-'+pose+'.png']=url;
for(const [pose,url] of Object.entries(boss.art.atlas))art['atlas-'+pose+'.png']=url;
if(boss.summon&&Q.get('summon')!=='off')art.summonIcon=boss.summon.icon;
if(boss.finisher)art.finisherIcon=boss.finisher.icon;
await Promise.all(Object.entries(art).map(([key,url])=>load(key,url)));
await Promise.all((boss.ending?.shots||[]).filter(s=>s.art).map((s,i)=>load('ending'+i,s.art)));
await Promise.all(PANELS.flatMap(p=>['good','stumble'].map(async variant=>{const id=p.caption?p.id:p.id+'-'+variant;panelAssets[id]=await load(id,p.art[variant]);})));
// Isolate only painted cyan cracks; stone, roots and gold bands keep their hue.
const warmMasks={};
for(const name of Object.keys(images).filter(n=>n.startsWith('sloth-'))){
 const im=images[name];if(!im)continue;const mask=document.createElement('canvas');mask.width=im.width;mask.height=im.height;const m=mask.getContext('2d');m.drawImage(im,0,0);const pixels=m.getImageData(0,0,mask.width,mask.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){const cyan=clampMask((d[i+2]-d[i]*1.15)/90)*clampMask((d[i+1]-d[i]*1.05)/50);d[i+3]*=cyan;[d[i],d[i+1],d[i+2]]=boss.wake.colour;}m.putImageData(pixels,0,0);warmMasks[name]=mask;
}
function clampMask(x){return Math.max(0,Math.min(1,x));}
installFakePad();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=x=>1-(1-clamp(x))**3;
const CX=800,CY=480,R=61;
function drain(){music.mapTimeline=game.mapTimeline;for(const e of game.events.splice(0)){if(e.type==='outro')music.finishAt(e.time);if(e.type==='grade'){lastGrade=e;music.feedback(e.burst?'sting':e.grade==='perfect'?'parry':e.grade,game.time);}if(e.type==='panel'||(e.type==='cutin'&&!boss.sections.some(p=>p.beat===e.beat)))music.feedback('sting',e.time);if(e.type==='summon'||e.type==='finisher')music.feedback('sting',e.time);if(e.type==='summon-impact')music.feedback('sting',e.time);}}
function saveLog(){if(logged||playback)return;logged=true;try{const key='atlas.beat.log.'+boss.id;let runs=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(runs))runs=[];runs.push({date:new Date().toISOString(),boss:boss.id,bpm:boss.song.bpm,assist:game.assist,offsetMs:OFFSET*1000,grade:game.grade,replay:tape.data(),events:game.history,notes:game.notes.map(n=>({beat:n.beat,type:n.type,grade:n.grade,ms:n.ms??null,status:n.status}))});localStorage.setItem(key,JSON.stringify(runs.slice(-10)));}catch{}}
function skipCutin(){if(game.skipSummon()){tape.actions.push({time:game.time,type:'summon-skip'});render();return true;}const i=game.cutins.length-1,c=game.cutins[i];if(c&&game.time-c.time<c.duration){skippedCutin=i;tape.actions.push({time:game.time,type:'cutin-skip'});render();return true;}return false;}
async function begin(){if(beginning)return;beginning=true;music.cut();void music.ctx?.close();music=new BeatMusic(boss,{endless:game.summonMode!=='off'});completed=false;logged=false;skippedCutin=-1;streakWarm=0;game.start();tape=new FightTape(game);menu=false;choice=0;lastGrade=null;paused=false;try{const startBeat=Number(Q.get('startBeat'))||0;const startTime=startBeat>0?boss.song.firstBeatOffset+startBeat*BEAT:0;if(startTime>0){if(game.mapTimeline)for(const h of boss.song.map.holds)if((h.endBar-1)*4<=startBeat)game.mapTimeline.released.add(h.id);game.update(startTime);game.events=[];game.history=[];for(const n of game.notes)if(n.beat<startBeat){n.status='summoned';delete n.grade;}game.misses=0;tape=new FightTape(game);}music.mapTimeline=game.mapTimeline;await music.unlock(startTime);}finally{beginning=false;game.down=held.size>0;render();}}
const OFFSET=(+Q.get('offset')||0)/1000,lag=()=>(music.ctx?.outputLatency||0)+OFFSET;
function endReplay(){if(!playback)return;music.cut();void music.ctx?.close();game=original.game;music=original.music;lastGrade=original.lastGrade;skippedCutin=original.skippedCutin;streakWarm=original.streakWarm;playback=null;original=null;paused=false;menu=true;held.clear();render();}
async function watch(){if(beginning)return;original={game,music,lastGrade,skippedCutin,streakWarm};music.cut();game=new BeatGame(tape.options);playback=new FightPlayback(game,tape,()=>{skippedCutin=game.cutins.length-1;});music=new BeatMusic(boss,{endless:game.summonMode!=='off'});menu=false;paused=false;lastGrade=null;skippedCutin=-1;streakWarm=0;beginning=true;try{music.mapTimeline=game.mapTimeline;await music.unlock(0);}finally{beginning=false;render();}}
function finish(){if(game.phase==='end'&&(!music.endTime||game.time>=music.endTime)){if(playback){endReplay();return;}saveLog();menu=true;}}
function select(){if(choice===1){void watch();return;}if(embedded){if(!completed){completed=true;music.cut();parent.postMessage({type:'beat-complete',boss:boss.id,result:game.snapshot()},location.origin);}}else void begin();}
function advance(dt){if(menu)return;streakWarm+=(clamp(game.combo/(boss.streak?.fullCombo||20))-streakWarm)*(1-Math.exp(-Math.max(0,dt)*2));if(playback)playback.advance(dt);else if(game.phase==='end'){game.time+=Math.max(0,dt);tape.steps.push(game.time);}else tape.update(game,dt);drain();finish();}
function updateLive(){if(!manual&&!paused&&!beginning&&['play','end'].includes(game.phase)&&music.ctx){advance(Math.max(0,music.ctx.currentTime-music.epoch-lag()-(playback?playback.clock:game.time)));}}
function down(source){if(held.has(source))return;const first=!held.size;held.add(source);if(!first)return;if(playback){endReplay();return;}if(menu){select();return;}if((game.phase==='ready'||(!embedded&&game.phase==='end'))){void begin();return;}if(paused)return;updateLive();tape.input(game,'press');drain();render();}
function up(source){held.delete(source);if(held.size)return;updateLive();if(!playback&&!menu)tape.input(game,'release');drain();render();}
async function pause(){if(!['play','end'].includes(game.phase)||beginning)return;const target=music;if(!paused){updateLive();paused=true;music.cut();await target.ctx?.suspend().catch(()=>{});if(music!==target)return;}else{await target.ctx?.resume().catch(()=>{});if(music!==target)return;music.epoch=music.ctx.currentTime-game.time-lag();music.resumeTrack(game.time);music.cursor=music.score.findIndex(e=>e.time>=game.time);if(music.cursor<0)music.cursor=music.score.length;paused=false;}render();}
// Any comfortable key plays: letters (not P), digits, numpad, arrows, Space, Enter. Escape/P pause or skip.
const keys={has:c=>/^(Key[A-OQ-Z]|Digit\d|Numpad\d|NumpadEnter|Arrow(Up|Down|Left|Right)|Space|Enter)$/.test(c)};
addEventListener('keydown',e=>{if(menu&&/^Arrow/.test(e.code)){e.preventDefault();if(!e.repeat){choice=1-choice;render();}}else if(keys.has(e.code)){e.preventDefault();if(!e.repeat)down(e.code);}else if(['Escape','KeyP'].includes(e.code)&&!e.repeat){e.preventDefault();if(playback&&e.code==='Escape')endReplay();else if(menu&&e.code==='Escape'){choice=0;select();}else if(e.code!=='Escape'||!skipCutin())void pause();}});
addEventListener('keyup',e=>{if(keys.has(e.code)){e.preventDefault();up(e.code);}});
const surface=document.querySelector('#surface');surface.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();surface.setPointerCapture(e.pointerId);down('pointer');});
surface.addEventListener('pointerup',()=>up('pointer'));surface.addEventListener('pointercancel',()=>up('pointer'));
// Losing focus only lets go of held buttons. It no longer pauses (Daryll, 2026-10-18: the fight "played for like one
// second and then paused itself" when the browser shifted focus); a hidden tab still pauses.
addEventListener('blur',()=>{held.clear();game.release();});
// No automatic pause at all (Daryll, 2026-10-18: "paused itself again when I went to move … very annoying"). Start, P or Esc pause.
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();game.release();}});
let previousStart=false,blockedB=false,previousNav=false,previousB=false;
function poll(){const p=readPad();if(!p){if(previousPad)up('pad');previousPad=false;return;}flagNative();const snap=snapshot(p),b=snap.buttons;const nav=b[12]||b[13]||b[14]||b[15]||Math.abs(p.axes?.[0]||0)>.5||Math.abs(p.axes?.[1]||0)>.5;if(menu&&nav&&!previousNav){choice=1-choice;render();}previousNav=nav;if(b[1]&&!previousB){if(playback){endReplay();blockedB=true;}else if(menu){choice=0;select();blockedB=true;}}previousB=b[1];const cutActive=!!summonFrame(game.summons.at(-1),game.time,BEAT)||game.cutins.length-1>skippedCutin&&game.time-(game.cutins.at(-1)?.time??-9)<(game.cutins.at(-1)?.duration??0),any=b.slice(0,4).some((v,i)=>v&&!(i===1&&(cutActive||blockedB)));if(!b[1])blockedB=false;if(b[1]&&cutActive&&!playback){blockedB=true;skipCutin();}if(any&&!previousPad)down('pad');if(!any&&previousPad)up('pad');if(b[9]&&!previousStart)void pause();previousPad=any;previousStart=b[9];}
function step(dt){poll();if(!paused&&!beginning){advance(dt);if(!manual)music.syncTime(game.time);}render();}
function cover(im,zoom=1,fx=.5,fy=.5){if(!im)return;const scale=Math.max(1600/im.width,900/im.height)*zoom,w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(1600-w)*fx,(900-h)*fy,w,h);}
function sprite(name,x,y,w,h,rot=0){const im=images[name];if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();}
function text(s,x,y,size=32,color='#f6dfaa',align='left'){ctx.save();ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${size>=40?'bold ':''}${size}px Georgia`;ctx.shadowColor='#07101a';ctx.shadowBlur=color==='#242a30'?0:9;ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();}
function ring(x,y,r,color,width=3,start=0,end=Math.PI*2){ringDraws++;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#f3d59800');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function emblem(x,y,r){const icon=game.finisherRing!==null?images.finisherIcon:images.summonIcon;if(icon)ctx.drawImage(icon,x-r,y-r,r*2,r*2);}
function scene(){const t=game.time,b=(t-game.offset)/BEAT,next=game.notes.find(n=>n.status==='pending'||n.status==='holding'),lastSlam=[...game.notes].reverse().find(n=>n.parry&&b>=n.beat),slamAge=lastSlam?t-game.offset-lastSlam.beat*BEAT:9;
 const wind=next?.parry&&next.beat-b<2&&next.beat-b>0,impact=slamAge<.45,hitAge=lastGrade?t-lastGrade.time:9,perfect=lastGrade?.grade==='perfect'&&hitAge<.36;
 ctx.save();const punch=perfect?1+.012*(1-hitAge/.36):1;ctx.translate(800,450);ctx.scale(punch,punch);ctx.translate(-800,-450);
 if(impact){ctx.translate(Math.sin(t*83)*4*(1-slamAge/.45),Math.cos(t*71)*3*(1-slamAge/.45));}
 cover(images['bg.png']);
 // Golden light gradually replaces the cyan in Sloth's actual painted cracks.
 const visualChanges=game.stageChanges.map(c=>({...c,time:c.time+(PANELS.some(p=>p.beat===c.beat)?4*BEAT:0)})),stage=visualChanges.findLast(c=>t>=c.time),visualStage=stage?.stage||0,blend=stage?clamp((t-stage.time)/(BEAT*(boss.wakeStages?.crossfadeBeats||1))):1;
 const current=boss.wakeStages?.poses[visualStage]||'idle',previous=boss.wakeStages?.poses[stage?.previous||0]||'idle';
 function paintPose(p,alpha){const name='sloth-'+p+'.png';ctx.save();ctx.globalAlpha=alpha;sprite(name,585,805+Math.sin(t)*3,1300,732,wind?-.014:0);ctx.globalAlpha=alpha*game.wake;ctx.translate(585,805+Math.sin(t)*3);ctx.rotate(wind?-.014:0);if(warmMasks[name])ctx.drawImage(warmMasks[name],-650,-732,1300,732);ctx.restore();}
 if(blend<1)paintPose(previous,1-blend);paintPose(wind?'windup':impact?'slam':current,blend);
 if(stage&&t-stage.time<BEAT*2){const k=(t-stage.time)/(BEAT*2);for(let i=0;i<18;i++){ctx.globalAlpha=(1-k)*.35;glow(370+i*29+Math.sin(i)*k*100,730-k*100,35+k*40,i%2?'#c9b98980':'#9aab8580');}ctx.globalAlpha=1;}
 if(boss.streak){ctx.save();ctx.globalAlpha=streakWarm;glow(580,540,600,'#edb85e28');for(let i=0;i<boss.streak.motes;i++){ctx.fillStyle='#f7d382';ctx.fillRect(260+(i*97)%650+Math.sin(t+i)*10,790-(t*35+i*43)%650,3,5);}for(let i=0;i<boss.streak.flakes;i++){ctx.fillStyle='#a8a77b';ctx.save();ctx.translate(300+i*39,180+(t*48+i*71)%600);ctx.rotate(t+i);ctx.fillRect(-3,-2,7,4);ctx.restore();}ctx.restore();}
 glow(1060,800,240,'#f9c97736');
 const stagger=lastGrade?.grade==='miss'&&hitAge<.45,pose=perfect?(lastGrade.parry?'atlas-parry.png':'atlas-strike.png'):'atlas-ready.png';
 sprite(pose,1110+(stagger?Math.sin(hitAge*9)*15:0),870+Math.sin(t*2)*2,920,518,stagger?.05:0);
 // Low fog is a soft setback, never a loss state.
 for(let i=0;i<6;i++){ctx.save();ctx.translate(i*310+Math.sin(t*.25+i)*100,770+Math.sin(t*.4+i)*26);ctx.scale(3.5,1);const g=ctx.createRadialGradient(0,0,0,0,0,120);g.addColorStop(0,`rgba(164,190,203,${(1-game.wake)*.22})`);g.addColorStop(1,'#9ab7c900');ctx.fillStyle=g;ctx.fillRect(-120,-120,240,240);ctx.restore();}
 for(let i=0;i<50;i++){ctx.globalAlpha=.15+i%5*.07;ctx.fillStyle=i%3?'#f4dba2':'#bce8ec';ctx.fillRect((i*197.7+t*(6+i%5))%1600,(i*119.3-t*(4+i%3)+9000)%900,2+i%3,2+i%3);}ctx.globalAlpha=1;
 ctx.restore();
 const g=ctx.createLinearGradient(0,0,0,900);g.addColorStop(0,'#07111bba');g.addColorStop(.25,'#07111b00');g.addColorStop(.72,'#07111b00');g.addColorStop(1,'#07111be8');ctx.fillStyle=g;ctx.fillRect(0,0,1600,900);
 const pulse=b<0?0:(1-b%1)**5;   // before the first downbeat b is negative and b%1 went negative: (1-b%1)**5 blew up into a full-screen flashctx.fillStyle=`rgba(255,218,139,${pulse*.035})`;ctx.fillRect(0,0,1600,900);
 ctx.strokeStyle=`rgba(246,194,99,${streakWarm*.48})`;ctx.lineWidth=16;ctx.strokeRect(8,8,1584,884);
 if(playback||game.summonUsed&&!boss.finisher||game.finisherUsed){if(hitAge<.36&&lastGrade?.grade!=='miss')glow(1110,650,140,'#ffe4a52a');return;}
 text('THE BEAT',66,58,33);text('Atlas · '+boss.name,66,101,24,'#d8c7a3');
 text('WAKE',1175,56,23,'#d8c7a3');ctx.fillStyle='#07111be0';ctx.fillRect(1176,80,350,18);ctx.fillStyle='#eecb7f';ctx.fillRect(1176,80,350*game.wake,18);ctx.strokeStyle='#bfa46c';ctx.lineWidth=2;ctx.strokeRect(1176,80,350,18);
 if(boss.summon&&game.summonMode!=='off'){const full=game.summonMeter>=1;ctx.save();ctx.shadowColor=b%2<1?'#f0ca7c':'#bca0ed';ctx.shadowBlur=full?18+8*Math.sin(t*3):4;ring(1121,78,29,'#726080',6);ring(1121,78,29,'#f2cf83',6,-Math.PI/2,-Math.PI/2+Math.PI*2*game.summonMeter);if(full){ctx.globalAlpha=.85+.15*Math.sin(t*3);emblem(1121,78,25);}ctx.restore();}
 if(game.combo>1){text(String(game.combo),1515,153,58,'#ffe4a0','right');text('COMBO',1515,199,20,'#dbc99f','right');}
 // Four quiet phrase beads keep the sequence readable without another lane to aim at.
 if(next&&game.phase==='play'){for(let i=1;i<=4;i++){ctx.globalAlpha=i===next.number?1:.38;ring(CX-90+i*36,754,9,'#edd59c',2);if(i<next.number){ctx.fillStyle='#edd59c';ctx.fill();}}ctx.globalAlpha=1;}
 const specialBeat=game.finisherRing??game.summonRing;const special=specialBeat!==null&&specialBeat-b<2.5&&(!next||next.beat>=specialBeat);
 if(special){const delta=specialBeat-b;glow(CX,CY,140,'#b795ee55');ring(CX,CY,R,'#f6dda0',4);emblem(CX,CY,R-8);ring(CX,CY,R+Math.max(0,delta)/2.5*170,'#d8b5ff',6);}
 if(!special&&next&&game.phase==='play'&&next.beat-b<2.5){
 const delta=next.beat-b,holding=next.status==='holding',charge=next.type==='charge',radius=charge?R+25:R;
 glow(CX,CY,110,'#f9d48926');ctx.fillStyle='#071321d9';ctx.beginPath();ctx.arc(CX,CY,radius,0,7);ctx.fill();ring(CX,CY,radius,'#f6dda0',3);
 text(game.notes.indexOf(next)===0?'A':String(next.number),CX,CY+2,53,'#ffe9b7','center');
 if(!holding){const r=radius+Math.max(0,delta)/2.5*170;ctx.save();ctx.shadowBlur=15+clamp(1-delta)*22;ctx.shadowColor='#ffdf99';ring(CX,CY,r,'#ffe0a1',5+clamp(1-delta)*3);ctx.restore();}
 if(next.type!=='tap'){
 const progress=holding?clamp((b-next.beat)/next.duration):0;
 ctx.save();ctx.shadowColor='#ffe3a0';ctx.shadowBlur=22;ring(CX,CY,radius+17,'#9c875144',12);ring(CX,CY,radius+17,'#ffdc90',12,-Math.PI/2,-Math.PI/2+Math.PI*2*(charge?progress:1-progress));ctx.restore();
 // The draining trail shows a short sustain; the closing arc marks release.
 if(holding){glow(CX,CY,150,'#ffe1a13a');ring(CX,CY,radius+36,'#ffe8b4',3,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);}
 }
 }
 if(lastGrade&&hitAge<.72){const k=clamp(hitAge/.72),good=lastGrade.grade!=='miss';
 if(good){ctx.save();ctx.globalAlpha=1-k;ctx.shadowColor='#ffdb91';ctx.shadowBlur=20;ring(CX,CY,R+k*(lastGrade.burst?380:150),'#ffe5a5',6*(1-k));for(let i=0;i<24;i++){const a=i*2.399,r=70+k*(lastGrade.burst?400:220);ctx.fillStyle=i%3?'#ffe7ad':'#e4ffff';ctx.save();ctx.translate(CX+Math.cos(a)*r,CY+Math.sin(a)*r);ctx.rotate(a);ctx.fillRect(-8,-2,18*(1-k)+2,5);ctx.restore();}ctx.restore();}
 text(lastGrade.grade==='miss'?'miss':lastGrade.grade.toUpperCase(),CX,320-k*22,lastGrade.burst?58:42,good?'#ffe5a8':'#c5d2da','center');
 }
 // Musical progress, no timer or instruction paragraph.
 ctx.fillStyle='#ead09833';ctx.fillRect(64,853,1472,3);ctx.fillStyle='#edcf8b';ctx.fillRect(64,853,1472*clamp(b/END),3);
}
function panel(p,age,score=true){
 // Camera push uses the duel cut-in's cubic ease and focus-cover treatment.
 const im=images[p.id],fallback=p.id.includes('stumble')?images['charge.jpg']:p.id===PANELS.at(-1).id?images['bg.png']:images['strike.jpg'];
 ctx.save();cover(im||fallback,1+.055*ease(age/2.5),p.id===PANELS.at(-1).id?.5:.42,.45);
 if(!im&&p.id===PANELS.at(-1).id){glow(800,430,500,'#ffd68e55');sprite('atlas-ready.png',1040,820,1150,647);}
 const g=ctx.createLinearGradient(0,500,0,900);g.addColorStop(0,'#07101a00');g.addColorStop(1,'#07101aee');ctx.fillStyle=g;ctx.fillRect(0,0,1600,900);
 ctx.strokeStyle='#07101b';ctx.lineWidth=32;ctx.strokeRect(16,16,1568,868);ctx.strokeStyle='#e4c58b';ctx.lineWidth=3;ctx.strokeRect(30,30,1540,840);
 const finale=p.id===PANELS.at(-1).id,y=finale?598:768;ctx.font='bold 40px Georgia';const w=Math.min(1430,ctx.measureText(p.caption).width+94);ctx.fillStyle='#f3e3bd';ctx.fillRect(66,y-42,w,84);ctx.strokeStyle='#322e28';ctx.lineWidth=4;ctx.strokeRect(66,y-42,w,84);text(p.caption,108,y,40,'#242a30');
 if(finale&&score&&!playback){text(game.grade,1350,655,130,'#ffe2a0','center');text(`${game.perfects} PERFECT   ·   ${game.maxCombo} MAX COMBO`,110,707,29);}

 ctx.restore();
}
function render(){ringDraws=0;ctx.clearRect(0,0,1600,900);scene();const p=game.panels.at(-1),age=p?game.time-p.time:0,show=p&&(age<4*BEAT||p.id===PANELS.at(-1).id);
 burstCaption.style.display='none';cut.style.display='none';if(show){if(p.id===PANELS.at(-1).id&&boss.ending){const ending=boss.ending,bar=ending.barBeats*BEAT,shots=ending.shots,index=shots.findLastIndex(s=>age>=s.bar*bar),shot=shots[Math.max(0,index)],elapsed=age-shot.bar*bar;
 if(shot.finale){cover(images['ending'+Math.max(0,index-1)],1.04);ctx.save();ctx.globalAlpha=clamp(elapsed/BEAT);panel(p,age,age>=ending.scoreBar*bar);ctx.restore();}else{const before=shots[Math.max(0,index-1)],previous=before.finale?images[p.id]:images['ending'+Math.max(0,index-1)];cover(previous,1.025);ctx.save();ctx.globalAlpha=clamp(elapsed/BEAT);cover(images['ending'+index],1+.045*ease(elapsed/(4*bar)),.48+.02*Math.sin(elapsed*.15),.45);ctx.restore();ctx.save();ctx.globalAlpha=.28;for(let i=0;i<18;i++){ctx.fillStyle='#ffe1a2';ctx.fillRect((i*137+age*9)%1600,900-(i*83+age*17)%900,2+i%3,2+i%3);}ctx.restore();}
 }else panel(p,age);if(age<.18&&!(boss.cutins||[]).some(c=>c.beat===p.beat)){cut.style.display='block';cut.style.opacity=String(1-age/.18);transition(3.44+age);}}
 const ci=game.cutins.length-1,cue=game.cutins[ci];if(cue&&ci>skippedCutin&&game.time-cue.time<cue.duration){cut.style.display='block';cut.style.opacity=String(Math.min(1,(cue.duration-(game.time-cue.time))/.18));transition(game.time-cue.time,'burst'+ci);if(show){burstCaption.textContent=p.caption;burstCaption.style.display='block';}}
 const move=game.summons.at(-1),finishing=move?.kind==='finisher',config=finishing?boss.finisher:boss.summon,key=finishing?'finisher':'summon';const movie=summonFrame(move,game.time,BEAT,config?.art.length);cut.style.filter='';if(movie){cut.style.display='block';cut.style.opacity='1';burstCaption.style.display='none';transition(movie.age,key+movie.index,{pearl:finishing&&config.id==='pearl'&&movie.index===0,duration:movie.duration,previous:key+Math.max(0,movie.index-1),impact:movie.index===Math.floor((config.wakeBeat??12)/(config.beats/config.art.length))});}
 pearlIcon.style.display=movie&&finishing&&config.id==='pearl'?'block':'none';if(movie&&finishing){pearlIcon.style.transform=`scale(${1+.12*Math.sin(game.time*8)})`;pearlIcon.style.opacity=String(.8+.2*Math.sin(game.time*8));}
 if(game.phase==='ready'){ctx.fillStyle='#07111b80';ctx.fillRect(0,0,1600,900);text('THE BEAT',800,310,94,'#ffe8b2','center');text('Atlas · '+boss.name,800,390,32,'#e7d2ab','center');glow(CX,CY,150,'#f4cb7640');ring(CX,CY,R,'#f5d797',4);text('A',CX,CY+3,53,'#ffe4a5','center');}
 if(menu){for(let i=0;i<2;i++){const x=110+i*560; text(i===0?(embedded?'Return':'One more go?'):'Watch it back',x,800,35,i===choice?'#ffe4a5':'#a89878');if(i===choice){ring(x+420,800,27,'#f5d797',3);text('A',x+420,802,32,'#f5d797','center');}}}
 if(paused){ctx.fillStyle='#07111bc9';ctx.fillRect(0,0,1600,900);text('PAUSE',800,450,64,'#f2dcaa','center');}
 document.querySelector('#result').textContent=game.phase==='end'?`The weight lifts. ${game.grade}. ${game.perfects} perfects. ${game.maxCombo} max combo.`:'';
}
window.__beat={get ringDraws(){return ringDraws;},get game(){return game;},get replaying(){return !!playback;},get menu(){return menu;},get tape(){return tape.data();},step,snapshot:()=>game.snapshot(),get music(){return music;},panelAssets,assets:Object.keys(images),get summonFrame(){return summonFrame(game.summons.at(-1),game.time,BEAT);},get paused(){return paused;},get beginning(){return beginning;},showPanel:(id)=>{const p=PANELS.find(p=>id.startsWith(p.id));panel({...p,id,caption:p.caption||(id.endsWith('stumble')?p.stumble:p.good)},1);}};
window.__ready=true;render();function loop(){poll();if(!manual){updateLive();if(['play','end'].includes(game.phase)&&!paused&&!beginning)music.syncTime(game.time);render();}requestAnimationFrame(loop);}requestAnimationFrame(loop);

// Watch mode (Daryll, 2026-10-18: "it needs to play in the Fight Studio"): Fight Studio embeds this page with
// ?watch=1 and drives it with __beat.watchTo(songSeconds). Silent (the studio plays the song), and a perfect
// player hits every ring, so you see the fight exactly as it lines up with the music while you chart it.
if(Q.get('watch')==='1'){
 music.feedback=()=>{};music.syncTime=()=>{};music.cut=()=>{};logged=true;
 const at=b=>b*game.beat+game.offset;
 const bot=()=>{const t=game.time-game.latency;
  for(const n of game.notes)if(n.status==='pending'&&Math.abs(at(n.beat)-t)<1/240){game.press();if(n.type==='tap')game.release();}
  if(game.active&&t>=at(game.active.beat+game.active.duration))game.release();
  if((game.finisherRing??game.summonRing)!=null&&Math.abs(at(game.finisherRing??game.summonRing)-t)<1/240){game.press();game.release();}};
 if(Q.get('mine')==='1')game.boss.chart=game.boss.chart.filter(n=>n.mine);   // Fight Studio with Claude's rings hidden: only Daryll's rings play
 const fresh=()=>{game.start();tape=new FightTape(game);menu=false;beginning=false;paused=false;lastGrade=null;};
 window.__beat.watchTo=(t)=>{
  if(!['play','end'].includes(game.phase)||t<game.time-0.05)fresh();
  let guard=0;while(game.time<t-1e-4&&guard++<400000){const dt=Math.min(1/240,t-game.time);tape.update(game,dt);bot();drain();}
  render();
 };
 fresh();render();
}
