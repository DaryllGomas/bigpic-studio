// GPU particles: every particle's motion lives in the vertex shader (one draw call per emitter, no CPU updates).
// Presets: fireflies, embers, motes, mist, spray. Additive HDR for lights (they bloom), alpha for mist.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime; uniform float uSize; uniform float uScale; uniform vec3 uBoxMin; uniform vec3 uBoxMax; uniform float uAmount;
uniform float uSpeed;
varying float vAlpha; varying float vTw;
float h(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec3 size = uBoxMax - uBoxMin;
  vec3 p = position;
  float t = uTime * uSpeed;
  float a = 1.0;
  float sz = uSize * (0.6 + aSeed.w * 0.8);
#if defined(FIREFLIES)
  p += vec3(sin(t * (0.3 + aSeed.x * 0.5) + aSeed.y * 6.28) * 1.6, sin(t * (0.5 + aSeed.z * 0.6) + aSeed.x * 6.28) * 0.5, cos(t * (0.25 + aSeed.y * 0.4) + aSeed.z * 6.28) * 1.6);
  float blink = sin(t * (0.9 + aSeed.y * 1.4) + aSeed.w * 30.0) * 0.5 + 0.5;
  a = pow(blink, 3.0);
#elif defined(EMBERS)
  float life = fract(t * (0.12 + aSeed.x * 0.1) + aSeed.y);
  p.y += life * size.y;
  p.x += sin(t * 1.3 + aSeed.z * 9.0 + life * 6.0) * 0.5 * life;
  p.z += cos(t * 1.1 + aSeed.w * 9.0 + life * 5.0) * 0.5 * life;
  a = smoothstep(0.0, 0.08, life) * (1.0 - life) * (0.6 + 0.4 * sin(t * 13.0 + aSeed.x * 50.0));
  sz *= 1.0 - life * 0.6;
#elif defined(MOTES)
  p += vec3(sin(t * 0.15 + aSeed.x * 6.28) * 2.5, sin(t * 0.2 + aSeed.y * 6.28) * 1.2 + t * 0.15 * (aSeed.z - 0.3), cos(t * 0.13 + aSeed.z * 6.28) * 2.5);
  p.y = uBoxMin.y + mod(p.y - uBoxMin.y, size.y);
  a = 0.35 + 0.65 * pow(sin(t * (1.0 + aSeed.w * 2.0) + aSeed.x * 40.0) * 0.5 + 0.5, 2.0);
#elif defined(MIST)
  p.x = uBoxMin.x + mod(p.x - uBoxMin.x + t * (0.6 + aSeed.x * 0.8), size.x);
  p.y += sin(t * 0.1 + aSeed.y * 6.28) * 1.5;
  float edge = min(p.x - uBoxMin.x, uBoxMax.x - p.x) / (size.x * 0.15);
  a = clamp(edge, 0.0, 1.0) * (0.5 + 0.5 * aSeed.z);
#elif defined(SPRAY)
  float life = fract(t * (0.35 + aSeed.x * 0.3) + aSeed.y);
  p.y += life * size.y * (0.4 + aSeed.z * 0.6);
  p.x += (aSeed.w - 0.5) * life * 4.0;
  p.z += (aSeed.x - 0.5) * life * 3.0;
  a = smoothstep(0.0, 0.15, life) * (1.0 - life);
  sz *= 0.5 + life * 1.5;
#endif
  a *= step(aSeed.x, uAmount);
  vAlpha = a;
  vTw = aSeed.w;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = sz * uScale / max(-mv.z, 0.1);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uTex; uniform vec3 uColor; uniform vec3 uColor2; uniform float uIntensity;
varying float vAlpha; varying float vTw;
void main(){
  vec4 t = texture2D(uTex, gl_PointCoord);
  vec3 c = mix(uColor, uColor2, vTw);
  float a = t.a * vAlpha;
  if (a < 0.003) discard;
#ifdef ADDITIVE
  gl_FragColor = vec4(c * uIntensity * a, 1.0);
#else
  gl_FragColor = vec4(c * uIntensity, a);
#endif
}`;

export const PRESETS = {
  fireflies: { size: 0.32, color: '#ffd77a', color2: '#e8f2a0', intensity: 6, additive: true, speed: 1 },
  embers: { size: 0.16, color: '#ff9a3c', color2: '#ffd27a', intensity: 7, additive: true, speed: 1 },
  motes: { size: 0.12, color: '#f1dcaa', color2: '#d4b06a', intensity: 4, additive: true, speed: 1 },
  mist: { size: 26, color: '#8d84b8', color2: '#b49aa8', intensity: 1, additive: false, speed: 1 },
  spray: { size: 5, color: '#cfe4ff', color2: '#9fb6d8', intensity: 1, additive: false, speed: 1 },
};

export function createParticles({ preset, count, min, max, texture, seed = 1, overrides = {} }) {
  const P = { ...PRESETS[preset], ...overrides };
  const pos = new Float32Array(count * 3), sd = new Float32Array(count * 4);
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = min.x + (max.x - min.x) * r();
    pos[i * 3 + 1] = min.y + (max.y - min.y) * r();
    pos[i * 3 + 2] = min.z + (max.z - min.z) * r();
    for (let k = 0; k < 4; k++) sd[i * 4 + k] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
  g.boundingSphere = new THREE.Sphere(min.clone().add(max).multiplyScalar(0.5), min.distanceTo(max));
  const defines = { [preset.toUpperCase()]: 1 };
  if (P.additive) defines.ADDITIVE = 1;
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, defines,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: P.size }, uScale: { value: 500 }, uBoxMin: { value: min.clone() }, uBoxMax: { value: max.clone() },
      uAmount: { value: 1 }, uSpeed: { value: P.speed }, uTex: { value: texture },
      uColor: { value: new THREE.Color(P.color) }, uColor2: { value: new THREE.Color(P.color2) }, uIntensity: { value: P.intensity },
    },
    transparent: true, depthWrite: false,
    blending: P.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = P.additive ? 10 : 5;
  pts.userData.baseIntensity = P.intensity;
  pts.update = (dt, t, camera, height) => {
    mat.uniforms.uTime.value = t;
    mat.uniforms.uScale.value = height * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
  };
  return pts;
}
