// Keyboard + mouse + gamepad -> one tiny event stream: up/down/left/right/act/back.
// Pad: native Gamepad API via the shared reader (src/engine/gamepad.js): stick / D-pad move, A = act, B = back. Button 16 is never read.
import { readPad, snapshot, installFakePad, flagNative } from '../engine/gamepad.js';
export class Input {
  constructor(canvas) {
    installFakePad(); addEventListener('gamepadconnected', flagNative);
    this.q = []; this.handlers = new Set(); this.pad = {}; this.lastAct = -1;
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'act', Enter: 'act', KeyJ: 'act', KeyZ: 'act', Escape: 'back', Backspace: 'back', KeyX: 'back' };
    addEventListener('keydown', e => { const a = map[e.code]; if (a) { e.preventDefault(); if (!e.repeat) this.emit(a); } else if (/^Digit[1-4]$/.test(e.code) && !e.repeat) this.emit('num', +e.code.slice(5) - 1); });
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); this.emit('act', null, 'mouse'); });
  }
  on(fn) { this.handlers.add(fn); return () => this.handlers.delete(fn); }
  emit(type, arg, src) { this.lastAct = type === 'act' ? performance.now() : this.lastAct; this.handlers.forEach(h => h(type, arg, src)); }
  poll() {
    const gp = readPad(); if (!gp) return;
    flagNative();
    const { buttons: b, axes: ax } = snapshot(gp);
    const now = { act: b[0] || b[7], back: b[1], up: b[12] || ax[1] < -.6, down: b[13] || ax[1] > .6, left: b[14] || ax[0] < -.6, right: b[15] || ax[0] > .6 };
    for (const k in now) { if (now[k] && !this.pad[k]) { document.body.classList.add('pad-on'); this.emit(k, null, 'pad'); } this.pad[k] = now[k]; }
  }
}
