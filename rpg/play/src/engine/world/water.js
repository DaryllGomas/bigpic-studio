// Pixel water: falling sheets and canals. Flow direction is explicit (falls move DOWN, canals move along their length
// toward the drop). Stepped bands of foam and streaks, sampled on a texel grid so it matches the pixel world.
import * as THREE from 'three';

const COMMON = /* glsl */ `
float wh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(wh(i), wh(i+vec2(1,0)), f.x), mix(wh(i+vec2(0,1)), wh(i+vec2(1,1)), f.x), f.y); }
`;

export function waterfallMaterial({ width, height, tpu = 12, speed = 7 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSize: { value: new THREE.Vector2(width, height) }, uTpu: { value: tpu }, uSpeed: { value: speed },
      uDeep: { value: new THREE.Color('#1c2c4a') }, uLight: { value: new THREE.Color('#8fb4d8') }, uFoam: { value: new THREE.Color('#e8f4ff') },
      uTint: { value: new THREE.Color(1, 1, 1) }, uGlow: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: COMMON + /* glsl */ `
      uniform float uTime; uniform vec2 uSize; uniform float uTpu; uniform float uSpeed; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uFoam; uniform vec3 uTint; uniform float uGlow;
      varying vec2 vUv;
      void main(){
        // texel grid; y measured DOWN from the lip, the pattern scrolls toward larger y (downward)
        vec2 px = floor(vec2(vUv.x * uSize.x, (1.0 - vUv.y) * uSize.y) * uTpu);
        float x = px.x, y = px.y / uTpu;
        float acc = 1.0 + y * 0.06;                    // falling water accelerates and stretches
        float flow = y / acc - uTime * uSpeed / acc;
        float col = wn(vec2(x * 0.45, 0.0)) ;
        float streak = wn(vec2(x * 0.7 + floor(col * 4.0), flow * 0.9));
        float band = step(0.62, streak);
        float edge = min(vUv.x, 1.0 - vUv.x) * uSize.x;
        float lip = smoothstep(1.4, 0.0, y);
        float foamB = smoothstep(uSize.y - 6.0, uSize.y, y);
        vec3 c = mix(uDeep, uLight, 0.25 + 0.45 * streak);
        c = mix(c, uFoam, max(band * 0.7, max(lip, foamB)));
        float a = smoothstep(0.0, 0.6, edge + wn(vec2(px.y * 0.3, flow)) * 0.6) * 0.92;
        gl_FragColor = vec4(c * uTint * uGlow, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

/** A canal surface; flow runs along +v (uv.y) toward the drop. */
export function canalMaterial({ width, length, tpu = 16, speed = 1.6 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSize: { value: new THREE.Vector2(width, length) }, uTpu: { value: tpu }, uSpeed: { value: speed },
      uDeep: { value: new THREE.Color('#0d1626') }, uLight: { value: new THREE.Color('#4b6e98') }, uGlint: { value: new THREE.Color('#ffd9a0') },
      uTint: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: COMMON + /* glsl */ `
      uniform float uTime; uniform vec2 uSize; uniform float uTpu; uniform float uSpeed; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uGlint; uniform vec3 uTint;
      varying vec2 vUv;
      void main(){
        vec2 px = floor(vUv * uSize * uTpu);
        float along = px.y / uTpu - uTime * uSpeed;     // features move toward +v
        float r = wn(vec2(px.x * 0.5, along * 2.2)) * 0.6 + wn(vec2(px.x * 0.15, along * 0.6)) * 0.4;
        vec3 c = mix(uDeep, uLight, smoothstep(0.35, 0.85, r) * 0.6);
        float glint = step(0.86, wn(vec2(px.x * 0.9, along * 3.0)));
        c += uGlint * glint * 0.8;
        gl_FragColor = vec4(c * uTint, 1.0);
      }`,
  });
}
