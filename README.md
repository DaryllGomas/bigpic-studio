# BigPic Studios

Games, worlds and interactive experiences, by Daryll + AI. Live at **https://studio.bigpicsolutions.com**

- **The page:** `index.html` (one file, vanilla HTML/CSS/JS, no build step) + `assets/`
- **Hosting:** GitHub Pages from `main`; `CNAME` = studio.bigpicsolutions.com (Cloudflare DNS: `studio` CNAME → daryllgomas.github.io, DNS only)
- **Data:** likes, anonymous visit counts and the Commission / Membership / Request form go to **BigPic Pulse**, self-hosted, at `https://pulse.bigpicsolutions.com`
- **Settings:** `PULSE`, `TIP_URL`, `SOL_ADDRESS` near the bottom of `index.html` (Support the dev shows once a tip link or SOL address is set)

**Full manual:** `BigPic - Technology/Playbooks/Runbook - BigPic Studios Site (studio.bigpicsolutions.com).md` on the BigPic Drive (with the Pulse runbook beside it).

Rules: real content only (true dates, real screenshots, honest statuses). The hero is Concept B's image, and it stays.

## Shipping an update (2026-10-18)
Each game keeps its own `devlog.json` (`the-first-world/`, `rpg/`, `arcade/`; THE PATH's lives in `thepath-site`). The home page's What's new and Lab log are **generated** from them, never hand-edited.
1. Edit the game's `devlog.json` (newest release first).
2. Run **`tools/ship-news.sh`**. It validates every devlog (`tools/hub/check-devlog.mjs`), rebuilds `news.json` and the two marked regions of `index.html` (`tools/hub/build-news.mjs`; `--check` tells you if they're stale), then prints a checklist of what else ships together: the TV sync for that game, the Junction LOG, `~/BigPic/_Changelog/<date>.md`.
3. Studio-level items that aren't a game release (Ancients, the trailer) live in `tools/hub/news-extra.json`. THE PATH's devlog is copied to `tools/hub/sources/` from `../thepath-site/` on each run.
4. Commit; pushing is Daryll's call. Browser check on Atlas: `atlas-run . tests/mirror-and-news.mjs shots/out`.
