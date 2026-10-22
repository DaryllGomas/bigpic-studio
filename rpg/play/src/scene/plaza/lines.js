// All the words of the City, in one place. Edit freely: each person is { id, name, at | house, face, variant, lines(ctx) }.
//   at: [x, z] in plaza coordinates (x east, z south, the camera looks north).   house: [lx, lz] in the House's own frame.
//   lines(ctx) returns 1-3 short lines. ctx = { signal, deed, secondDeed, greenSeen, fished, homeDone, night, time, lvl, favour }.
//   lvl = friendship 0..5 (src/engine/friends.js). At 2 and 4 a person's own story opens up. favour = 'none' | 'ready' | 'done'.
// Canon these must keep: the City is Telor, the tended light: round, no crime, everyone working together; its only
// enemy is complacency. Atlas is a friend, not a king. Ora is always "it". The Green and the City are a choice, never a class.
// Sloth and the rest are complacency given form, not evil. No slang, no on-screen instructions.

/** Has the player caught a fish? atlas.fish.v1 is { v:1, counts:{ id:{count,best} } }; older/odd shapes are read loosely. */
export function hasFished(storage) {
  try {
    const raw = storage && storage.getItem('atlas.fish.v1');
    if (!raw) return false;
    const j = JSON.parse(raw);
    if (j && typeof j === 'object' && j.counts && typeof j.counts === 'object') return Object.values(j.counts).some((v) => v && v.count > 0);
    const walk = (v) => (typeof v === 'number' ? v > 0 : Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v).some(walk) : v === true);
    return walk(j);
  } catch { return false; }
}

import { CITY_KEY } from '../../engine/friends.js';
export { CITY_KEY };
/** Has Atlas been out to the Green? (our own small flag, plus the quest store's, plus a planted plot). */
export function hasSeenGreen(storage, questSeen = false) {
  if (questSeen) return true;
  try { const c = JSON.parse(storage.getItem(CITY_KEY) || 'null'); if (c && c.greenSeen) return true; } catch {}
  try { const g = JSON.parse(storage.getItem('atlas.green.v1') || 'null'); if (g && g.plots && Object.keys(g.plots).length) return true; } catch {}
  return false;
}


/** Compose a person: what happened lately (react) first, then, once you are friends, their own story. */
const person = (d) => ({ ...d, lines: (c = {}) => {
  const lvl = c.lvl || 0, r = (d.react && d.react(c)) || [];
  const story = lvl >= 4 ? d.l4 : lvl >= 2 ? d.l2 : null;
  // news (a finished-favour scene, two or more lines) takes the whole conversation; a one-line remark rides ahead of the story
  const out = story && r.length < 2 ? [...r, ...story] : r.length ? r : d.base(c);
  return out.slice(0, 3);
} });

export const ELDER = {
  id: 'elder', name: 'ELDER MAREN',
  lines: (c = {}) => {
    if (!c.signal) return [
      'Atlas. You came back through the Nexus, and the whole City felt it. Welcome home, friend.',
      'Take the Signal. Ora has kept it warm for you, and it is yours again.',
      'Go out by the east archway, past the market. The Greenfolk live there, close to the earth, and a plot of land is waiting for you.',
    ];
    const lvl = c.lvl || 0;
    if (c.secondDeed && lvl < 2) return ['The weight on the causeway is lifted, Atlas, and it was not defeated. It was changed. That is the better road.',
      'Sloth keeps the way now, and the way beyond is open. Telor has no need to be afraid of it.'];
    if (c.homeDone) return lvl >= 4
      ? ['A roof of your own, and friends in the City and on the Green alike. That is a whole first day, Atlas.',
        'Rest if you like. But the road beyond the gate has begun to call, and I think you hear it too.']
      : ['I hear you have a roof of your own on the Green. That closes your first day well, Atlas.',
        'Rest if you like. But the road beyond the gate is calling now, and I think you hear it too.'];
    if (lvl >= 4) return ['Telor was never meant to be finished. A city that finishes stops listening.', 'You listen, Atlas. That is why the light came back with you.'];
    if (lvl >= 2) return ['I was a keeper of the beacon before I was an elder. I still climb its stair every morning.', 'Old habits keep a person kind.'];
    if (c.fished) return ['They tell me the koi have taken to you. Of course they have.'];
    if (c.greenSeen) return ['You have seen the Green. Good. Walk it often; the City is better for those who do.'];
    return ['The east archway, past the market. The Green is waiting, and so is your plot.'];
  },
};

export const PEOPLE = [
  person({ id: 'tamsin', name: 'TAMSIN', house: [-3.0, 5.6], face: [-0.7, 0.7], variant: 11,
    base: () => ['This is the House, where the City trades. Relics, tools, old keepsakes. Anything made with care finds its keeper here.',
      'Walk in whenever you like. The prices are honest, and so is the haggling.'],
    react: (c) => c.homeDone ? ['I hear you have a roof of your own out on the Green. Bring me something from it one day.'] : [],
    l2: ['I came to the House to buy a clock, and stayed nine years. Everything on these shelves has a story.'],
    l4: ['My work toward ascension is a catalogue of everything the House has ever kept, so that no keepsake is forgotten.', 'It will take me a lifetime. I am glad of it.'] }),
  person({ id: 'orrin', name: 'ORRIN', at: [13.4, -14.4], face: [0.3, 1], variant: 9,
    base: () => ['I trade in relics. A relic is only worth what it means to the one who carries it.',
      'The House takes a fair look at everything. Bring it something worth the looking.'],
    react: (c) => c.homeDone ? ['A house you raised yourself. That will be a relic someday, and a good one.'] : [],
    l2: ['My grandmother carried one smooth stone in her pocket her whole life. That is how I learned what a relic is.'],
    l4: ['I am learning to let things go. That is my road to ascension, and it is harder than any trade.'] }),
  person({ id: 'bram', name: 'BRAM', at: [17.4, 11.6], face: [0.3, 1], variant: 8,
    base: (c) => c.greenSeen ? ['You have seen the pond, then. The koi come up at dusk, if you have the patience.']
      : ['The pond out on the Green is full of koi, if you have patience. They bite best at dusk.'],
    react: (c) => {
      if (c.favour === 'ready' || (c.favour === undefined && c.fished)) return ['Is that a catch? Let me see. A fine one, and still cold from the pond. May I?',
        'My father taught me to fish at dusk, when the water goes quiet and the koi come up to look at the sky. He said they were only curious, and so was he.',
        'Thank you, friend. That one I will remember.'];
      if (c.night) return ['The koi are lovely under the lanterns. Go and see them, if you like.'];
      return c.fished ? ['Another catch? The koi like a steady hand. Dusk is still the best hour, mind.'] : [];
    },
    l2: ['I fish to think. Half the City\'s good ideas begin at that pond.'],
    l4: ['My road to ascension is patience. They say it is the slowest one, and I am in no hurry.'] }),
  person({ id: 'sael', name: 'SAEL', at: [20.8, 8.2], face: [-0.5, 0.8], variant: 2,
    base: (c) => c.greenSeen
      ? ['You found the Green. Then you know: we come and go as we please, the City and the Green. It is one choice, not a wall.']
      : ['I live out on the Green, near the earth. Soil under the nails, quiet mornings.',
        'I come into the City whenever I like. Nobody here chose a better life than anyone else, only a different one.'],
    react: (c) => {
      if (c.homeDone) return ['A roof of your own on the Green? Then we are neighbours. I like the sound of that.'];
      if (c.greenSeen && c.favour !== 'done') return ['You went out and came back. Then you have seen it for yourself.', 'My door on the Green is always open. So is yours now, I think.'];
      return [];
    },
    l2: ['My family farmed the Green before the City was built. We never thought of it as a different life, only a different pace.'],
    l4: ['I am growing a field of wheat that will be ready the year I ascend. No hurry, I tell it, and I check on it every day.'] }),
  person({ id: 'lio', name: 'LIO', at: [-13.4, 12.0], face: [-0.2, 1], variant: 0,
    base: () => ['The old lychgate lane out of Brambleholt curves round to the Green as well. The Green runs all the way around the City, like a ring.'],
    react: (c) => c.night ? ['The lane glows at this hour. Soft, like it is breathing.'] : [],
    l2: ['I walk the lychgate lane each evening. I know every stone of it, and it still surprises me.'],
    l4: ['Before I ascend I mean to walk the whole ring of the Green, a step at a time, with no one to hurry me.'] }),
  person({ id: 'wyn', name: 'WYN', at: [2.6, -18.4], face: [-0.4, -1], variant: 10,
    base: () => ['The old stone circle. Our people\'s first sacred place, long before any of this was built.',
      'We kept it exactly as it was. A City should remember where it began.'],
    react: (c) => c.night ? ['The circle is quiet at night in a different way. Stay a moment, if you like.'] : [],
    l2: ['I sit in the circle at dawn. The stones remember the first voices. I only listen.'],
    l4: ['I am writing down what the stones say, so someone can go on listening after me. That is my road to ascension.'] }),
  person({ id: 'dara', name: 'DARA', at: [-9.4, -34.0], face: [0.4, 1], variant: 4,
    base: (c) => ['The beacon over the crown burns on good deeds. Every kindness feeds it a little.',
      c.deed ? 'It has been brighter since the lamps came back along the gate road. I noticed.'
        : 'Some of the lamps on the gate road have gone dark. A small thing, but the beacon notices.'],
    react: (c) => {
      if (c.deed && c.favour !== 'done') return ['Look up. The beacon is brighter since the lamps came back along the gate road.', 'That was your doing, Atlas. Thank you.'];
      if (c.night) return ['At night the beacon is the loudest thing in the City, and I mean that kindly.'];
      return [];
    },
    l2: ['I keep the beacon\'s stair. When the City does a kindness, I can see it in the flame.'],
    l4: ['I would like to be the one who lights it on the day the whole City ascends together. It is the only thing I truly want.'] }),
  person({ id: 'joss', name: 'JOSS', at: [-8.4, -41.0], face: [0.8, 0.4], variant: 12,
    base: (c) => c.secondDeed
      ? ['The road is open. I keep saying it to myself, to hear that it is true.']
      : ['The road beyond the gate runs north to the causeway.',
        'Far out there, a great stone weight sits on the bridge. Sloth, we call it. It is not cruel, only heavy.',
        'Not yet, friend. But one day.'],
    react: (c) => c.secondDeed
      ? ((c.lvl || 0) >= 2 ? ['The weight on the causeway has woken, and I said "not yet" at this gate for years. Today I get to say "go."']
        : ['Sloth is awake? The road is open? I said "not yet" at this gate for years, and I never really believed the "soon."',
          'Now he sits by the causeway like a gatekeeper. I may have to share my job.'])
      : (c.homeDone && !c.secondDeed)
      ? ['You have a house on the Green now, and out on the causeway the weight has stirred. I felt it in the stones this morning.', 'Not yet, friend. But soon.'] : [],
    l2: ['I keep the gate. Not to keep anyone out, only to be the first to say welcome.'],
    l4: ['I stood braced for years, waiting for trouble that never came. My road to ascension is learning to stand easy.'] }),
  person({ id: 'kit', name: 'KIT', at: [-14.2, -3.6], face: [0.6, 0.8], variant: 6,
    base: (c) => [c.greenSeen ? 'Did you see the frogs? Sael says there are frogs.' : 'When I am bigger I will go and see the Green. Sael says there are frogs.',
      'The doves always come back in the evening. Always.'],
    react: (c) => c.secondDeed ? ['Atlas woke the big sleepy one on the bridge! Does it snore? I bet it snores.'] : c.homeDone ? ['Is it true you have a house now? Does it have a window for the doves?'] : c.night ? ['I am supposed to be in bed. Please do not tell.'] : [],
    l2: ['There is a snail on the fountain. I named it Gate, because it is always on its way somewhere.'],
    l4: ['When I am older I want to keep the doves. Elder Maren says that is a real job, and I believe the elder.'] }),
  person({ id: 'idris', name: 'IDRIS', at: [-5.2, 5.6], face: [0.8, 0.5], variant: 3,
    base: () => ['Look around. No locks, no guards, nobody hungry. We all work for the same light.',
      'Only one thing can hurt us here, and that is getting comfortable. So we keep moving.'],
    react: (c) => c.secondDeed ? ['They say the one on the causeway was only comfortable, not cruel. I have been thinking about that all day.'] : c.night ? ['Nobody locks a thing in Telor. At night you can hear how quiet that is.'] : [],
    l2: ['I used to worry about everything. Then I noticed nothing was left to worry about, and that frightened me for a while.'],
    l4: ['So I take up a new craft each season: bread, then glass, now bells. Ascension, I think, is staying curious on purpose.'] }),
];

// Ambient barks: one at a time over a passer-by. barkPool(ctx) picks the pool for the moment.
export const BARKS_ALL = [
  'Look how the light sits on the water.', 'The figs are good today.', 'Mind the doves, they have no manners.',
  'Is that the beacon? Brighter than yesterday.', 'Nothing to hurry for. Lovely.', 'I could listen to that fountain all day.',
  'Did you hear the lute earlier?', 'Another good day for the City.', 'Walk with me a little?', 'The bread smells wonderful.',
  'Off to the market, back by supper.', 'Careful, the little ones are racing again.', 'Someone left a lantern burning. Leave it.',
  'What an evening for the square.', 'I owe the baker a favour and a song.', 'The Green had good rain this week.',
  'Has anyone seen my other glove?', 'The stairs to the beacon count themselves, if you let them.', 'A little slower today, a little kinder.',
  'The tilers sing while they work. I have started humming along.', 'Mind the step, it has an opinion about shoes.',
  'Telor is round, you know. You can never quite get lost.',
];
export const BARKS_DAY = ['Such a clear morning.', 'Every window open today.', 'The market is just waking up.', 'Bright enough to read the whole sky.'];
export const BARKS_EVENING = ['The lanterns are coming on.', 'Supper smells wonderful tonight.', 'The doves are heading home.', 'That golden hour never gets old.'];
export const BARKS_NIGHT = ['The lanterns look lovely tonight.', 'Quiet streets. I like them.', 'Listen. You can hear the fountain from here.',
  'The stars are out over the beacon.', 'Almost home. Good night, friend.', 'Whoever lit these lanterns, thank you.'];
export const BARKS_HOME = ['I hear someone has built a house out on the Green.', 'A new roof on the Green, they say. Good for the neighbourhood.', 'They say the new house has a lovely window.'];
export function barkPool(c = {}) {
  const t = c.time, extra = t === 'night' ? BARKS_NIGHT : t === 'dusk' ? [...BARKS_NIGHT.slice(0, 2), ...BARKS_EVENING] : t === 'golden' ? BARKS_EVENING : BARKS_DAY;
  return [...BARKS_ALL, ...extra, ...(c.homeDone ? BARKS_HOME : [])];
}

// Gift reactions: loved, liked, and a kind thank-you.
const GIFT_LINES = {
  "elder": [
    "A little grain, and all the care that brought it here. Thank you, friend.",
    "There is room on my windowsill for this kindness.",
    "You thought of me, Atlas. Thank you."
  ],
  "tamsin": [
    "These belong beside the oldest clock. Something living among all those memories.",
    "I shall set this beside my supper. Thank you.",
    "A gift has a story before it reaches the shelf. I shall remember yours."
  ],
  "orrin": [
    "Look at that light. Some treasures ask for nothing but a moment of wonder.",
    "Something grown with care. A good thing to carry home.",
    "Thank you. I shall find a place for it."
  ],
  "bram": [
    "A Moon Koi. My father would have stayed until dawn just to see one. Thank you, Atlas.",
    "A fine catch. There is patience in a gift like this.",
    "Kind of you, friend. I shall enjoy it."
  ],
  "sael": [
    "Good wheat. I can almost hear the field in it. Thank you, neighbour.",
    "Fresh greens for the table. You know what I like.",
    "Thank you, Atlas. I shall take it home with me."
  ],
  "lio": [
    "Something fresh after a long walk. You have chosen well, friend.",
    "A little colour for the lane. Lovely.",
    "Thank you. A good reason to pause a while."
  ],
  "wyn": [
    "These will sit beside me at dawn. Even the stones may enjoy the colour.",
    "Grain from the Green. Something old, beginning again.",
    "Thank you, Atlas. I shall keep this moment."
  ],
  "dara": [
    "A lantern of the water. How quietly it carries its light. Thank you.",
    "These will brighten the foot of the beacon stair.",
    "A kindness for me? Thank you, Atlas."
  ],
  "joss": [
    "Ripe tomatoes. Supper at the gate will be a fine thing tonight.",
    "Bread begins here. Thank you, friend.",
    "A welcome gift. You have made my watch brighter."
  ],
  "kit": [
    "A Sky Minnow! It shines like the fountain when the sun catches it.",
    "Flowers! I shall show them to Gate. Slowly.",
    "For me? Thank you, Atlas."
  ],
  "idris": [
    "Just what my new bread needed. You must come and taste it.",
    "A fresh leaf, a fresh idea. Thank you.",
    "Thank you. Now to think of something to make with it."
  ]
};
export const cityGiftReaction = (id,taste) => [GIFT_LINES[id][taste==='love'?0:taste==='like'?1:2]];
