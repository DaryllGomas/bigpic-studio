// The Dial (packet 06). A night sky over ruined megaliths; turning the stone precession
// ring selects an era. Every word here comes from data/timeline.json, data/did-you-know.json
// and data/artifacts.json via js/redesign/data.js. Nothing is hard-coded content.
import { loadAncientsData, yearsAgo } from "./data.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const MOBILE = window.matchMedia("(max-width: 760px)");

const STRATA_DIR = "images/redesign/strata/";
const EVENTS_DIR = "images/redesign/events/";
const DIAL_DIR = "images/redesign/dial/";

// Where each era's plate should centre its circular window crop (fraction of plate width).
// The plates are 1672x941 with the painted scene band roughly y 8%-68%; these x-focuses were
// eyeballed against the actual art so the window shows each era's real subject, not empty rock.
const PLATE_FOCUS = {
  prehistoric: 0.5,
  earlyNeolithic: 0.36,
  earlyUrban: 0.52,
  bronzeAge: 0.4,
  classical: 0.46,
  postClassical: 0.52,
  earlyModern: 0.34,
  modern: 0.62,
};

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitEraTitle(title) {
  const match = title.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  return match ? { name: match[1], range: match[2] } : { name: title, range: "" };
}

/* ------------------------------------------------------------------ model */

function buildModel(timeline) {
  const eras = timeline.periods.map((period, eraIndex) => {
    const items = period.events.map((event, dataIndex) => {
      const nn = String(dataIndex + 1).padStart(2, "0");
      return {
        event,
        dataIndex,
        key: `${period.id}-${nn}`,
        image: `${EVENTS_DIR}${period.id}/${nn}-${slugify(event.title)}.webp`,
        theoretical: event.theoretical === true,
      };
    });
    return {
      id: period.id,
      title: period.title,
      didYouKnow: period.didYouKnow,
      eraIndex,
      plate: `${STRATA_DIR}${period.id}.webp`,
      focusX: PLATE_FOCUS[period.id] ?? 0.5,
      events: items,
      orbit: pickOrbit(items),
    };
  });
  return eras;
}

// Up to 6 events evenly spread across the era's real event order, always keeping the
// theoretical one (only prehistoric has one; the formula already lands on it there).
function pickOrbit(items, max = 6) {
  const n = items.length;
  if (n <= max) return items;
  const k = max;
  const picked = [];
  const seen = new Set();
  for (let i = 0; i < k; i += 1) {
    const idx = Math.round(((n - 1) * i) / (k - 1));
    if (!seen.has(idx)) {
      seen.add(idx);
      picked.push(idx);
    }
  }
  const theoreticalIdx = items.findIndex((it) => it.theoretical);
  if (theoreticalIdx >= 0 && !seen.has(theoreticalIdx)) {
    // Swap in the theoretical event at the position closest to it.
    let closest = 0;
    let bestDist = Infinity;
    picked.forEach((idx, pos) => {
      const dist = Math.abs(idx - theoreticalIdx);
      if (dist < bestDist) {
        bestDist = dist;
        closest = pos;
      }
    });
    picked[closest] = theoreticalIdx;
  }
  picked.sort((a, b) => a - b);
  return picked.map((idx) => items[idx]);
}

/* ------------------------------------------------------------ image art */

const probeCache = new Map();
function probe(src) {
  if (!probeCache.has(src)) {
    probeCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      }),
    );
  }
  return probeCache.get(src);
}

// Every event image has a fallback: a crop of its own era's plate. Never a broken image,
// never a console 404 for a file we haven't probed.
function attachArt(node, item, era) {
  const plateUrl = new URL(era.plate, document.baseURI).href;
  node.style.setProperty("--plate", `url("${plateUrl}")`);
  const spread = (item.dataIndex * 37 + era.eraIndex * 11) % 100;
  node.style.setProperty("--crop-x", `${spread}%`);
  if (!item.image) return;
  probe(item.image).then((ok) => {
    if (!ok || node.querySelector("img")) return;
    const img = el("img");
    img.alt = "";
    img.decoding = "async";
    img.src = item.image;
    img.addEventListener("load", () => node.classList.add("has-image"), { once: true });
    img.addEventListener("error", () => img.remove(), { once: true });
    node.append(img);
  });
}

/* --------------------------------------------------------------- render */

function buildRail(eras, state) {
  const rail = $(".dial-rail__list");
  rail.innerHTML = "";
  eras.forEach((era) => {
    const li = el("li", "dial-rail__item");
    const button = el("button", "dial-rail__button");
    button.type = "button";
    const { name } = splitEraTitle(era.title);
    button.dataset.era = era.id;
    button.setAttribute("aria-current", era.eraIndex === state.eraIndex ? "true" : "false");
    button.append(el("span", "dial-rail__dot"), el("span", "dial-rail__label", name));
    button.addEventListener("click", () => goToEra(era.eraIndex, state));
    li.append(button);
    rail.append(li);
  });
}

function buildStrip(eras, state) {
  const strip = $(".dial-strip__track");
  strip.innerHTML = "";
  eras.forEach((era) => {
    const button = el("button", "dial-strip__card");
    button.type = "button";
    button.dataset.era = era.id;
    const { name, range } = splitEraTitle(era.title);
    const art = el("span", "dial-strip__art event-art");
    attachArt(art, { dataIndex: era.eraIndex, image: null }, era);
    button.append(art, el("span", "dial-strip__name", name), el("span", "dial-strip__range", range));
    button.addEventListener("click", () => goToEra(era.eraIndex, state));
    strip.append(button);
  });
}

function renderOrbit(era, state) {
  const wrap = $(".dial-orbit");
  wrap.innerHTML = "";
  const thread = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  thread.setAttribute("class", "dial-orbit__thread");
  thread.setAttribute("viewBox", "0 0 1000 1000");
  thread.setAttribute("preserveAspectRatio", "none");
  wrap.append(thread);

  const medallionLayer = el("div", "dial-orbit__medallions");
  wrap.append(medallionLayer);

  const n = era.orbit.length;
  if (n === 0) return;
  // Sweep along the ring band: left-and-slightly-up, down through the bottom, to
  // right-and-slightly-up, as in frame 1. deg is a plain screen angle (y grows down),
  // so this walks clockwise through the bottom of the circle.
  const startDeg = 196;
  const endDeg = -2;
  const R = 460; // orbit radius in a 0-1000 box, matching the ring band
  const TILT = 1; // the ring is a true circle now, so the orbit is too
  const points = era.orbit.map((item, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const deg = startDeg + (endDeg - startDeg) * t;
    const rad = (deg * Math.PI) / 180;
    const x = 500 + R * Math.cos(rad);
    const y = 500 + R * TILT * Math.sin(rad);
    return { item, x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const goldPath = document.createElementNS(thread.namespaceURI, "path");
  goldPath.setAttribute("class", "dial-orbit__gold");
  goldPath.setAttribute("d", pathD);
  thread.append(goldPath);

  const theoIdx = points.findIndex((p) => p.item.theoretical);
  if (theoIdx > 0) {
    const bluePath = document.createElementNS(thread.namespaceURI, "path");
    bluePath.setAttribute("class", "dial-orbit__blue");
    bluePath.setAttribute(
      "d",
      `M ${points[theoIdx - 1].x.toFixed(1)} ${points[theoIdx - 1].y.toFixed(1)} L ${points[theoIdx].x.toFixed(1)} ${points[theoIdx].y.toFixed(1)}`,
    );
    thread.append(bluePath);
  }
  if (theoIdx >= 0 && theoIdx < points.length - 1) {
    const bluePath2 = document.createElementNS(thread.namespaceURI, "path");
    bluePath2.setAttribute("class", "dial-orbit__blue");
    bluePath2.setAttribute(
      "d",
      `M ${points[theoIdx].x.toFixed(1)} ${points[theoIdx].y.toFixed(1)} L ${points[theoIdx + 1].x.toFixed(1)} ${points[theoIdx + 1].y.toFixed(1)}`,
    );
    thread.append(bluePath2);
  }

  points.forEach(({ item, x, y }) => {
    const button = el("button", `dial-medallion${item.theoretical ? " is-theoretical" : ""}`);
    button.type = "button";
    button.style.left = `${x / 10}%`;
    button.style.top = `${y / 10}%`;
    button.dataset.key = item.key;
    button.setAttribute("aria-pressed", state.focusKey === item.key ? "true" : "false");
    const art = el("span", "event-art event-art--medallion");
    attachArt(art, item, era);
    const caption = el("span", "dial-medallion__caption");
    caption.append(
      el("span", "dial-medallion__year", item.event.year),
      el("span", "dial-medallion__title", titleCase(item.event.title)),
    );
    button.append(art, caption);
    button.addEventListener("click", () => focusEvent(item, state));
    medallionLayer.append(button);
  });
}

// Data titles are upper-case ("EMERGENCE OF HUMANS"); the frame sets them in title case.
// This only changes letter case, never the words themselves.
function titleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
}

function renderWindow(era) {
  const plate = $(".dial-window__plate");
  const prev = plate.style.backgroundImage;
  const next = `url("${era.plate}")`;
  plate.style.backgroundPositionX = `${era.focusX * 100}%`;
  if (prev === next) return;
  if (REDUCED.matches || typeof window.gsap === "undefined") {
    plate.style.backgroundImage = next;
    return;
  }
  const ghost = $(".dial-window__ghost");
  ghost.style.backgroundImage = prev || next;
  ghost.style.backgroundPositionX = plate.style.backgroundPositionX;
  ghost.style.opacity = "1";
  plate.style.backgroundImage = next;
  window.gsap.to(ghost, { opacity: 0, duration: 0.9, ease: "power1.out" });
}

function renderEventPanel(item, era) {
  const panel = $(".dial-event");
  panel.classList.toggle("is-theoretical", item.theoretical);
  panel.innerHTML = "";
  const scroll = el("div", "dial-event__scroll");
  const figure = el("figure", "dial-event__figure");
  const art = el("span", "event-art event-art--panel");
  attachArt(art, item, era);
  figure.append(art);
  const date = el("p", "dial-event__date", item.event.year);
  const title = el("h2", "dial-event__title", titleCase(item.event.title));
  const tag = el("span", "dial-event__tag", item.theoretical ? "THEORETICAL" : "MAINSTREAM");
  const desc = el("p", "dial-event__desc", item.event.description);
  scroll.append(figure, date, title, tag, desc);
  if (item.event.details?.details) {
    scroll.append(el("p", "dial-event__details", item.event.details.details));
  }
  panel.append(scroll);
  const cta = el("a", "dial-event__cta ornament-pill", "ENTER THIS ERA →");
  cta.href = `timeline.html#${era.id}`;
  cta.addEventListener("click", (e) => enterEra(e, era.id));
  panel.append(cta);
}

function enterEra(e, eraId) {
  if (!document.startViewTransition || REDUCED.matches) return;
  e.preventDefault();
  const href = e.currentTarget.href;
  document.startViewTransition(() => {
    window.location.href = href;
  });
}

function renderFact(era, dyk, state) {
  const fact = $(".dial-fact");
  const facts = era.didYouKnow ? dyk[era.didYouKnow] : null;
  if (!facts || facts.length === 0) {
    fact.hidden = true;
    return;
  }
  fact.hidden = false;
  fact.innerHTML = "";
  let pool = facts;
  let current = pool[Math.floor(Math.random() * pool.length)];
  const body = el("p", "dial-fact__body", current);
  fact.append(
    el("h3", "dial-fact__title", "DID YOU KNOW?"),
    body,
    (() => {
      const btn = el("button", "dial-fact__refresh ornament-pill", "ANOTHER FACT ↻");
      btn.type = "button";
      btn.addEventListener("click", () => {
        let next = current;
        while (next === current && pool.length > 1) {
          next = pool[Math.floor(Math.random() * pool.length)];
        }
        current = next;
        body.textContent = current;
      });
      return btn;
    })(),
  );
}

function renderTeaser(artifacts) {
  const teaser = $(".dial-teaser");
  teaser.innerHTML = "";
  const thumbs = el("div", "dial-teaser__thumbs");
  Object.values(artifacts)
    .slice(0, 3)
    .forEach((a) => {
      const img = el("img", "dial-teaser__thumb");
      img.src = a.image || a.images?.[0] || "";
      img.alt = "";
      img.loading = "lazy";
      thumbs.append(img);
    });
  const copy = el("div", "dial-teaser__copy");
  copy.append(
    el("span", "dial-teaser__title", "ARTIFACTS"),
    el("span", "dial-teaser__sub", "EXPLORE REMARKABLE OBJECTS FROM OUR PAST →"),
  );
  const link = el("a", "dial-teaser__link");
  link.href = "artifacts.html";
  link.setAttribute("aria-label", "Explore remarkable objects from our past");
  link.append(thumbs, copy);
  teaser.append(link);
}

/* --------------------------------------------------------------- state */

function focusEvent(item, state) {
  state.focusKey = item.key;
  document.querySelectorAll(".dial-medallion").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.key === item.key ? "true" : "false");
  });
  renderEventPanel(item, state.eras[state.eraIndex]);
}

function rotateRingTo(eraIndex, state) {
  const ring = $(".dial-ring__art");
  const deg = -45 * eraIndex;
  if (REDUCED.matches || typeof window.gsap === "undefined") {
    ring.style.transform = `rotate(${deg}deg)`;
    return;
  }
  window.gsap.to(ring, { rotate: deg, duration: 1.1, ease: "elastic.out(1, 0.85)" });
}

function goToEra(eraIndex, state, { silent = false } = {}) {
  const n = state.eras.length;
  const clamped = ((eraIndex % n) + n) % n;
  state.eraIndex = clamped;
  const era = state.eras[clamped];
  document.querySelectorAll(".dial-rail__button").forEach((b) => {
    b.setAttribute("aria-current", b.dataset.era === era.id ? "true" : "false");
  });
  document.querySelectorAll(".dial-strip__card").forEach((b) => {
    b.classList.toggle("is-current", b.dataset.era === era.id);
  });
  $(".dial-scrubber__label").textContent = splitEraTitle(era.title).name;
  $(".dial-scrubber__range").textContent = splitEraTitle(era.title).range;
  rotateRingTo(clamped, state);
  renderWindow(era);
  renderOrbit(era, state);
  const defaultItem = era.orbit[era.orbit.length - 1] ?? era.events[0];
  focusEvent(defaultItem, state);
  renderFact(era, state.dyk, state);
  if (!silent) state.strip?.scrollCardIntoView?.(clamped);
  history.replaceState(null, "", `#${era.id}`);
}

/* --------------------------------------------------------- interaction */

function wireInteractions(state) {
  const stage = $(".dial-stage");
  let wheelLock = false;
  stage.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      goToEra(state.eraIndex + (e.deltaY > 0 ? 1 : -1), state);
      setTimeout(() => (wheelLock = false), 420);
    },
    { passive: false },
  );

  stage.tabIndex = stage.tabIndex || 0;
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToEra(state.eraIndex + 1, state);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToEra(state.eraIndex - 1, state);
    }
  });

  $(".dial-scrubber__prev").addEventListener("click", () => goToEra(state.eraIndex - 1, state));
  $(".dial-scrubber__next").addEventListener("click", () => goToEra(state.eraIndex + 1, state));
  $(".dial-strip__prev")?.addEventListener("click", () => goToEra(state.eraIndex - 1, state));
  $(".dial-strip__next")?.addEventListener("click", () => goToEra(state.eraIndex + 1, state));

  // Drag on the ring.
  const ringWrap = $(".dial-ring-wrap");
  let dragging = false;
  let dragStartX = 0;
  let dragAccum = 0;
  const onDown = (e) => {
    dragging = true;
    dragStartX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragAccum = 0;
    ringWrap.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? dragStartX;
    const delta = x - dragStartX;
    dragAccum += delta;
    dragStartX = x;
    const threshold = 90;
    if (Math.abs(dragAccum) >= threshold) {
      goToEra(state.eraIndex + (dragAccum > 0 ? 1 : -1), state);
      dragAccum = 0;
    }
  };
  const onUp = () => {
    dragging = false;
  };
  ringWrap.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/* ---------------------------------------------------------------- FX */

function wireAmbient() {
  const canvas = $(".dial-fx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let stars = [];
  let embers = [];

  function resize() {
    w = canvas.width = canvas.clientWidth * devicePixelRatio;
    h = canvas.height = canvas.clientHeight * devicePixelRatio;
    const starCount = Math.round((w * h) / 26000);
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.62,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
    }));
    embers = Array.from({ length: 26 }, (_, i) => ({
      side: i % 2,
      x: 0,
      y: 0,
      vy: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.4,
      life: Math.random(),
      size: Math.random() * 2 + 1,
    })).map((e) => resetEmber(e, w, h));
  }

  function resetEmber(e, w, h) {
    e.x = (e.side === 0 ? Math.random() * w * 0.22 : w - Math.random() * w * 0.22);
    e.y = h * (0.82 + Math.random() * 0.18);
    e.life = 0;
    return e;
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      const tw = 0.55 + 0.45 * Math.sin(t * 0.0006 * s.speed + s.phase);
      ctx.globalAlpha = tw * 0.85;
      ctx.fillStyle = "#fff6e0";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    embers.forEach((e) => {
      e.y -= e.vy;
      e.x += e.drift;
      e.life += 0.004;
      const alpha = Math.max(0, 1 - e.life) * 0.8;
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
      grad.addColorStop(0, `rgba(255, 198, 120, ${alpha})`);
      grad.addColorStop(1, "rgba(255, 140, 40, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
      ctx.fill();
      if (e.life >= 1) resetEmber(e, w, h);
    });
    raf = requestAnimationFrame(frame);
  }

  let raf;
  resize();
  window.addEventListener("resize", resize);
  if (REDUCED.matches) {
    frame(0);
    cancelAnimationFrame(raf);
  } else {
    raf = requestAnimationFrame(frame);
  }
}

/* --------------------------------------------------------------- init */

function parseHashEra(eras) {
  const id = location.hash.replace("#", "");
  const idx = eras.findIndex((e) => e.id === id);
  return idx >= 0 ? idx : 0;
}

async function init() {
  const { timeline, didYouKnow, artifacts } = await loadAncientsData();
  const eras = buildModel(timeline);
  const state = { eras, eraIndex: 0, focusKey: null, dyk: didYouKnow };

  buildRail(eras, state);
  buildStrip(eras, state);
  renderTeaser(artifacts);
  wireInteractions(state);
  wireAmbient();

  const startIndex = parseHashEra(eras);
  goToEra(startIndex, state, { silent: true });
  document.documentElement.dataset.dialReady = "true";
  console.info(`[Dial] ready: ${eras.length} eras.`);
}

init().catch((error) => {
  console.error("[Dial] failed to initialise.", error);
});
