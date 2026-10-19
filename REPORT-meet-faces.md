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

## What's new hero button — 2026-10-18

Implemented beside Play The Path as a secondary glass button, with equal 44px heights, clear keyboard focus, and `data-track="hero-whats-new"`. The actions share a row at 1920, 1366 and 820px and wrap into two clean rows at 390px. The gold Play button remains the primary action.

The update label is computed from the newest valid `time[datetime]` in the existing modal; it currently reads “Oct 18, 2026”. It uses an absolute date because the source contains dates without publication times. UTC formatting avoids timezone date shifts. A glowing unread dot compares that date with a localStorage seen date and clears on opening; both storage reads and writes tolerate blocked storage. The same modal opens, traps Tab focus, closes with Escape, and restores focus. Its card can scroll on short screens.

The modal's hand-written news was checked against the home lab log and `the-first-world/devlog.json`: its top entry is today's **The First World v0.12 — After the ending**, describing seasonal festivals, newcomers by boat and a growing Telor. No news was invented or changed. The complete existing modal list is:

- Oct 18: The First World v0.12; The First World v0.11.
- Oct 17: The First World v0.10; The First World v0.9.
- Oct 15: The First World v0.8.
- Oct 11: The First World v0.5.
- Oct 10: The Path v0.2.2; First scenes beyond the Nexus.

Verification: `atlas-run . tests/whats-new.mjs shots/whats-new` passed at all four requested widths. Checks cover current date sourcing, analytics attribute, equal heights, desktop alignment, no horizontal overflow, keyboard opening, focus outline/trapping/restoration, Escape, seen-state persistence after reload, and opening with localStorage blocked. Zero JavaScript page errors. Existing Pulse localhost CORS console failures remain and are recorded unfiltered in [results](shots/whats-new/results.json).

Hero screenshots: [1920](shots/whats-new/1920-hero.png), [1366](shots/whats-new/1366-hero.png), [820](shots/whats-new/820-hero.png), [390](shots/whats-new/390-hero.png). Modal screenshots use the same widths and `-modal.png` filenames. Desktop and phone hero shots and the phone modal were visually inspected. `git diff --check` passed. Committed on `meet-faces`; no push or publication, no changes to `main` or `arcade/`, and no project files deleted.

Limitation: unread state has the same day-level granularity as the source, so multiple releases on an already-read date do not light the dot again.

## Beyond the Nexus page — 2026-10-18

Updated the RPG page and home card to the current private build: the Nexus → City → lamps → Green → Sloth journey, THE BEAT's one-button painted battles, Dueling Dragons, the River road and Mill Landing, Tobin, The Current and The Pearl, and the river's recovery. Added Log 03 (October 18), refreshed the next-work list and feedback questions, and stated that the game is not playable on the web yet. Existing page buttons remain. Removed the home character card's misleading “playable” wording for The Current.

Sources: read-only atlas-hd2d git history since October 11, README, HANDOFF, river/battle/finisher and related reports, CREDITS, October 12–18 changelogs, and the first-island storyboard's next-boss table. Future bosses are plans, not finished fights. Sloth's private placeholder song remains outside this site; no game code or audio was copied or published.

Four real river screenshots recovered from the retained Atlas river verification run `run-1792373271-933843/out`: fork, mill approach, Current before and after. Converted to 1600-pixel-wide WebP (1600×900, preserving the source aspect ratio) in `rpg/img/`; existing screenshots retained. No generated artwork.

Validation: `node tools/hub/check-devlog.mjs rpg/devlog.json` passes all 36 rules; `git diff --check` passes. Atlas `tests/rpg-page.mjs` passes at 1920×1080 and 390×1080: Log 03 rendered, 15 images loaded, no horizontal overflow, lightbox open/Escape close, existing play destination intact, zero page or console errors. Visually reviewed both full-page captures and the river images within the gallery. Artifacts: `shots/rpg-page/check/`.

Used `/tmp/atlas-run-rpg-page`, the installed atlas-run with rsync deletion and remote cleanup omitted to obey the brief's no-deletion rule. Remote artifacts retained. No atlas-hd2d writes, main/arcade edits, push or publication.
