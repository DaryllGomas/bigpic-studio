// A pool of real point lights shared by any number of light sources (lanterns, braziers, glyph glows).
// Each frame the nearest sources to the focus get a light; lights hand over by fading, never popping.
import * as THREE from 'three';

export class LightPool {
  constructor(scene, size = 12) {
    this.sources = [];
    this.roleScale = {};
    this.slots = [];
    for (let i = 0; i < size; i++) {
      const l = new THREE.PointLight(0xffaa55, 0, 12, 2);
      l.castShadow = false;
      scene.add(l);
      this.slots.push({ light: l, src: null, w: 0 });
    }
  }
  add(src) {
    const s = { pos: src.pos.clone(), color: new THREE.Color(src.color ?? 0xffa050), intensity: src.intensity ?? 20, distance: src.distance ?? 12,
      flicker: src.flicker ?? 0.15, role: src.role ?? 'lantern', priority: src.priority ?? 1, phase: Math.random() * 100, slot: null };
    this.sources.push(s);
    return s;
  }
  update(focus, dt, t) {
    const n = this.slots.length;
    const ranked = this.sources
      .map((s) => [s, s.pos.distanceToSquared(focus) / (s.priority * s.priority)])
      .sort((a, b) => a[1] - b[1]);
    const want = new Set(ranked.slice(0, n).map((r) => r[0]));
    const fade = 1 - Math.exp(-dt * 6);
    // release slots whose source is no longer wanted (fade out first)
    for (const sl of this.slots) {
      if (sl.src && !want.has(sl.src)) { sl.w += (0 - sl.w) * fade; if (sl.w < 0.02) { sl.src.slot = null; sl.src = null; sl.w = 0; } }
      else if (sl.src) sl.w += (1 - sl.w) * fade;
    }
    // assign wanted sources to free slots
    for (const s of want) {
      if (s.slot) continue;
      const free = this.slots.find((sl) => !sl.src);
      if (!free) break;
      free.src = s; s.slot = free; free.w = 0;
    }
    for (const sl of this.slots) {
      const l = sl.light;
      if (!sl.src) { l.intensity = 0; continue; }
      const s = sl.src;
      l.position.copy(s.pos);
      l.color.copy(s.color);
      l.distance = s.distance;
      const fl = 1 + s.flicker * (Math.sin(t * 11.3 + s.phase) * 0.5 + Math.sin(t * 17.9 + s.phase * 2.1) * 0.3 + Math.sin(t * 4.1 + s.phase) * 0.2);
      l.intensity = s.intensity * (this.roleScale[s.role] ?? 1) * fl * sl.w;
    }
  }
}
