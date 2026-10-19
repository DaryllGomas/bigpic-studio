#!/usr/bin/env bash
# ship-news.sh: the one command to run when any game ships an update. Run from anywhere; it works on this repo.
#   1. validates every game devlog (privacy + shape)   2. rebuilds news.json + the home What's new + Lab log
#   3. prints what else must ship together. It never commits, pushes or publishes.
set -euo pipefail
cd "$(dirname "$0")/.."
DEVLOGS=(the-first-world/devlog.json rpg/devlog.json arcade/devlog.json)
# THE PATH's devlog lives in its own site repo; build-news.mjs refreshes our copy from it when it sits beside this repo
PATHLIVE="../thepath-site/devlog.json"
[ -f "$PATHLIVE" ] && DEVLOGS+=("$PATHLIVE") || DEVLOGS+=(tools/hub/sources/the-path.devlog.json)
echo "== 1. checking devlogs"
node tools/hub/check-devlog.mjs "${DEVLOGS[@]}"
echo; echo "== 2. rebuilding the news overview"
node tools/hub/build-news.mjs
echo; git status --short -- index.html news.json tools/hub/sources || true
cat <<'LIST' | sed "s/__DATE__/$(date +%F)/"

== 3. what else ships with this update (tick each)
  [ ] The game's own page/log shows it (the devlog IS the game's log; its page reads devlog.json)
  [ ] The Junction LOG: arcade/devlog.json has the release if the arcade itself changed (the arcade LOG reads it)
  [ ] TV: if a game or the aisle changed, sync the loki copy (steps in REPORT-mirror-and-news.md, "TV sync")
  [ ] THE PATH: its devlog is edited in thepath-site, then re-run this script so our copy and the home list pick it up
  [ ] Home poster: if the aisle's look changed, re-render arcade/band/aisle-poster.jpg (Atlas, embed mode, 1600x612)
  [ ] ~/BigPic/_Changelog/__DATE__.md  (what, why, who, how to reverse)
  [ ] Review `git diff`, commit on a branch; publishing (push to main) is Daryll's call
LIST
