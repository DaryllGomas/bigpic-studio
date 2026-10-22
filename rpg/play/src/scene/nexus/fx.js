// Light for the Nexus, all our own shaders: the gate veils (sealed obsidian starlight; the living gate shows a road running
// to a sunrise), volumetric beams (axial billboards, one draw call for all of them), threads of light (tubes with a
// travelling head), the forming swarm (points that spiral in and become Atlas), and soft glow halos.
import * as THREE from 'three';

const HASH = /* glsl */ `
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
`;

/** The arch-shaped opening as a flat shape (x across, y up from the threshold). */
export function archShape(w, spring, seg = 24) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, spring);
  s.absarc(0, spring, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  return s;
}

export function veilMaterial({ w, spring, alive = false }) {
  return new THREE.ShaderMaterial({
    defines: alive ? { ALIVE: 1 } : {},
    uniforms: { uTime: { value: 0 }, uNear: { value: 0 }, uI: { value: 1 }, uW: { value: w }, uSpring: { value: spring }, uFlare: { value: 0 }, uWake: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uNear, uI, uW, uSpring, uFlare, uWake; varying vec2 vP;
      ${HASH}
      float stars(vec2 uv, float scale, float t, float seed){
        vec2 p = uv * scale + vec2(seed * 13.1, t); vec2 id = floor(p), f = fract(p) - 0.5;
        float h = h21(id + seed); if (h < 0.86) return 0.0;
        vec2 o = vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5;
        float d = length(f - o * 0.6);
        float tw = 0.6 + 0.4 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
        return smoothstep(0.09, 0.0, d) * tw * (h - 0.86) * 7.0;
      }
      void main(){
        float hw = uW * 0.5, x = vP.x, y = vP.y, apex = uSpring + hw;
        float edge = y < uSpring ? hw - abs(x) : hw - length(vec2(x, y - uSpring));
        vec2 uv = vec2(x / uW + 0.5, y / apex);
        vec3 col;
      #ifdef ALIVE
        // through the living gate: a road runs out to a sunrise (THE PATH's dawn), shimmering like air over heat
        float hz = 0.34;
        vec2 q = uv + vec2(sin(uv.y * 38.0 - uTime * 2.2) * 0.004 + sin(uv.y * 11.0 + uTime * 1.3) * 0.003, 0.0);
        // THE PATH's dawn: twilight navy high, coral and sunrise low, a gold sun on the horizon
        vec3 sky = mix(vec3(0.95, 0.38, 0.2), vec3(0.42, 0.16, 0.30), smoothstep(hz, hz + 0.18, q.y));
        sky = mix(sky, vec3(0.05, 0.05, 0.16), smoothstep(hz + 0.12, 0.92, q.y));
        float sun = exp(-length((q - vec2(0.5, hz)) * vec2(1.0, 1.7)) * 15.0);
        float disc = smoothstep(0.075, 0.068, length((q - vec2(0.5, hz + 0.02)) * vec2(uW / (uSpring + uW * 0.5), 1.0))) * step(hz, q.y);
        col = sky * 0.55 + vec3(1.0, 0.72, 0.4) * sun * 2.2 + vec3(1.0, 0.86, 0.6) * disc * 3.5 + vec3(1.0, 0.8, 0.55) * exp(-abs(q.y - hz) * 90.0) * 1.4;
        col += vec3(0.9, 0.8, 1.0) * stars(q, 26.0, uTime * 0.02, 1.0) * smoothstep(hz + 0.25, 0.9, q.y) * 2.0;
        if (q.y < hz) {
          float d = (hz - q.y) / hz;
          vec3 ground = mix(vec3(0.10, 0.04, 0.10), vec3(0.03, 0.02, 0.06), d);
          float halfW = 0.012 + d * 0.30, rx = abs(q.x - 0.5);
          float rail = exp(-abs(rx - halfW) * (260.0 - d * 180.0));
          float roadIn = smoothstep(halfW + 0.006, halfW - 0.004, rx);
          float persp = 1.0 / max(d, 0.03);
          float gz = fract(persp * 0.35 - uTime * 0.55);
          float xline = smoothstep(0.1, 0.0, gz) * roadIn * smoothstep(0.02, 0.3, d);
          float centre = smoothstep(0.004 + d * 0.01, 0.0, rx) * step(0.5, fract(persp * 0.7 - uTime * 0.8));
          col = ground + vec3(0.25, 0.12, 0.08) * roadIn + vec3(1.0, 0.74, 0.40) * (rail * 3.2 + xline * 1.4 + centre * 1.6);
          col += vec3(1.0, 0.7, 0.4) * sun * 1.4 * (1.0 - d);
        }
        // the veil itself: a white-gold wash that breathes, a hot rim, sparks drifting up
        float breathe = 0.85 + 0.15 * sin(uTime * 1.3);
        col = mix(col, vec3(1.0, 0.9, 0.7) * 1.4, 0.02 + uNear * 0.08);
        col += vec3(1.0, 0.82, 0.55) * (exp(-edge * 4.5) * 1.4 + exp(-edge * 18.0) * 4.0) * breathe;
        vec2 sp = vec2(uv.x * 9.0, uv.y * 5.0 - uTime * 0.35);
        float spark = smoothstep(0.92, 1.0, vn(sp * 3.0)) * smoothstep(0.0, 0.2, uv.y);
        col += vec3(1.0, 0.85, 0.6) * spark * 3.0;
        col = mix(col, vec3(1.0, 0.95, 0.85) * 9.0, uFlare);
        col *= uI;
      #else
        // sealed: obsidian glass holding a slow starfield; it stirs and hums when you come near
        col = mix(vec3(0.010, 0.008, 0.026), vec3(0.035, 0.022, 0.085), uv.y);
        float t = uTime * 0.015;
        float s = stars(uv * vec2(uW / 4.4, 1.6), 14.0, t, 2.0) + stars(uv * vec2(uW / 4.4, 1.6), 24.0, t * 1.6, 5.0) * 0.7 + stars(uv * vec2(uW / 4.4, 1.6), 40.0, t * 2.3, 9.0) * 0.45;
        vec3 starC = mix(vec3(0.62, 0.55, 1.0), vec3(1.0, 0.86, 0.62), h21(floor(uv * 30.0)));
        col += starC * s * (0.55 + uNear * 1.6) * uWake;
        float neb = vn(uv * vec2(3.0, 4.0) + vec2(t * 3.0, -t * 2.0)) * vn(uv * 7.0 - t * 4.0);
        col += vec3(0.22, 0.10, 0.42) * neb * (0.35 + uNear) * uWake;
        float rd = length(vec2(x, y - 1.2));
        col += vec3(0.5, 0.42, 1.0) * uNear * (0.5 + 0.5 * sin(rd * 9.0 - uTime * 3.0)) * exp(-rd * 0.45) * 0.35;
        col += mix(vec3(0.45, 0.36, 0.9), vec3(1.0, 0.8, 0.5), 0.35) * (exp(-edge * 7.0) * (0.55 + uNear * 1.8)) * uWake;
        col *= uI;
      #endif
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/** Volumetric beams of light as axial billboards. beams: [{ a, b, w0, w1, color, i }]. One draw call. */
export function createBeams(beams) {
  const S = 10, verts = beams.length * (S + 1) * 2;
  const A = new Float32Array(verts * 3), B = new Float32Array(verts * 3), Wd = new Float32Array(verts * 2), side = new Float32Array(verts), tt = new Float32Array(verts), col = new Float32Array(verts * 3), seed = new Float32Array(verts);
  const idx = [];
  let v = 0;
  beams.forEach((bm, k) => {
    const c = new THREE.Color(bm.color).multiplyScalar(bm.i ?? 1);
    for (let s = 0; s <= S; s++) for (const sd of [-1, 1]) {
      A.set([bm.a.x, bm.a.y, bm.a.z], v * 3); B.set([bm.b.x, bm.b.y, bm.b.z], v * 3);
      Wd.set([bm.w0, bm.w1], v * 2); side[v] = sd; tt[v] = s / S; col.set([c.r, c.g, c.b], v * 3); seed[v] = k * 1.37 + 0.3;
      v++;
    }
    const base = k * (S + 1) * 2;
    for (let s = 0; s < S; s++) { const a = base + s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  g.setAttribute('aW', new THREE.BufferAttribute(Wd, 2)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aT', new THREE.BufferAttribute(tt, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uI: { value: 1 }, uBoost: { value: new Float32Array(Math.max(1, beams.length)) } },
    vertexShader: /* glsl */ `
      attribute vec3 aA, aB, aCol; attribute vec2 aW; attribute float aSide, aT, aSeed;
      varying float vS, vT, vSeed, vView; varying vec3 vCol;
      void main(){
        vec3 p = mix(aA, aB, aT);
        vec3 ax = normalize(aB - aA);
        vec3 toCam = normalize(cameraPosition - p);
        vec3 sd = normalize(cross(ax, toCam));
        p += sd * aSide * mix(aW.x, aW.y, aT);
        vS = aSide; vT = aT; vSeed = aSeed; vCol = aCol;
        vView = 1.0 - abs(dot(ax, toCam)) * 0.6;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uI; varying float vS, vT, vSeed, vView; varying vec3 vCol;
      ${HASH}
      void main(){
        float across = exp(-vS * vS * 3.2);
        float along = smoothstep(0.0, 0.12, vT) * (1.0 - smoothstep(0.82, 1.0, vT));
        float streak = 0.62 + 0.38 * vn(vec2(vS * 2.6 + vSeed * 7.0, vT * 1.4 - uTime * 0.035 + vSeed));
        float dust = smoothstep(0.82, 1.0, vn(vec2(vS * 14.0 + vSeed * 3.0, vT * 40.0 + uTime * 0.25))) * 0.6;
        gl_FragColor = vec4(vCol * across * along * (streak + dust) * vView * uI, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 12;
  mesh.update = (dt, t) => { mat.uniforms.uTime.value = t; };
  return mesh;
}

/** A thread of light along a curve: a bright head travels it (uHead 0..1), leaving it lit at uPersist. */
export function threadMaterial(color = '#ffd27a') {
  return new THREE.ShaderMaterial({
    uniforms: { uHead: { value: -1 }, uPersist: { value: 0 }, uI: { value: 1 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uPulse: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uHead, uPersist, uI, uTime, uPulse; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float s = vUv.x;
        float head = exp(-pow((s - uHead) / 0.035, 2.0)) * 5.0;
        float trail = step(s, uHead) * smoothstep(uHead - 0.45, uHead, s) * 1.2;
        float lit = step(s, uHead) * uPersist * (0.55 + 0.45 * sin(s * 60.0 - uTime * 2.5));
        float pulse = uPulse * exp(-pow((fract(uTime * 0.18 + 0.5) - s) / 0.05, 2.0)) * 2.0;
        float ends = smoothstep(0.0, 0.04, s) * smoothstep(1.0, 0.96, s);
        vec3 c = uColor * (head + trail + lit + pulse) * ends * uI;
        c += vec3(1.0) * head * 0.6 * ends * uI;
        gl_FragColor = vec4(c, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
}

/**
 * The forming swarm: points that spiral in around an axis and land on Atlas's silhouette.
 * starts: world Vector3s; ends: [u, v] in the sprite plane (metres right of centre, up from the feet), placed each frame
 * by uBase/uRight so they stay on the billboard as it turns. delays/durs: per-point seconds. uT drives it.
 */
export function createSwarm({ starts, ends, delays, durs, axis, texture }) {
  const n = starts.length;
  const S = new Float32Array(n * 3), E = new Float32Array(n * 3), T = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    S.set([starts[i].x, starts[i].y, starts[i].z], i * 3); E.set([ends[i][0], ends[i][1], 0], i * 3);
    T.set([delays[i], durs[i], (Math.random() * 1.4 + 0.6) * (Math.random() < 0.5 ? -1 : 1), Math.random()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(S.slice(), 3));
  g.setAttribute('aStart', new THREE.BufferAttribute(S, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(E, 3)); g.setAttribute('aT', new THREE.BufferAttribute(T, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uScale: { value: 500 }, uTex: { value: texture }, uAxis: { value: axis.clone() }, uI: { value: 1 }, uBase: { value: axis.clone() }, uRight: { value: new THREE.Vector3(1, 0, 0) }, uFwd: { value: new THREE.Vector3(0, 0, 1) } },
    vertexShader: /* glsl */ `
      attribute vec3 aStart, aEnd; attribute vec4 aT; uniform float uT, uScale; uniform vec3 uAxis, uBase, uRight, uFwd;
      varying float vA; varying float vHot;
      void main(){
        float p = clamp((uT - aT.x) / aT.y, 0.0, 1.0);
        float e = p * p * (3.0 - 2.0 * p);
        vec3 endW = uBase + uRight * aEnd.x + vec3(0.0, aEnd.y, 0.0) + uFwd * 0.04;
        vec3 s0 = aStart - uAxis, s1 = endW - uAxis;
        float r0 = length(s0.xz), r1 = length(s1.xz);
        float a0 = atan(s0.z, s0.x), a1 = atan(s1.z, s1.x);
        float da = a1 - a0; da -= 6.2831853 * floor((da + 3.14159265) / 6.2831853);
        float ang = a0 + da * e + aT.z * 6.2831853 * (1.0 - e) * e * 1.6;
        float r = mix(r0, r1, e) + sin(e * 3.14159) * (0.6 + aT.w * 0.8);
        float y = mix(s0.y, s1.y, pow(e, 0.8)) + sin(e * 3.14159) * (aT.w - 0.3) * 1.2;
        vec3 p3 = uAxis + vec3(cos(ang) * r, y, sin(ang) * r);
        vA = smoothstep(0.0, 0.08, p) * (1.0 - smoothstep(0.93, 1.0, p));
        vHot = smoothstep(0.75, 0.97, p);
        vec4 mv = modelViewMatrix * vec4(p3, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (0.07 + vHot * 0.06 + aT.w * 0.05) * uScale / max(-mv.z, 0.1);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; uniform float uI; varying float vA; varying float vHot;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA; if (a < 0.003) discard;
        vec3 c = mix(vec3(1.0, 0.78, 0.42), vec3(0.85, 0.95, 1.0), vHot);
        gl_FragColor = vec4(c * a * 6.0 * uI, 1.0); }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false; pts.renderOrder = 14;
  pts.update = (dt, t, camera, h) => { mat.uniforms.uScale.value = (h * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
  return pts;
}

/** Soft halos at fixed points (one draw call). list: [{ p, color, size, i }]. Returns the Points with setI(k, v). */
export function createHalos(list, texture) {
  const n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
  list.forEach((h, k) => { pos.set([h.p.x, h.p.y, h.p.z], k * 3); const c = new THREE.Color(h.color).multiplyScalar(h.i ?? 1); col.set([c.r, c.g, c.b], k * 3); size[k] = h.size; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: texture }, uScale: { value: 500 }, uI: { value: 1 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `attribute vec3 aCol; attribute float aSize; uniform float uScale, uTime; varying vec3 vC;
      void main(){ vC = aCol * (0.9 + 0.1 * sin(uTime * 1.7 + position.x * 3.0 + position.z)); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / -mv.z; }`,
    fragmentShader: /* glsl */ `uniform sampler2D uTex; uniform float uI; varying vec3 vC;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vC * a * a * uI, 1.0); }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false; pts.renderOrder = 9;
  pts.update = (dt, t, camera, h) => { mat.uniforms.uTime.value = t; mat.uniforms.uScale.value = (h * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); };
  pts.setColor = (k, color, i = 1) => { const c = new THREE.Color(color).multiplyScalar(i); g.attributes.aCol.setXYZ(k, c.r, c.g, c.b); g.attributes.aCol.needsUpdate = true; };
  return pts;
}

/** A soft pool of light on the floor (additive decal). */
export function lightPool({ radius, color, i = 1, texture }) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({ map: texture, color: new THREE.Color(color).multiplyScalar(i), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 3;
  return m;
}

/** The cosmos beyond the window: violet nebula, stars, a ringed pale world. Projected by view direction through the pane's
 * frame (outward/right/up), so it sits at infinity and parallaxes like a real view, not a picture. */
export function cosmosMaterial({ outward, right, up }) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOut: { value: outward.clone() }, uRight: { value: right.clone() }, uUp: { value: up.clone() } },
    vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uOut, uRight, uUp; varying vec3 vW;
      ${HASH}
      void main(){
        vec3 rd = normalize(vW - cameraPosition);
        float f = max(dot(rd, uOut), 0.05);
        vec2 uv = vec2(dot(rd, uRight), dot(rd, uUp)) / f * 0.42 + vec2(0.5, 0.45);
        vec3 c = mix(vec3(0.02, 0.012, 0.05), vec3(0.08, 0.045, 0.18), clamp(uv.y, 0.0, 1.0));
        float n = vn(uv * 3.0 + 4.0) * vn(uv * 7.0 - 2.0);
        c += vec3(0.35, 0.16, 0.6) * pow(n, 1.5) * 0.9 + vec3(0.6, 0.28, 0.45) * pow(vn(uv * 5.0 + 9.0), 4.0) * 0.45;
        for (int k = 0; k < 3; k++) { float s = 30.0 + float(k) * 40.0; vec2 p = uv * s; vec2 id = floor(p); float hh = h21(id + float(k) * 7.0);
          if (hh > 0.88) { vec2 o = vec2(h21(id + 1.3), h21(id + 2.7)) - 0.5; float d = length(fract(p) - 0.5 - o * 0.6);
            c += mix(vec3(0.75, 0.7, 1.0), vec3(1.0, 0.9, 0.75), h21(id)) * smoothstep(0.12, 0.0, d) * (0.6 + 0.4 * sin(uTime * (1.0 + hh * 3.0) + hh * 50.0)) * (hh - 0.88) * 20.0; } }
        vec2 pc = uv - vec2(0.42, 0.36); float pr = length(pc);
        float body = smoothstep(0.17, 0.165, pr);
        vec3 pl = mix(vec3(0.42, 0.4, 0.6), vec3(0.95, 0.9, 1.0), smoothstep(-0.1, 0.25, dot(normalize(pc + 1e-4), vec2(-0.7, 0.7)) * (1.0 - pr * 3.0) + 0.1));
        pl *= 0.55 + 0.45 * vn(pc * 18.0);
        c = mix(c, pl * 1.1, body);
        c += vec3(0.7, 0.62, 1.0) * exp(-max(pr - 0.17, 0.0) * 28.0) * 0.55 * (1.0 - body);
        vec2 rp = vec2(pc.x * 0.94 + pc.y * 0.34, -pc.x * 0.34 + pc.y * 0.94); float re = length(rp * vec2(1.0, 4.2));
        float ring = smoothstep(0.011, 0.0, abs(re - 0.28)) + smoothstep(0.007, 0.0, abs(re - 0.25)) * 0.6;
        c += vec3(1.0, 0.86, 0.62) * ring * min(step(0.0, rp.y) + (1.0 - body), 1.0) * 1.3;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.DoubleSide,
  });
}
