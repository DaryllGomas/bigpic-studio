// Falls for a city in daylight: layered streaks moving down, white threads of foam, a bright lip and a churning foot,
// soft edges. Stepped on a fine texel grid so it still sits in the pixel world, but bright and clean enough for the sun.
import * as THREE from 'three';

const NOISE = /* glsl */ `
float fh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float fn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(fh(i), fh(i+vec2(1,0)), f.x), mix(fh(i+vec2(0,1)), fh(i+vec2(1,1)), f.x), f.y); }`;

export function brightFallMaterial({ width, height, tpu = 12, speed = 7 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSize: { value: new THREE.Vector2(width, height) }, uTpu: { value: tpu }, uSpeed: { value: speed },
      uDeep: { value: new THREE.Color('#3f6f8c') }, uLight: { value: new THREE.Color('#cfe6f4') }, uFoam: { value: new THREE.Color('#ffffff') },
      uTint: { value: new THREE.Color(1, 1, 1) }, uGlow: { value: 1 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: NOISE + /* glsl */ `
      uniform float uTime; uniform vec2 uSize; uniform float uTpu; uniform float uSpeed; uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uFoam; uniform vec3 uTint; uniform float uGlow;
      varying vec2 vUv;
      void main(){
        vec2 px = floor(vec2(vUv.x * uSize.x, (1.0 - vUv.y) * uSize.y) * uTpu);
        float x = px.x, y = px.y / uTpu;
        float acc = 1.0 + y * 0.05;
        float flow = y / acc - uTime * uSpeed / acc;
        float colv = fn(vec2(x * 0.18, 3.0));
        float s1 = fn(vec2(x * 0.42, flow * 0.5)), s2 = fn(vec2(x * 1.1 + 7.0, flow * 1.3)), s3 = fn(vec2(x * 2.3 + 3.0, flow * 2.4));
        float streak = s1 * 0.5 + s2 * 0.32 + s3 * 0.18;
        vec3 c = mix(uDeep, uLight, smoothstep(0.28, 0.7, streak) * (0.65 + colv * 0.5));
        c = mix(c, uFoam, smoothstep(0.66, 0.86, streak) * 0.85);
        float lip = smoothstep(1.2, 0.0, y), foot = smoothstep(uSize.y - 2.5, uSize.y, y);
        c = mix(c, uFoam, max(lip * 0.75, foot * 0.9));
        float edge = min(vUv.x, 1.0 - vUv.x) * uSize.x;
        float a = smoothstep(0.0, 0.45, edge + (fn(vec2(px.y * 0.2, flow)) - 0.5) * 0.4) * 0.96;
        gl_FragColor = vec4(c * uTint * uGlow, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}
