// THE JUNCTION aisle, embedded in the studio home's band (2026-10-11). Owned by the arcade session.
//
//   import { mountJunctionAisle } from '/arcade/band/junction-aisle-embed.js';
//   mountJunctionAisle(el, { arcade: '/arcade/', poster: '/arcade/band/aisle-poster.jpg' });
//
// Shows a still of the aisle first (a link into the arcade). When the band comes near the screen, and the device can
// take it, the live 3D aisle loads in place (an iframe of /arcade/?embed=1): left/right or a drag spins it, a click on the
// centre cabinet opens /arcade/ on that game. Weak devices, reduced motion and no WebGL keep the still.
export function mountJunctionAisle(el, options = {}) {
  const o = { arcade: '/arcade/', poster: new URL('aisle-poster.jpg', import.meta.url).href, ...options };
  el.style.position = el.style.position || 'relative';
  el.style.overflow = 'hidden';
  if (!el.style.aspectRatio && !el.style.height) el.style.aspectRatio = '1024 / 392';
  el.style.background = '#07040a';
  const still = document.createElement('a');
  still.href = o.arcade; still.setAttribute('aria-label', 'THE JUNCTION arcade: 26 games, free, one click');
  still.style.cssText = 'position:absolute;inset:0;display:block;background:#07040a center/cover no-repeat;';
  still.style.backgroundImage = `url("${o.poster}")`;
  el.appendChild(still);

  const canLive = (() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if ((navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)) return false;
    if (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''))) return false;
    try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return false; } catch { return false; }
    return true;
  })();
  if (!canLive) return { live: false };

  let frame = null;
  const start = () => {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.src = o.arcade + (o.arcade.includes('?') ? '&' : '?') + 'embed=1&arcade=' + encodeURIComponent(o.arcade);
    frame.title = 'THE JUNCTION arcade';
    frame.loading = 'lazy';
    frame.setAttribute('allow', 'gamepad; fullscreen');
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .8s;';
    frame.addEventListener('load', () => setTimeout(() => { frame.style.opacity = '1'; }, 900));   // let the room power up behind the still
    el.appendChild(frame);
  };
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '300px 0px' });
  io.observe(el);
  // INSERT COIN inside the aisle asks the page to open its support modal
  addEventListener('message', (e) => {
    if (!frame || e.source !== frame.contentWindow || !e.data || e.data.junction !== 'support') return;
    const b = document.querySelector('[data-support-open]'); if (b) b.click(); else window.open('https://bigpicsolutions.com/support/', '_blank', 'noopener');
  });
  return { live: true, start };
}
