// Friendships with the townsfolk (Stardew-style, light). Pure: no DOM, no three.js, node-testable.
// Saved inside 'atlas.city.v1' next to the older { greenSeen } flag (fields are only ever added):
//   { greenSeen?, friends: { id: 0..5 }, seen: { id: 'YYYY-MM-DD' }, favours: { id: true } }
// Talking to someone for the first time on a real calendar day: +1. Finishing their favour: +2. Nothing numeric is ever shown.
export const CITY_KEY = 'atlas.city.v1';
export const MAX_LEVEL = 5;
export const FAVOUR_BONUS = 2;
export const HOME_KEY = 'atlas.home.v1';

/** Local calendar day, 'YYYY-MM-DD'. */
export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const clamp = (n) => Math.max(0, Math.min(MAX_LEVEL, Math.floor(Number.isFinite(n) ? n : 0)));
export function readCity(storage) {
  let c = null;
  try { c = JSON.parse(storage && storage.getItem(CITY_KEY) || 'null'); } catch {}
  if (!c || typeof c !== 'object' || Array.isArray(c)) c = {};
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
  return { ...c, friends: obj(c.friends), seen: obj(c.seen), favours: obj(c.favours) };
}
function writeCity(storage, c) { try { storage && storage.setItem(CITY_KEY, JSON.stringify(c)); } catch {} }
/** Merge a patch into the saved city without losing friendships (the old code overwrote the whole key). */
export function mergeCity(storage, patch) { const c = { ...readCity(storage), ...patch }; writeCity(storage, c); return c; }

/** The house-building lane saves 'atlas.home.v1' as { v:1, stage:0..3 }; 3 = finished. Read it loosely. */
export function homeStage(storage) {
  try { const h = JSON.parse(storage && storage.getItem(HOME_KEY) || 'null'); const s = h && Number(h.stage); return Number.isFinite(s) ? s : 0; } catch { return 0; }
}
export const homeDone = (storage) => homeStage(storage) >= 3;

/** Is this person's favour ready to be finished? c = the lines context (deed, greenSeen, fished, homeDone). */
export function favourReady(id, c) {
  switch (id) {
    case 'bram': return !!(c.carriedFish ?? c.fished);
    case 'sael': return !!c.greenSeen;
    case 'dara': return !!c.deed;
    case 'joss': return !!c.homeDone;
    default: return false;
  }
}
export const FAVOUR_IDS = ['bram', 'sael', 'dara', 'joss'];

export function createFriends({ storage, now = () => new Date() } = {}) {
  return {
    canGift: id => readCity(storage).gifts?.[id] !== dayKey(now()),
    gift(id, item, satchel) {
      const c=readCity(storage), today=dayKey(now()), before=clamp(c.friends[id]);
      if(c.gifts?.[id]===today || !satchel.take(item))return {given:false};
      const taste=giftTaste(id,item); c.gifts={...c.gifts,[id]:today};c.friends[id]=clamp(before+(taste==='love'?2:taste==='like'?1:0));writeCity(storage,c);
      return {given:true,taste,rose:c.friends[id]>before,level:c.friends[id]};
    },
    level: (id) => clamp(readCity(storage).friends[id]),
    favourDone: (id) => readCity(storage).favours[id] === true,
    /** First talk of the real day: +1. Returns { level, before, rose }. */
    touch(id) {
      const c = readCity(storage), today = dayKey(now()), before = clamp(c.friends[id]);
      if (c.seen[id] === today) return { level: before, before, rose: false };
      c.seen[id] = today; c.friends[id] = clamp(before + 1); writeCity(storage, c);
      return { level: c.friends[id], before, rose: c.friends[id] > before };
    },
    /** Their favour is finished: +2, once. */
    finishFavour(id) {
      const c = readCity(storage), before = clamp(c.friends[id]);
      if (c.favours[id] === true) return { level: before, before, rose: false, done: false };
      c.favours[id] = true; c.friends[id] = clamp(before + FAVOUR_BONUS); writeCity(storage, c);
      return { level: c.friends[id], before, rose: c.friends[id] > before, done: true };
    },
  };
}

// Preferences are item IDs; everything else receives a kind, neutral thank-you.
export const PREFERENCES = {
  elder:['wheat','flowers'],tamsin:['flowers','tomatoes'],orrin:['starfin','wheat'],bram:['moon-koi','fish'],sael:['wheat','greens'],lio:['greens','flowers'],wyn:['flowers','wheat'],dara:['lantern-eel','flowers'],joss:['tomatoes','wheat'],kit:['sky-minnow','flowers'],idris:['tomatoes','greens'],
  builder:['wheat','tomatoes'],fisher:['moon-koi','fish'],farmer:['greens','wheat'],keeper:['flowers','greens'],child:['sky-minnow','flowers'],neighbour:['tomatoes','wheat'],
};
export function giftTaste(id,item) { const [love,like]=PREFERENCES[id]||[]; return item===love?'love':item===like||(like==='fish'&&!['wheat','greens','tomatoes','flowers'].includes(item))?'like':'plain'; }
