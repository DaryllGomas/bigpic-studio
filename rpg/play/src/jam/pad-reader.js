// Reader and fake-pad seam reused verbatim from ../engine/gamepad.js.
// Kept local because that module statically imports the journal and Three art.
export const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, GUIDE: 16 };
const NBTN = 16; // 0..15 only: 16 is never looked at

/** A scripted pad for tests: `?padtest` replaces navigator.getGamepads with window.__fakePad. */
export function installFakePad() {
  if (!new URLSearchParams(location.search).has('padtest') || window.__fakePad) return;
  const fake = {
    id: 'padtest (Xbox 360 Controller)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), hapticActuators: [],
  };
  window.__fakePad = fake;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
  /** __padSet({ buttons: ['A','START'] | [0,9], axes: [lx, ly, rx, ry] }): replace the whole pad state (omitted = released / centred). */
  window.__padSet = ({ buttons = [], axes = [0, 0, 0, 0] } = {}) => {
    const want = new Set(buttons.map((b) => (typeof b === 'string' ? B[b.toUpperCase()] : b)));
    fake.buttons.forEach((b, i) => { b.pressed = b.touched = want.has(i); b.value = b.pressed ? 1 : 0; });
    fake.axes = [axes[0] || 0, axes[1] || 0, axes[2] || 0, axes[3] || 0];
  };
}

/** True once a pad has been seen: tells the TV launcher the game handles the controller itself. */
export function flagNative() {
  if (window.__nativeGamepad) return;
  window.__nativeGamepad = true;
  document.documentElement.dataset.nativeGamepad = '1';
  window.dispatchEvent(new CustomEvent('nativegamepad'));
}

/** The pad in use: reads every connected pad and prefers whichever is being touched, else the first. */
export function readPad() {
  try {
    const pads = [...(navigator.getGamepads?.() ?? [])].filter((p) => p && p.connected);
    if (!pads.length) return null;
    const busy = (p) => p.buttons.slice(0, NBTN).some((b) => b && b.pressed) || p.axes.slice(0, 4).some((a) => Math.abs(a) > 0.3);
    return pads.find(busy) ?? pads[0];
  } catch { return null; }
}

/** Plain snapshot of the pad (buttons 0..15 only) plus the four stick axes. */
export function snapshot(pad) {
  const buttons = [];
  for (let i = 0; i < NBTN; i++) buttons[i] = !!pad.buttons[i]?.pressed;
  return { buttons, axes: Array.from(pad.axes).slice(0, 4).map((a) => a || 0) };
}

