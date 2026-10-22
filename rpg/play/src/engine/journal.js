import { FISH } from './fishing.js';
import { fishPortrait } from '../scene/green-art.js';
import { ELDER, PEOPLE } from '../scene/plaza/lines.js';
import { GREENFOLK } from '../scene/green-lines.js';

const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const number = (v, max = 999999) => Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
export function readJournal(storage) {
  const read = key => { try { return object(JSON.parse(storage?.getItem(key))); } catch { return {}; } };
  const fish = read('atlas.fish.v1'), city = read('atlas.city.v1'), home = read('atlas.home.v1');
  const met = read('atlas.journal.v1');
  return {
    fish: FISH.map(f => ({...f, count:number(object(fish.counts)[f.id]?.count), best:number(object(fish.counts)[f.id]?.best)})),
    friends: [ELDER, ...PEOPLE, ...GREENFOLK].filter(p => Object.hasOwn(object(city.seen), p.id) || number(object(city.friends)[p.id],5)>0 || object(met.met)[p.id] === true).map(p => ({id:p.id,name:p.name,level:number(object(city.friends)[p.id],5)})),
    stage:number(home.stage,3), carried:Object.fromEntries(['stone','timber','reed'].map(k=>[k,number(object(home.carried)[k],999)])),
  };
}
const hints = ['The pond holds a little sky.','Gold beneath the pond’s still water.','A small star in the pond.','Bites at dusk, beneath the lanterns.','Stirs beneath the moon.'];
export const NEL_LINES = [
  'Six pale stones will give your home somewhere to stand.',
  'A firm foundation. Eight fallen timbers will make a fine frame.',
  'Ten bundles of reeds, and we will keep the rain singing outside.',
  'There it is, Atlas. Room for all the days ahead.',
];
const CSS = `
#journal {position:fixed;inset:0;z-index:110;background:radial-gradient(ellipse at top,#233c49f5,#090f20fa 75%);color:#f1dcaa;font:28px/1.4 Georgia,serif;padding:4vh 6vw;box-sizing:border-box;overflow:auto}
#journal[hidden]{display:none} #journal *{box-sizing:border-box}
#journal h1{font:600 44px Cinzel,serif;letter-spacing:.25em;margin:0} #journal header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #bc995c;padding-bottom:20px}
#journal button{font:600 28px Cinzel,serif;color:#efd8a1;border:1px solid #ad8a52;background:#142333;padding:12px 28px;cursor:pointer}
#journal nav{display:flex;gap:18px;margin:24px 0} #journal [aria-selected=true]{background:#5b5038;border-color:#ffe0a0}
#journal .fish-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;margin-top:4vh} #journal article{border:1px solid #ad8a5266;background:#0c1729a6;padding:22px;text-align:center}
#journal h2{font:600 28px Cinzel,serif;margin:12px 0} #journal p{margin:12px 0;color:#d3d9cf} #journal img{width:100%;max-width:192px;image-rendering:pixelated} #journal .unknown{filter:brightness(0) drop-shadow(0 0 1px #a6b6c1);opacity:.65}
#journal .detail{font-size:25px} #journal .hint{font-size:23px;font-style:italic;color:#b7c9c2;min-height:3em}
#journal .friends-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px} #journal .friend{display:flex;align-items:center;text-align:left;gap:12px;padding:10px}
#journal .medal{display:grid;place-items:center;flex-shrink:0;width:52px;height:52px;border-radius:50%;border:2px solid #b99a61;background:#37545c;font:28px Cinzel,serif} #journal .friend h2{margin:4px 0;font-size:clamp(21px,1.7vw,28px)} #journal .hearts{color:#f4cc76;letter-spacing:4px;font-size:30px} #journal .dim{color:#52606c}
#journal .home{display:grid;grid-template-columns:1fr 1fr;gap:6vw;align-items:center} #journal svg{width:100%;max-height:40vh} #journal blockquote{font-size:34px;line-height:1.5;margin:24px 0} #journal .materials{display:flex;gap:28px;font-size:30px}
@media(max-width:1300px){#journal{padding:3vh 4vw}#journal .fish-grid{gap:10px;margin-top:3vh}#journal article{padding:12px}#journal h2{font-size:23px}#journal .detail,#journal .hint{font-size:21px}#journal .friends-grid{gap:10px}#journal .friend{gap:8px;padding:7px}#journal .friend h2{font-size:21px}#journal .medal{width:40px;height:40px}#journal .hearts{font-size:25px;letter-spacing:2px}}
`;
export class Journal {
  constructor(driver) {
    this.driver=driver; this.tab=0;
    const style=document.createElement('style'); style.textContent=CSS;document.head.append(style);
    this.el=document.createElement('section');this.el.id='journal';this.el.hidden=true;this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-label','Journal');this.el.dataset.padMenu='';document.body.append(this.el);
    this.el.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t)this.select(Number(t.dataset.tab));if(e.target.closest('[data-back]'))this.close();});
  }
  get open(){return !this.el.hidden;}
  storage(){try{return window.localStorage;}catch{return null;}}
  observe(){const p=window.__diorama?.world?.talk?.speaker;if(!p||!GREENFOLK.some(f=>f.id===p.id)||this.lastMet===p.id)return;this.lastMet=p.id;try{const s=this.storage();const d=object(JSON.parse(s?.getItem('atlas.journal.v1')));d.met={...object(d.met),[p.id]:true};s?.setItem('atlas.journal.v1',JSON.stringify(d));}catch{}}
  show(){this.driver.setPause(true);this.data=readJournal(this.storage());this.el.hidden=false;this.driver.pauseEl.style.visibility="hidden";this.select(0);}
  close(){this.el.hidden=true;this.driver.pauseEl.style.visibility="";this.driver.focus(this.driver.pauseEl.querySelector('[data-act=journal]'));}
  select(tab){this.tab=(tab+3)%3;this.render();this.driver.focus(this.el.querySelector(`[data-tab="${this.tab}"]`));}
  render(){
    const d=this.data;this.el.innerHTML=`<header><h1>JOURNAL</h1><button data-back aria-label="Back to pause">BACK</button></header><nav role="tablist">${['FISH','FRIENDS','HOME'].map((s,i)=>`<button role="tab" aria-selected="${i===this.tab}" data-tab="${i}">${s}</button>`).join('')}</nav><div role="tabpanel" aria-label="${['Fish','Friends','Home'][this.tab]}"></div>`;
    const panel=this.el.querySelector('[role=tabpanel]');
    if(this.tab===0){panel.className='fish-grid';d.fish.forEach((f,i)=>{const a=document.createElement('article');const img=document.createElement('img');img.src=fishPortrait(f).toDataURL();img.alt=f.count?f.name:'Uncaught fish';if(!f.count)img.className='unknown';a.append(img);a.insertAdjacentHTML('beforeend',`<h2>${f.count?f.name:'???'}</h2>${f.count?`<div class="detail">${f.count} caught<br>Best · ${f.best||'—'} cm</div><p class="hint">${hints[i]}</p>`:''}`);panel.append(a);});}
    if(this.tab===1){panel.className='friends-grid';if(!d.friends.length)panel.innerHTML='<p>Still so many paths to cross.</p>';d.friends.forEach(p=>{const a=document.createElement('article');a.className='friend';a.innerHTML=`<span class="medal">${p.name[0]}</span><div><h2>${p.name}</h2><div class="hearts" aria-label="${p.level} of 5 hearts">${'♥'.repeat(p.level)}<span class="dim">${'♡'.repeat(5-p.level)}</span></div></div>`;panel.append(a);});}
    if(this.tab===2){panel.className='home';panel.innerHTML=`<div><svg viewBox="0 0 400 300" role="img" aria-label="${['Unbuilt home','Foundation','Timber frame','Finished home'][d.stage]}"><g fill="none" stroke="#394653" stroke-width="9"><path d="M65 250H335V135L200 40 65 135Z"/></g><path d="M50 253H350L330 275H70Z" fill="${d.stage>=1?'#b9b6a3':'#243142'}"/><g fill="none" stroke="${d.stage>=2?'#c6a06a':'#283747'}" stroke-width="12"><path d="M80 250V140L200 55 320 140V250M200 60V250M80 150H320"/></g>${d.stage>=3?'<path d="M80 150H320V248H80Z" fill="#dedac0"/><path d="M48 143L200 30 352 143 330 158 200 65 70 158Z" fill="#819b8a"/><path d="M177 250V176H222V250" fill="#644f37"/><path d="M105 177H147V218H105Z M253 177H295V218H253Z" fill="#f6d58e"/>':''}</svg><h2>${['A place on the Green','Foundation','Timber frame','A home on the Green'][d.stage]}</h2></div><div><h2>NEL</h2><blockquote>“${NEL_LINES[d.stage]}”</blockquote><div class="materials"><span>Stone · ${d.carried.stone}</span><span>Timber · ${d.carried.timber}</span><span>Reeds · ${d.carried.reed}</span></div></div>`;}
  }
}
