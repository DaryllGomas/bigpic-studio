import { Jam, DEFAULTS } from './rules.js';
import { Music } from './audio.js';
import { JamInput } from './input.js';
import { Clock } from '../battle/clock.js';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d'), q=new URLSearchParams(location.search);
const game=new Jam(), music=new Music(), fx=new Clock();
const test=q.has('test'); let manual=test, last=performance.now(), feedback='', feedbackUntil=0, impact=0, combo=0, lastResolve=null;
const press=n=>{
 if(n==='A'&&['ready','win'].includes(game.phase)) reset();
 if(n==='START') music.cut();
 if(!test) music.unlock(game.time); game.press(n); drain(); draw();
};
const input=new JamInput(press,canvas);
function drain() {
  for(const e of game.events.splice(0)) {
    music.event(e,game);
    if(e.type==='break') { music.breakTimes ||= []; music.breakTimes.push(e.time); music.beat=game.beat; }
    if(e.type==='parry') { feedback=e.grade==='perfect'?'✦':'◇'; feedbackUntil=game.time+.7; fx.freeze(65);impact=.2; }
    if(e.type==='contact' && e.grade==='miss') { feedback='·';feedbackUntil=game.time+.7;impact=.12;fx.freeze(40); }
    if(e.type==='note') { combo++;impact=.055; }
    if(e.type==='phase') { combo=0; if(e.phase==='silence') {feedback='BREAK';feedbackUntil=game.time+game.beat;fx.freeze(90);} }
    if(e.type==='resolve') {lastResolve=e;feedback=e.repeat?'HUM':e.name || (e.spark?'✦':'');feedbackUntil=game.time+1.5;fx.freeze(e.solo?80:45);impact=.16;}
  }
}
function step(dt) {input.poll();music.sync(game);game.update(dt);music.sync(game);fx.tick(dt);impact=Math.max(0,impact-dt);drain();draw();}
const gold='#e9c887', cream='#f3e6c9', cyan='#9bd9df', muted='#71818a';
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(s,x,y,size=24,c=cream,align='center'){ctx.fillStyle=c;ctx.font=`${size}px Georgia`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function line(x,y,xx,yy,c=gold,width=1){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
function glow(x,y,r,c){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function glyph(n,x,y,r=24,active=false){
 ctx.save();if(active){ctx.shadowColor=gold;ctx.shadowBlur=24;}ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);const g=ctx.createRadialGradient(x-7,y-8,1,x,y,r);g.addColorStop(0,active?'#fff0b9':'#d9c392');g.addColorStop(1,'#947442');ctx.fillStyle=g;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#33291e';ctx.lineWidth=3;ctx.stroke();text(n,x,y+r*.36,r*1.05,'#282619');ctx.restore();
}
function diamond(x,y,r,filled,c=gold){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();if(filled){ctx.fillStyle=c;ctx.fill();}}
function draw(){
 const s=game,t=s.time,b=s.beat,p=(t-s.start)/b, pulse=Math.exp(-((t/b)%1)*7), freeze=fx.hold>0;
 const g=ctx.createLinearGradient(0,0,0,900);g.addColorStop(0,'#101d2b');g.addColorStop(.58,'#38414a');g.addColorStop(1,'#111c25');ctx.fillStyle=g;ctx.fillRect(0,0,1600,900);
 glow(1220,180,650,'#b9955135');glow(400,480,470,'#47677720');
 // A quiet horizon and a single block stage, deliberately no arena/content.
 for(let i=0;i<7;i++)line(70,370+i*24,1530,370+i*24,'#b1a17d0b');
 ctx.fillStyle='#17232c';ctx.beginPath();ctx.moveTo(110,641);ctx.lineTo(1360,599);ctx.lineTo(1550,697);ctx.lineTo(240,739);ctx.closePath();ctx.fill();line(240,739,1550,697,'#a5925c50',2);
 text('ATLAS VEYR',100,72,20,gold,'left');text('THE JAM',100,112,32,cream,'left');line(100,136,370,136,'#9e885c80');
 text('SLOTH',1280,102,30,cream);rect(1080,126,400,7,'#0d1822');rect(1080,126,400*s.grip/s.c.grip,7,gold);
 for(let i=0;i<6;i++)diamond(1180+i*40,164,9,i<s.shell,s.phase==='silence'||s.phase==='solo'?cyan:gold);
 text('ATLAS',300,218,26);rect(210,236,180,5,'#0b1720');rect(210,236,180*s.hp/72,5,cyan);
 for(let i=0;i<4;i++)diamond(255+i*30,265,7,i<s.kindle,s.kindled?cream:gold);
 const bob=freeze?0:Math.sin(t/b*Math.PI*2)*3;
 // Atlas: human head, long coat, grey temples, warm rim. No robot.
 ctx.save();ctx.translate(340,635+bob);if(impact>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches)ctx.translate(Math.sin(t*180)*impact*22,0);
 ctx.fillStyle='#080f19';ctx.beginPath();ctx.ellipse(0,6,94,16,0,0,Math.PI*2);ctx.fill();
 rect(-30,-101,23,108,'#101825');rect(11,-101,23,108,'#101825');rect(-39,0,33,10,'#080e17');rect(10,0,35,10,'#080e17');
 ctx.beginPath();ctx.moveTo(-41,-249);ctx.lineTo(31,-250);ctx.lineTo(64,-68);ctx.lineTo(5,-87);ctx.lineTo(-63,-58);ctx.closePath();ctx.fillStyle='#172840';ctx.fill();
 line(-41,-249,-63,-58,gold,3);line(31,-250,64,-68,'#a18553',3);line(-5,-230,9,-94,'#b6a16b',2);
 rect(-29,-303,47,51,'#b9a489');rect(-33,-309,51,20,'#3d3934');rect(-33,-292,9,24,'#a4a4a0');rect(16,-289,8,29,'#d1b99a');
 rect(-54,-234,18,104,'#1d3048');rect(-57,-138,22,19,'#c3ad8c');rect(28,-234,20,83,'#263950');rect(31,-156,20,18,'#ccb996');
 ctx.restore();
 const oraX=453+Math.sin(t)*12,oraY=396+Math.cos(t*1.4)*10;glow(oraX,oraY,65,'#9ee5ef60');ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(oraX,oraY,24,9,-.4,0,7);ctx.stroke();rect(oraX-5,oraY-5,10,10,cream);
 // Slumped grey block, bowed head, one gold band that catches every call tick.
 const wake=s.phase==='win'||s.phase==='duet', sy=626+bob, headY=wake?-293:-253;
 ctx.save();ctx.translate(1140,sy);ctx.fillStyle='#080f18';ctx.beginPath();ctx.ellipse(0,8,204,28,0,0,7);ctx.fill();
 rect(-132,-213,258,205,'#555e62');rect(-132,-213,21,205,'#707574');rect(-112,-229,213,36,'#6a706e');rect(126,-194,46,168,'#363f47');
 rect(-83,headY,126,83,'#737a78');rect(-83,headY,16,83,'#95978c');rect(43,headY+13,24,70,'#464f54');
 const lift=s.phase==='call'&&t<s.contact?Math.max(0,Math.min(1,(t-s.start)/(s.contact-s.start)))*85:0;
 rect(-177,-160-lift,65,158,'#666d6c');rect(90,-168,62,159,'#626b6d');rect(-177,-112-lift,65,18,gold);
 const targets=s.phase==='call'?s.targets():[],near=targets.some(v=>Math.abs(t-v)<.13);
 if(near){glow(-145,-105-lift,85,'#ffe3a289');rect(-177,-112-lift,65,18,'#ffedb7');}
 rect(-56,headY+(wake?33:54),22,wake?8:3,wake?gold:cyan);rect(-12,headY+(wake?33:54),22,wake?8:3,wake?gold:cyan);
 for(let i=0;i<6-s.shell;i++){line(-85+i*28,-176,-97+i*28,-93,cyan,2);line(-97+i*28,-93,-80+i*28,-40,cyan,2);}
 if(s.phase==='solo'||s.phase==='silence')glow(-6,-119,164,'#a8e7e332');
 if(s.phase==='silence'&&p<.6)for(let i=0;i<6;i++){const angle=i*Math.PI/3;diamond(Math.cos(angle)*(120+p*130),-140+Math.sin(angle)*(100+p*100),5,true,gold);}
 ctx.restore();
 // Dust points are fixed, no random-number dependence in capture runs.
 for(let i=0;i<28;i++){const x=(i*173+83)%1500+40,y=325+(i*97+t*7)%350;rect(x,y,2,2,i%3?'#c6b88845':'#c6b88880');}
 const active=['answer','solo','duet'].includes(s.phase), count=s.phase==='solo'?8:4;
 const slotW=count===8?64:112, gap=count===8?14:24, startX=174;
 if(active || s.phase==='call') {
   const targetList=active?s.targets():Array.from({length:4},(_,i)=>s.start+(i+.5)*b);
   for(let i=0;i<count;i++){
     const x=startX+i*(slotW+gap), target=targetList[i], distance=Math.abs(t-target), on=distance<.16;
     rect(x,679,slotW,78,on?'#c6b587':s.notes[i]?'#334d58':'#142330');
     line(x,757,x+slotW,757,s.kindled&&active?cream:on?cream:gold,s.kindled&&active?4:2);
     if(s.notes[i]&&active)glyph(s.notes[i],x+slotW/2,717,23,on||s.kindled);
     else if(s.phase==='duet'){ctx.globalAlpha=.45;glyph('YAXA'[i],x+slotW/2,717,23,on);ctx.globalAlpha=1;}
     else {diamond(x+slotW/2,717,5,on,on?'#16232f':muted);}
     const progress=Math.max(0,Math.min(1,1-(target-t)/(count===8?b*.5:b)));
     rect(x,765,slotW*progress,3,on?cream:gold);
   }
 }
 if(s.phase==='call') {
   const contact=s.contact, remain=contact-t;
   for(let i=0;i<3;i++){const x=910+i*128,target=s.targets()[i],lit=Math.abs(t-target)<.16;diamond(x,290,lit?15:9,lit,lit?cream:gold);}
   if(remain>-.19){ctx.beginPath();ctx.arc(340,490,Math.max(12,32+Math.max(0,remain)*31),0,Math.PI*2);ctx.strokeStyle='#e9c887aa';ctx.lineWidth=3;ctx.stroke();}
   glyph('A',340,590,25,s.calls===1&&Math.abs(remain)<.28);
   if(s.late&&p>1.5&&p<3.5)text('NOT YET',1140,241,22,gold);
 }
 if(feedback&&t<feedbackUntil)text(feedback,790,344,feedback==='BREAK'?58:40,feedback==='HUM'?'#c0ccbc':gold);
 if(lastResolve&&t<feedbackUntil&&lastResolve.type==='resolve')text(Math.round(lastResolve.damage).toString(),790,390,24,cream);
 // Buttons are names, not tutorial prose. Four choices always visible.
 for(const [i,n] of ['A','X','Y','B'].entries()){const x=205+i*140;glyph(n,x,826,22,active&&s.kindled);text(['Strike','Signal','Wake','Breathe'][i],x,874,26,i===1?cyan:cream);}
 if(active&&combo)text(String(combo),790,580,48,s.kindled?gold:cyan);
 if(s.phase==='solo')text('SOLO',440,634,24,cyan);
 if(s.phase==='duet')text('DUET',440,634,24,gold);
 if(s.kindled&&s.phase==='answer')text('KINDLE',440,634,24,gold);
 if(s.phase==='silence'){rect(174,679,608,89,'#0b1520');line(174,722,782,722,'#a6d5d040');}
 if(s.phase==='ready'||s.phase==='win'||s.paused){
   rect(0,0,1600,900,'#08111cc9');line(560,357,1040,357,'#a48d61');line(560,543,1040,543,'#a48d61');
   text(s.paused?'PAUSE':s.phase==='win'?'one more go?':'THE JAM',800,425,54,gold);
   if(s.phase==='win'&&s.bonus)text('✦',800,475,26,cyan);
   glyph(s.paused?'Ⅱ':'A',800,509,25,true);
 }
}
function reset(){music.cut();music.score=[];music.scheduled.clear();music.breakTimes=[];game.reset();feedback='';lastResolve=null;draw();}
if(q.get('tune')==='1'){
 const panel=document.createElement('form');panel.id='tune';panel.innerHTML='<b>THE JAM · tuning</b>';
 for(const [key,label,min,max,step] of [['bpm','BPM',40,120,1],['latency','Latency (s)',0,.2,.005],['perfectEarly','Perfect early',.02,.3,.01],['perfectLate','Perfect late',.02,.3,.01],['goodEarly','Good early',.1,.5,.01],['goodLate','Good late',.1,.5,.01],['damage','Slam damage',1,30,1],['strike','Strike damage',1,40,1],['grip','Grip',100,2000,50]]){
   const labelEl=document.createElement('label');labelEl.textContent=label;const el=document.createElement('input');Object.assign(el,{name:key,type:'number',min,max,step,value:DEFAULTS[key]});labelEl.append(el);panel.append(labelEl);
 }
 const apply=document.createElement('button');apply.textContent='Apply · restart';panel.append(apply);panel.onsubmit=e=>{e.preventDefault();for(const el of panel.querySelectorAll('input')){if(!el.checkValidity())return;game.c[el.name]=+el.value;}reset();};document.body.append(panel);
}
window.__jam={game,music,press,step,reset,draw,setManual(v){manual=v;last=performance.now();},snapshot(){return {phase:game.phase,time:game.time,start:game.start,hp:game.hp,grip:game.grip,shell:game.shell,kindle:game.kindle,targets:game.targets(),contact:game.contact,late:game.late,paused:game.paused,history:game.history};}};
window.__ready=true;draw();
function frame(now){const dt=Math.max(0,(now-last)/1000);last=now;if(!manual)step(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Resuming from a hidden tab must never leave audio running ahead of input.
addEventListener('visibilitychange',()=>{if(document.hidden&&!game.paused&&!['ready','win'].includes(game.phase)){game.press('START');music.cut();} });
