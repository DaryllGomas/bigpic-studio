// Build config. Local dev and TV play leave this as is; tools/build-web.mjs rewrites it in the deployed copy only.
//   webConcept  true on the studio web build: the road ends at the checkpoint below with a "More to come" card.
//   checkpoint  the id of the last boss that is built. Move it forward as each new battle lands
//               (the match for that boss ends the concept; see CHECKPOINTS in checkpoint.js).
// A page can also opt in with ?concept=1 (kept across scenes by main.js's go()).
export const BUILD = {webConcept: true, checkpoint: 'current'};
