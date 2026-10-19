# Meet faces report — 2026-10-18

Implemented on `meet-faces`; no push or publication. `main` and `arcade/` were not changed. No project files were deleted.

## Changes

- Meet cards use character-specific top-aligned crops, a narrower art area, and a top-anchored hover zoom. Sloth, the Night Warden and the Current retain their full heads clear of the text gradient at 1920, 1366, 820 and 390 px. Ora remains contained.
- Character pop-ups contain the entire artwork instead of covering a landscape frame. Thumbnails sit below the image rather than over it. This applies to every image of Sloth, the Warden, the Current and Ora; world/game galleries retain their previous layout.
- Replaced the Drift card and dialog with the Current. Tag: “Endless scroll, given form.” Dialog describes the glowing-picture lure and her healing rather than dying, with “Built & playable · Beyond the Nexus” status.
- New `assets/universe/meet-current.webp`: 900×609, 179,728 bytes (about 176 KiB), converted at quality 86 from the game's read-only `pitch/beat/art/current/poses/idle.png`. Its silver mask and gold halo are visible against the site's dark background; transparency is preserved. The same asset serves the dialog.
- Searched the entire home `index.html`: the only Drift references were the meet card and its INFO entry, both replaced. No remaining Drift promises or planned-boss lists on this page. Existing `meet-drift.webp` and `assets/info/drift-1.webp` remain in place.

## Browser verification and screenshots

All browser runs used Atlas through:

```sh
atlas-run . tests/meet-faces.mjs shots/meet-faces/before
atlas-run . tests/meet-faces.mjs shots/meet-faces/after
```

Before and after directories each contain 32 PNGs: the meet row, all four pop-ups, and alternate gallery images at each requested width. Viewports were 1920×1080, 1366×1080, 820×1080 and 390×1080.

| Evidence | Before | After |
| --- | --- | --- |
| Desktop row | [1920](shots/meet-faces/before/1920-meet-row.png) | [1920](shots/meet-faces/after/1920-meet-row.png) |
| Laptop row | [1366](shots/meet-faces/before/1366-meet-row.png) | [1366](shots/meet-faces/after/1366-meet-row.png) |
| Tablet row | [820](shots/meet-faces/before/820-meet-row.png) | [820](shots/meet-faces/after/820-meet-row.png) |
| Phone row | [390](shots/meet-faces/before/390-meet-row.png) | [390](shots/meet-faces/after/390-meet-row.png) |
| Warden phone pop-up | [Before](shots/meet-faces/before/390-warden-popup.png) | [After](shots/meet-faces/after/390-warden-popup.png) |
| Warden full figure | [Before](shots/meet-faces/before/1366-warden-popup-2.png) | [After](shots/meet-faces/after/1366-warden-popup-2.png) |
| Replacement phone pop-up | [Drift](shots/meet-faces/before/390-drift-popup.png) | [Current](shots/meet-faces/after/390-current-popup.png) |

Other shots follow `{width}-{sloth,warden,drift/current,ora}-popup.png`; alternate images use `-popup-2.png`. Raw diagnostics: `shots/meet-faces/{before,after}/results.json`.

Verified loaded card/gallery images, character `object-fit:contain`, world-gallery styling reset, Escape close behavior and no horizontal overflow. Visually inspected all four row widths and Warden pop-ups. `git diff --check` passed.

## Remaining limitations

Zero JavaScript `pageerror` events at every width, before and after. The local preview produces existing Pulse analytics/support CORS failures (four requests, eight console messages per viewport), because the backend rejects the Atlas localhost origin. These are recorded unfiltered in both results files; no analytics behavior was changed. No implementation work remains for this brief.
