import {initMotion,castMotion,shatter,reform} from './battle-motion.js';
import {card,colours,awakenAudio,clearCards,gemNames,initFeed,layoutFeed,releaseFeed} from './river.js';
import {SirenScore} from './score.js';
import {CurrentFight,moves} from './current.js';
import {actionIdToSwap, encodeSwap, burdenMax, vesselCap} from './weighing-kernel.js';
const art = '../beat/art/current/';
const query = new URLSearchParams(location.search);
const embedded=query.get('embedded')==='1'&&parent!==window;
let completed=false;
function complete(won){
 if(!embedded||completed)return;completed=true;
 parent.postMessage({type:'match-complete',boss:'current',result:won?{won:true,rounds:fight.rounds,losses:fight.losses,moves:fight.moves}:null},location.origin);
}
const fight = new CurrentFight(Number(query.get('seed')) || 719,{playtestEasy:query.has('hard')?false:undefined});
const $ = s => document.querySelector(s), board = $('#board'), cinema = $('#cinema');
function pose(who,name){
 const folder=who==='atlas'?'atlas/atlas-':'poses/';
 document.querySelectorAll(`[data-fighter="${who}"]`).forEach(im=>im.src=art+folder+name+'.png');
}
// Source-over layers keep one camera: spell -> turning -> clear.
// Round-one victory lands exactly on the turning painting; the next two
// duels carry it through to clear. CSS eases the layers between turns.
function arenaLight(progress){
 progress=progress<=1/3?progress*1.5:.5+(progress-1/3)*.75;
 const smooth=t=>t*t*(3-2*t);
 $('#arena-turning').style.opacity=smooth(Math.min(1,progress*2));
 $('#arena-clear').style.opacity=smooth(Math.max(0,progress*2-1));
 $('#arena').style.setProperty('--healing',progress);
 const cool=[139,121,212],warm=[255,203,122];
 $('#arena').style.setProperty('--rim',`rgba(${cool.map((v,i)=>Math.round(v+(warm[i]-v)*progress)).join(',')},.34)`);
}
const music = new SirenScore();
const score = () => music.setRound(fight.round);
initFeed();
let cursor = 27, selected = -1, busy = true, started = false, idleTimer;
let moveCursor=-1,preview=null;

const huds=['atlas','siren'].map((who,actor)=>{
 const hud=$('#'+who+'-hud');
 hud.innerHTML=`<div class="health-line"><span class="sigil" aria-hidden="true">${actor?'☾':'◈'}</span><div class="health" role="progressbar" aria-label="${actor?'The Current’s clarity':'Atlas’s focus'}" aria-valuemin="0" aria-valuemax="30"><i></i><em></em></div></div><div class="vessels" aria-label="Gathered power"></div><div class="move-readout" aria-live="polite" hidden></div><div class="move-row" aria-label="${who} moves"></div>`;
 moves.forEach((move,i)=>{
  const vial=document.createElement('div');vial.className='vial';vial.style.setProperty('--gem-colour',colours[i+2]);
  vial.innerHTML=`<i></i>${card(i+2)}`;vial.setAttribute('role','meter');vial.setAttribute('aria-label',move.names[actor]+' mana');vial.setAttribute('aria-valuemin','0');vial.setAttribute('aria-valuemax',vesselCap);
  hud.querySelector('.vessels').append(vial);
  const slot=document.createElement('button');slot.className='move';slot.style.setProperty('--gem-colour',colours[i+2]);
  slot.innerHTML=`<span class="move-cost">${move.cost}</span><span class="move-stone">${card(i+2)}</span><div class="pips">${'<i></i>'.repeat(move.cost)}</div>`;
  slot.title=`${move.names[actor]} · ${move.cost} · ${move.effect}`;slot.setAttribute('aria-label',slot.title);
  slot.onclick=()=>{if(!busy){if(actor){inspectHer(i);return;}if(moveCursor!==i)preview=null;selected=-1;moveCursor=i;cast(i);}};
  if(actor)slot.tabIndex=-1;
  hud.querySelector('.move-row').append(slot);
 });return hud;
});
const tiles = Array.from({length:64}, (_,i) => {
 const b = document.createElement('button'); b.className = 'tile'; b.setAttribute('role','gridcell');
 b.addEventListener('click',()=>{cursor=i;moveCursor=-1;pick(i);}); board.append(b); return b;
});
// Fit the painted aperture to the actual cells, including fractional layout
// pixels. Neither the frame nor its opening depends on viewport percentages.
function fitBoardFrame(){
 const box=board.getBoundingClientRect(),first=tiles[0].getBoundingClientRect(),last=tiles[63].getBoundingClientRect();
 const width=(last.right-first.left+12)*1254/974,height=(last.bottom-first.top+12)*1254/940;
 const left=first.left-box.left-6-width*141/1254,top=first.top-box.top-6-height*147/1254;
 const frame=$('#board-frame');
 Object.assign(frame.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
 // Reserve the sky above the rim.
 $('#tide').style.top=`${Math.min(board.offsetTop-box.height/2+top-32,innerHeight*.06)}px`;
 layoutFeed();
}
const boardResize=new ResizeObserver(fitBoardFrame);
boardResize.observe(board);boardResize.observe($('#arena'));fitBoardFrame();
const tideSegments=Array.from({length:48},(_,i)=>{
 const segment=document.createElementNS('http://www.w3.org/2000/svg','rect');
 segment.setAttribute('x',24+i*4);segment.setAttribute('y','10');segment.setAttribute('width','3');segment.setAttribute('height','5');segment.setAttribute('rx','1');
 $('#tide-progress').append(segment);return segment;
});
function drawBoard(values){
 values.forEach((v,i)=>{
  const t=tiles[i],shown=preview?.conversions.find(c=>c.cell===i)?.kind??v;
  if(t.dataset.shownKind!==String(shown)){t.innerHTML=card(shown);t.dataset.shownKind=shown;}t.dataset.kind=v;
  t.style.setProperty('--tint',colours[v]);t.style.setProperty('--phase',`${-(i*0.37)}s`);
  t.className='tile'+(cursor===i&&moveCursor<0?' cursor':'')+(selected===i?' selected':'')+(preview?.affected.includes(i)?' preview-clear':'')+(preview?.conversions.some(c=>c.cell===i)?' preview-convert':'');
  t.setAttribute('aria-label',`${gemNames[v]}, row ${Math.floor(i/8)+1}, column ${i%8+1}`);
  t.setAttribute('aria-selected',String(selected===i)); t.tabIndex=cursor===i?0:-1;
 });
 }
function render() {
 drawBoard(fight.state.board);
 updateHud();
 arenaLight(fight.progress);
 $('#meter i').style.height=`${fight.progress*100}%`;
 $('#meter').classList.toggle('summoned',fight.round>1);
 $('#meter').setAttribute('aria-valuenow',fight.progress*100);
 $('#meter').setAttribute('aria-valuemax','100');
 clearTimeout(idleTimer);
 if(!busy) idleTimer=setTimeout(()=>{
  const a=fight.swaps()[0]; if(a===undefined)return;
  actionIdToSwap(a).forEach(i=>tiles[i].classList.add('hint'));
 },5500);
}
function updateHud(){
 huds.forEach((hud,actor)=>{
  const hp=actor?fight.state.burden[1]:fight.health[0],health=hud.querySelector('.health');
  health.setAttribute('aria-valuenow',hp);health.querySelector('i').style.width=`${hp/burdenMax*100}%`;
  health.querySelector('em').textContent=`${actor?'Clarity':'Focus'} ${hp} / ${burdenMax}`;
  const readout=hud.querySelector('.move-readout');readout.hidden=actor!==0||moveCursor<0;
  if(!readout.hidden){const move=moves[moveCursor];readout.innerHTML=`<b>${move.names[0]} · ${move.cost}</b>`;}
  hud.querySelectorAll('.vial').forEach((v,i)=>{const n=fight.state.vessels[actor][i];v.style.setProperty('--fill',n/vesselCap);v.setAttribute('aria-valuenow',n);});
  hud.querySelectorAll('.move').forEach((slot,i)=>{
   const n=fight.state.vessels[actor][i];
   // Show each owner’s readiness between turns, respecting the one-use breath.
   const ready=n>=moves[i].cost&&!(i===4&&fight.state.liftUsed[actor]);
   slot.classList.toggle('ready',ready);slot.classList.toggle('chosen',actor===0&&moveCursor===i);
   slot.disabled=busy;slot.classList.toggle('spent',i===4&&!!fight.state.liftUsed[actor]);slot.setAttribute('aria-disabled',String(!ready));
   slot.querySelectorAll('.pips i').forEach((pip,j)=>pip.classList.toggle('filled',j<n));
  });
 });
 const turnsLeft=Math.max(0,48-fight.state.actionCountI);
 tideSegments.forEach((segment,i)=>segment.classList.toggle('remaining',i<turnsLeft));
 $('#tide').style.setProperty('--crest',Math.max(0,1-turnsLeft/12));
 $('#tide').classList.toggle('near-cap',turnsLeft<=12);
 $('#tide').dataset.leader=fight.leader;
 $('#tide').setAttribute('aria-label',`${turnsLeft} turns left of 48; ${fight.leader?'The Current':'Atlas'} leads`);
 $('#round-seals').setAttribute('aria-label',`Round ${fight.round} of 3`);
 [...$('#round-seals').children].forEach((s,i)=>{s.className=i<fight.round-1?'won':i===fight.round-1?'active':'';});
}
function inspectHer(i){
 const readout=huds[1].querySelector('.move-readout');readout.hidden=false;readout.innerHTML=`<b>${moves[i].names[1]} · ${moves[i].cost}</b>`;
}
function clearPreview(){preview=null;$('#power-preview').hidden=true;}
function cast(i){
 if(busy)return;
 if(preview?.index===i){if(preview.unavailable)return;const frozen=preview.action;clearPreview();moveCursor=-1;void play(frozen);return;}
 clearPreview();const p=fight.preview(i);
 if(p){preview={...p,index:i};}else preview={index:i,action:null,affected:[],conversions:[],damage:0,relief:0,vessels:[0,0,0,0,0],unavailable:true};
 const el=$('#power-preview');el.hidden=false;el.classList.toggle('unavailable',!!preview.unavailable);
 el.innerHTML=`<b>${moves[i].names[0]}${preview.unavailable?' · ◌':''}</b><div class="preview-yields"><span>${card(0)} ${preview.damage}</span><span>${card(1)} ${preview.relief}</span>${preview.vessels.map((n,j)=>`<span>${card(j+2)} ${n}</span>`).join('')}</div>`;
 // Preview conversions use the replacement gem, while direct clears keep
 // their identities. Refills and later cascades remain unknown.
 render();
}
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function show(files, duration=1700, pearl=false, lanterns=false) {
 cinema.hidden=false; cinema.className=pearl?'pearl':'';
 for(const file of files){
  const image=new Image(); image.src=art+file;
  await image.decode().catch(()=>{});
  const painting=$('#painting'); painting.style.animation='none'; painting.src=image.src;
  void painting.offsetWidth; painting.style.animation='';
  const lights=$('#cinema-lanterns');
  if(lanterns){
   // A single short flight per ending painting; these never enter the arena.
   for(let i=0;i<4;i++){
    const light=new Image();light.alt='';light.className='cinema-lantern';
    light.src=art+`duel-pass9/card-bright-${i+1}.png`;
    light.style.left=`${[16,32,73,87][i]}%`;light.style.setProperty('--delay',`${i*.3}s`);
    light.onanimationend=()=>light.remove();lights.append(light);
   }
  }
  await wait(duration);lights.replaceChildren();
 }
 cinema.hidden=true;
}
const story = name => `story/${name}.jpg`;
const key = name => `duel-pass9/key-${name}.png`;
async function panel(result){
 const small=!result.power,el=$('#move-panel');
 el.className=(result.actor?'her-panel':'atlas-panel')+(small?' cascade-panel':'');
 const file=result.actor?(result.move===0?'4-the-wave':result.move===3?'6-last-stand':'2-the-pull'):(result.move===4?'5-pearl-gathers':'7-release');
 el.querySelector('img').src=art+key(file);
 el.querySelector('b').textContent='';el.querySelector('span').textContent='';
 el.hidden=false;await wait(small?800:1700);el.hidden=true;
}
async function milestone(kind) {
 if(kind!=='pulled-under')await shatter(tiles,wait,kind==='pearl'?250:650);
 if(kind==='summon'){
  music.sting(true);pose('siren','bigmove');
  await show([key('3-dragons')],5500);
  fight.resume();score();pose('siren','idle');
 }else if(kind==='pearl'){
  music.sting(true);await show([key('5-pearl-gathers')],1100);
  fight.resume();score();pose('siren','bigmove');$('#arena').classList.add('gathering');
 }else if(kind==='pulled-under'){
  pose('siren','bigmove');await show([key('9-pulled-under')],1400);
  fight.resume();pose('siren','idle');
 }else{
  music.ending();arenaLight(1);releaseFeed();
  await show([key('7-release'),key('8-she-wakes')],8000,false,true);
  fight.resume();pose('siren','woken');
  $('#clear-river').style.backgroundImage=`url('${art}${key('8-she-wakes')}')`;$('#clear-river').style.opacity=1;
  for(const id of ['board','meter','arena-depth','water-front','atlas-contact','atlas-reflection','siren-reflection','atlas-hud','siren-hud','round-seals','control-hint','tide','feed-river','atlas','water','gauntlet-water','siren-stage','power-preview'])$('#'+id).hidden=true;
  $('#credits').hidden=embedded;complete(true);return;
 }
 render();if(kind!=='pulled-under')await reform(tiles,wait,kind==='pearl'?400:900);
}

async function play(action) {
 busy=true;selected=-1;clearPreview();clearTimeout(idleTimer);updateHud();
 const result=fight.act(action);
 if(!result){busy=false;render();return;}
 window.__lastResult=result;
 arenaLight(fight.progress);
 pose('siren',result.actor?'windup':'idle');pose('atlas',result.actor?'idle':'cast');
 if(result.power)music.sting();
 const weight=result.power||result.maxRun>=4||result.waves>=3;
 await Promise.all([
  weight?panel(result):Promise.resolve(),
  (async()=>{await castMotion(result,wait);await clearCards(result,tiles,wait,drawBoard);})(),
  wait(850)
 ]);
 render();pose('atlas','idle');$('#arena').dataset.turn='';
 if(result.trace.directRelief)huds[result.actor].classList.add('breathing');
 await wait(180);huds[result.actor].classList.remove('breathing');
 if(result.milestone){
  if(fight.state.finishReasonI===2){
   $('#arena').dataset.crest=String(fight.state.winnerI);
   // Her crest and pulled-under share the same 1.4-second transition.
   if(result.milestone!=='pulled-under')await wait(1000);
  }
  await milestone(result.milestone);delete $('#arena').dataset.crest;
 }
 if(fight.stage==='awake'){busy=true;return;}
 render();
 if(fight.state.actorI===1){await wait(500);await play(fight.ai());}
 else{busy=false;pose('siren','idle');render();}
}

function pick(i){
 if(busy)return;clearPreview();
 if(selected<0){selected=i;render();return;}
 if(selected===i){selected=-1;render();return;}
 const a=selected, dx=Math.abs(i%8-a%8),dy=Math.abs(Math.floor(i/8)-Math.floor(a/8));
 if(dx+dy!==1){selected=i;render();return;}
 const action=encodeSwap(Math.min(a,i),dy?1:0);
 if(!fight.swaps().includes(action)){
  tiles[i].animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:300});render();return;
 }
 void play(action);
}
function input(key){
 if(key==='exit'){complete(false);return;}
 if(completed)return;
 if(!started){if(key==='pick')void start();return;}
 if(busy)return;
 if(key==='cancel'){selected=-1;clearPreview();moveCursor=-1;render();return;}
 if(key==='power'){clearPreview();selected=-1;moveCursor=moveCursor<0?0:-1;render();return;}
 if(moveCursor>=0){
  if(key==='pick'){cast(moveCursor);return;}
  if(preview)return;
  if(key==='left')moveCursor=(moveCursor+4)%5;
  if(key==='right')moveCursor=(moveCursor+1)%5;
  if(key==='up')moveCursor=-1;
  render();return;
 }
 if(key==='pick'){pick(cursor);return;}
 const x=cursor%8,y=Math.floor(cursor/8);
 if(key==='down'&&y===7&&selected<0){moveCursor=0;render();return;}
 const next=key==='left'?y*8+Math.max(0,x-1):key==='right'?y*8+Math.min(7,x+1):key==='up'?Math.max(0,y-1)*8+x:Math.min(7,y+1)*8+x;
 if(next===cursor&&selected>=0){tiles[cursor].animate([{filter:'brightness(1.6)'},{filter:'none'}],{duration:250});return;}
 cursor=next;if(selected>=0 && selected!==next)pick(next);else render();
}
document.addEventListener('keydown',e=>{
 const key={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'pick',A:'pick',Enter:'pick',' ':'pick',Escape:embedded?'exit':'cancel',p:'power',y:'power',Y:'power'}[e.key];
 if(key){e.preventDefault();if(!e.repeat)input(key);}
});
async function start(){
 if(started)return;awakenAudio();started=true;$('#start').hidden=true;
 void music.start();
 $('#arena').classList.add('entering');pose('siren','windup');
 await show([key('1-arrival')],4000);$('#arena').classList.remove('entering');pose('siren','idle');
 $('#arena').classList.add('board-arrived');
 busy=false;render();
}
$('#start').onclick=start;
let held=new Set(),lastAxis=0;
function gamepad(time){
 const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected);
 const down=new Set();
 if(pad){
  [[0,'pick'],[1,'cancel'],[3,'power'],[12,'up'],[13,'down'],[14,'left'],[15,'right'],[16,'exit']].forEach(([i,k])=>{if(pad.buttons[i]?.pressed)down.add(k);});
  if(time-lastAxis>200){if(pad.axes[0]<-.6)down.add('left');if(pad.axes[0]>.6)down.add('right');if(pad.axes[1]<-.6)down.add('up');if(pad.axes[1]>.6)down.add('down');}
 }
 for(const k of down)if(!held.has(k)){input(k);lastAxis=time;}held=down;
 requestAnimationFrame(gamepad);
}
requestAnimationFrame(gamepad);
// Preload action paintings while the start gate is visible.
for(const file of new Set(moves.flatMap(m=>m.paintings).concat(story('09-final-attack'),story('11-atlas-answers')))){const im=new Image();im.src=art+file;}
// Preload both painted Atlas poses and her existing poses.
for(const pose of ['idle','cast']){const im=new Image();im.src=art+`atlas/atlas-${pose}.png`;}
for(const n of ['idle','windup','bigmove','woken']){const im=new Image();im.src=art+`poses/${n}.png`;}
initMotion();
render();
window.__current={fight,music,get preview(){return preview;},get busy(){return busy;},input,play,render};
