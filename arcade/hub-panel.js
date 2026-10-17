/*!
 * THE JUNCTION · LOG: the studio game hub (What's new, Now building, Help us test, feedback) in a slide-over panel.
 * Self-contained: it needs only the LOG button (#jxLog) in the top bar, ../assets/hub/hub.css + hub.js, hub-panel.css
 * and devlog.json. It builds the panel before hub.js runs (load this script first, both with defer).
 * While the panel is closed it listens to nothing on the keyboard, so the arcade's keys are untouched. While it is open
 * it keeps keys inside the panel (the aisle doesn't move while you type), Tab stays in the panel, and Escape closes it.
 */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('embed')) return;   // the home page's embedded aisle has no chrome
  const btn = document.getElementById('jxLog');
  if (!btn) return;
  const SEEN = 'junction.logSeen';
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // ---------- the panel ----------
  const root = el('div', 'jx-hub');
  root.id = 'jxPanel';
  root.inert = true;
  const scrim = el('div', 'jx-scrim');
  const sheet = el('aside', 'jx-sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'jxTitle');
  sheet.tabIndex = -1;
  const bar = el('header', 'jx-bar');
  const title = el('p', 'jx-title');
  title.id = 'jxTitle';
  title.appendChild(el('span', 'jx-name', 'THE JUNCTION'));
  title.appendChild(el('span', 'jx-dot', '·')).setAttribute('aria-hidden', 'true');
  title.appendChild(el('span', 'jx-log', 'LOG'));
  const x = el('button', 'jx-x');
  x.type = 'button';
  x.setAttribute('aria-label', 'Close the log');
  x.appendChild(el('span', 'jx-esc', 'ESC')).setAttribute('aria-hidden', 'true');
  x.appendChild(el('span', null, '✕')).setAttribute('aria-hidden', 'true');
  bar.appendChild(title); bar.appendChild(x);
  const body = el('div', 'jx-body');
  const hub = el('section', 'game-hub');
  hub.id = 'jxhub';
  hub.dataset.game = 'the-junction';
  hub.dataset.src = 'devlog.json';
  hub.dataset.version = btn.dataset.version || '';
  hub.dataset.title = 'News & feedback';
  body.appendChild(hub);
  sheet.appendChild(bar); sheet.appendChild(body);
  root.appendChild(scrim); root.appendChild(sheet);
  document.body.appendChild(root);

  // a small light on the button until this version's log has been opened once
  const ver = hub.dataset.version;
  if (ver && store.get(SEEN) !== ver) btn.classList.add('is-new');

  // ---------- open / close ----------
  let isOpen = false;
  const focusables = () => [...sheet.querySelectorAll('button, [href], input, textarea, select, summary, [tabindex]:not([tabindex="-1"])')]
    .filter((n) => !n.disabled && n.offsetParent !== null && !n.closest('[hidden]') && !n.closest('.hub-hp'));
  const onKey = (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (f.length) {
        const first = f[0], last = f[f.length - 1], a = document.activeElement;
        if (e.shiftKey && (a === first || !sheet.contains(a))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (a === last || !sheet.contains(a))) { e.preventDefault(); first.focus(); }
      }
    }
    // the arcade listens on window; stop here so typing a message never slides the aisle or starts a game
    e.stopPropagation();
  };
  function open() {
    if (isOpen) return;
    isOpen = true;
    root.inert = false;
    root.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.remove('is-new');
    if (ver) store.set(SEEN, ver);
    addEventListener('keydown', onKey, true);
    setTimeout(() => (isOpen ? x.focus({ preventScroll: true }) : 0), 60);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('is-open');
    root.inert = true;
    btn.setAttribute('aria-expanded', 'false');
    removeEventListener('keydown', onKey, true);
    // hand the keys back to the arcade: nothing keeps focus, so Enter or Space can't press a button by accident
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-controls', root.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => { if (isOpen) close(); else open(); btn.blur(); });
  // a keyboard press on the button itself must not also reach the arcade (Enter would start a game behind the panel)
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); });
  x.addEventListener('click', close);
  scrim.addEventListener('click', close);
  // pointer and wheel inside the panel stay in the panel
  for (const ev of ['wheel', 'pointerdown']) sheet.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  if (location.hash === '#log') open();
  window.__junctionLog = { open, close, get isOpen() { return isOpen; } };
})();
