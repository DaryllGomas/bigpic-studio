import { readPad, snapshot, installFakePad, flagNative } from './pad-reader.js';
export class JamInput {
  constructor(press,canvas) {
    installFakePad(); this.previous = []; this.press = press;
    const keys = {Space:'A',Enter:'A',KeyF:'A',KeyA:'A',KeyX:'X',KeyY:'Y',KeyB:'B',Escape:'START',KeyP:'START'};
    addEventListener('keydown',e => { if (e.target.matches('input,button')) return; if(keys[e.code]) {e.preventDefault();if(!e.repeat) press(keys[e.code]);} });
    canvas.addEventListener('pointerdown',e => { const r=canvas.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*1600,y=(e.clientY-r.top)/r.height*900; press(y>730 ? ['A','X','Y','B'][Math.max(0,Math.min(3,Math.floor((x-170)/140)))] : 'A'); });
  }
  poll() {
    const pad = readPad(); if(!pad) return; flagNative(); const b=snapshot(pad).buttons;
    for(const [i,n] of [[0,'A'],[1,'B'],[2,'X'],[3,'Y'],[9,'START']]) if(b[i]&&!this.previous[i]) this.press(n);
    this.previous=b;
  }
}
