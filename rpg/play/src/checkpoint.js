// The web concept's end card: "More to come". Shown once the last built boss falls and the player is back on the road.
// The card is gated by src/build-config.js; local dev and TV play never see it.
export const CHECKPOINTS = {
  current: {
    title: 'MORE TO COME',
    line: 'Beyond the Nexus is still in development. This is as far as the road goes for now.',
    studioLabel: 'BACK TO THE STUDIO',
    studioUrl: '/rpg/',
    stayLabel: 'KEEP EXPLORING',
  },
};

export function isWebConcept(config, search = (globalThis.location?.search || '')) {
  return !!config.webConcept || new URLSearchParams(search).get('concept') === '1';
}

/** True when a finished fight is the build's checkpoint boss and was won. */
export function shouldShowCheckpoint(config, bossId, result, search) {
  return isWebConcept(config, search) && !!CHECKPOINTS[config.checkpoint] && bossId === config.checkpoint && result?.won === true;
}

const CSS = `
#concept-card { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 1.4s ease;
  background: radial-gradient(ellipse at 50% 50%, rgba(8,10,22,.7), rgba(3,4,10,.9)); font-family: 'Cinzel', 'Times New Roman', serif; color: #f1dcaa; }
#concept-card.on { opacity: 1; }
#concept-card .box { width: min(640px, 86vw); box-sizing: border-box; padding: 44px 48px 48px; text-align: center; border: 2px solid rgba(212,176,106,.6);
  background: linear-gradient(180deg, rgba(16,18,38,.92), rgba(8,9,20,.92)); box-shadow: 0 0 80px rgba(212,176,106,.18); }
#concept-card h1 { margin: 0 0 8px; font: 600 clamp(26px, 5vw, 38px)/1 'Cinzel', 'Times New Roman', serif; letter-spacing: .3em; padding-left: .3em; text-shadow: 0 0 18px rgba(212,176,106,.5); }
#concept-card .rule { width: 200px; height: 1px; margin: 16px auto 22px; background: linear-gradient(90deg, transparent, #d4b06a 40%, #d4b06a 60%, transparent); }
#concept-card p { margin: 0 0 28px; font: 500 clamp(17px, 2.6vw, 22px)/1.45 Georgia, 'Iowan Old Style', 'Times New Roman', serif; color: #e8dcc0; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
#concept-card button { display: block; width: 100%; margin: 12px 0 0; padding: 16px 20px; font: 600 clamp(16px, 2.4vw, 22px)/1 'Cinzel', 'Times New Roman', serif; letter-spacing: .2em;
  color: #f1dcaa; background: rgba(212,176,106,.08); border: 1px solid rgba(212,176,106,.45); cursor: pointer; }
#concept-card button:hover, #concept-card button:focus-visible { background: rgba(212,176,106,.2); outline: none; }
@media (prefers-reduced-motion: reduce) { #concept-card { transition: none; } }
`;

/** Show the card. Pauses the engine, never starts audio. Returns {close, el}. */
export function showCheckpointCard({engine, input, id, navigate = (url) => { location.href = url; }}) {
  const cp = CHECKPOINTS[id];
  if (!cp || document.getElementById('concept-card')) return null;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'concept-card'; el.setAttribute('data-pad-menu', ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', cp.title);
  el.innerHTML = `<div class="box"><h1></h1><div class="rule"></div><p></p>
    <button data-act="studio" class="first"></button><button data-act="stay"></button></div>`;
  el.querySelector('h1').textContent = cp.title;
  el.querySelector('p').textContent = cp.line;
  el.querySelector('[data-act=studio]').textContent = cp.studioLabel;
  el.querySelector('[data-act=stay]').textContent = cp.stayLabel;
  const wasPaused = engine.paused;
  engine.paused = true;
  input?.down.clear(); input?.pressed.clear();
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  const buttons = [...el.querySelectorAll('button')];
  buttons[0].focus();
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    el.remove(); style.remove();
    engine.paused = wasPaused;
    input?.down.clear(); input?.pressed.clear();
    document.getElementById('view')?.focus();
  };
  const onKey = (e) => {
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault(); e.stopImmediatePropagation();
      const i = buttons.indexOf(document.activeElement);
      buttons[(i + (e.code === 'ArrowUp' || e.code === 'ArrowLeft' ? buttons.length - 1 : 1)) % buttons.length].focus();
    } else if (['Space', 'Enter', 'KeyF'].includes(e.code)) {
      e.preventDefault(); e.stopImmediatePropagation(); (document.activeElement?.closest?.('button') || buttons[0]).click();
    }
  };
  window.addEventListener('keydown', onKey, true);
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'stay') close();
    else if (act === 'studio') navigate(cp.studioUrl);
  });
  return {close, el};
}
