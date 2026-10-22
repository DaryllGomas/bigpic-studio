// A pixel sprite standing in the lit 3D world: billboarded to the camera's yaw, 4-direction walk cycles,
// a crisp alpha-tested silhouette that casts a real shadow, a soft contact shadow, and a rim light from the sky behind it.
import * as THREE from 'three';
import { gear as sharedGear, AURAS } from '../gear.js';

export class SpriteCharacter {
  constructor({ map, emissiveMap, cols, rows, frameW, frameH, ppu = 20, dirs = ['down', 'up', 'left', 'right'], contactTex }) {
    this.cols = cols; this.rows = rows; this.dirs = dirs;
    this.dir = 'up'; this.frame = 0; this.animT = 0; this.moving = false;
    const w = frameW / ppu, h = frameH / ppu;
    this.height = h;
    for (const t of [map, emissiveMap]) if (t) { t.repeat.set(1 / cols, 1 / rows); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
    this.rim = { value: new THREE.Color(0, 0, 0) };
    const texel = new THREE.Vector2(1 / (frameW * cols), 1 / (frameH * rows));
    const mat = new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 2.5, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.82, metalness: 0.0 });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = this.rim; sh.uniforms.uTexel = { value: texel };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim; uniform vec2 uTexel;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float aU = texture2D(map, vMapUv + vec2(0.0, uTexel.y)).a;
          float aL = texture2D(map, vMapUv - vec2(uTexel.x, 0.0)).a;
          float aR = texture2D(map, vMapUv + vec2(uTexel.x, 0.0)).a;
          float aU2 = texture2D(map, vMapUv + vec2(0.0, 2.0 * uTexel.y)).a;
          float edge = clamp((1.0 - aU) * 0.9 + (1.0 - aU2) * 0.4 + (1.0 - aL) * 0.25 + (1.0 - aR) * 0.25, 0.0, 1.0) * step(0.5, aU2 + aU + 0.01);
          totalEmissiveRadiance += uRim * edge;
        }`);
    };
    this.material = mat;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, h / 2, 0);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    if (contactTex) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: contactTex, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }));
      c.rotation.x = -Math.PI / 2; c.position.y = 0.02; c.renderOrder = 2;
      this.group.add(c);
    }
    this.setFrame();
  }
  /** Gear cosmetics: call after setting hero.rim.value each frame. Aura tints the rim uniform (no shader change,
   *  so no cache-key concern); a LANTERN adds one small warm light. */
  applyGear(g = sharedGear()) {
    const a = g.aura();
    if (a) { const c = AURAS[a]; this._aura = this._aura || new THREE.Color(); this._aura.setRGB(c[0], c[1], c[2]); }
    else this._aura = null;
    if (g.hasLantern() && !this._lantern) { this._lantern = new THREE.PointLight('#ffb860', 1.6, 5, 2); this._lantern.position.set(0.5, 0.9, 0.3); this.group.add(this._lantern); }
    else if (!g.hasLantern() && this._lantern) { this.group.remove(this._lantern); this._lantern.dispose?.(); this._lantern = null; }
  }
  tintRim() {
    if (!this._aura) return;
    const m = Math.max(this.rim.value.r, this.rim.value.g, this.rim.value.b, 0.05);
    this.rim.value.lerp(this._aura.clone().multiplyScalar(m * 1.6), 0.55);
  }
  setFrame() {
    const row = this.dirs.indexOf(this.dir), col = this.frame;
    const ox = col / this.cols, oy = 1 - (row + 1) / this.rows;
    this.material.map.offset.set(ox, oy);
    if (this.material.emissiveMap) this.material.emissiveMap.offset.set(ox, oy);
  }
  /** move: world-space direction (unit, y=0) or null; camRight/camFwd: camera basis on the ground. */
  update(dt, camera, move, speed, camRight, camFwd) {
    if (move) {
      const lx = move.dot(camRight), ly = move.dot(camFwd);
      this.dir = Math.abs(lx) > Math.abs(ly) * 1.05 ? (lx > 0 ? 'right' : 'left') : ly > 0 ? 'up' : 'down';
      this.animT += dt * (speed / 3.0) * 7.5;
      this.frame = 2 + (Math.floor(this.animT) % 4);
    } else {
      this.animT += dt * 0.9;
      this.frame = Math.floor(this.animT) % 2;
    }
    this.setFrame();
    const p = this.group.position;
    this.mesh.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
  }
}

/** Rim light for any alpha-cut sprite material: edges facing the sky pick up the sky's colour. */
export function addSpriteRim(mat, texel, rimUniform, strength = 1) {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    sh.uniforms.uRim = rimUniform; sh.uniforms.uTexel = { value: texel };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim; uniform vec2 uTexel;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float aU = texture2D(map, vMapUv + vec2(0.0, uTexel.y)).a, aU2 = texture2D(map, vMapUv + vec2(0.0, 2.0 * uTexel.y)).a;
        float aL = texture2D(map, vMapUv - vec2(uTexel.x, 0.0)).a, aR = texture2D(map, vMapUv + vec2(uTexel.x, 0.0)).a;
        float edge = clamp((1.0 - aU) + (1.0 - aU2) * 0.5 + (1.0 - aL) * 0.35 + (1.0 - aR) * 0.35, 0.0, 1.0);
        totalEmissiveRadiance += uRim * edge * ${strength.toFixed(2)} * diffuseColor.rgb * 3.0;
      }`);
  };
  mat.customProgramCacheKey = () => prevKey() + `|rim:${strength.toFixed(2)}`;  // strength is baked into the shader
  mat.needsUpdate = true;
}
