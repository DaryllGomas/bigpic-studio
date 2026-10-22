// Presentation only: picture cards, river light and D minor sound. No rules/RNG.
export const colours=['#69c9ff','#ff86b3','#ffd283','#ba92ff','#84dfbb','#bc80ff','#fff0c6'];
export const gemNames=['wave','heart','sun','drop','sprout','bolt','feather'];
const assets=['1-waves','4-heart','3-sun','2-drop','5-sprout','6-bolt','7-feather'];
const gemBounds=['18 18 220 223','5 15 246 231','1 4 254 247','34 3 188 250','22 0 212 254','63 0 130 253','0 38 256 182'];
export function card(kind){
 return `<svg class="gem" viewBox="${gemBounds[kind]}" preserveAspectRatio="${kind>=5?'xMidYMid meet':'none'}" aria-hidden="true"><image width="256" height="256" href="../beat/art/current/gems/gem-${assets[kind]}.png"/></svg><span class="gem-veil"></span>`;
}
let audio;
export function awakenAudio(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(Audio){audio ||= new Audio();void audio.resume();}
}
function sound(actor,count){
 if(!audio)return;
 const now=audio.currentTime;
 if(actor){
  const buffer=audio.createBuffer(1,audio.sampleRate*.65,audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.12;
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
  source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1500,now);filter.frequency.exponentialRampToValueAtTime(180,now+.65);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.25,now+.1);gain.gain.exponentialRampToValueAtTime(.001,now+.65);
  source.connect(filter).connect(gain).connect(audio.destination);source.start();return;
 }
 // D minor: D, E, F, G, A, B-flat, C. Quiet bell partials.
 [587.330,659.255,698.456,783.991,880,932.328,1046.502].slice(0,Math.min(7,Math.max(2,Math.ceil(count/3)))).forEach((hz,i)=>{
  [1,2].forEach((partial)=>{const osc=audio.createOscillator(),gain=audio.createGain(),t=now+i*.065;
   osc.type='sine';osc.frequency.value=hz*partial;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.045/partial,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+1.1);
   osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+1.15);
  });
 });
}
// All seven destinations mirror ownership, and only credited tiles arrive.
export function destination(actor,kind){return kind===0?`#${actor?'atlas':'siren'}-hud .health`:kind===1?`#${actor?'siren':'atlas'}-hud .health`:`#${actor?'siren':'atlas'}-hud .vial:nth-child(${kind-1})`;}
export async function clearCards(result,tiles,wait,draw){
 const arena=document.querySelector('#arena'),effects=document.querySelector('#effects');
 arena.dataset.turn=result.actor?'current':'atlas';sound(result.actor,result.clear);respondFeed(result);
 for(const w of result.trace.waves){
  draw(w.board);await wait(90);
  for(const c of w.cells){
   const tile=tiles[c.cell],rect=tile.getBoundingClientRect();tile.classList.add(result.actor?'sinking':'lit');
   if(c.credit>0){const target=document.querySelector(destination(result.actor,c.kind)).getBoundingClientRect();
    const trail=document.createElement('i');trail.className='resource-trail';trail.dataset.kind=c.kind;trail.dataset.actor=result.actor;trail.dataset.credit=c.credit;trail.innerHTML=card(c.kind);effects.append(trail);
    const anim=trail.animate([{left:`${rect.left+rect.width/2}px`,top:`${rect.top}px`,opacity:1,transform:'scale(.65)'},{left:`${target.left+target.width/2}px`,top:`${target.top+target.height/2}px`,opacity:0,transform:'scale(.3)'}],{duration:500,easing:'ease-in'});anim.onfinish=()=>trail.remove();
   }
  }
  await wait(320);draw(w.after);
  for(const f of w.falls){tiles[f.to].animate([{translate:`0 ${(f.from-f.to)/8*tiles[f.to].clientHeight}px`},{translate:'0 0'}],{duration:230});}
  for(const r of w.refills)tiles[r.cell].classList.add('pouring');
  await wait(250);
 }
 if(result.trace.directRelief>0){const bar=document.querySelector(destination(result.actor,1));bar.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:500});}
 if(result.trace.reshuffle){draw(result.after);document.querySelector('#board').animate([{filter:'brightness(1.7)'},{filter:'none'}],{duration:350});await wait(350);}
}
const pool=[];let feedIndex=0;
export function initFeed(){
 const river=document.querySelector('#feed-river');
 const lanes=[0,1].map(side=>{const lane=document.createElement('div');lane.className='feed-lane';lane.dataset.side=side;river.append(lane);return lane;});
 for(let i=0;i<8;i++){
  const el=document.createElement('div');el.className='feed-card';el.style.setProperty('--n',i);
  el.style.setProperty('--toward',i<4?'10px':'-10px');
  el.innerHTML=`<img class="isolated" alt="" src="../beat/art/current/duel-pass9/card-dark-${i%4+1}.png"><img class="hopeful" alt="" src="../beat/art/current/duel-pass9/card-bright-${i%4+1}.png">`;
  lanes[Math.floor(i/4)].append(el);pool.push(el);
 }
}
export function respondFeed(result){
 const count=Math.min(6,Math.max(2,Math.ceil(result.clear/3)));let enlarged=false;
 for(let i=0;i<count;i++){const el=pool[feedIndex++%pool.length];el.classList.toggle('hope',result.actor===0);el.classList.remove('posted','outward','enlarged');void el.offsetWidth;el.classList.add(result.actor?'posted':'outward');
  if(!result.actor&&result.clear>=8&&!enlarged){el.classList.add('enlarged');enlarged=true;setTimeout(()=>el.classList.remove('enlarged'),600);}
 }
}
export function releaseFeed(){pool.forEach(el=>el.classList.add('hope','released'));}

// Reserve the entire motion envelope, not just the cards' resting positions.
export function layoutFeed(){
 const rect=sel=>document.querySelector(sel).getBoundingClientRect();
 const frame=rect('#board-frame'),size=Math.max(56,Math.min(80,innerWidth*.035)),laneWidth=size+32,edge=8;
 const top=Math.max(...['#atlas-hud .vessels','#siren-hud .vessels'].map(s=>rect(s).bottom))+24;
 const bottom=Math.min(...['#atlas-hud .move-row','#siren-hud .move-row'].map(s=>rect(s).top))-24;
 document.querySelectorAll('.feed-lane').forEach((lane,side)=>{
  Object.assign(lane.style,{left:`${side?innerWidth-edge-laneWidth:edge}px`,top:`${top}px`,width:`${laneWidth}px`,height:`${bottom-top}px`});
  [...lane.children].forEach((el,i)=>Object.assign(el.style,{width:`${size}px`,height:`${size}px`,left:'16px',top:`${16+i*(bottom-top-size-32)/3}px`}));
 });
 const left=edge+laneWidth+64,right=frame.left-32,width=Math.max(60,right-left),height=Math.min(innerHeight*.72,width*1.5);
 for(const id of ['atlas','atlas-reflection'])Object.assign(document.querySelector('#'+id).style,{left:`${left}px`,width:`${width}px`,height:`${height}px`});
 const sirenLeft=frame.right+32,sirenWidth=Math.max(60,innerWidth-left-sirenLeft);
 for(const id of ['siren-stage','siren-reflection']){
  const el=document.querySelector('#'+id);el.style.setProperty('--siren-height',`${Math.min(innerHeight*.72,sirenWidth*1.5)}px`);Object.assign(el.style,{left:`${sirenLeft}px`,right:`${left}px`,height:`${Math.min(innerHeight*.72,sirenWidth*1.5)}px`});
 }
}
