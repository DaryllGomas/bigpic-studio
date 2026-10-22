// The Lamps on the Gate Road. Pure store; storage may be unavailable (private browsing).
export const QUEST_KEY = 'atlas.quests.v1';
export const LAMP_IDS = Array.from({ length: 28 }, (_, i) => `lamp-${i}`);
export const STATES = Object.freeze({ WAITING: 'waiting', LAMPS: 'lamps', COMPLETE: 'complete' });
export const QUEST2 = Object.freeze({ title: 'The Weight on the Bridge' });
export const QUEST2_STATES = Object.freeze({ LOCKED: 'locked', ROAD: 'road', BRIDGE: 'bridge', BATTLE: 'battle', CLEARED: 'cleared' });
const fresh = () => ({ state: STATES.WAITING, signal: false, lamps: [], firstDeed: false, light: 0,
  quest2: QUEST2_STATES.LOCKED, secondDeed: false, greenSeen: false });
function decode(raw) {
  try {
    const s = JSON.parse(raw);
    if (!s || !Object.values(STATES).includes(s.state) || !Array.isArray(s.lamps) ||
        s.lamps.some(id => !LAMP_IDS.includes(id)) || new Set(s.lamps).size !== s.lamps.length ||
        s.signal !== (s.state !== STATES.WAITING) || s.firstDeed !== (s.state === STATES.COMPLETE) ||
        (s.state === STATES.WAITING && s.lamps.length) || (s.firstDeed && s.lamps.length !== LAMP_IDS.length)) return fresh();
    // Older quest-one saves have no quest-two fields. Reject inconsistent new data without erasing the first deed.
    let quest2 = s.firstDeed ? QUEST2_STATES.ROAD : QUEST2_STATES.LOCKED;
    let secondDeed = false;
    if (Object.values(QUEST2_STATES).includes(s.quest2) && typeof s.secondDeed === 'boolean' &&
        s.secondDeed === (s.quest2 === QUEST2_STATES.CLEARED) &&
        (s.firstDeed ? s.quest2 !== QUEST2_STATES.LOCKED : s.quest2 === QUEST2_STATES.LOCKED)) {
      quest2 = s.quest2 === QUEST2_STATES.BATTLE ? QUEST2_STATES.BRIDGE : s.quest2;
      secondDeed = s.secondDeed;
    }
    // greenSeen (added with the City talk lane): Atlas has walked out to the Green. Older saves simply lack it.
    return { greenSeen: s.greenSeen === true, quest2, secondDeed, state: s.state, signal: s.signal, lamps: [...s.lamps], firstDeed: s.firstDeed,
      light: s.lamps.length * 10 + (s.firstDeed ? 30 : 0) };
  } catch { return fresh(); }
}
export function createQuestStore({ storage, replay = false, startBattle } = {}) {
  let s;
  try { s = replay ? fresh() : decode(storage?.getItem(QUEST_KEY)); } catch { s = fresh(); }
  const save = () => { try { storage?.setItem(QUEST_KEY, JSON.stringify(s)); } catch {} };
  if (replay) save();
  return {
    get snapshot() { return { ...s, lamps: [...s.lamps] }; },
    /** Atlas has been out to the Green (the east archway). Once only; the townsfolk change what they say. */
    markGreen() { if (s.greenSeen) return false; s.greenSeen = true; save(); return true; },
    reachBridge() {
      if (s.quest2 !== QUEST2_STATES.ROAD) return false;
      s.quest2 = QUEST2_STATES.BRIDGE; save(); return true;
    },
    // The battle adapter calls back with true for a win, false for a loss/cancel. Each attempt owns its callback.
    startBattle(battle = startBattle) {
      if (s.quest2 !== QUEST2_STATES.BRIDGE || typeof battle !== 'function') return false;
      s.quest2 = QUEST2_STATES.BATTLE; save();
      let settled = false;
      const finish = won => {
        if (settled) return false;
        settled = true;
        s.quest2 = won === true ? QUEST2_STATES.CLEARED : QUEST2_STATES.BRIDGE;
        s.secondDeed = won === true; save(); return true;
      };
      try { battle(finish); } catch { finish(false); }
      return true;
    },
    accept() { if (s.state !== STATES.WAITING) return false; s.signal = true; s.state = STATES.LAMPS; save(); return true; },
    relight(id) {
      if (s.state !== STATES.LAMPS) return false;
      if (id === 'ring') {
        if (s.lamps.length !== LAMP_IDS.length) return false;
        s.state = STATES.COMPLETE; s.firstDeed = true; s.light += 30; s.quest2 = QUEST2_STATES.ROAD;
      } else {
        if (!LAMP_IDS.includes(id) || s.lamps.includes(id)) return false;
        s.lamps.push(id); s.light += 10;
      }
      save(); return true;
    },
  };
}
let shared;
export function quests() {
  if (!shared) {
    let storage; try { storage = globalThis.localStorage; } catch {}
    shared = createQuestStore({ storage, replay: new URLSearchParams(globalThis.location?.search).has('replay') });
  }
  return shared;
}

// A hold belongs to one nearby target. Release, range loss, or target change discards the stroke.
export function createSignalHold(quest, duration = 1.05) {
  let target = null, elapsed = 0;
  return {
    step(id, down, dt) {
      if (!down || !id || !quest.snapshot.signal) { target = null; elapsed = 0; return { progress: 0, relit: false }; }
      if (id !== target) { target = id; elapsed = 0; }
      elapsed += Math.min(.05, Math.max(0, dt));
      const progress = Math.min(1, elapsed / duration);
      const relit = progress === 1 && quest.relight(id);
      if (relit) { target = null; elapsed = 0; }
      return { progress, relit };
    },
  };
}
