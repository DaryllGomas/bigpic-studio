// The sky: one GLSL function set shared by the sky dome and the haze pass, so distant things melt into the exact sky colour.
// The sky is "dropped" by uHorizonDrop: the virtual horizon sits below the true one, so a diorama camera that looks down
// still sees a band of dusk sky above the far world (the backdrop trick the classic diorama games use).
import * as THREE from 'three';

export const skyUniforms = {
  uZenith: { value: new THREE.Color() },
  uUpper: { value: new THREE.Color() },
  uHorizon: { value: new THREE.Color() },
  uGlow: { value: new THREE.Color() },
  uBelow: { value: new THREE.Color() },
  uSunDir: { value: new THREE.Vector3(0, 0.05, -1).normalize() },
  uSunColor: { value: new THREE.Color() },
  uSunDisc: { value: 0 },
  uMoonDir: { value: new THREE.Vector3(0.3, 0.12, -1).normalize() },
  uMoonColor: { value: new THREE.Color() },
  uMoonGlow: { value: 0.5 },
  uStars: { value: 0.5 },
  uCloudLit: { value: new THREE.Color() },
  uCloudDark: { value: new THREE.Color() },
  uCloudCover: { value: 0.5 },
  uHorizonDrop: { value: 0.15 },
  uTime: { value: 0 },
};

export const SKY_GLSL = /* glsl */ `
uniform vec3 uZenith; uniform vec3 uUpper; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uBelow;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunDisc;
uniform vec3 uMoonDir; uniform vec3 uMoonColor; uniform float uMoonGlow;
uniform float uStars; uniform vec3 uCloudLit; uniform vec3 uCloudDark; uniform float uCloudCover;
uniform float uHorizonDrop; uniform float uTime;

float sk_hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float sk_hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float sk_noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(sk_hash12(i), sk_hash12(i+vec2(1,0)), f.x), mix(sk_hash12(i+vec2(0,1)), sk_hash12(i+vec2(1,1)), f.x), f.y); }
float sk_fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * sk_noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }

vec3 skyDir(vec3 rd){ return normalize(vec3(rd.x, rd.y + uHorizonDrop, rd.z)); }

// gradient + horizon glow, no stars/clouds (the haze colour)
vec3 skyGradient(vec3 v){
  float e = v.y;
  vec3 c = mix(uHorizon, uUpper, smoothstep(0.0, 0.2, e));
  c = mix(c, uZenith, smoothstep(0.16, 0.7, e));
  float az = dot(normalize(v.xz + 1e-5), normalize(uSunDir.xz + 1e-5)) * 0.5 + 0.5;
  float band = exp(-max(e, 0.0) * 13.0);
  c += uGlow * band * (0.2 + 0.8 * az * az * az);
  c = mix(c, uBelow, smoothstep(0.0, -0.16, e));
  return c;
}

vec3 skyHaze(vec3 rd){
  vec3 v = skyDir(rd);
  v.y = clamp(v.y, 0.03, 0.12);           // haze takes the colour just above the glow band: violet, warm only toward the sun
  vec3 c = skyGradient(v);
  float s = max(dot(normalize(rd), normalize(vec3(uSunDir.x, uSunDir.y - uHorizonDrop, uSunDir.z))), 0.0);
  c += uSunColor * pow(s, 6.0) * 0.35;
  return c;
}

vec3 skyColor(vec3 rd){
  vec3 v = skyDir(rd);
  vec3 c = skyGradient(v);
  float e = v.y;
  // stars: hashed cells on the sphere, a few big four-point ones
  if (uStars > 0.001 && e > -0.02) {
    vec3 p = v * 230.0; vec3 id = floor(p); float h = sk_hash13(id);
    if (h > 0.9955) {
      vec3 f = fract(p) - 0.5; float d = length(f.xy + f.z * 0.3);
      float big = step(0.9993, h);
      float tw = 0.65 + 0.35 * sin(uTime * (1.5 + h * 4.0) + h * 700.0);
      float core = smoothstep(0.32, 0.0, d);
      float cross = big * (smoothstep(0.06, 0.0, abs(f.x)) + smoothstep(0.06, 0.0, abs(f.y))) * smoothstep(0.5, 0.0, d);
      vec3 sc = mix(vec3(1.0, 0.92, 0.78), vec3(0.75, 0.88, 1.0), sk_hash13(id + 7.0));
      c += sc * (core * (1.0 + big * 2.0) + cross * 1.5) * tw * uStars * smoothstep(-0.02, 0.12, e) * 2.2;
    }
    // faint milky dust band
    float dust = sk_fbm(v.xz * 6.0 + v.y * 3.0) * smoothstep(0.05, 0.4, e);
    c += vec3(0.35, 0.38, 0.62) * pow(dust, 3.0) * uStars * 0.35;
  }
  // sun (dawn/dusk), mostly glow
  float sd = dot(v, uSunDir);
  c += uSunColor * (pow(max(sd, 0.0), 40.0) * 0.6 + pow(max(sd, 0.0), 6.0) * 0.18);
  c += uSunColor * uSunDisc * smoothstep(0.9993, 0.9997, sd) * 6.0;
  // moon: a big pale disc with soft maria and a halo
  vec3 md = normalize(uMoonDir);
  float mdot = dot(v, md);
  float R = 0.052;
  float ang = acos(clamp(mdot, -1.0, 1.0));
  if (ang < R * 1.15) {
    vec3 t1 = normalize(cross(md, vec3(0.0, 1.0, 0.0))); vec3 t2 = cross(t1, md);
    vec2 lp = vec2(dot(v, t1), dot(v, t2)) / R;
    float maria = sk_fbm(lp * 2.2 + 3.0);
    float limb = sqrt(max(1.0 - dot(lp, lp), 0.0));
    vec3 mc = uMoonColor * (0.72 + 0.28 * limb) * (1.0 - 0.28 * smoothstep(0.45, 0.7, maria));
    float disc = smoothstep(R, R * 0.97, ang);
    c = mix(c, mc * 2.4, disc);
  }
  c += uMoonColor * uMoonGlow * (exp(-ang * 9.0) * 0.22 + exp(-ang * 40.0) * 0.35) * smoothstep(-0.05, 0.05, e);
  // clouds: long dusk streaks, posterised for the pixel-painted look, lit from the horizon glow side
  if (e > -0.03) {
    vec2 cp = v.xz / (max(e, 0.0) + 0.09);
    cp = cp * vec2(0.22, 0.55) + vec2(uTime * 0.0025, 0.0);
    float n = sk_fbm(cp * 1.4) * 0.75 + sk_fbm(cp * 4.0 + 9.0) * 0.25;
    float dens = smoothstep(1.0 - uCloudCover, 1.05 - uCloudCover * 0.6, n);
    dens = floor(dens * 4.0 + 0.5) / 4.0;
    dens *= smoothstep(-0.03, 0.04, e) * (1.0 - smoothstep(0.45, 0.85, e));
    float az = dot(normalize(v.xz + 1e-5), normalize(uSunDir.xz + 1e-5)) * 0.5 + 0.5;
    float under = smoothstep(0.55, 0.25, n - (1.0 - uCloudCover));
    float lit = clamp(az * az * 1.2 * (1.0 - e * 1.6) + under * 0.25, 0.0, 1.0);
    lit = floor(lit * 5.0 + 0.5) / 5.0;
    vec3 cc = mix(uCloudDark, uCloudLit, lit);
    c = mix(c, cc, dens * 0.92);
    // silver lining near the moon
    c += uMoonColor * dens * exp(-ang * 7.0) * 0.25 * uMoonGlow;
  }
  return c;
}
`;

export function createSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.999999; }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      ${SKY_GLSL}
      void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0); }`,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.onBeforeRender = (r, s, cam) => mesh.position.copy(cam.position);
  return mesh;
}
