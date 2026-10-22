// Keyboard: WASD / arrows to walk, Shift to run, T time of day, Q/E turn the view. Edge-triggered presses via consume().
export class Input {
  constructor(el = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.firstGesture = null;
    const map = (e) => e.code;
    addEventListener('keydown', (e) => {
      const k = map(e);
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) e.preventDefault();
      this._gesture();
    });
    addEventListener('keyup', (e) => this.down.delete(map(e)));
    addEventListener('blur', () => this.down.clear());
    addEventListener('pointerdown', (e) => { this._gesture(); if (e.target?.id === 'view' && e.button === 0) this.down.add('Action'); });
    addEventListener('pointerup', () => this.down.delete('Action'));
    addEventListener('pointercancel', () => this.down.delete('Action'));
  }
  _gesture() { if (this.firstGesture) { const f = this.firstGesture; this.firstGesture = null; f(); } }
  onFirstGesture(f) { this.firstGesture = f; }
  consume(code) { const had = this.pressed.has(code); this.pressed.delete(code); return had; }
  endFrame() { this.pressed.clear(); }
  action() { return this.down.has('Space') || this.down.has('KeyF') || this.down.has('Action'); }
  axis() {
    const d = this.down;
    const x = (d.has('KeyD') || d.has('ArrowRight') ? 1 : 0) - (d.has('KeyA') || d.has('ArrowLeft') ? 1 : 0);
    const y = (d.has('KeyW') || d.has('ArrowUp') ? 1 : 0) - (d.has('KeyS') || d.has('ArrowDown') ? 1 : 0);
    return { x, y, run: d.has('ShiftLeft') || d.has('ShiftRight') };
  }
}
