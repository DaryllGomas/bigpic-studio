// The Artifact Vault. All words come from data/artifacts.json via the shared loader.
// The page background is a painted vault wall (wall-wide / wall-tall) with five empty lit niches.
// The wall image, the niche hotspots and the embers all live in one geometry: layout() scales the
// wall like `object-fit: cover`, then publishes its box as --wx/--wy/--ww/--wh (px) and --u (screen px
// per wall-image px) on <html>. Niches are positioned in % of the wall image, so they track the art
// exactly at every window size.
import { loadAncientsData } from "./data.js";

const FILTERS = [["all", "All"], ["mysterious", "Mysterious"], ["tools", "Tools & Weapons"], ["art", "Art & Symbols"]];
const TAGS = { mysterious: "Mysterious", tools: "Tools & Weapons", art: "Art & Symbols" };
const SECTIONS = [["overview", "Overview"], ["context", "Context"], ["significance", "Significance"], ["mysteries", "Mysteries"]];
// Painted niche renders (images/redesign/vault/<file>.webp): each artifact as a lit museum object on pure
// black, made in Daryll's ChatGPT window. Keyed by artifact id; the real photos stay in the detail gallery.
const NICHE_RENDERS = {
  "mysterious-handbags": "images/redesign/vault/mysterious-handbags.webp",
  "egyptian-cartouches": "images/redesign/vault/egyptian-cartouches.webp",
  "bronze-age-swords": "images/redesign/vault/bronze-age-swords.webp",
  "paleolithic-hand-axe": "images/redesign/vault/paleolithic-hand-axe.webp",
  "venus-figurines": "images/redesign/vault/venus-figurines.webp",
};
// Frame 3 order: top row hand axe, Venus, swords; bottom row cartouche, handbags. Anything else follows.
const ORDER = ["paleolithic-hand-axe", "venus-figurines", "bronze-age-swords", "egyptian-cartouches", "mysterious-handbags"];
// Niche interiors as [x0, x1, y0, y1] in % of the wall image, measured on the PNGs (empty plinth top = y1).
// plaque: [offset below the niche foot, height] in wall-image px. embers: torch/brazier points in wall-image px.
const WALLS = {
  wide: {
    w: 1672, h: 941,
    slots: [[18.3, 29.0, 21.4, 41.8], [36.0, 45.5, 21.4, 41.8], [52.0, 61.5, 21.4, 41.8], [23.7, 35.5, 53.0, 70.6], [45.5, 57.5, 53.0, 70.6]],
    plaque: [[30, 40], [30, 40], [30, 40], [38, 40], [38, 40]],
    embers: [[245, 760], [1135, 745], [270, 385], [1105, 380], [1640, 665], [255, 105], [800, 100], [1085, 120]],
  },
  tall: {
    w: 1024, h: 1536,
    slots: [[20.5, 35.2, 25.6, 41.1], [45.5, 61.3, 25.6, 41.1], [71.4, 87.1, 25.6, 41.1], [28.0, 46.8, 48.8, 64.9], [61.3, 79.8, 48.8, 64.9]],
    plaque: [[30, 40], [30, 40], [30, 40], [32, 40], [32, 40]],
    embers: [[150, 1100], [990, 1095], [165, 625], [955, 630], [180, 270], [685, 275], [945, 270]],
  },
};
const OBJ_SPAN = { h: 0.88, bottom: -0.032 }; // the render's square box, in niche heights: ~82% object height, base on the plinth

const stage = document.querySelector(".vault-stage");
const wallbox = document.querySelector(".vault-wallbox");
const panel = document.querySelector(".vault-panel");
const scrim = document.querySelector(".vault-scrim");
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Side panel only on a landscape desktop window; anywhere narrower or taller than wide the
// panel is a bottom sheet (keep in step with the layout breakpoint in vault.css).
const sheetQuery = matchMedia("(max-width: 1300px), (max-aspect-ratio: 1/1)");
const phoneQuery = matchMedia("(max-width: 760px)");
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const imagesOf = (a) => a.images ?? (a.image ? [a.image] : []);
const img = (src, cls, alt = "") => { const i = el("img", cls); i.alt = alt; i.decoding = "async"; i.onerror = () => i.classList.add("is-missing"); i.src = src; return i; };

let entries = [], current = null, imageIndex = 0, opener = null;
let wallMode = "wide", emberPts = [];

// ---- the wall: one geometry for the painted image, the niche hotspots and the embers ----
function layout() {
  const vw = innerWidth, vh = innerHeight, stacked = phoneQuery.matches;
  const mode = stacked || vw / vh < 1.1 ? "tall" : "wide";
  const cfg = WALLS[mode], W = cfg.w, H = cfg.h;
  const xs = cfg.slots.map((r) => r[0] / 100 * W), xe = cfg.slots.map((r) => r[1] / 100 * W);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xe);
  const by0 = Math.min(...cfg.slots.map((r) => r[2] / 100 * H));
  const by1 = Math.max(...cfg.slots.map((r, k) => r[3] / 100 * H + cfg.plaque[k][0] + cfg.plaque[k][1]));
  const panelOn = !stacked && !sheetQuery.matches;
  const cover = Math.max(vw / W, vh / H);
  let u = cover, ox, oy;
  if (stacked) {
    ox = (vw - W * u) / 2; oy = (vh - H * u) / 2;
  } else {
    if (!panelOn) u = Math.min(cover * 1.25, Math.max(cover, vw / 2 / ((bx0 + bx1) / 2))); // zoom just enough to centre the wall
    const w = W * u, h = H * u;
    const shellRight = (vw + Math.min(vw, 1680)) / 2, panelW = Math.min(430, Math.max(330, 0.256 * vw));
    const panelLeft = shellRight - 24 - panelW;
    ox = panelOn ? Math.min(0, panelLeft - 30 - u * bx1) : vw / 2 - u * (bx0 + bx1) / 2;
    ox = Math.min(0, Math.max(vw - w, ox));
    const header = parseFloat(getComputedStyle(root).getPropertyValue("--header-height")) || 126;
    oy = header + (vh - header) / 2 + 8 - u * (by0 + by1) / 2;
    oy = Math.max(oy, 196 - u * by0);
    oy = Math.min(0, Math.max(vh - h, oy));
  }
  wallMode = mode;
  const set = (k, v) => root.style.setProperty(k, v);
  set("--wx", ox.toFixed(2) + "px"); set("--wy", oy.toFixed(2) + "px"); set("--ww", (W * u).toFixed(2) + "px"); set("--wh", (H * u).toFixed(2) + "px"); set("--u", u.toFixed(5));
  set("--fx", (ox + u * (bx0 + bx1) / 2).toFixed(1) + "px");
  // The niche layer is absolutely positioned inside the stage (not fixed: a fixed layer is its own stacking
  // context and the screen-blended renders could no longer see the painted wall behind them).
  const sr = stage.getBoundingClientRect();
  set("--bx", (ox - sr.left - scrollX).toFixed(2) + "px"); set("--by", (oy - sr.top - scrollY).toFixed(2) + "px");
  document.querySelectorAll(".vault-scene__wall").forEach((i) => { i.hidden = i.dataset.wall !== mode; });
  stage.classList.toggle("is-stacked", stacked);
  stage.dataset.wall = mode;
  emberPts = cfg.embers.map(([x, y]) => [ox + x * u, oy + y * u]);
  placeNiches();
}

function placeNiches() {
  const cfg = WALLS[wallMode];
  document.querySelectorAll(".niche").forEach((n) => {
    const k = Number(n.dataset.slot), [x0, x1, y0, y1] = cfg.slots[k], [pdy, pdh] = cfg.plaque[k];
    n.style.setProperty("--nx", x0 + "%"); n.style.setProperty("--ny", y0 + "%");
    n.style.setProperty("--nw", (x1 - x0) + "%"); n.style.setProperty("--nh", (y1 - y0) + "%");
    n.style.setProperty("--pdy", pdy); n.style.setProperty("--pdh", pdh);
  });
}

// The renders sit on pure black. Screen-blending that onto the (bright, amber) painted niche washes the object
// out, so each render is keyed once into a true cut-out: black that is connected to the image border becomes
// transparent (soft edge, colour un-matted), black enclosed by the object stays opaque.
const cutouts = new Map();
function cutout(src) {
  if (!cutouts.has(src)) cutouts.set(src, new Promise((ok, fail) => {
    const im = new Image(); im.decoding = "async";
    im.onerror = fail;
    im.onload = () => {
      try {
        const N = 720, c = document.createElement("canvas"); c.width = c.height = N;
        const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0, N, N);
        const d = g.getImageData(0, 0, N, N), px = d.data, T = 38, LO = 5;
        const mx = (k) => Math.max(px[k], px[k + 1], px[k + 2]);
        const bg = new Uint8Array(N * N), stack = new Int32Array(N * N); let sp = 0;
        const push = (x, y) => { const q = y * N + x; if (!bg[q] && mx(q * 4) <= T) { bg[q] = 1; stack[sp++] = q; } };
        for (let x = 0; x < N; x++) { push(x, 0); push(x, N - 1); }
        for (let y = 0; y < N; y++) { push(0, y); push(N - 1, y); }
        while (sp) { const q = stack[--sp], x = q % N, y = (q / N) | 0; if (x > 0) push(x - 1, y); if (x < N - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < N - 1) push(x, y + 1); }
        for (let q = 0; q < N * N; q++) {
          if (!bg[q]) continue;
          const k = q * 4, m = mx(k), t = Math.min(1, Math.max(0, (m - LO) / (T - LO)));
          // soft glow only: fade it out toward the square's edge so no hard edge of the render shows
          const x = q % N, y = (q / N) | 0, e = Math.min(1, Math.min(x, y, N - 1 - x, N - 1 - y) / (N * 0.05)), al = t * t * (3 - 2 * t) * e * e;
          const f = al > 0.02 ? 1 / al : 0;
          px[k] = Math.min(255, px[k] * f); px[k + 1] = Math.min(255, px[k + 1] * f); px[k + 2] = Math.min(255, px[k + 2] * f); px[k + 3] = al * 255;
        }
        g.putImageData(d, 0, 0);
        c.toBlob((b) => (b ? ok(URL.createObjectURL(b)) : fail(new Error("toBlob"))), "image/png");
      } catch (e) { fail(e); }
    };
    im.src = src;
  }));
  return cutouts.get(src);
}

function niche(key, a, i) {
  const mysterious = a.category.includes("mysterious");
  const b = el("button", "niche" + (mysterious ? " is-mysterious" : "")); b.type = "button"; b.dataset.key = key; b.dataset.slot = i; b.style.setProperty("--i", i); b.setAttribute("aria-pressed", "false");
  const light = el("span", "niche__light"); light.style.setProperty("--flick", (3 + i * 0.41).toFixed(2) + "s");
  b.append(light);
  const src = NICHE_RENDERS[key] ?? imagesOf(a)[0];
  const o = el("img", "niche__object" + (NICHE_RENDERS[key] ? " is-pending" : " is-photo")); o.alt = ""; o.decoding = "async"; o.onerror = () => o.classList.add("is-missing");
  if (NICHE_RENDERS[key]) cutout(src).then((u) => { o.src = u; o.classList.remove("is-pending"); }).catch(() => { o.src = src; o.classList.remove("is-pending"); o.classList.add("is-screen"); });
  else o.src = src;
  b.append(o, el("span", "niche__veil"), el("span", "niche__rim"));
  const plaque = el("span", "niche__plaque"); plaque.append(el("span", "niche__title", a.title));
  b.append(plaque);
  b.addEventListener("click", () => { if (!b.classList.contains("is-dimmed")) select(key, true, b); });
  return b;
}

function build(artifacts) {
  const all = Object.entries(artifacts);
  entries = [...ORDER.map((k) => all.find(([x]) => x === k)).filter(Boolean), ...all.filter(([x]) => !ORDER.includes(x))].slice(0, 5);
  wallbox.replaceChildren(...entries.map(([k, a], i) => niche(k, a, i)));
  const nav = document.querySelector(".vault-filters");
  FILTERS.forEach(([value, label], n) => {
    const f = el("button", "vault-filter", label); f.type = "button"; f.dataset.filter = value; f.setAttribute("aria-pressed", String(n === 0));
    f.addEventListener("click", () => applyFilter(value)); nav.append(f);
  });
  layout();
}

function applyFilter(value) {
  document.querySelectorAll(".vault-filter").forEach((f) => f.setAttribute("aria-pressed", String(f.dataset.filter === value)));
  document.querySelectorAll(".niche").forEach((n) => {
    const a = Object.fromEntries(entries)[n.dataset.key];
    const off = value !== "all" && !a.category.includes(value);
    n.classList.toggle("is-dimmed", off); n.tabIndex = off ? -1 : 0; n.setAttribute("aria-disabled", String(off));
  });
}

function showImage(n) {
  const srcs = imagesOf(current[1]); if (!srcs.length) return;
  imageIndex = (n + srcs.length) % srcs.length;
  const src = srcs[imageIndex], main = panel.querySelector(".vault-gallery__image");
  main.classList.remove("is-missing"); main.alt = `${current[1].title}, image ${imageIndex + 1} of ${srcs.length}`;
  main.classList.add("is-swapping");
  const done = () => main.classList.remove("is-swapping");
  main.onload = done; main.onerror = () => { done(); main.classList.add("is-missing"); };
  setTimeout(() => { main.src = src; if (reduced) done(); }, reduced ? 0 : 140);
  panel.querySelector(".vault-gallery__backdrop").style.backgroundImage = `url("${src}")`;
  panel.querySelector(".vault-gallery__count").textContent = `Image ${imageIndex + 1} of ${srcs.length}`;
  panel.querySelectorAll(".vault-gallery__thumb").forEach((t, k) => t.setAttribute("aria-current", String(k === imageIndex)));
  panel.querySelectorAll(".vault-gallery__dot").forEach((d, k) => d.classList.toggle("is-active", k === imageIndex));
}

function select(key, fromUser, trigger) {
  current = entries.find(([k]) => k === key); if (!current) return;
  const a = current[1], srcs = imagesOf(a), mysterious = a.category.includes("mysterious");
  document.querySelectorAll(".niche").forEach((n) => n.setAttribute("aria-pressed", String(n.dataset.key === key)));
  panel.classList.toggle("is-mysterious", mysterious);
  panel.querySelector(".vault-panel__title").textContent = a.title;
  const tags = panel.querySelector(".vault-panel__tags"); tags.replaceChildren(...a.category.map((c) => el("span", "vault-panel__tag ornament-pill", TAGS[c] ?? c)));
  const [place, dates] = a.era.split(" • ");
  panel.querySelector(".vault-panel__era-place").textContent = place;
  panel.querySelector(".vault-panel__era-dates").textContent = dates ?? "";
  const sec = panel.querySelector(".vault-panel__sections"); sec.replaceChildren();
  SECTIONS.forEach(([f, label]) => { if (!a[f]) return; const s = el("section", "vault-panel__section"); s.append(el("h3", null, label), el("p", null, a[f])); sec.append(s); });
  const gal = panel.querySelector(".vault-gallery"); gal.classList.toggle("is-single", srcs.length < 2);
  const thumbs = panel.querySelector(".vault-gallery__thumbs"), dots = panel.querySelector(".vault-gallery__dots");
  thumbs.replaceChildren(...srcs.map((s, k) => { const t = el("button", "vault-gallery__thumb"); t.type = "button"; t.setAttribute("aria-label", `Show image ${k + 1} of ${srcs.length}`); t.append(img(s, "")); t.addEventListener("click", () => showImage(k)); return t; }));
  dots.replaceChildren(...srcs.map(() => el("span", "vault-gallery__dot")));
  panel.querySelector(".vault-panel__body").scrollTop = 0;
  showImage(0);
  if (fromUser) { stage.classList.remove("is-panel-closed"); if (sheetQuery.matches) openSheet(trigger); }
}

function openSheet(trigger) { opener = trigger ?? document.activeElement; stage.classList.add("is-sheet-open"); scrim.hidden = false; panel.focus({ preventScroll: true }); }
function closePanel() {
  setFolio(false);
  if (sheetQuery.matches) { stage.classList.remove("is-sheet-open"); scrim.hidden = true; } else stage.classList.add("is-panel-closed");
  (opener ?? document.querySelector('.niche[aria-pressed="true"]'))?.focus?.();
}
function setFolio(on) {
  stage.classList.toggle("is-folio", on);
  const btn = panel.querySelector(".vault-panel__explore"); btn.setAttribute("aria-expanded", String(on));
  panel.querySelector(".vault-panel__explore-label").textContent = on ? "Return to the vault" : "Explore artifact";
  scrim.hidden = !(on || stage.classList.contains("is-sheet-open"));
}

function wire() {
  sheetQuery.addEventListener("change", () => stage.classList.toggle("is-sheet", sheetQuery.matches));
  stage.classList.toggle("is-sheet", sheetQuery.matches);
  panel.querySelector(".vault-gallery__arrow--prev").addEventListener("click", () => showImage(imageIndex - 1));
  panel.querySelector(".vault-gallery__arrow--next").addEventListener("click", () => showImage(imageIndex + 1));
  panel.querySelector(".vault-panel__close").addEventListener("click", closePanel);
  panel.querySelector(".vault-panel__explore").addEventListener("click", () => setFolio(!stage.classList.contains("is-folio")));
  scrim.addEventListener("click", () => (stage.classList.contains("is-folio") && !sheetQuery.matches ? setFolio(false) : closePanel()));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea")) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { if (!current) return; e.preventDefault(); showImage(imageIndex + (e.key === "ArrowRight" ? 1 : -1)); }
    // QA fix: Escape also closes the desktop side panel (it only closed the folio and the sheet), like its close button.
    if (e.key === "Escape") { if (stage.classList.contains("is-folio")) setFolio(false); else if (stage.classList.contains("is-sheet-open") || (!sheetQuery.matches && !stage.classList.contains("is-panel-closed"))) closePanel(); }
  });
  let x0 = null; const g = panel.querySelector(".vault-gallery__stage");
  g.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  g.addEventListener("pointerup", (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 40) showImage(imageIndex + (e.clientX < x0 ? 1 : -1)); x0 = null; });
}

function embers() {
  if (reduced) return;
  const c = document.querySelector(".vault-scene__embers"), ctx = c.getContext("2d"); const ps = [];
  const size = () => { c.width = innerWidth; c.height = innerHeight; }; size(); addEventListener("resize", size);
  const tick = () => {
    if (!document.hidden) {
      if (emberPts.length && ps.length < 110 && Math.random() < 0.55) {
        const [x, y] = emberPts[(Math.random() * emberPts.length) | 0], u = parseFloat(root.style.getPropertyValue("--u")) || 1;
        ps.push({ x: x + (Math.random() - 0.5) * 16 * u, y, vx: (Math.random() - 0.5) * 0.4, vy: -0.4 - Math.random() * 0.9, life: 1, s: (Math.random() * 1.5 + 0.6) * Math.max(0.8, u) });
      }
      ctx.clearRect(0, 0, c.width, c.height);
      for (let k = ps.length - 1; k >= 0; k--) {
        const p = ps[k]; p.x += p.vx + Math.sin(p.y / 30) * 0.2; p.y += p.vy; p.life -= 0.006;
        if (p.life <= 0) { ps.splice(k, 1); continue; }
        ctx.fillStyle = `rgba(255,${150 + p.life * 80},${60 + p.life * 40},${p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

loadAncientsData().then(({ artifacts }) => {
  build(artifacts); wire(); applyFilter("all");
  select(entries.find(([k]) => k === "mysterious-handbags")?.[0] ?? entries[0][0], false);
  embers();
  addEventListener("resize", layout);
  phoneQuery.addEventListener("change", layout);
  sheetQuery.addEventListener("change", layout);
  requestAnimationFrame(() => stage.classList.add("is-lit"));
}).catch((err) => {
  const s = document.querySelector(".vault-hall__status"); if (s) s.textContent = "The vault could not be opened: the artifact records did not load. Serve the site over http and reload.";
  console.error("[Vault]", err);
});
