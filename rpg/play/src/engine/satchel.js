// Carried items are separate from lifetime fishing records. Pure, injected storage.
export const SATCHEL_KEY = 'atlas.satchel.v1';
export const ITEMS = Object.freeze({ 'sky-minnow':'Sky Minnow', 'gilded-carp':'Gilded Carp', starfin:'Starfin', 'lantern-eel':'Lantern Eel', 'moon-koi':'Moon Koi', wheat:'Wheat', greens:'Greens', tomatoes:'Tomatoes', flowers:'Flowers' });
export const CROPS = ['wheat','greens','tomatoes','flowers'];
export const isFish = id => Object.hasOwn(ITEMS,id) && !CROPS.includes(id);
export class Satchel {
  constructor(storage = null) { this.storage = storage; this.fallback = {}; this.unwritable = false; }
  get counts() {
    try { if(!this.storage || this.unwritable)return {...this.fallback}; const d = JSON.parse(this.storage.getItem(SATCHEL_KEY)); return Object.fromEntries(Object.entries(d?.counts || {}).filter(([id,n]) => Object.hasOwn(ITEMS,id) && Number.isSafeInteger(n) && n > 0)); } catch { return {...this.fallback}; }
  }
  change(id, amount) { if (!Object.hasOwn(ITEMS,id) || !Number.isSafeInteger(amount)) return false; const c=this.counts, n=(c[id]||0)+amount; if(n<0 || !Number.isSafeInteger(n))return false; if(n)c[id]=n;else delete c[id]; this.fallback={...c}; try { this.storage?.setItem(SATCHEL_KEY,JSON.stringify({v:1,counts:c})); } catch { this.unwritable=true; } return true; }
  add(id) { return this.change(id,1); }
  take(id) { return this.change(id,-1); }
  get items() { return Object.entries(this.counts).map(([id,count])=>({id,count,name:ITEMS[id]})); }
  get fish() { return this.items.find(i=>isFish(i.id)); }
}
// The talk row shows one carried kind at a time; up/down browses kinds.
export function giftChoices(satchel, friends, id, reaction, rise) {
  if (!friends.canGift(id) || !satchel.items.length) return [];
  return [...satchel.items.map(item=>({label:`Give ${item.name}`,count:item.count, choose:()=>{const r=friends.gift(id,item.id,satchel);if(!r.given)return [];if(r.rose)rise(id);return reaction(id,r.taste,item.id);}})), {label:'Not now',choose:()=>null}];
}
