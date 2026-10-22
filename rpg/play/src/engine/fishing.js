// Pure fishing loop. Seconds are supplied by the scene; storage and randomness are injectable.
export const FISH_KEY = 'atlas.fish.v1';
export const FISH = [
  { id:'sky-minnow', name:'Sky Minnow', color:'#a9e2ef', weight:45, beats:2, min:12, max:24 },
  { id:'gilded-carp', name:'Gilded Carp', color:'#efbc61', weight:30, beats:2, min:24, max:55 },
  { id:'starfin', name:'Starfin', color:'#beacff', weight:12, beats:3, min:18, max:38 },
  { id:'lantern-eel', name:'Lantern Eel', color:'#85f6cc', weight:9, beats:3, min:35, max:75, times:['dusk','night'], glow:true },
  { id:'moon-koi', name:'Moon Koi', color:'#e5eaff', weight:5, beats:3, min:28, max:65, times:['night'], glow:true },
];
export function chooseFish(time, random = Math.random) {
  const pool = FISH.filter(f => !f.times || f.times.includes(time));
  let n = random() * pool.reduce((s,f)=>s+f.weight,0);
  return pool.find(f => (n -= f.weight) < 0) || pool.at(-1);
}
export class Fishing {
  constructor(storage = null, random = Math.random) {
    this.storage=storage; this.random=random; this.state='idle'; this.elapsed=0; this.hits=0; this.mark=0; this.zone=[.28,.72]; this.tally={}; this.fish=null;
    try { const d=JSON.parse(storage?.getItem(FISH_KEY)); if(d?.v===1) for(const f of FISH) { const v=d.counts?.[f.id]; if(Number.isSafeInteger(v?.count)&&v.count>0&&Number.isFinite(v.best)&&v.best>0) this.tally[f.id]={count:v.count,best:v.best}; } } catch {}
  }
  get snapshot() { return {state:this.state,elapsed:this.elapsed,wait:this.wait,hits:this.hits,mark:this.mark,zone:[...this.zone],fish:this.fish&&{...this.fish},size:this.size,twitch:this.state==='wait'&&[.3,.66].some(p=>Math.abs(this.elapsed-this.wait*p)<.14),tally:JSON.parse(JSON.stringify(this.tally))}; }
  enter(state) { this.state=state; this.elapsed=0; }
  cancel() { this.enter('idle'); this.hits=0; }
  press(time='golden') {
    if(this.state==='idle') { this.fish=chooseFish(time,this.random); this.size=Math.round(this.fish.min+this.random()*(this.fish.max-this.fish.min)); this.wait=2+this.random()*4; this.hits=0; this.enter('cast'); }
    else if(this.state==='bite') { this.mark=0; this.enter('reel'); }
    else if(this.state==='reel') {
      if(this.mark<this.zone[0] || this.mark>this.zone[1]) this.enter('escape');
      else if(++this.hits>=this.fish.beats) {
        const old=this.tally[this.fish.id]||{count:0,best:0}; this.tally[this.fish.id]={count:old.count+1,best:Math.max(old.best,this.size)};
        try { this.storage?.setItem(FISH_KEY,JSON.stringify({v:1,counts:this.tally})); } catch {}
        this.enter('catch');
      } else { this.enter('reel'); this.mark=0; }
    }
  }
  debugBite() { if(this.state==='wait'||this.state==='cast') { this.enter('bite'); return true; } return false; }
  update(dt) {
    if(!Number.isFinite(dt)||dt<0) return;
    this.elapsed+=dt;
    if(this.state==='cast'&&this.elapsed>=.8) this.enter('wait');
    else if(this.state==='wait'&&this.elapsed>=this.wait) this.enter('bite');
    else if(this.state==='bite'&&this.elapsed>=1.05) this.enter('escape');
    else if(this.state==='reel') { this.mark=(1-Math.cos(this.elapsed*Math.PI/1.35))/2; if(this.elapsed>=5.4) this.enter('escape'); }
    else if((this.state==='catch'&&this.elapsed>=2.8)||(this.state==='escape'&&this.elapsed>=.8)) this.enter('idle');
  }
}
