// The diorama post chain (all our own shaders):
//   scene (HDR, MSAA) -> haze + signed CoC (full) -> downsample (half) -> golden-angle bokeh gather (half)
//   -> depth-of-field composite (full) -> soft-knee bloom mip chain -> light shafts -> ACES + grade + vignette + grain.
import * as THREE from 'three';
import { SKY_GLSL, skyUniforms } from './world/sky.js';

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const TRI = new THREE.BufferGeometry();
TRI.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

class Pass {
  constructor(fragmentShader, uniforms = {}, defines = {}) {
    this.material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, defines, depthTest: false, depthWrite: false });
    this.mesh = new THREE.Mesh(TRI, this.material);
    this.mesh.frustumCulled = false;
    this.u = this.material.uniforms;
  }
  run(renderer, target) {
    renderer.setRenderTarget(target);
    renderer.render(this.mesh, ORTHO);
  }
}

const rt = (w, h, opts = {}) => new THREE.WebGLRenderTarget(w, h, {
  type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  depthBuffer: false, generateMipmaps: false, ...opts,
});

const HAZE = /* glsl */ `
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform mat4 uProjInv; uniform mat4 uCamWorld; uniform vec3 uCamPos;
uniform float uHazeDensity; uniform float uFogA; uniform float uFogB; uniform float uFogBase; uniform float uHazeMax;
uniform float uFocusDist; uniform float uFocusRange; uniform float uNearScale; uniform float uFarScale; uniform float uFocusY; uniform float uTilt;
varying vec2 vUv;
${SKY_GLSL}
void main(){
  vec3 col = texture2D(tColor, vUv).rgb;
  float d = texture2D(tDepth, vUv).x;
  vec4 vp = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vp.xyz /= vp.w;
  vec3 wp = (uCamWorld * vec4(vp.xyz, 1.0)).xyz;
  vec3 rd = normalize(wp - uCamPos);
  bool sky = d >= 0.99999;
  float dist = sky ? 4000.0 : length(vp.xyz);
  if (!sky) {
    float fd = min(1.0 - exp(-dist * uHazeDensity), uHazeMax * 0.36);   // aerial haze is capped: far giants stay legible
    float oy = uCamPos.y - uFogBase;
    float ry = abs(rd.y) < 1e-3 ? 1e-3 : rd.y;
    float hf = uFogA * exp(-oy * uFogB) * (1.0 - exp(-dist * ry * uFogB)) / (ry * uFogB);
    float f = 1.0 - (1.0 - fd) * exp(-max(hf, 0.0));
    f = min(f, uHazeMax);
    vec3 hc = skyHaze(rd);
    hc = mix(hc, uBelow * 1.25 + hc * 0.15, smoothstep(-0.03, -0.3, rd.y));   // looking down into the abyss: mist in shadow, not glow
    col = mix(col, hc, f);
  }
  float delta = dist - uFocusDist;
  float coc = delta > 0.0 ? clamp((delta - uFocusRange) / dist * uFarScale, 0.0, 1.0)
                          : -clamp((-delta - uFocusRange * 0.5) / max(dist, 1.0) * uNearScale, 0.0, 1.0);
  float dy = vUv.y - uFocusY;
  float ts = smoothstep(0.14, 0.55, abs(dy)) * uTilt * (dy < 0.0 ? 1.0 : 0.16);
  coc = (delta > 0.0 ? 1.0 : -1.0) * max(abs(coc), ts);
  gl_FragColor = vec4(col, coc);
}`;

const DOWN_HALF = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  vec4 a = texture2D(tSrc, vUv + uTexel * vec2(-0.75, -0.75));
  vec4 b = texture2D(tSrc, vUv + uTexel * vec2( 0.75, -0.75));
  vec4 c = texture2D(tSrc, vUv + uTexel * vec2(-0.75,  0.75));
  vec4 d = texture2D(tSrc, vUv + uTexel * vec2( 0.75,  0.75));
  vec4 o = (a + b + c + d) * 0.25;
  // keep the strongest near-field CoC so blurry foreground edges spread
  float nearMin = min(min(a.a, b.a), min(c.a, d.a));
  o.a = nearMin < -0.05 ? nearMin : o.a;
  gl_FragColor = o;
}`;

const BOKEH = /* glsl */ `
uniform sampler2D tHalf; uniform vec2 uTexel; uniform float uMaxR; uniform float uRadScale; varying vec2 vUv;
const float GA = 2.39996323;
void main(){
  vec4 c = texture2D(tHalf, vUv);
  float cs = abs(c.a) * uMaxR;
  vec3 acc = c.rgb; float tot = 1.0; float accC = abs(c.a);
  float r = uRadScale; float ang = 0.0;
  for (int i = 0; i < 110; i++) {
    if (r > uMaxR) break;
    vec2 off = vec2(cos(ang), sin(ang)) * r * uTexel;
    vec4 s = texture2D(tHalf, vUv + off);
    float ss = abs(s.a) * uMaxR;
    if (s.a > c.a) ss = clamp(ss, 0.0, cs * 2.0);
    float m = smoothstep(r - 0.5, r + 0.5, ss);
    // brighter samples weigh a touch more: highlights bloom into discs
    float lw = 1.0 + 0.6 * smoothstep(1.0, 4.0, dot(s.rgb, vec3(0.3, 0.6, 0.1)));
    acc += mix(acc / tot, s.rgb * lw, m);
    accC += mix(accC / tot, abs(s.a), m);
    tot += 1.0;
    ang += GA; r += uRadScale / r;
  }
  gl_FragColor = vec4(acc / tot, accC / tot);
}`;

const DOF_COMPOSITE = /* glsl */ `
uniform sampler2D tSharp; uniform sampler2D tBlur; varying vec2 vUv;
void main(){
  vec4 a = texture2D(tSharp, vUv); vec4 b = texture2D(tBlur, vUv);
  float k = smoothstep(0.03, 0.22, max(abs(a.a), b.a));
  gl_FragColor = vec4(mix(a.rgb, b.rgb, k), 1.0);
}`;

const BLOOM_PRE = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee; varying vec2 vUv;
vec3 T(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
void main(){
  vec3 c = T(vec2(0)) * 0.125 + (T(vec2(-1, 1)) + T(vec2(1, 1)) + T(vec2(-1, -1)) + T(vec2(1, -1))) * 0.125
         + (T(vec2(-2, 2)) + T(vec2(2, 2)) + T(vec2(-2, -2)) + T(vec2(2, -2))) * 0.03125
         + (T(vec2(0, 2)) + T(vec2(-2, 0)) + T(vec2(2, 0)) + T(vec2(0, -2))) * 0.0625;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float w = max(soft, br - uThreshold) / max(br, 1e-4);
  c *= w;
  c /= 1.0 + max(c.r, max(c.g, c.b)) * 0.04; // tame single-pixel fireflies
  gl_FragColor = vec4(c, 1.0);
}`;

const BLOOM_DOWN = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
vec3 T(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
void main(){
  vec3 c = T(vec2(0)) * 0.125 + (T(vec2(-1, 1)) + T(vec2(1, 1)) + T(vec2(-1, -1)) + T(vec2(1, -1))) * 0.125
         + (T(vec2(-2, 2)) + T(vec2(2, 2)) + T(vec2(-2, -2)) + T(vec2(2, -2))) * 0.03125
         + (T(vec2(0, 2)) + T(vec2(-2, 0)) + T(vec2(2, 0)) + T(vec2(0, -2))) * 0.0625;
  gl_FragColor = vec4(c, 1.0);
}`;

const BLOOM_UP = /* glsl */ `
uniform sampler2D tLow; uniform sampler2D tHigh; uniform vec2 uTexel; uniform float uScatter; varying vec2 vUv;
vec3 T(vec2 o){ return texture2D(tLow, vUv + o * uTexel).rgb; }
void main(){
  vec3 up = (T(vec2(-1, 1)) + T(vec2(1, 1)) + T(vec2(-1, -1)) + T(vec2(1, -1))) * 0.0625
          + (T(vec2(0, 1)) + T(vec2(-1, 0)) + T(vec2(1, 0)) + T(vec2(0, -1))) * 0.125 + T(vec2(0)) * 0.25;
  gl_FragColor = vec4(texture2D(tHigh, vUv).rgb + up * uScatter, 1.0);
}`;

const FINAL = /* glsl */ `
uniform sampler2D tColor; uniform sampler2D tBloom; uniform sampler2D tDepth;
uniform float uBloom; uniform float uExposure; uniform float uSat; uniform float uContrast; uniform float uVignette; uniform float uGrain;
uniform vec3 uLift; uniform vec3 uGain; uniform vec3 uShadowTint; uniform vec3 uHighTint; uniform vec2 uRes; uniform float uTime;
uniform vec2 uShaftPos; uniform vec3 uShaftColor; uniform float uShaft; uniform float uCA;
uniform float uGround; uniform vec2 uFocalPos; uniform float uFocal;
varying vec2 vUv;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 ACESFitted(vec3 c){
  const mat3 IN = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 OUT = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  return clamp(OUT * RRTAndODTFit(IN * c), 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec2 q = vUv - 0.5;
  // a whisper of lateral chromatic aberration at the frame edge
  vec2 ca = q * dot(q, q) * uCA;
  vec3 c = vec3(texture2D(tColor, vUv - ca).r, texture2D(tColor, vUv).g, texture2D(tColor, vUv + ca).b);
  c += texture2D(tBloom, vUv).rgb * uBloom;
  // light shafts: march toward the glow source over the occlusion of the depth buffer (sky = open)
  if (uShaft > 0.001) {
    vec2 dir = (uShaftPos - vUv) / 28.0; vec2 p = vUv; float acc = 0.0; float w = 1.0;
    float j = h12(vUv * uRes + uTime) ;
    p += dir * j;
    for (int i = 0; i < 28; i++) { p += dir; float open = step(0.99999, texture2D(tDepth, p).x); acc += open * w; w *= 0.965; }
    acc /= 20.0;
    float fall = smoothstep(0.9, 0.0, length((vUv - uShaftPos) * vec2(uRes.x / uRes.y, 1.0)));
    c += uShaftColor * acc * acc * fall * uShaft;
  }
  // focal lift: a soft exposure swell around the scene's focal point (a painter's value funnel); 0 = off
  if (uFocal > 0.001) { vec2 fq = (vUv - uFocalPos) * vec2(uRes.x / uRes.y, 1.0); c *= 1.0 + uFocal * exp(-dot(fq, fq) * 5.0); }
  // ground fall-off: the near foreground (bottom of frame) settles darker so the eye travels in; 0 = off
  c *= 1.0 - uGround * smoothstep(0.42, 0.0, vUv.y) * (0.6 + 0.4 * smoothstep(0.0, 0.5, abs(q.x)));
  c *= uExposure;
  c = ACESFitted(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c *= mix(uShadowTint, uHighTint, smoothstep(0.02, 0.55, l));
  c = pow(max(c, 0.0), vec3(uContrast));
  c = c * uGain + uLift * (1.0 - c);
  vec2 vq = q; vq.x *= uRes.x / uRes.y;
  c *= 1.0 - uVignette * smoothstep(0.38, 1.1, length(vq));
  c = toSRGB(clamp(c, 0.0, 1.0));
  float n = h12(vUv * uRes + fract(uTime * 7.13) * 91.0) - 0.5;
  c += n * uGrain + (h12(vUv * uRes * 1.37) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}`;

export class PostFX {
  constructor(renderer, { samples = 4, bloomLevels = 6 } = {}) {
    this.renderer = renderer;
    this.samples = samples;
    this.levels = bloomLevels;
    this.enabled = true;
    const depthTexture = new THREE.DepthTexture(1, 1);
    depthTexture.type = THREE.FloatType;
    this.sceneRT = rt(1, 1, { depthBuffer: true, depthTexture, samples });
    this.hazeRT = rt(1, 1);
    this.halfRT = rt(1, 1);
    this.bokehRT = rt(1, 1);
    this.dofRT = rt(1, 1);
    this.down = []; this.up = [];
    for (let i = 0; i < bloomLevels; i++) { this.down.push(rt(1, 1)); this.up.push(rt(1, 1)); }

    this.haze = new Pass(HAZE, {
      ...skyUniforms,
      tColor: { value: null }, tDepth: { value: null },
      uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
      uHazeDensity: { value: 0.0018 }, uFogA: { value: 0.02 }, uFogB: { value: 0.06 }, uFogBase: { value: -10 }, uHazeMax: { value: 0.92 },
      uFocusDist: { value: 30 }, uFocusRange: { value: 8 }, uNearScale: { value: 1.7 }, uFarScale: { value: 0.13 }, uFocusY: { value: 0.4 }, uTilt: { value: 0.5 },
    });
    this.downHalf = new Pass(DOWN_HALF, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.bokeh = new Pass(BOKEH, { tHalf: { value: null }, uTexel: { value: new THREE.Vector2() }, uMaxR: { value: 11 }, uRadScale: { value: 1.0 } });
    this.dof = new Pass(DOF_COMPOSITE, { tSharp: { value: null }, tBlur: { value: null } });
    this.bloomPre = new Pass(BLOOM_PRE, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 }, uKnee: { value: 0.6 } });
    this.bloomDown = new Pass(BLOOM_DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.bloomUp = new Pass(BLOOM_UP, { tLow: { value: null }, tHigh: { value: null }, uTexel: { value: new THREE.Vector2() }, uScatter: { value: 0.85 } });
    this.final = new Pass(FINAL, {
      tColor: { value: null }, tBloom: { value: null }, tDepth: { value: null },
      uBloom: { value: 0.12 }, uExposure: { value: 1.0 }, uSat: { value: 1.05 }, uContrast: { value: 1.05 }, uVignette: { value: 0.45 }, uGrain: { value: 0.02 },
      uLift: { value: new THREE.Color(0.01, 0.012, 0.03) }, uGain: { value: new THREE.Color(1, 1, 1) },
      uShadowTint: { value: new THREE.Color(0.92, 0.96, 1.1) }, uHighTint: { value: new THREE.Color(1.06, 1.0, 0.92) },
      uRes: { value: new THREE.Vector2() }, uTime: { value: 0 },
      uShaftPos: { value: new THREE.Vector2(0.5, 0.8) }, uShaftColor: { value: new THREE.Color(1, 0.8, 0.5) }, uShaft: { value: 0 }, uCA: { value: 0.012 },
      uGround: { value: 0 }, uFocalPos: { value: new THREE.Vector2(0.5, 0.6) }, uFocal: { value: 0 },
    });
  }

  setSize(w, h) {
    this.w = w; this.h = h;
    this.sceneRT.setSize(w, h);
    this.hazeRT.setSize(w, h);
    this.dofRT.setSize(w, h);
    const hw = Math.ceil(w / 2), hh = Math.ceil(h / 2);
    this.halfRT.setSize(hw, hh);
    this.bokehRT.setSize(hw, hh);
    let bw = hw, bh = hh;
    for (let i = 0; i < this.levels; i++) {
      this.down[i].setSize(bw, bh); this.up[i].setSize(bw, bh);
      bw = Math.max(1, Math.ceil(bw / 2)); bh = Math.max(1, Math.ceil(bh / 2));
    }
    this.final.u.uRes.value.set(w, h);
    // the max bokeh radius is in half-res pixels: scale it with the frame so the look holds at any size
    this.bokeh.u.uMaxR.value = Math.max(6, Math.min(16, 11 * (h / 1000)));
  }

  render(scene, camera, time) {
    const r = this.renderer;
    if (!this.enabled) { r.setRenderTarget(null); r.toneMapping = THREE.ACESFilmicToneMapping; r.render(scene, camera); return; }
    r.setRenderTarget(this.sceneRT);
    r.render(scene, camera);

    const H = this.haze.u;
    H.tColor.value = this.sceneRT.texture; H.tDepth.value = this.sceneRT.depthTexture;
    H.uProjInv.value.copy(camera.projectionMatrixInverse); H.uCamWorld.value.copy(camera.matrixWorld);
    H.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    this.haze.run(r, this.hazeRT);

    this.downHalf.u.tSrc.value = this.hazeRT.texture;
    this.downHalf.u.uTexel.value.set(1 / this.w, 1 / this.h);
    this.downHalf.run(r, this.halfRT);

    this.bokeh.u.tHalf.value = this.halfRT.texture;
    this.bokeh.u.uTexel.value.set(1 / this.halfRT.width, 1 / this.halfRT.height);
    this.bokeh.run(r, this.bokehRT);

    this.dof.u.tSharp.value = this.hazeRT.texture; this.dof.u.tBlur.value = this.bokehRT.texture;
    this.dof.run(r, this.dofRT);

    // bloom
    this.bloomPre.u.tSrc.value = this.dofRT.texture;
    this.bloomPre.u.uTexel.value.set(1 / this.w, 1 / this.h);
    this.bloomPre.run(r, this.down[0]);
    for (let i = 1; i < this.levels; i++) {
      this.bloomDown.u.tSrc.value = this.down[i - 1].texture;
      this.bloomDown.u.uTexel.value.set(1 / this.down[i - 1].width, 1 / this.down[i - 1].height);
      this.bloomDown.run(r, this.down[i]);
    }
    let low = this.down[this.levels - 1];
    for (let i = this.levels - 2; i >= 0; i--) {
      this.bloomUp.u.tLow.value = low.texture; this.bloomUp.u.tHigh.value = this.down[i].texture;
      this.bloomUp.u.uTexel.value.set(1 / low.width, 1 / low.height);
      this.bloomUp.run(r, this.up[i]);
      low = this.up[i];
    }

    const F = this.final.u;
    F.tColor.value = this.dofRT.texture; F.tBloom.value = this.up[0].texture; F.tDepth.value = this.sceneRT.depthTexture;
    F.uTime.value = time;
    this.final.run(r, null);
  }
}
