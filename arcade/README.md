# arcade/: THE JUNCTION band for the studio home

- `band/junction-band.js` + `.css`: the cabinet wall component. **Owned by the arcade session; the source copy is `~/Projects/sites/the-junction-test/band/`.** Edit there and re-copy, never here.
- `cabinet/`: THE PATH's cabinet engine, copied unchanged from `thepath-site/play/js/cabinet/` (2026-10-11).
- `cab/`: the marquee, side and control-panel art for the 23 cabinets that have it (from `thepath-site/play/assets/cab/`).
- `band/brick.jpg`: Poly Haven red_brick_03 (CC0).
- `../assets/starvector/ship_atlas.png`: Starvector loads its sprite atlas relative to the engine (`cabinet/games/starvector/gfx.js` → `../../../../assets/starvector/`), so it has to sit at the site root's `assets/starvector/`.

Mount: `mountJunctionBand(el, { arcadeUrl: '/arcade/', engine: '/arcade/cabinet/', art: '/arcade/cab/', brick: '/arcade/band/brick.jpg' })` (absolute paths, or the same relative to the page).

## The arcade pages (studio.bigpicsolutions.com/arcade/), added 2026-10-11
- `index.html`: **the aisle**, THE JUNCTION's main view (three.js Cover Flow arc; Daryll approved design + flow on v3, fixes in v4).
- `grid.html`: **the cabinet wall**, the grid toggle (the same band component, all 26 games).
- `tex/`: side-art fallbacks for Starvector and Grid Cycles. `band/brick_nor.jpg`: the brick normal map (Poly Haven, CC0).
- Source of truth for both pages: `~/Projects/sites/the-junction-test/` (`index.html`, `grid.html`). Copied here with studio paths (`./cabinet/`, `./`, `band/brick*.jpg`). Edit there and re-copy, never here.
- localStorage: only `junction.*` keys (`junction.initials`).

## The home band = the aisle (Daryll, 2026-10-11)
- `band/junction-aisle-embed.js`: `mountJunctionAisle(el, { arcade: '/arcade/', poster: '/arcade/band/aisle-poster.jpg' })`. Shows the still poster (a link into /arcade/), then loads the live aisle in an iframe (`/arcade/?embed=1`) when the band nears the screen. Weak devices, reduced motion, save-data and no-WebGL keep the still.
- Embed mode (`?embed=1`): no page chrome; the title "The Junction · 26 games · free · one click" top left and the DAILY CHALLENGE top right; drag or arrow keys spin; clicking the centre cabinet opens `/arcade/?game=<id>`; the page keeps its wheel scroll. No coin prompts anywhere (Daryll, 2026-10-11: they read as gated). The daily challenge's button plays today's round; game over offers play again. Support lives only in the site nav.
- `/arcade/?game=<id>` starts the aisle on that cabinet.
- `band/aisle-poster.jpg`: the still (a render of embed mode at 1600×612). Re-render it when the aisle changes.

## LOG: news and feedback (added 2026-10-15)
- The **LOG** button (top right, next to GRID VIEW) opens a slide-over with the studio game hub: What's new, Now building, Help us test, and a Bug / Idea / Feedback form that posts to BigPic Pulse as project `the-junction`.
- Self-contained: `hub-panel.js` + `hub-panel.css` (the panel), `devlog.json` (the text), and five lines in `index.html` (two stylesheet links, the `#jxLog` button, two deferred scripts: `hub-panel.js` before `../assets/hub/hub.js`). **If `index.html` is ever re-copied from `the-junction-test`, carry those five lines over.**
- Keys: closed, the panel listens to nothing. Open, it keeps every key inside the panel (the aisle doesn't move while you type), Tab stays in it, Escape or the scrim closes it, and focus is dropped on close so the arcade has the keys back. A gamepad still drives the aisle while it's open.
- `devlog.json` is public: run `node tools/hub/check-devlog.mjs arcade/devlog.json` (from the repo root) before every publish. localStorage: `junction.logSeen` (hides the button's pink light once this version's log has been opened).
