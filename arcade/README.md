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
- Embed mode (`?embed=1`): no page chrome; the title "The Junction · 26 games · free · one click" top left and the DAILY CHALLENGE top right; drag or arrow keys spin; clicking the centre cabinet opens `/arcade/?game=<id>`; the page keeps its wheel scroll. INSERT COIN posts `{ junction: 'support' }` to the parent, and the wrapper clicks the page's `[data-support-open]`.
- `/arcade/?game=<id>` starts the aisle on that cabinet.
- `band/aisle-poster.jpg`: the still (a render of embed mode at 1600×612). Re-render it when the aisle changes.
