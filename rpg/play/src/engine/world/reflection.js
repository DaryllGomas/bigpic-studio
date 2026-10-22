// Wet stone: a planar mirror of the world for one horizontal surface (the causeway). Rendered at half resolution from a
// camera mirrored across the plane with an oblique near plane (nothing below the water line leaks in). The surface shader
// samples it through the stone's normal map, streaks it vertically like rain-wet flagstones, and weights it by Fresnel and
// by the wetness (low roughness = puddles).
import * as THREE from 'three';

export class PlanarReflection {
  constructor(renderer, { y = 0, scale = 0.5 } = {}) {
    this.renderer = renderer; this.y = y; this.scale = scale;
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
    this.cam = new THREE.PerspectiveCamera();
    this.uniforms = { uRefl: { value: this.rt.texture }, uReflMatrix: { value: new THREE.Matrix4() }, uReflStrength: { value: 1 } };
    this._v = new THREE.Vector3(); this._t = new THREE.Vector3(); this._q = new THREE.Vector4(); this._plane = new THREE.Plane();
  }
  /** Patch a MeshStandardMaterial so it shows the reflection. */
  apply(mat, { base = 0.3, streak = 0.006 } = {}) {
    const U = this.uniforms;
    const prev = mat.onBeforeCompile;
    const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
    mat.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix; varying vec4 vReflCoord;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvReflCoord = uReflMatrix * modelMatrix * vec4(transformed, 1.0);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uRefl; uniform float uReflStrength; varying vec4 vReflCoord;')
        .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        {
          vec2 ruv = vReflCoord.xy / vReflCoord.w;
          vec2 bend = (normal.xy - geometryNormal.xy) * 0.045;
          float wet = mix(${base.toFixed(3)}, 1.0, 1.0 - smoothstep(0.06, 0.45, roughnessFactor));
          float st = ${streak.toFixed(4)} * (1.0 + roughnessFactor * 5.0);
          vec3 rc = texture2D(uRefl, ruv + bend).rgb * 0.36
                  + (texture2D(uRefl, ruv + bend + vec2(0.0, st)).rgb + texture2D(uRefl, ruv + bend - vec2(0.0, st)).rgb) * 0.22
                  + (texture2D(uRefl, ruv + bend + vec2(0.0, st * 2.6)).rgb + texture2D(uRefl, ruv + bend - vec2(0.0, st * 2.6)).rgb) * 0.1;
          float cosV = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          float fres = 0.04 + 0.96 * pow(1.0 - cosV, 5.0);
          reflectedLight.indirectSpecular += rc * wet * fres * uReflStrength;
        }`);
    };
    // base and streak are baked into the shader text, so they must be part of the cache key
    mat.customProgramCacheKey = () => prevKey() + `|planar-refl:${base.toFixed(3)}:${streak.toFixed(4)}`;
    mat.needsUpdate = true;
  }
  render(scene, camera, w, h) {
    const W = Math.max(1, Math.round(w * this.scale)), H = Math.max(1, Math.round(h * this.scale));
    if (this.rt.width !== W || this.rt.height !== H) this.rt.setSize(W, H);
    const cam = this.cam, Y = this.y;
    cam.copy(camera, false);
    cam.layers.mask = 1;                                   // layer 0 only: the mirror surface itself lives on layer 1
    const rot = new THREE.Matrix4().extractRotation(camera.matrixWorld);
    const p = this._v.setFromMatrixPosition(camera.matrixWorld);
    cam.position.set(p.x, 2 * Y - p.y, p.z);
    const look = this._t.set(0, 0, -1).applyMatrix4(rot); look.y = -look.y;
    cam.up.set(0, 1, 0).applyMatrix4(rot); cam.up.y = -cam.up.y;
    cam.lookAt(cam.position.clone().add(look));
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    this.uniforms.uReflMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // oblique near plane = the mirror plane (Lengyel)
    const pl = this._plane.set(new THREE.Vector3(0, 1, 0), -Y).applyMatrix4(cam.matrixWorldInverse);
    const c = new THREE.Vector4(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant);
    const P = cam.projectionMatrix.elements, q = this._q;
    q.x = (Math.sign(c.x) + P[8]) / P[0]; q.y = (Math.sign(c.y) + P[9]) / P[5]; q.z = -1; q.w = (1 + P[10]) / P[14];
    c.multiplyScalar(2 / c.dot(q));
    P[2] = c.x; P[6] = c.y; P[10] = c.z + 1 - 0.003; P[14] = c.w;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    const r = this.renderer, prevAuto = r.shadowMap.autoUpdate;
    r.shadowMap.autoUpdate = false;
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, cam);
    r.shadowMap.autoUpdate = prevAuto;
    r.setRenderTarget(null);
  }
}

/** Dithered partial fade for anything between the camera and the hero (foreground never vanishes outright). */
export const occluder = { uOcc: { value: new THREE.Vector4(0, 0, 0, 0) } };
export function addOccluderFade(mat) {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    sh.uniforms.uOcc = occluder.uOcc;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uOcc;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if (uOcc.w > 0.0) {
        float viewD = length(vViewPosition);
        float ign0 = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        if (ign0 < smoothstep(11.0, 4.0, viewD) * 0.7) discard;        // near the lens: partial, never gone
        vec2 d = (gl_FragCoord.xy - uOcc.xy) / vec2(uOcc.w * 0.8, uOcc.w * 1.1);
        float rr = length(d);
        if (viewD < uOcc.z - 1.2 && rr < 1.0) {
          float k = smoothstep(1.0, 0.5, rr) * 0.7;
          if (ign0 < k) discard;
        }
      }`);
  };
  mat.customProgramCacheKey = () => prevKey() + '|occ';
  mat.needsUpdate = true;
}
