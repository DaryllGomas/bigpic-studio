// THE JUNCTION band: the cabinet wall from the approved studio home mock-up v5 (2026-10-11).
// One component, owned by the arcade session; the studio home and the arcade's Grid view both mount it.
//
//   import { mountJunctionBand } from './band/junction-band.js';
//   mountJunctionBand(el, { arcadeUrl: '/arcade/', games: 'mock' | 'all', engine, art, brick });
//   engine / art / brick: URLs relative to the page (or absolute). Defaults: the copies next to this module's test home.
//
// Every screen runs its game's own demo live (THE PATH's cabinet engine, unchanged). Click a cabinet to play it
// full screen. The DAILY CHALLENGE uses the game's own built-in high-score table; its button plays today's round.
// The arcade is free: no coin prompts anywhere (Daryll, 2026-10-11).
const HERE = new URL('.', import.meta.url);
const DEFAULTS = {
  engine: new URL('../../thepath-site/play/js/cabinet/', HERE).href,
  art: new URL('../../thepath-site/play/assets/cab/', HERE).href,
  brick: new URL('../assets/red_brick_03_diff_1k.jpg', HERE).href,
  arcadeUrl: '../',
  games: 'mock',
};
// the mock-up's two rows, in its order
const MOCK = [['gridcycles', 'starvector', 'relicquest', 'castlecrush', 'lancerider', 'lasthuman', 'hyperdrift'],
  ['nebularun', 'tunnelrat', 'lastlight', 'swarmpatrol', 'afterglow', 'route9', 'sunsetdrive', 'warlordsroad', 'deepkeep']];
const HAS_ART = new Set('afterglow castlecrush deepkeep hyperdrift irondojo ironworks lancerider lanejumper lasthuman lastlight lunarduty mudmetal nebularun route9 shortorder sporefield spritepop stackattack sunsetdrive swarmpatrol tunnelrat vaultdigger warlordsroad'.split(' '));
const NEON = ['#ff7a2a', '#33e6ff', '#ff3fa4', '#ffcf5a', '#8a5cff', '#46f0a0'];
const BTN = ['#ff3a2a', '#ff3a2a', '#ffc21a', '#ff3a2a', '#ffc21a', '#ff3a2a'];
const ICON = {
  arcade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l16 16M20 4L4 20"/><circle cx="12" cy="12" r="3"/><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/></svg>',
  cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 14v4M8 20h8"/></svg>',
};

function signSVG() {
  // THE JUNCTION · VIDEO ARCADE, in red neon tube with the path-and-star emblem (the mock-up's sign)
  return `<svg class="jb-sign" viewBox="0 0 860 400" aria-label="The Junction video arcade">
  <defs>
    <filter id="jbg" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="jbg2" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <rect x="30" y="150" width="800" height="150" rx="34" fill="rgba(40,4,4,.55)" stroke="#ff3b1c" stroke-width="9" filter="url(#jbg)"/>
    <rect x="30" y="150" width="800" height="150" rx="34" stroke="#ffd2c4" stroke-width="2.5"/>
    <path d="M300 150 A130 130 0 0 1 560 150" stroke="#ff3b1c" stroke-width="9" filter="url(#jbg)"/><path d="M300 150 A130 130 0 0 1 560 150" stroke="#ffd2c4" stroke-width="2.5"/>
    <path d="M416 34 l12 26 M402 28 l38 6" stroke="#ff3b1c" stroke-width="6" filter="url(#jbg)"/>
    <path d="M470 60 L400 140 M470 60 l-6 18 M470 60 l-18 4" stroke="#ffcf8a" stroke-width="7" filter="url(#jbg)"/>
    <path d="M470 60 L400 140" stroke="#fff3e0" stroke-width="2.5"/>
    <path d="M480 52 l10-10 M482 66 l14-2 M466 46 l2-14" stroke="#ffcf8a" stroke-width="4" filter="url(#jbg2)"/>
    <path d="M150 336 H710 M220 362 H640" stroke="#ff3b1c" stroke-width="7" filter="url(#jbg)"/>
  </g>
  <text x="430" y="252" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="118" letter-spacing="3" fill="#6a0904" stroke="#ff3b1c" stroke-width="7" filter="url(#jbg)" paint-order="stroke">THE JUNCTION</text>
  <text x="430" y="252" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="118" letter-spacing="3" fill="none" stroke="#ffe0d6" stroke-width="2.2">THE JUNCTION</text>
  <rect x="270" y="318" width="320" height="58" rx="10" fill="rgba(40,4,4,.85)" stroke="#ff3b1c" stroke-width="5" filter="url(#jbg2)"/>
  <text x="430" y="358" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="36" letter-spacing="4" fill="#ffd9cf" filter="url(#jbg2)">VIDEO ARCADE</text>
</svg>`;
}

function wallDressing(art) {
  const P = (id, l, t, w, h, c, r) => `<div class="jb-box" style="left:${l}cqw;top:${t}cqw;width:${w}cqw;height:${h}cqw;transform:rotate(${r}deg);background:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url('${art}${id}_side.jpg') center/cover;box-shadow:0 0 1.8cqw ${c},inset 0 0 0 .14cqw ${c}"></div>`;
  return `<div class="jb-wall" aria-hidden="true">
    ${P('lasthuman', 0.3, 6, 3, 6.4, 'rgba(255,60,140,.75)', -3)}${P('spritepop', 0.5, 17, 2.4, 5, 'rgba(255,60,90,.6)', 2)}${P('nebularun', 39.6, 3.6, 2.6, 5.2, 'rgba(120,140,255,.75)', 0)}
    ${P('irondojo', 43, 6.4, 2.8, 4.2, 'rgba(255,60,160,.7)', 0)}${P('sunsetdrive', 47.4, 5.2, 2.2, 4.4, 'rgba(255,110,60,.7)', 0)}${P('mudmetal', 78.6, 1.2, 3.6, 7.6, 'rgba(255,70,70,.65)', -2)}
    <div class="jb-ws" style="left:83.6cqw;top:4.2cqw;transform:rotate(-9deg);font-size:1.25cqw">PLAY<br>MORE<br>WORLDS</div>
    <div class="jb-ws" style="left:91.2cqw;top:3cqw;transform:rotate(-5deg);font-size:1.25cqw">GOOD<br>GAMES<br>BRIGHTER<br>PEOPLE</div>
  </div>`;
}

let cssLoaded = false;
function loadStyle() {
  if (cssLoaded) return; cssLoaded = true;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('junction-band.css', HERE).href; document.head.appendChild(l);
  if (!document.querySelector('link[href*="Newsreader"],link[href*="Bungee"]')) {
    const f = document.createElement('link'); f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bungee&family=Newsreader:ital,opsz,wght@0,6..72,500;1,6..72,500&family=Space+Grotesk:wght@400;500;700&display=swap';
    document.head.appendChild(f);
  }
}

export async function mountJunctionBand(el, options = {}) {
  const o = { ...DEFAULTS, ...options };
  // paths passed in are relative to the PAGE (like any URL in its HTML); make them absolute before the module uses them
  for (const k of ['engine', 'art', 'brick']) o[k] = new URL(o[k], document.baseURI).href;
  loadStyle();
  const [{ CabinetRunner, KeyboardPanel }, { Cartridges }, { RoundResult }] = await Promise.all([
    import(o.engine + 'host.js'), import(o.engine + 'cartridges.js'), import(o.engine + 'sdk/index.js')]);
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse) document.documentElement.classList.add('jb-coarse');
  const all = Cartridges.all.map((c) => c.id);
  let rows = MOCK;
  if (o.games === 'all') { const rest = all.filter((id) => !MOCK.flat().includes(id)); rows = [MOCK[0], MOCK[1], rest]; }

  el.classList.add('jb'); el.style.setProperty('--jb-brick', `url("${o.brick}")`);
  const total = rows.flat().filter((id) => Cartridges.get(id)).length;
  el.innerHTML = `<div class="jb-room"></div><div class="jb-haze"></div>${wallDressing(o.art)}
    <header class="jb-head">
      <div class="jb-eye">${ICON.arcade}<span>Arcade</span><i></i></div>
      <h2 class="jb-title">The <em>Junction</em></h2>
      <div class="jb-sub">${ICON.play}<a href="${o.arcadeUrl}">${all.length} games · free · one click</a></div>
    </header>
    ${signSVG()}
    <div class="jb-floor">${rows.map((r, i) => `<div class="jb-row r${i + 1}"></div>`).join('')}</div>
    <aside class="jb-dc" aria-label="Daily challenge"></aside>`;
  if (rows.length > 2) { el.style.aspectRatio = '1024/520'; el.querySelector('.r3').style.top = '27.4cqw'; el.querySelector('.r3').style.zIndex = 3; }

  // ---- the cabinets ----
  const cabs = []; let n = 0;
  rows.forEach((ids, ri) => {
    const row = el.querySelector('.r' + (ri + 1));
    for (const id of ids) {
      const cart = Cartridges.get(id); if (!cart) continue;
      const spec = cart.spec, c = NEON[n++ % NEON.length];
      const side = HAS_ART.has(id) ? `${o.art}${id}_side.jpg` : '';
      const d = document.createElement('div');
      d.className = 'jb-cab'; d.tabIndex = 0; d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Play ' + spec.name); d.style.setProperty('--c', c);
      if (side) d.style.setProperty('--side', `url("${side}")`);
      d.innerHTML = `<div class="jb-shell">
          ${side ? `<span class="jb-side l" style="background-image:url('${side}')"></span><span class="jb-side r" style="background-image:url('${side}')"></span>` : ''}
          <div class="jb-mq">${HAS_ART.has(id) ? `<img src="${o.art}${id}_marquee.jpg" alt="" loading="lazy" decoding="async">` : `<div class="nm">${spec.name}</div>`}</div>
          <div class="jb-hood"></div>
          <div class="jb-bezel"><div class="jb-tube"><canvas width="320" height="240"></canvas></div></div>
          <div class="jb-panel"><div class="jb-deck" ${HAS_ART.has(id) ? `style="background-image:url('${o.art}${id}_panel.jpg')"` : ''}></div>
            <div class="jb-ctl"><span class="stk"></span>${BTN.slice(0, 3).map((b) => `<span class="bt" style="background:${b}"></span>`).join('')}</div></div>
          <div class="jb-lip"></div><div class="jb-body"><i></i></div></div>`;
      row.appendChild(d);
      const runner = new CabinetRunner(cart, { cabinetId: 'junction_' + id, freePlay: true, attractFps: 20 });
      // the band shows the games being played: a short title card, then the demo
      runner.attract.coinText = 'PRESS START';   // the arcade is free: nothing on screen asks for a coin
      runner.attract.titleSeconds = 0.8; runner.attract.demoSeconds = 60; runner.attract.scoresSeconds = 3;
      const cv = d.querySelector('canvas'), g = cv.getContext('2d');
      const cab = { id, cart, spec, c, el: d, g, runner, img: new ImageData(runner.surface.data, 320, 240) };
      runner.step(0.9 + (n % 7) * 0.45, { x: 0, y: 0, a: false, b: false, start: false });   // stagger the demos
      g.putImageData(cab.img, 0, 0);
      d.addEventListener('click', () => play(cab)); d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(cab); } });
      cabs.push(cab);
    }
  });

  // ---- the daily challenge: one game a day, its own built-in high-score table ----
  const day = (() => { const t = new Date(); return t.getUTCFullYear() * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate(); })();
  const pick = cabs[Math.floor(day / 1) % cabs.length];
  const dc = el.querySelector('.jb-dc');
  const drawDC = () => {
    const rowsH = pick.runner.table.entries.slice(0, 5).map((e, i) => `<tr class="${e.player ? 'you' : ''}"><td>${i + 1}</td><td>${e.blank ? '---' : e.initials}</td><td>${e.blank ? '' : String(e.score).padStart(6, '0')}</td></tr>`).join('');
    dc.innerHTML = `<h4>${ICON.cup}DAILY CHALLENGE</h4>
      <div class="gm">${ICON.cup}<div><b>${pick.spec.name}</b><small>TODAY'S ROUND · HIGH SCORE</small></div></div>
      <table><thead><tr><th>#</th><th>INIT</th><th>SCORE</th></tr></thead><tbody>${rowsH}</tbody></table>
      <button class="jb-coin" type="button">PLAY TODAY'S ROUND</button>`;
    dc.querySelector('.gm').style.cursor = 'pointer';
    dc.querySelector('.gm').onclick = () => play(pick, day);
    dc.querySelector('.jb-coin').addEventListener('click', () => play(pick, day));
  };
  drawDC();

  // ---- playing, full screen ----
  const ov = document.createElement('div'); ov.className = 'jb-play'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = `<button class="x" aria-label="Back to the arcade">×</button><div class="pm"></div>
    <div class="big"><canvas width="320" height="240"></canvas><div class="ov"><div class="s"></div><div class="c">PRESS START TO PLAY AGAIN</div></div></div>
    <div class="jb-pad"><div class="jb-joy"><div class="jb-knob"></div></div><div class="jb-keys"><button class="jb-key b" data-k="b">B</button><button class="jb-key a" data-k="a">A</button></div></div>`;
  document.body.appendChild(ov);
  const bg = ov.querySelector('canvas').getContext('2d'), over = ov.querySelector('.ov');
  const keys = new KeyboardPanel(window); keys.enabled = false;
  let active = null, run = null, runImg = null, wantCoin = false;
  function play(cab, seed = 0) {
    active = cab; ov.style.setProperty('--c', cab.c);
    ov.querySelector('.pm').innerHTML = HAS_ART.has(cab.id) ? `<img src="${o.art}${cab.id}_marquee.jpg" alt="">` : `<div class="nm">${cab.spec.name}</div>`;
    let ini = 'YOU'; try { ini = (localStorage.getItem('junction.initials') || 'YOU').slice(0, 3); } catch {}
    run = seed ? new CabinetRunner(cab.cart, { cabinetId: 'junction_' + cab.id, freePlay: true, seed, playerInitials: ini.padEnd(3, ' ') }) : cab.runner;
    run.playerInitials = ini.padEnd(3, ' ');
    runImg = new ImageData(run.surface.data, 320, 240);
    run.onRoundOver = (result, summary, info) => {
      if (info && info.aborted) return;
      over.querySelector('.s').textContent = (result === RoundResult.Won ? 'CLEARED · ' : 'GAME OVER · ') + String(info && info.score != null ? info.score : 0).padStart(6, '0');
      setTimeout(() => { if (run && run.phase !== 'playing') over.classList.add('show'); }, 800);
      if (cab === pick) drawDC();
    };
    over.classList.remove('show'); ov.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    keys.enabled = true; wantCoin = true;
  }
  function close() {
    if (run && run.phase === 'playing') run.abort();
    if (run) run.onRoundOver = null;
    run = null; active = null; keys.enabled = false; ov.classList.remove('open'); over.classList.remove('show'); document.documentElement.style.overflow = '';
  }
  ov.querySelector('.x').addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (!run) return;
    if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); close(); }
    else if (run.phase !== 'playing' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ')) wantCoin = true;
  });
  over.addEventListener('pointerdown', () => { wantCoin = true; });
  const touch = { x: 0, y: 0, a: false, b: false, start: false };
  {
    const joy = ov.querySelector('.jb-joy'), knob = ov.querySelector('.jb-knob'); let id = null;
    const mv = (e) => { const r = joy.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const R = r.width * 0.36, m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; const dz = R * 0.35; touch.x = dx > dz ? 1 : dx < -dz ? -1 : 0; touch.y = dy < -dz ? 1 : dy > dz ? -1 : 0; };
    joy.addEventListener('pointerdown', (e) => { id = e.pointerId; joy.setPointerCapture(id); mv(e); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === id) mv(e); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; touch.x = touch.y = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    for (const k of ov.querySelectorAll('.jb-key')) { const nm = k.dataset.k;
      k.addEventListener('pointerdown', (e) => { e.preventDefault(); touch[nm] = true; k.classList.add('down'); if (run && run.phase !== 'playing') wantCoin = true; });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) k.addEventListener(ev, () => { touch[nm] = false; k.classList.remove('down'); }); }
  }

  // ---- one loop; the wall only runs while it's on screen ----
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(el);
  const IDLE = { x: 0, y: 0, a: false, b: false, start: false };
  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (run) {
      if (wantCoin && run.phase !== 'playing') { run.insertCoin(); over.classList.remove('show'); }
      wantCoin = false;
      const k = keys.frame();
      run.step(dt, { x: k.x || touch.x, y: k.y || touch.y, a: k.a || touch.a, b: k.b || touch.b, start: k.start || touch.start });
      if (run.dirty) { bg.putImageData(runImg, 0, 0); run.dirty = false; }
    } else if (visible && !document.hidden) {
      for (const cab of cabs) { cab.runner.step(dt, IDLE); if (cab.runner.dirty) { cab.g.putImageData(cab.img, 0, 0); cab.runner.dirty = false; } }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { cabs, play, close };
}
