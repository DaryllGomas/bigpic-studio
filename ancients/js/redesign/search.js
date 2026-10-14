// Header search (packet 08). One module for all three pages: it finds events (title, subtitle, year, place,
// description, details) and Vault artifacts, shows them in a results panel under the header field, and
// jumps to the pick: timeline.html#<eraId>-NN (opens the event panel) or artifacts.html#<artifactId>.
// Nothing here has its own words: every string shown comes from data/*.json via the shared loader.
import { loadAncientsData } from "./data.js";

const EVENTS_DIR = "images/redesign/events/";
const STRATA_DIR = "images/redesign/strata/";
const VAULT_DIR = "images/redesign/vault/";
const MAX_RESULTS = 12;
const MIN_QUERY = 2;

const input = document.querySelector(".site-search__input");
const field = document.querySelector(".site-search");
const header = document.querySelector(".site-header__inner");
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// Length-preserving fold (lowercase, strip accents) so match indices line up with the original text.
const fold = (s) => Array.from(s, (c) => { const f = c.normalize("NFD")[0].toLowerCase(); return f.length === 1 ? f : c; }).join("");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "3000" must also find "3,000 BCE": digits may carry optional thousands commas.
const tokenRe = (t) => new RegExp(/^\d+$/.test(t) ? Array.from(t, escapeRe).join(",?") : escapeRe(t), "g");
const slugify = (title) => title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const eraName = (title) => (title.match(/^(.*?)\s*\([^)]*\)\s*$/) ?? [, title])[1];
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function buildIndex({ timeline, artifacts }) {
  const docs = [];
  timeline.periods.forEach((period) => {
    period.events.forEach((event, i) => {
      const d = event.details && typeof event.details === "object" ? event.details : {};
      const nn = String(i + 1).padStart(2, "0");
      docs.push({
        kind: "event",
        key: `${period.id}-${nn}`,
        title: event.title,
        sub: [event.year, event.shortDesc].filter(Boolean).join(" · "),
        era: eraName(period.title),
        theoretical: event.theoretical === true,
        thumb: `${EVENTS_DIR}${period.id}/${nn}-${slugify(event.title)}.webp`,
        plate: `${STRATA_DIR}${period.id}.webp`,
        spread: (i * 37 + 11) % 100,
        // [weight, text]: title and year weigh most, then subtitle, then places and people, then prose.
        fields: [
          [10, event.title], [10, d.title], [8, event.year], [8, d.year], [6, event.shortDesc], [6, d.shortDesc],
          [5, list(d.locations).join(" · ")], [5, list(d.keyFigures).join(" · ")], [4, list(d.artifacts).join(" · ")],
          [3, event.description], [3, d.description], [2, d.details], [2, d.culturalContext],
        ].filter(([, t]) => typeof t === "string" && t),
      });
    });
  });
  Object.entries(artifacts).forEach(([id, a]) => {
    const image = list(a.images ?? a.image)[0];
    const [place, dates] = String(a.era ?? "").split(" • ");
    docs.push({
      kind: "artifact",
      key: id,
      title: a.title,
      sub: [place, dates].filter(Boolean).join(" · "),
      era: "Artifact Vault",
      theoretical: list(a.category).includes("mysterious"),
      thumb: `${VAULT_DIR}${id}.webp`,
      fallback: image,
      fields: [[10, a.title], [8, a.era], [4, list(a.category).join(" ")], [3, a.overview], [2, a.context], [2, a.significance], [2, a.mysteries]]
        .filter(([, t]) => typeof t === "string" && t),
    });
  });
  docs.forEach((doc) => { doc.folded = doc.fields.map(([w, t]) => [w, fold(t), t]); });
  return docs;
}

function search(docs, query) {
  const tokens = fold(query).split(/[\s,]+/).filter(Boolean);
  if (!tokens.length || fold(query).replace(/\s/g, "").length < MIN_QUERY) return { tokens, hits: [] };
  const res = tokens.map(tokenRe);
  const hits = [];
  docs.forEach((doc, order) => {
    let score = 0, snippet = null, best = 0;
    for (const re of res) {
      let tokenBest = 0;
      for (const [w, text, original] of doc.folded) {
        re.lastIndex = 0;
        const m = re.exec(text);
        if (!m) continue;
        const wordStart = m.index === 0 || /[^a-z0-9]/.test(text[m.index - 1]);
        const s = w + (wordStart ? 3 : 0);
        if (s > tokenBest) tokenBest = s;
        // The line under the title already shows year and subtitle; show a snippet for prose and place matches.
        if (w <= 5 && w > best && !doc.sub.includes(original)) { best = w; snippet = { text: original, at: m.index, len: m[0].length }; }
      }
      if (!tokenBest) return;
      score += tokenBest;
    }
    // A title that starts with the whole query comes first.
    if (doc.folded[0][1].startsWith(tokens.join(" "))) score += 12;
    hits.push({ doc, score, snippet, order });
  });
  hits.sort((a, b) => b.score - a.score || a.order - b.order);
  return { tokens, hits: hits.slice(0, MAX_RESULTS) };
}

// Wrap each matched stretch of `text` in <mark>.
function highlight(parent, text, res) {
  const f = fold(text), spans = [];
  res.forEach((re) => { re.lastIndex = 0; let m; while ((m = re.exec(f))) { spans.push([m.index, m.index + m[0].length]); if (!m[0].length) re.lastIndex++; } });
  spans.sort((a, b) => a[0] - b[0]);
  let at = 0;
  for (const [s, e] of spans) {
    if (e <= at) continue;
    const from = Math.max(s, at);
    if (from > at) parent.append(text.slice(at, from));
    parent.append(el("mark", null, text.slice(from, e)));
    at = e;
  }
  if (at < text.length) parent.append(text.slice(at));
}

function snippetOf(s, res, parent) {
  const WINDOW = 46;
  let from = Math.max(0, s.at - WINDOW), to = Math.min(s.text.length, s.at + s.len + WINDOW);
  if (from > 0) from = s.text.indexOf(" ", from) + 1 || from;
  if (to < s.text.length) { const sp = s.text.lastIndexOf(" ", to); if (sp > s.at + s.len) to = sp; }
  if (from > 0) parent.append("… ");
  highlight(parent, s.text.slice(from, to), res);
  if (to < s.text.length) parent.append(" …");
}

function thumb(doc) {
  const t = el("span", "search-result__thumb");
  if (doc.plate) {
    t.style.backgroundImage = `url("${new URL(doc.plate, document.baseURI).href}")`;
    t.style.backgroundPosition = `${doc.spread}% 50%`;
  }
  const i = el("img"); i.alt = ""; i.decoding = "async"; i.loading = "lazy";
  let tried = false;
  i.onerror = () => { if (!tried && doc.fallback) { tried = true; i.src = doc.fallback; } else i.remove(); };
  i.src = doc.thumb;
  t.append(i);
  return t;
}

function go(doc) {
  const timelinePage = document.body.classList.contains("page--timeline");
  const vaultPage = document.body.classList.contains("page--artifacts");
  const page = doc.kind === "event" ? "timeline.html" : "artifacts.html";
  const inPlace = doc.kind === "event" ? timelinePage : vaultPage;
  if (!inPlace) { location.href = `${page}#${doc.key}`; return; }
  // Jump without a reload. Clearing the hash first makes re-picking the open event fire hashchange again.
  if (location.hash === `#${doc.key}`) history.replaceState(null, "", location.pathname + location.search);
  location.hash = doc.key;
}

function init() {
  const panel = el("div", "search-results ornament-frame");
  panel.id = "site-search-results";
  panel.hidden = true;
  panel.setAttribute("data-lenis-prevent", "");
  const scroller = el("div", "search-results__scroll");
  scroller.setAttribute("role", "listbox");
  scroller.setAttribute("aria-label", "Search results");
  scroller.id = "site-search-list";
  const foot = el("p", "search-results__foot");
  foot.setAttribute("aria-hidden", "true");
  panel.append(scroller, foot);
  header.append(panel);

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", scroller.id);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("aria-keyshortcuts", "/");

  let docs = null, rows = [], active = -1, loadFailed = false;
  loadAncientsData().then((data) => { docs = buildIndex(data); if (input.value) run(); }).catch(() => { loadFailed = true; });

  const siteHeader = header.closest(".site-header");
  // The header sits under the Descent event panel and the vault sheet (z 50-60); lift it while results are showing.
  const open = () => { siteHeader?.classList.add("is-searching"); panel.hidden = false; input.setAttribute("aria-expanded", "true"); requestAnimationFrame(() => panel.classList.add("is-open")); };
  const close = () => {
    panel.classList.remove("is-open"); panel.hidden = true; siteHeader?.classList.remove("is-searching");
    input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant");
    active = -1; rows.forEach((r) => r.classList.remove("is-active"));
  };
  const setActive = (n, scroll = true) => {
    if (!rows.length) return;
    active = (n + rows.length) % rows.length;
    rows.forEach((r, k) => { r.classList.toggle("is-active", k === active); r.setAttribute("aria-selected", String(k === active)); });
    input.setAttribute("aria-activedescendant", rows[active].id);
    if (scroll) rows[active].scrollIntoView({ block: "nearest" });
  };
  const pick = (hit) => { close(); input.value = ""; input.blur(); go(hit.doc); };

  function note(text) { const p = el("p", "search-results__note", text); scroller.replaceChildren(p); rows = []; foot.textContent = ""; }

  function run() {
    const q = input.value.trim();
    if (!q) { close(); return; }
    open();
    if (loadFailed) return note("The records did not load. Serve the site over http and reload.");
    if (!docs) return note("Reading the records…");
    const { tokens, hits } = search(docs, q);
    if (fold(q).replace(/\s/g, "").length < MIN_QUERY) return note("Keep typing: a name, a place, a year.");
    if (!hits.length) return note(`Nothing in the record for “${q}”.`);
    const res = tokens.map(tokenRe);
    rows = hits.map((hit, k) => {
      const { doc } = hit;
      const row = el("a", "search-result" + (doc.theoretical ? " is-theoretical" : "") + ` search-result--${doc.kind}`);
      row.id = `site-search-r${k}`;
      row.setAttribute("role", "option");
      row.tabIndex = -1;
      row.href = `${doc.kind === "event" ? "timeline.html" : "artifacts.html"}#${doc.key}`;
      row.append(thumb(doc));
      const body = el("span", "search-result__body");
      const head = el("span", "search-result__head");
      const title = el("span", "search-result__title"); highlight(title, doc.title, res);
      const tag = el("span", "search-result__tag", doc.kind === "artifact" ? (doc.theoretical ? "Artifact · Mysterious" : "Artifact") : doc.theoretical ? "Theoretical" : "Event");
      head.append(title, tag);
      const sub = el("span", "search-result__sub"); highlight(sub, doc.sub, res);
      const era = el("span", "search-result__era", doc.era);
      body.append(head, sub);
      if (hit.snippet) { const sn = el("span", "search-result__snippet"); snippetOf(hit.snippet, res, sn); body.append(sn); }
      body.append(era);
      row.append(body);
      row.addEventListener("click", (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); pick(hit); });
      row.addEventListener("pointermove", () => { if (active !== k) setActive(k, false); });
      row.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the field while clicking
      row._hit = hit;
      return row;
    });
    scroller.replaceChildren(...rows);
    scroller.scrollTop = 0;
    foot.textContent = `${hits.length} ${hits.length === 1 ? "result" : "results"} · ↑ ↓ to move · Enter to open · Esc to close`;
    setActive(0, false);
  }

  input.addEventListener("input", run);
  input.addEventListener("focus", () => { if (input.value.trim()) run(); });
  input.addEventListener("keydown", (e) => {
    // The pages listen on the document for arrows and Escape; while the field has focus those keys are ours.
    e.stopPropagation();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (panel.hidden) { run(); return; }
      setActive(active + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter") {
      if (!panel.hidden && rows[active]) { e.preventDefault(); pick(rows[active]._hit); }
    } else if (e.key === "Escape") {
      if (!panel.hidden) { e.preventDefault(); close(); } else { input.value = ""; input.blur(); }
    } else if (e.key === "Tab") close();
  });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !panel.contains(e.target) && !field.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    input.focus();
    input.select();
  });
}

if (input && field && header) init();
