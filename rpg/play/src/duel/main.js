import {Duel} from './rules.js';
import {Music} from '../jam/audio.js';
import {readPad,snapshot,installFakePad,flagNative} from '../jam/pad-reader.js';
import {createCutin} from './cutin.js';
const Q=new URLSearchParams(location.search),manual=Q.has('test'),canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),cut=document.querySelector('#cutin');
canvas.width=1600;canvas.height=900;
const game=new Duel({light:Math.max(0,Math.min(3,Number(Q.get('light'))||0))}),music=new Music(),paint=await createCutin(cut),images={};
async function load(name){const im=new Image();im.src='/rpg/play/pitch/duel/assets/'+name;try{await im.decode();images[name]=im;}catch{}}
await Promise.all(['base.jpg','bg.png','sloth-idle.png','sloth-windup.png','sloth-slam.png','atlas-ready.png','atlas-strike.png','atlas-parry.png'].map(load));
const nav=document.querySelector('nav');
['A','X','Y','B'].forEach((b,i)=>{const el=document.createElement('button');el.style.setProperty('--color',['#b8e989','#87cffa','#f4df77','#e7b781'][i]);el.innerHTML='<b>'+b+'</b><span></span>';el.onclick=()=>press(b);nav.append(el);});
const keys={Space:'A',KeyJ:'A',Enter:'A',KeyF:'A',KeyK:'X',KeyX:'X',KeyI:'Y',KeyL:'Y',KeyY:'Y',Escape:'B',Backspace:'B',KeyB:'B',KeyP:'START'};
addEventListener('keydown',e=>{if(e.target.matches('input'))return;if(keys[e.code]){e.preventDefault();if(!e.repeat)press(keys[e.code]);}});
document.querySelector('#card').onclick=()=>press('A');
installFakePad();let previous=[],lastBass=-1,flash=0;
function press(b){game.press(b);music.unlock(game.time);if(game.paused)music.cut();render();}
function poll(){const p=readPad();if(!p)return;flagNative();const b=snapshot(p).buttons;for(const [i,n]of [[0,'A'],[1,'B'],[2,'X'],[3,'Y'],[9,'START']])if(b[i]&&!previous[i])press(n);previous=b;}
function process(){for(const e of game.events.splice(0)){
 if(e.type==='hit')music.add('kick',e.time);
 if(e.type==='contact'){if(e.grade==='perfect')music.add('parry',e.time);flash=e.grade==='perfect'?.4:.2;}
 if(e.type==='action')music.add('note',e.time,e.button);
 if(e.type==='break'){music.cut();music.breakTimes||=[];music.breakTimes.push(e.time);music.beat=1.2;}
 if(e.type==='radiant')music.add('kick',e.time);
 if(e.type==='bent')music.add('bent',e.time);
 if(e.type==='phase'&&e.phase==='wake'){music.cut();music.add('hum',e.time,'B',.4);}
 }
 if(!['ready','break','win','lose','wake'].includes(game.phase)&&!game.paused&&(!game.broken||game.phase==='radiant')&&Math.floor(game.time)!==lastBass){lastBass=Math.floor(game.time);music.add('bass',game.time);}
}
function step(dt){poll();game.update(dt);flash=Math.max(0,flash-dt);process();render();}
function cover(im){const s=Math.max(1600/im.width,900/im.height);ctx.drawImage(im,(1600-im.width*s)/2,(900-im.height*s)/2,im.width*s,im.height*s);}
function sprite(im,x,y,w,h,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();}
// Until transparent poses arrive, preserve the approved composition as one
// painting rather than showing hard rectangular crop boundaries.
function fallbackSloth(t){ctx.save();ctx.translate(800,450);const z=1.012+Math.sin(t*.8)*.002;ctx.scale(z,z);ctx.translate(-800,-450);cover(images['base.jpg']);ctx.restore();}
const fallbackAtlas=document.createElement('canvas');fallbackAtlas.width=1920;fallbackAtlas.height=1080;
{const x=fallbackAtlas.getContext('2d');x.beginPath();[[870,613],[889,612],[907,626],[920,650],[941,663],[959,693],[964,736],[952,756],[960,795],[972,835],[999,877],[967,885],[939,851],[909,811],[880,817],[850,850],[795,884],[746,884],[775,863],[812,816],[829,786],[759,777],[700,764],[691,746],[734,734],[794,710],[811,691],[801,667],[791,658],[789,635],[803,612],[824,607],[833,631],[829,648],[852,660],[872,653]].forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.clip();x.drawImage(images['base.jpg'],0,0);}
const AX=1110,AY=870; // Atlas stands right of centre, facing Sloth (left)
function render(){
 const t=game.time,p=game.phase,age=t-game.start,visualHit=p==='windup'&&t>=game.contact,wind=p==='windup'&&!visualHit,impact=['impact','mini'].includes(p)||visualHit,impactAge=visualHit?t-game.contact:age,awake=['wake','win'].includes(p);
 ctx.clearRect(0,0,1600,900);ctx.save();
 const shake=impact?Math.max(0,1-impactAge/.6)*10:0;ctx.translate(Math.sin(t*89)*shake,Math.cos(t*71)*shake);
 ctx.translate(800,450);ctx.scale(1.025,1.025);ctx.translate(-800+Math.sin(t*.12)*5,-450);
 cover(images['bg.png']||images['base.jpg']);
 if(images['sloth-idle.png']){
 const im=images[wind?'sloth-windup.png':impact?'sloth-slam.png':'sloth-idle.png']||images['sloth-idle.png'];
 const k=wind?Math.min(1,age/(game.contact-game.start)):0;
 ctx.save();if(awake)ctx.filter='saturate(1.15) brightness('+(1+.25*Math.min(age/2,1))+') hue-rotate(-12deg)';
 sprite(im,600,800+(awake?Math.min(age/4,1)*45:0),1300+Math.sin(t*.9)*8,732+Math.sin(t*.9)*6,wind?.025*k:0);ctx.restore();
 }else fallbackSloth(t);
 // Ground contact, drifting dust and wet causeway light.
 let g=ctx.createRadialGradient(AX,AY-40,4,AX,AY-40,230);g.addColorStop(0,'#efce8a33');g.addColorStop(1,'#efce8a00');ctx.fillStyle=g;ctx.fillRect(AX-300,AY-240,600,300);
 const atlas=images[p==='action'&&game.action==='A'?'atlas-strike.png':p==='mini'?'atlas-parry.png':'atlas-ready.png']||images['atlas-ready.png'];
 if(atlas){ctx.save();if(p==='bent')ctx.globalAlpha=.7;sprite(atlas,AX-(p==='action'&&game.action==='A'?Math.sin(Math.min(1,age)*Math.PI)*55:0),AY+Math.sin(t*2)*2,920,518,p==='bent'?.18*Math.sin(Math.min(age,1)*Math.PI):0);ctx.restore();}

 if(!atlas&&images['sloth-idle.png'])ctx.drawImage(fallbackAtlas,0,0,1920,1080,-70,45+Math.sin(t*2)*2,1600,900);
 // Ora and gauntlet illumination.
 const ox=AX-150+Math.sin(t*1.6)*8,oy=AY-420+Math.cos(t*1.8)*9;if(!atlas){
 g=ctx.createRadialGradient(ox,oy,0,ox,oy,65);g.addColorStop(0,awake?'#fff5c7':'#efffff');g.addColorStop(.09,'#c4faff');g.addColorStop(.25,'#93dfff99');g.addColorStop(1,'#7bd5ff00');ctx.fillStyle=g;ctx.fillRect(ox-65,oy-65,130,130);
 ctx.strokeStyle='#edd697';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ox,oy,23,12,t,0,Math.PI*2);ctx.stroke();}
 for(let i=0;i<65;i++){const x=(i*197.9+t*(7+i%6))%1600,y=(i*131.7+t*(9+i%9))%900;ctx.globalAlpha=.12+(i%5)*.065;ctx.fillStyle=i%3?'#efd6a2':'#92c0c8';ctx.fillRect(x,y,2+i%3,2+i%2);}ctx.globalAlpha=1;
 if(wind){const k=Math.min(1,age/(game.contact-game.start)),r=230-160*k,cx=AX-60,cy=AY-330;ctx.save();
  // the target: a steady inner ring with the A glyph, brightening as the closing ring reaches it
  const near=Math.max(0,1-Math.abs(r-70)/60);ctx.globalAlpha=.55+.45*near;ctx.fillStyle='#08121bcc';ctx.beginPath();ctx.arc(cx,cy,70,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#f3dc9a';ctx.beginPath();ctx.arc(cx,cy,70,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=near>.8?'#fff3c8':'#e9d28a';ctx.font='bold 54px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('A',cx,cy+3);
  ctx.globalAlpha=1;ctx.shadowColor='#ffe7a0';ctx.shadowBlur=30;ctx.strokeStyle='#ffe2a0';ctx.lineWidth=7;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(p==='fog'||game.drowse){for(let i=0;i<6;i++){ctx.save();ctx.translate(200+i*270+Math.sin(t+i)*80,680+Math.sin(t*.5+i)*30);ctx.scale(3.7,1);const fog=ctx.createRadialGradient(0,0,0,0,0,100);fog.addColorStop(0,p==='fog'?'#bccddb55':'#bccddb26');fog.addColorStop(1,'#bccddb00');ctx.fillStyle=fog;ctx.fillRect(-100,-100,200,200);ctx.restore();}}
 if(impact){ctx.strokeStyle='#eed3a6';ctx.globalAlpha=Math.max(0,1-impactAge/.75);ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(AX-260,AY-20,50+impactAge*320,12+impactAge*70,0,0,7);ctx.stroke();for(let i=0;i<16;i++){ctx.save();ctx.translate(AX-260+Math.cos(i*2.4)*impactAge*240,AY-30-Math.sin(i*1.8)*impactAge*140+impactAge*impactAge*150);ctx.rotate(t*3+i);ctx.fillStyle=i%3?'#8a7e68':'#eddaa6';ctx.fillRect(-4,-4,5+i%7,5+i%5);ctx.restore();}ctx.globalAlpha=1;}
 if(awake){ctx.fillStyle='#fbd08026';ctx.fillRect(0,0,1600,900);}
 if(p==='bent')ctx.fillStyle='#08162888',ctx.fillRect(0,0,1600,900);
 ctx.restore();
 g=ctx.createLinearGradient(0,0,0,900);g.addColorStop(0,'#08121b99');g.addColorStop(.3,'#08121b00');g.addColorStop(.7,'#08121b00');g.addColorStop(1,'#08121be8');ctx.fillStyle=g;ctx.fillRect(0,0,1600,900);
 if(flash){ctx.fillStyle='rgba(255,239,189,'+flash+')';ctx.fillRect(0,0,1600,900);}
 cut.style.display=['radiant','mini'].includes(p)?'block':'none';if(p==='radiant')paint(1.72+age);if(p==='mini')paint(3.44+age);
 document.querySelector('#grip').style.width=100*game.grip/game.c.grip+'%';document.querySelector('#hp').style.width=game.hp+'%';
 document.querySelector('#shell').innerHTML=Array.from({length:4},(_,i)=>'<i class="pip '+(i>=game.shell?'off':'')+'"></i>').join('');
 document.querySelector('#light').innerHTML=Array.from({length:3},(_,i)=>'<i class="pip '+(i>=game.light?'off':'')+'"></i>').join('');
 document.querySelector('#state').textContent=p==='break'?'BREAK':p==='fog'||game.drowse?'DROWSE':p==='player'?(game.broken?'RADIANT':'ATLAS'):'';
 [...nav.children].forEach((el,i)=>{el.disabled=p!=='player';el.querySelector('span').textContent=['Strike','Signal',game.light>=3?'RADIANT':'Rally','Guard'][i];el.className=i===2&&game.light>=3?'special':'';});
 const card=document.querySelector('#card');card.style.display=['ready','win','lose'].includes(p)?'flex':'none';card.innerHTML=(p==='ready'?'THE DUEL':p==='win'?'The weight lifts.':'A moment. Then, again.')+'<small>'+(p==='ready'?'Atlas · Sloth':'one more go?')+'</small><span class="ab">A</span>';
 document.querySelector('#pause').style.display=game.paused?'grid':'none';
}
if(Q.has('tune')){const f=document.createElement('form');f.id='tune';for(const n of ['latency','perfectEarly','perfectLate','goodEarly','goodLate','damage','grip']){const l=document.createElement('label');l.textContent=n;const i=document.createElement('input');i.type='number';i.step='.01';i.value=game.c[n];i.name=n;l.append(i);f.append(l);}const b=document.createElement('button');b.textContent='Apply · restart';f.append(b);f.onsubmit=e=>{e.preventDefault();for(const [k,v]of new FormData(f))game.c[k]=Number(v);game.reset();render();};document.body.append(f);}
document.body.classList.toggle('fallback',!images['sloth-idle.png']);
window.__duel={game,music,step,snapshot:()=>game.snapshot(),assets:Object.keys(images)};window.__ready=true;render();
let prev=performance.now();function loop(now){const dt=(now-prev)/1000;prev=now;if(!manual)step(Math.min(dt,.25));requestAnimationFrame(loop);}requestAnimationFrame(loop);
