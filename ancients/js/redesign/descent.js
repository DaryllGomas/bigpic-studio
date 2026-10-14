// The Descent (packets 03 + 04).
// Present at the top, oldest at the bottom. Every word on this page comes from
// data/timeline.json and data/did-you-know.json via js/redesign/data.js.
import { loadAncientsData, yearsAgo } from "./data.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const STRATA_DIR = "images/redesign/strata/";
const EVENTS_DIR = "images/redesign/events/";

// Where the rock bands sit inside each plate (fractions of plate height). The near
// parallax layer shows only these bands, so the painted scene recedes behind the rock.
const PLATE_ROCK = {
  modern: { top: 0, bottom: 0.6 },
  earlyModern: { top: 0.1, bottom: 0.64 },
  postClassical: { top: 0.09, bottom: 0.7 },
  classical: { top: 0.07, bottom: 0.72 },
  bronzeAge: { top: 0.06, bottom: 0.7 },
  earlyUrban: { top: 0.1, bottom: 0.68 },
  earlyNeolithic: { top: 0.05, bottom: 0.8 },
  prehistoric: { top: 0.12, bottom: 0.8 },
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

// "PREHISTORIC PERIOD (300,000 - 10,000 BCE)" -> name + "(300,000 - 10,000 BCE)", same words.
function splitEraTitle(title) {
  const match = title.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  return match ? { name: match[1], range: match[2] } : { name: title, range: "" };
}

const fmt = new Intl.NumberFormat("en-US");

/* ------------------------------------------------------------------ model */

function buildModel(timeline) {
  const eras = [];
  const events = [];
  const periods = [...timeline.periods].reverse();
  periods.forEach((period, eraIndex) => {
    const era = {
      id: period.id,
      title: period.title,
      didYouKnow: period.didYouKnow,
      plate: `${STRATA_DIR}${period.id}.webp`,
      eraIndex,
      events: [],
    };
    const indexed = period.events.map((event, dataIndex) => ({ event, dataIndex }));
    indexed.reverse().forEach(({ event, dataIndex }) => {
      const nn = String(dataIndex + 1).padStart(2, "0");
      const approx = /^\s*(~|c\.|circa)/i.test(event.year);
      const item = {
        era,
        event,
        dataIndex,
        key: `${period.id}-${nn}`,
        image: `${EVENTS_DIR}${period.id}/${nn}-${slugify(event.title)}.webp`,
        theoretical: event.theoretical === true,
        yearsAgo: yearsAgo(event.year),
        approx,
        order: events.length,
      };
      era.events.push(item);
      events.push(item);
    });
    eras.push(era);
  });
  return { eras, events };
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

// Every event image has a fallback: a crop of its own era's strata plate, framed so that
// neighbouring events show different parts of the painting. Never a broken image.
function artFor(item, variant) {
  const art = el("span", `event-art event-art--${variant}`);
  const spread = (item.dataIndex * 37 + item.era.eraIndex * 11) % 100;
  // Absolute URL: a relative url() in a custom property resolves against the stylesheet, not the page.
  art.style.setProperty("--plate", `url("${new URL(item.era.plate, document.baseURI).href}")`);
  art.style.setProperty("--crop-x", `${spread}%`);
  const attach = () =>
    probe(item.image).then((ok) => {
      if (!ok || art.querySelector("img")) return;
      const img = el("img");
      img.alt = "";
      img.decoding = "async";
      img.src = item.image;
      img.addEventListener("load", () => art.classList.add("has-image"), { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
      art.append(img);
    });
  art._attach = attach;
  return art;
}

/* ------------------------------------------------------------- rendering */

function renderEra(era, didYouKnow, state) {
  const section = el("section", "stratum");
  section.id = era.id;
  section.dataset.era = era.id;
  section.setAttribute("aria-labelledby", `${era.id}-title`);
  const rock = PLATE_ROCK[era.id] ?? { top: 0.08, bottom: 0.7 };
  section.style.setProperty("--rock-top", `${rock.top * 100}%`);
  section.style.setProperty("--rock-bottom", `${rock.bottom * 100}%`);

  const stage = el("div", "stratum__stage");
  stage.setAttribute("aria-hidden", "true");
  const far = el("div", "stratum__far");
  const farImg = el("img");
  farImg.alt = "";
  farImg.decoding = "async";
  farImg.src = era.plate;
  if (era.eraIndex > 1) farImg.loading = "lazy";
  far.append(farImg);
  const haze = el("div", "stratum__haze");
  const near = el("div", "stratum__near");
  const nearImg = farImg.cloneNode();
  near.append(nearImg);
  const shade = el("div", "stratum__shade");
  stage.append(far, haze, near, shade);

  const content = el("div", "stratum__content");
  if (era.eraIndex > 0) {
    const seam = el("div", "stratum__seam");
    seam.setAttribute("aria-hidden", "true");
    seam.innerHTML =
      '<svg viewBox="0 0 1600 60" preserveAspectRatio="none"><path d="M0 34 L90 30 L160 38 L240 27 L330 35 L420 31 L470 40 L560 29 L640 33 L720 26 L800 37 L880 30 L960 36 L1040 28 L1120 35 L1200 31 L1290 39 L1370 29 L1450 34 L1530 30 L1600 36"/></svg>';
    content.append(seam);
  }

  const plaque = el("header", "stratum__plaque");
  const h2 = el("h2", "stratum__title");
  h2.id = `${era.id}-title`;
  const { name, range } = splitEraTitle(era.title);
  h2.append(el("span", "stratum__name", name));
  if (range) h2.append(el("span", "stratum__range", range));
  plaque.append(h2);
  content.append(plaque);

  let dyk = null;
  const facts = era.didYouKnow ? didYouKnow[era.didYouKnow] : null;
  if (facts && facts.length) {
    dyk = el("aside", "did-you-know ornament-frame");
    dyk.setAttribute("aria-label", "Did you know?");
    const head = el("div", "did-you-know__head");
    head.append(el("h3", "did-you-know__title", "Did you know?"));
    const refresh = el("button", "did-you-know__refresh");
    refresh.type = "button";
    refresh.setAttribute("aria-label", "Show another fact");
    refresh.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M19.8 3.8v4.6h-4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    head.append(refresh);
    const text = el("p", "did-you-know__fact");
    text.setAttribute("aria-live", "polite");
    let current = Math.floor(Math.random() * facts.length);
    text.textContent = facts[current];
    refresh.addEventListener("click", () => {
      if (facts.length > 1) {
        let next = current;
        while (next === current) next = Math.floor(Math.random() * facts.length);
        current = next;
      }
      text.classList.remove("is-new");
      void text.offsetWidth;
      text.textContent = facts[current];
      text.classList.add("is-new");
      refresh.classList.remove("is-spinning");
      void refresh.offsetWidth;
      refresh.classList.add("is-spinning");
    });
    dyk.append(head, text);
    content.append(dyk);
  }

  const list = el("ol", "stratum__events");
  list.setAttribute("aria-label", `${name} events, newest first`);
  era.events.forEach((item) => {
    const li = el("li", "marker-slot");
    const button = el("button", "marker");
    button.type = "button";
    button.id = `event-${item.key}`;
    button.dataset.key = item.key;
    button.setAttribute("aria-haspopup", "dialog");
    if (item.theoretical) button.classList.add("is-theoretical");
    const medal = el("span", "marker__medal");
    medal.setAttribute("aria-hidden", "true");
    const art = artFor(item, "medal");
    medal.append(art);
    const label = el("span", "marker__label");
    label.append(
      el("span", "marker__date", item.event.year),
      el("span", "marker__title", item.event.title),
      el("span", "marker__short", item.event.shortDesc),
    );
    button.append(medal, label);
    button.addEventListener("click", () => state.openPanel(item, button));
    li.append(button);
    list.append(li);
    item.slot = li;
    item.button = button;
    item.medalArt = art;
  });
  content.append(list);

  section.append(stage, content);
  era.section = section;
  era.stage = stage;
  era.far = far;
  era.near = near;
  era.plaque = plaque;
  era.dyk = dyk;
  era.content = content;
  return section;
}

/* ---------------------------------------------------------------- layout */

function layoutMode() {
  const w = window.innerWidth;
  if (w <= 760) return "mobile";
  if (w <= 1100) return "compact";
  return "wide";
}

function computeLayout(model, strataRoot) {
  const W = strataRoot.clientWidth;
  const VH = window.innerHeight;
  const mode = layoutMode();
  const headerH = document.querySelector(".site-header")?.offsetHeight ?? 126;
  const gaugeW = mode === "mobile" ? Math.round(W * 0.3) : Math.round(Math.min(250, Math.max(170, W * 0.15)));
  const step = mode === "mobile" ? 150 : mode === "compact" ? 176 : 196;
  const medal = mode === "mobile" ? 50 : 72;
  let minX;
  let maxX;
  if (mode === "mobile") {
    minX = gaugeW + 34;
    maxX = gaugeW + 58;
  } else {
    minX = gaugeW + W * 0.07;
    maxX = W * (mode === "compact" ? 0.52 : 0.56);
  }
  const flipAt = mode === "mobile" ? Infinity : W * 0.47;

  const meander = (g) => {
    const t = 0.5 + 0.4 * Math.sin(g * 0.83 + 0.5) + 0.1 * Math.sin(g * 2.17 + 1.3);
    return minX + (maxX - minX) * Math.min(1, Math.max(0, t));
  };

  let y0 = 0;
  const theoIndex = model.events.findIndex((item) => item.theoretical);
  model.eras.forEach((era) => {
    const section = era.section;
    section.dataset.mode = mode;
    const plaqueTop = era.eraIndex === 0 ? headerH + (mode === "mobile" ? 18 : 22) : Math.round(VH * (mode === "mobile" ? 0.06 : 0.1));
    era.plaque.style.top = `${plaqueTop}px`;
    let cursor = plaqueTop + era.plaque.offsetHeight;

    if (era.dyk) {
      if (mode === "wide") {
        era.dyk.style.top = `${plaqueTop + era.plaque.offsetHeight + 36}px`;
        era.dyk.style.left = "";
      } else {
        era.dyk.style.top = `${cursor + 30}px`;
        cursor += 30 + era.dyk.offsetHeight;
      }
    }
    cursor += mode === "mobile" ? 70 : 96;

    era.events.forEach((item, i) => {
      const y = cursor + i * step;
      let x = meander(item.order);
      const prev = model.events[item.order - 1];
      const next = model.events[item.order + 1];
      if (theoIndex >= 0 && (item.order === theoIndex - 1 || item.order === theoIndex + 1)) {
        x = minX + (maxX - minX) * (mode === "mobile" ? 0 : 0.12);
      }
      if (item.theoretical) {
        x = mode === "mobile" ? minX + 64 : Math.min(W * 0.54, minX + (maxX - minX) * 0.12 + W * 0.26);
      }
      item.x = Math.round(x);
      item.yLocal = Math.round(y);
      item.flip = !item.theoretical && x > flipAt;
      item.slot.style.setProperty("--x", `${item.x}px`);
      item.slot.style.setProperty("--y", `${item.yLocal}px`);
      item.slot.classList.toggle("is-flip", item.flip);
      void prev;
      void next;
    });

    const needed = cursor + era.events.length * step + (mode === "mobile" ? 120 : 170);
    const height = Math.max(VH, needed);
    section.style.height = `${height}px`;
    era.top = y0;
    era.height = height;
    y0 += height;
  });

  model.events.forEach((item) => {
    item.y = item.era.top + item.yLocal;
  });

  return { W, VH, total: y0, mode, gaugeW, step, medal, minX, maxX, headerH };
}

/* --------------------------------------------------------------- threads */

function curveThrough(points, wiggle) {
  // Smooth vertical S-curves through each point, with a sideways drift between points
  // so the thread meanders like a molten river instead of a straight polyline.
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dy = b.y - a.y;
    const drift = (b.drift ?? (i % 2 ? 1 : -1)) * wiggle;
    const mx = (a.x + b.x) / 2 + drift;
    const my = (a.y + b.y) / 2;
    d += ` C${a.x.toFixed(1)} ${(a.y + dy * 0.28).toFixed(1)} ${mx.toFixed(1)} ${(my - dy * 0.2).toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    d += ` S${b.x.toFixed(1)} ${(b.y - dy * 0.28).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

function buildThreads(model, layout, svg) {
  const { W, total } = layout;
  svg.setAttribute("width", W);
  svg.setAttribute("height", total);
  svg.setAttribute("viewBox", `0 0 ${W} ${total}`);
  svg.style.height = `${total}px`;

  const gold = model.events.filter((item) => !item.theoretical);
  const wiggle = layout.mode === "mobile" ? 10 : W * 0.035;
  const goldPoints = [
    { x: gold[0].x + (layout.mode === "mobile" ? 8 : 40), y: 0 },
    ...gold.map((item) => ({ x: item.x, y: item.y })),
    { x: gold[gold.length - 1].x - 30, y: total },
  ];
  const goldD = curveThrough(goldPoints, wiggle);

  const theo = model.events.find((item) => item.theoretical);
  let blueD = "";
  if (theo) {
    const above = model.events[theo.order - 1];
    const below = model.events[theo.order + 1];
    const pts = [];
    if (above) pts.push({ x: above.x, y: above.y });
    pts.push({ x: theo.x, y: theo.y, drift: 1 });
    if (below) pts.push({ x: below.x, y: below.y, drift: 1 });
    blueD = curveThrough(pts, wiggle * 0.6);
  }

  const threads = [];
  for (const [selector, d] of [
    [".thread--gold", goldD],
    [".thread--blue", blueD],
  ]) {
    const group = svg.querySelector(selector);
    const paths = [...group.querySelectorAll("path")];
    paths.forEach((p) => p.setAttribute("d", d));
    if (!d) continue;
    const ref = paths[0];
    const length = ref.getTotalLength();
    // Length lookup by depth: the thread is drawn down to the reading line.
    const lut = [];
    const stepLen = 10;
    for (let s = 0; s <= length; s += stepLen) {
      lut.push(ref.getPointAtLength(s).y);
    }
    paths.forEach((p) => {
      p.style.strokeDasharray = `${length} ${length}`;
      p.style.strokeDashoffset = `${length}`;
    });
    threads.push({ group, paths, length, lut, stepLen, ref, drawn: 0, blue: selector.includes("blue") });
  }
  return threads;
}

function lengthAtDepth(thread, depth) {
  const { lut, stepLen, length } = thread;
  if (depth <= lut[0]) return 0;
  let lo = 0;
  let hi = lut.length - 1;
  if (depth >= lut[hi]) return length;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lut[mid] < depth) lo = mid;
    else hi = mid;
  }
  const t = (depth - lut[lo]) / Math.max(1e-6, lut[hi] - lut[lo]);
  return Math.min(length, (lo + t) * stepLen);
}

/* ----------------------------------------------------------------- gauge */

function buildGauge(model, root) {
  const track = $(".depth-gauge__track", root);
  track.textContent = "";
  const nodes = [];
  const surface = el("li", "gauge-node is-surface");
  surface.append(el("span", "gauge-node__dot"));
  const surfaceText = el("span", "gauge-node__text");
  surfaceText.append(el("span", "gauge-node__value", "0"), el("span", "gauge-node__unit", "Years ago"), el("span", "gauge-node__name", "Today"));
  surface.append(surfaceText);
  track.append(surface);
  nodes.push({ node: surface, item: null });
  model.events.forEach((item) => {
    const li = el("li", "gauge-node");
    if (item.theoretical) li.classList.add("is-theoretical");
    li.append(el("span", "gauge-node__dot"));
    const text = el("span", "gauge-node__text");
    text.append(
      el("span", "gauge-node__value", `${item.approx ? "~" : ""}${fmt.format(item.yearsAgo)}`),
      el("span", "gauge-node__unit", item.yearsAgo === 1 ? "Year ago" : "Years ago"),
      el("span", "gauge-node__name", item.event.title),
    );
    li.append(text);
    li.addEventListener("click", () => item.button?.focus({ preventScroll: true }));
    track.append(li);
    nodes.push({ node: li, item });
  });
  return nodes;
}

/* ---------------------------------------------------------------- embers */

function startEmbers(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  const sctx = sprite.getContext("2d");
  const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,244,214,1)");
  grad.addColorStop(0.25, "rgba(255,196,110,0.85)");
  grad.addColorStop(1, "rgba(230,120,40,0)");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 32, 32);

  let w = 0;
  let h = 0;
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);
  const count = w < 700 ? 26 : 54;
  const spawn = (p, fresh) => {
    p.x = Math.random() * w;
    p.y = fresh ? Math.random() * h : h + 10;
    p.vy = 0.18 + Math.random() * 0.55;
    p.size = 3 + Math.random() * 7;
    p.phase = Math.random() * Math.PI * 2;
    p.life = 0.35 + Math.random() * 0.65;
    return p;
  };
  const embers = Array.from({ length: count }, () => spawn({}, true));
  let raf = 0;
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(3, (now - last) / 16.7);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of embers) {
      p.y -= p.vy * dt;
      p.phase += 0.02 * dt;
      p.x += Math.sin(p.phase) * 0.35 * dt;
      if (p.y < -20) spawn(p, false);
      const flicker = 0.55 + 0.45 * Math.sin(p.phase * 3.1);
      ctx.globalAlpha = p.life * flicker * Math.min(1, (h - p.y) / 160 + 0.2);
      ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/* ----------------------------------------------------------------- panel */

function createPanel(model, hooks) {
  const panel = $(".event-panel");
  const frame = $(".event-panel__frame", panel);
  const scroll = $(".event-panel__scroll", panel);
  const art = $(".event-panel__art", panel);
  const era = $(".event-panel__era", panel);
  const date = $(".event-panel__date", panel);
  const title = $(".event-panel__title", panel);
  const tag = $(".event-panel__tag", panel);
  const short = $(".event-panel__short", panel);
  const desc = $(".event-panel__desc", panel);
  const sections = $(".event-panel__sections", panel);
  const count = $(".event-panel__count", panel);
  const [prevBtn, nextBtn] = panel.querySelectorAll(".event-panel__step");
  const closeBtn = $(".event-panel__close", panel);
  let current = null;
  let returnFocus = null;

  const section = (label, body) => {
    const block = el("section", "event-panel__section");
    block.append(el("h3", "event-panel__heading", label));
    block.append(body);
    sections.append(block);
  };
  const paragraph = (text) => el("p", "event-panel__text", text);
  const chips = (list) => {
    const ul = el("ul", "event-panel__chips");
    list.forEach((entry) => ul.append(el("li", "event-panel__chip", entry)));
    return ul;
  };

  function fill(item) {
    current = item;
    const { event } = item;
    frame.classList.toggle("is-theoretical", item.theoretical);
    panel.classList.toggle("is-theoretical", item.theoretical);
    art.textContent = "";
    const a = artFor(item, "panel");
    art.append(a);
    a._attach();
    era.textContent = splitEraTitle(item.era.title).name;
    date.textContent = event.year;
    title.textContent = event.title;
    tag.textContent = item.theoretical ? "Theoretical event" : "Mainstream event";
    short.textContent = event.shortDesc;
    desc.textContent = event.description;
    sections.textContent = "";
    const d = event.details;
    if (d) {
      if (d.description && d.description !== event.description) section("Overview", paragraph(d.description));
      if (d.details) section("Details", paragraph(d.details));
      if (d.culturalContext) section("Cultural context", paragraph(d.culturalContext));
      if (Array.isArray(d.keyFigures) && d.keyFigures.length) section("Key figures", chips(d.keyFigures));
      if (Array.isArray(d.locations) && d.locations.length) section("Locations", chips(d.locations));
      if (Array.isArray(d.artifacts) && d.artifacts.length) section("Related artifacts", chips(d.artifacts));
    }
    count.textContent = `${item.order + 1} of ${model.events.length}`;
    prevBtn.disabled = item.order === 0;
    nextBtn.disabled = item.order === model.events.length - 1;
    scroll.scrollTop = 0;
    model.events.forEach((other) => other.button?.classList.toggle("is-open", other === item));
  }

  function open(item, opener) {
    const wasOpen = !panel.hidden;
    if (!wasOpen) returnFocus = opener ?? document.activeElement;
    fill(item);
    if (!wasOpen) {
      panel.hidden = false;
      document.body.classList.add("has-panel");
      requestAnimationFrame(() => panel.classList.add("is-open"));
    } else {
      frame.classList.remove("is-swapping");
      void frame.offsetWidth;
      frame.classList.add("is-swapping");
    }
    title.focus({ preventScroll: true });
    hooks.onOpen?.(item);
  }

  function close() {
    if (panel.hidden) return;
    panel.classList.remove("is-open");
    document.body.classList.remove("has-panel");
    model.events.forEach((other) => other.button?.classList.remove("is-open"));
    const done = () => {
      panel.hidden = true;
    };
    if (REDUCED.matches) done();
    else setTimeout(done, 260);
    const target = current?.button ?? returnFocus;
    current = null;
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
    hooks.onClose?.();
  }

  function step(delta) {
    if (!current) return;
    const next = model.events[current.order + delta];
    if (!next) return;
    open(next);
    hooks.onStep?.(next);
  }

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  closeBtn.addEventListener("click", close);

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusables = [...panel.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")].filter(
        (node) => node.offsetParent !== null,
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === title)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target.closest(".event-panel__nav")) {
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });

  return { open, close, get current() { return current; } };
}

/* ------------------------------------------------------------------ main */

async function main() {
  const root = $(".descent");
  const strataRoot = $(".descent__strata", root);
  const column = $(".descent__column", root);
  const svg = $(".descent__threads", root);
  const status = $(".descent__status", root);
  const data = await loadAncientsData();
  const model = buildModel(data.timeline);

  let lenis = null;
  const scrollToY = (y, immediate = false) => {
    const target = Math.max(0, y);
    if (lenis) lenis.scrollTo(target, { immediate: immediate || REDUCED.matches, duration: 1.4 });
    else window.scrollTo({ top: target, behavior: immediate || REDUCED.matches ? "auto" : "smooth" });
  };
  const columnTop = () => column.getBoundingClientRect().top + window.scrollY;
  const centerOn = (item, immediate) => scrollToY(columnTop() + item.y - window.innerHeight * 0.45, immediate);

  const state = {
    openPanel: (item, opener) => panel.open(item, opener),
  };
  const panel = createPanel(model, {
    onOpen: (item) => {
      status.textContent = "";
      if (history.replaceState) history.replaceState(null, "", `#${item.key}`);
    },
    onStep: (item) => centerOn(item),
    onClose: () => {
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    },
  });

  const fragment = document.createDocumentFragment();
  model.eras.forEach((era) => fragment.append(renderEra(era, data.didYouKnow, state)));
  strataRoot.append(fragment);
  const gaugeNodes = buildGauge(model, root);

  if (document.fonts?.ready) {
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    } catch {
      /* fonts are a nicety */
    }
  }

  let layout = computeLayout(model, strataRoot);
  let threads = buildThreads(model, layout, svg);

  // Lazy art: probe an event image only when its marker nears the viewport.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = entry.target.dataset.key;
        const item = model.events.find((it) => it.key === key);
        item?.medalArt?._attach?.();
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "1200px 0px" },
  );
  model.events.forEach((item) => io.observe(item.button));

  /* ---- motion libraries (optional: the page works without them) ---- */
  const { gsap, ScrollTrigger, Lenis } = window;
  const motionOK = () => !REDUCED.matches;
  let parallax = [];
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (Lenis && motionOK()) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      document.documentElement.classList.add("lenis-on");
    }
  }
  const buildParallax = () => {
    parallax.forEach((tween) => tween.scrollTrigger?.kill() ?? tween.kill());
    parallax = [];
    if (!gsap || !ScrollTrigger || !motionOK()) return;
    model.eras.forEach((era) => {
      const common = { trigger: era.section, start: "top bottom", end: "bottom top", scrub: true };
      parallax.push(
        gsap.fromTo(era.far, { yPercent: 3.5, scale: 1.06 }, { yPercent: -3.5, scale: 1.13, ease: "none", scrollTrigger: common }),
        gsap.fromTo(era.near, { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { ...common } }),
      );
    });
  };
  buildParallax();

  /* ---- scroll-linked drawing, gauge and lit markers ---- */
  let intro = REDUCED.matches ? 1 : 0;
  const drops = [];
  const dropLayer = svg.querySelector(".thread__drops");
  const makeDrops = () => {
    dropLayer.textContent = "";
    drops.length = 0;
    if (REDUCED.matches) return;
    threads.forEach((thread) => {
      const n = thread.blue ? 3 : 9;
      for (let i = 0; i < n; i += 1) {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", thread.blue ? "5" : "6");
        c.setAttribute("fill", `url(#thread-drop-${thread.blue ? "blue" : "gold"})`);
        dropLayer.append(c);
        drops.push({ c, thread, offset: i / n, speed: 0.9 + Math.random() * 0.5 });
      }
    });
  };
  makeDrops();

  let lastLit = -2;
  const nodeSpacing = () => (layout.mode === "mobile" ? 108 : 122);
  const gaugeTrack = $(".depth-gauge__track", root);
  const gaugeWindow = $(".depth-gauge__window", root);

  function frame(now) {
    const scrollY = window.scrollY;
    const top = columnTop();
    const vh = window.innerHeight;
    const reading = scrollY - top + vh * 0.5;
    const drawDepth = REDUCED.matches ? Infinity : (scrollY - top + vh * 0.64) * intro;

    threads.forEach((thread) => {
      const len = drawDepth === Infinity ? thread.length : lengthAtDepth(thread, drawDepth);
      if (Math.abs(len - thread.drawn) > 0.5) {
        thread.drawn = len;
        const off = `${thread.length - len}`;
        thread.paths.forEach((p) => {
          p.style.strokeDashoffset = off;
        });
      }
    });

    // Markers ignite when the molten thread reaches them.
    const litDepth = drawDepth === Infinity ? Infinity : drawDepth + 8;
    model.events.forEach((item) => {
      const lit = item.y <= litDepth;
      if (lit !== item.lit) {
        item.lit = lit;
        item.button.classList.toggle("is-lit", lit);
        // Bug fix (Sonnet, fix pass 2): a lit marker is, by definition, one the thread has
        // already reached, which in practice means it is on screen or just behind it. The
        // IntersectionObserver in init() (rootMargin 1200px) is the normal trigger for its
        // art probe, but a reported case had existing event images rendering dark/unloaded
        // even once clearly in view — most likely an IO miss on a fast programmatic jump
        // (a hash deep link or a quick scroll past the 1200px margin before the observer's
        // first callback lands). Re-asserting the attach here, gated by the already-lit
        // state so it costs nothing once an image has loaded, guarantees every lit marker's
        // real art (if it exists) gets requested, independent of whether IO caught it.
        if (lit) item.medalArt?._attach?.();
      }
    });

    // Depth gauge: fractional position between the markers nearest the reading line.
    const ys = [0, ...model.events.map((item) => item.y)];
    let f = 0;
    if (reading >= ys[ys.length - 1]) f = ys.length - 1;
    else {
      for (let i = 1; i < ys.length; i += 1) {
        if (reading < ys[i]) {
          f = i - 1 + Math.max(0, (reading - ys[i - 1]) / Math.max(1, ys[i] - ys[i - 1]));
          break;
        }
      }
    }
    const spacing = nodeSpacing();
    const windowH = gaugeWindow.clientHeight;
    gaugeTrack.style.transform = `translate3d(0, ${(windowH * 0.42 - f * spacing).toFixed(1)}px, 0)`;
    const lit = Math.round(f);
    gaugeNodes.forEach((entry, i) => {
      const dist = Math.abs(i - f);
      entry.node.style.setProperty("--fade", Math.max(0.16, 1 - dist * 0.24).toFixed(3));
    });
    if (lit !== lastLit) {
      gaugeNodes[lastLit]?.node.classList.remove("is-current");
      gaugeNodes[lit]?.node.classList.add("is-current");
      model.events.forEach((item) => item.button.classList.remove("is-current"));
      gaugeNodes[lit]?.item?.button.classList.add("is-current");
      lastLit = lit;
    }

    // Molten droplets drifting down the drawn part of the thread, near the viewport only.
    if (drops.length) {
      const t = now / 1000;
      const viewTop = scrollY - top - 100;
      const viewBottom = scrollY - top + vh + 100;
      drops.forEach((drop) => {
        const { thread } = drop;
        const from = lengthAtDepth(thread, viewTop);
        const to = Math.min(thread.drawn, lengthAtDepth(thread, viewBottom));
        if (to - from < 40) {
          drop.c.style.opacity = "0";
          return;
        }
        const span = to - from;
        const phase = (drop.offset + (t * 60 * drop.speed) / span) % 1;
        const p = thread.ref.getPointAtLength(from + phase * span);
        drop.c.setAttribute("cx", p.x.toFixed(1));
        drop.c.setAttribute("cy", p.y.toFixed(1));
        drop.c.style.opacity = String(Math.min(1, Math.sin(phase * Math.PI) * 1.6));
      });
    }
  }

  let rafId = 0;
  const loop = (now) => {
    frame(now);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  let stopEmbers = () => {};
  const embersCanvas = $(".descent__embers", root);
  if (!REDUCED.matches) stopEmbers = startEmbers(embersCanvas);

  REDUCED.addEventListener?.("change", () => location.reload());

  /* ---- resize ---- */
  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Mobile browsers fire resize when the URL bar moves; only relayout on real changes.
      if (window.innerWidth === lastWidth && layoutMode() === "mobile") return;
      lastWidth = window.innerWidth;
      layout = computeLayout(model, strataRoot);
      threads = buildThreads(model, layout, svg);
      makeDrops();
      buildParallax();
      ScrollTrigger?.refresh();
      model.events.forEach((item) => {
        item.lit = undefined;
      });
    }, 180);
  });

  /* ---- deep links: #<eraId> scrolls to the era, #<eraId>-NN opens that event ---- */
  const goToHash = (immediate) => {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hash) return false;
    const era = model.eras.find((e) => e.id === hash);
    if (era) {
      scrollToY(columnTop() + era.top, immediate);
      return true;
    }
    const item = model.events.find((it) => it.key === hash);
    if (item) {
      centerOn(item, immediate);
      item.medalArt?._attach?.();
      panel.open(item, item.button);
      return true;
    }
    return false;
  };
  const deepLinked = goToHash(true);
  window.addEventListener("hashchange", () => goToHash(false));
  // Same-page links to eras (e.g. search results) go through the smooth scroller too.
  document.addEventListener("click", (e) => {
    const link = e.target.closest?.('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href").slice(1);
    if (model.eras.some((era) => era.id === id) || model.events.some((it) => it.key === id)) {
      e.preventDefault();
      history.pushState(null, "", `#${id}`);
      goToHash(false);
    }
  });

  /* ---- the one orchestrated entrance: the molten thread pours down from the surface ---- */
  document.documentElement.classList.add("descent-ready");
  if (!REDUCED.matches) {
    if (deepLinked) intro = 1;
    else if (gsap) {
      const proxy = { v: 0 };
      gsap.to(proxy, { v: 1, duration: 2.4, ease: "power2.inOut", delay: 0.35, onUpdate: () => (intro = proxy.v) });
    } else intro = 1;
  }

  ScrollTrigger?.refresh();
  window.__descent = { model, layout: () => layout, panel, stop: () => { cancelAnimationFrame(rafId); stopEmbers(); } };
  console.info(`[Descent] ${model.eras.length} eras, ${model.events.length} events rendered.`);
}

main().catch((error) => {
  console.error("[Descent] failed to render.", error);
  const status = document.querySelector(".descent__status");
  if (status) status.textContent = "The timeline could not load. Serve the site over http (python -m http.server) and reload.";
  document.documentElement.classList.add("descent-error");
});
