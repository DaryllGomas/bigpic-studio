// SLOTH, THE GUARDIAN: his words once the road is open. No three.js in here (so node can test it).
// Voice: heavy, kind, a little sleepy-wise. He was complacency given form and is grateful to be awake. Slow and short.
// Ora is "it". No instructions, no spoilers: he hints at the Wilds and at other forces stirring, nothing more.
// guardianLines({ visit, time }) -> the lines for this conversation. visit counts from 1 (the first time Atlas speaks to him).

export const GUARDIAN_FIRST = [
  'Oh. You are still here. Good. I was afraid I had dreamed you.',
  'Thank you for waking me. I had been sitting so long that I forgot I was sitting.',
  'The road is open now. I will keep it.',
];

/** A line for the hour (the road has dawn, dusk and night). */
export const GUARDIAN_TIME = {
  dawn: 'Morning on the causeway. Look how the mist lifts off the ravine. I never saw it do that with my eyes closed.',
  dusk: 'The light goes gold along here, around this hour. I keep it company.',
  night: 'The stars are close tonight. I count them slowly. I lose count, and begin again, and that is allowed.',
};

/** What he does with the days: watches, encourages, hints. Taken in order, a different pair each visit. */
export const GUARDIAN_WATCH = [
  'I watch the road now. It is a good thing to watch. Nothing on it is in a hurry, and I like that.',
  'A Greenfolk went by this morning with a basket. They nodded to me. Nobody has nodded to me in a very long time.',
  'I used to be the weight on this bridge. Now I am only the one who sits beside it. It is lighter, being this.',
];
export const GUARDIAN_CHEER = [
  'Go on, if you like. I will be here when you come back. That is the nice part of staying.',
  'You walk like someone who is going somewhere. I remember that. I think I used to.',
  'Ora stays close to you. It is good company, that light.',
];
export const GUARDIAN_HINT = [
  'Past the lantern the road goes on, into the Wilds. It is wide out there, and not all of it is awake.',
  'There are others out there, like me. Heavy ones, or quick ones. I think some of them are only tired.',
  'Something far off keeps humming. I feel it in the stones when the wind is right. A soft sort of song.',
  'I was the first to settle. I do not think I will be the last to wake.',
];

/** The two answers when he offers a replay (the second does nothing but close). */
export const GUARDIAN_REPLAY = 'One more go?';
export const GUARDIAN_DECLINE = 'Another time.';

export const ALL_GUARDIAN_LINES = [
  ...GUARDIAN_FIRST, ...Object.values(GUARDIAN_TIME), ...GUARDIAN_WATCH, ...GUARDIAN_CHEER, ...GUARDIAN_HINT, GUARDIAN_REPLAY, GUARDIAN_DECLINE,
];

/** First visit: thanks and the open road. After that: two lines, rotating (the hour's line leads on some visits). */
export function guardianLines({ visit = 1, time = 'dusk' } = {}) {
  if (visit <= 1) return [...GUARDIAN_FIRST];
  const n = visit - 2;
  const pick = (a, k) => a[(n + k) % a.length];
  const first = n % 3 === 0 && GUARDIAN_TIME[time] ? GUARDIAN_TIME[time] : n % 3 === 1 ? pick(GUARDIAN_WATCH, 0) : pick(GUARDIAN_CHEER, 0);
  const second = n % 2 === 0 ? pick(GUARDIAN_HINT, 0) : pick(GUARDIAN_WATCH, 1);
  return [first, second];
}
