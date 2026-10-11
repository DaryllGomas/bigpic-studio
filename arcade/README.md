# arcade/: THE JUNCTION band for the studio home

- `band/junction-band.js` + `.css`: the cabinet wall component. **Owned by the arcade session; the source copy is `~/Projects/sites/the-junction-test/band/`.** Edit there and re-copy, never here.
- `cabinet/`: THE PATH's cabinet engine, copied unchanged from `thepath-site/play/js/cabinet/` (2026-10-11).
- `cab/`: the marquee, side and control-panel art for the 23 cabinets that have it (from `thepath-site/play/assets/cab/`).
- `band/brick.jpg`: Poly Haven red_brick_03 (CC0).
- `../assets/starvector/ship_atlas.png`: Starvector loads its sprite atlas relative to the engine (`cabinet/games/starvector/gfx.js` → `../../../../assets/starvector/`), so it has to sit at the site root's `assets/starvector/`.

Mount: `mountJunctionBand(el, { arcadeUrl: '/arcade/', engine: '/arcade/cabinet/', art: '/arcade/cab/', brick: '/arcade/band/brick.jpg' })` (absolute paths, or the same relative to the page).
