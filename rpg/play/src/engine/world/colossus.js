// The colossus beyond the gate: a mourning, robed stone giant. Seated, head bowed under a heavy hood, forearms on its knees
// and its great hands hanging, robes draped to the ground and pooling, worn gold bands, faint cyan cracks. Sorrow, not menace.
// (Masters: Adversaries/"Sorrowful Ruined Stone Titan", "The Burden Colossus in the Ruined Archive"; Fidelity Ladder panel 2.)
// Method: one signed-distance sculpt (smooth unions of capsules and ellipsoids, a hollow hood with its opening cut away,
// a robe cone with hanging folds, a mantle with a ragged hem) -> surface nets mesh -> vertices projected onto the field,
// normals from its gradient, ambient occlusion baked from the field. Pixel-art stone and cloth (painted in world-sprites.js)
// are sampled triplanar with nearest filtering so the giant sits in the diorama; the sky behind it rims the silhouette.
// Built once at load (well under a second: the field is exact only near the surface), one draw call for the body,
// one for the tatters, one for the gold.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paintColossusStone, paintColossusCloth } from '../pixel/world-sprites.js';
import { rng } from '../pixel/paint.js';

// ---------- field helpers (allocation-free) ----------
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
function cap(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
}
function ell(x, y, z, rx, ry, rz) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz);
}
/** Ellipsoid centred at c, pitched about the x axis by t (positive tips its front, +z, downward). */
function ellP(px, py, pz, cx, cy, cz, rx, ry, rz, t) {
  const y = py - cy, z = pz - cz, c = Math.cos(t), s = Math.sin(t);
  return ell(px - cx, y * c + z * s, -y * s + z * c, rx, ry, rz);
}
/** Cheap smooth pseudo-noise in [~0.1, ~0.9] (nested sines): the sculpt calls it millions of times. */
function n3(x, y, z) {
  return 0.5 + 0.25 * (Math.sin(x * 1.31 + Math.sin(z * 0.87) * 1.7) * Math.sin(z * 1.17 + Math.sin(y * 0.93) * 1.3)
    + Math.sin(y * 1.53 + Math.sin(x * 1.07) * 1.1) * 0.6);
}

// ---------- the sculpt (local metres; the figure faces +z, sits on the ground at y = 0) ----------
const HOOD = { c: [0, 93, 28], ci: [0, 91, 32.5], r: [17, 19, 20.5], ri: [13.2, 15.2, 17.2], pitch: 0.8 };
const CUT = (() => { const n = new THREE.Vector3(0, -0.82, 0.58).normalize(); return { p: [0, 88.5, 35.5], n: [n.x, n.y, n.z] }; })();
const FINGERS = [-4.6, -1.5, 1.5, 4.6];
const SH = [27.5, 90, 5], EL = [36.5, 61, 27], WR = [27, 50.5, 54];

/** The stone body: torso hunched forward, shoulders, arms down to the knees, hanging hands, legs, the bowed head. */
function body(x, y, z) {
  const ax = Math.abs(x);                               // symmetric: the field noise below breaks the mirror
  let d = 1e9;
  if (y > 22) {
    d = ellP(x, y, z, 0, 75, 2, 26, 23, 19, 0.45);
    d = smin(d, ell(x, y - 49, z + 5, 26, 20, 22), 10);
    if (y > 70) {
      d = smin(d, Math.hypot(ax - SH[0], y - SH[1], z - SH[2]) - 11, 8);
      d = smin(d, cap(x, y, z, 0, 86, 8, 0, 91, 22, 7.5, 6.5), 6);                // neck, bent forward
      d = smin(d, ellP(x, y, z, 0, 88.5, 31.5, 10.5, 12.5, 11.5, 0.7), 4);         // the bowed head, deep in the hood
    }
    if (y > 44) d = smin(d, cap(ax, y, z, SH[0], SH[1], SH[2], EL[0], EL[1], EL[2], 9.2, 8.2), 5);   // upper arm
    d = smin(d, cap(ax, y, z, EL[0], EL[1], EL[2], WR[0], WR[1], WR[2], 8.2, 6.6), 4);              // forearm on the thigh
    if (z > 40 && y < 64) {
      d = smin(d, cap(ax, y, z, 27, 49.5, 56.5, 26, 37.5, 61.5, 6.3, 5.3), 3);     // the hand, hanging over the knee
      if (ax > 12 && ax < 40 && y < 56 && z > 48) {                                // fingers and thumb
        let f = 1e9;
        for (let k = 0; k < 4; k++) {
          const fx = 26 + FINGERS[k], len = k === 0 || k === 3 ? 11 : 13.5;
          f = Math.min(f, cap(ax, y, z, fx, 36.5, 62, fx * 1.02 + (k - 1.5) * 0.4, 36.5 - len, 64, 2.3, 1.8));
        }
        f = Math.min(f, cap(ax, y, z, 21.5, 46.5, 58.5, 20, 38.5, 63.5, 2.6, 2.1));
        d = smin(d, f, 2.2);
      }
    }
  }
  if (y < 68) {
    d = smin(d, cap(ax, y, z, 14, 40, -3, 19.5, 46, 40, 13.5, 11.5), 7);           // thigh
    d = smin(d, cap(ax, y, z, 19.5, 45, 43, 21.5, 8, 48, 10.5, 7), 5);             // shin
    if (y < 16) d = smin(d, ell(ax - 21.5, y - 4, z - 54, 7.5, 5, 12), 4);         // foot
  }
  // weathering: a chip missing from the right shoulder, a fracture across the left forearm, a broken fingertip
  if (y > 40 && d < 14) {
    d = Math.max(d, 4.2 - Math.hypot(x + 31, y - 100, z - 2));
    d = Math.max(d, 2.4 - Math.hypot(x - 31.5, y - 53, z - 40));
    d = Math.max(d, 2.6 - Math.hypot(x + 21.5, y - 40, z - 71.5));
    d = Math.max(d, 1.6 - Math.hypot(x - 24, y - 39, z - 68));
  }
  if (d > 12) return d;
  return d + (n3(x * 0.12, y * 0.12, z * 0.12) - 0.5) * 1.6 + (n3(x * 0.45, y * 0.45, z * 0.45) - 0.5) * 0.5;
}
/** The lower robe: falls from the waist over thighs and knees, sags between them, pools on the ground, in hanging folds. */
function robe(x, y, z) {
  if (y > 88) return y - 80;
  const ax = Math.abs(x);
  let d = cap(x, y, z, 0, 52, -5, 0, 2, -2, 28, 46);
  const legs = Math.min(cap(ax, y, z, 14, 41, -3, 19.5, 47.5, 41, 16, 14), cap(ax, y, z, 19.5, 46.5, 44, 22.5, 5, 51, 13.5, 11.5));
  d = smin(d, legs, 11);
  // the lap cloth, slung between the knees and falling to the ground
  d = smin(d, Math.max(cap(x, y, z, 0, 27, 45, 0, 3, 53, 10, 19), Math.abs(x) - 21), 12);
  d = smin(d, ell(x, y, z - 10, 58, 5.5, 54), 8);                                // pooled on the ground
  d = Math.max(d, -y - 1);
  const th = Math.atan2(x, z - 4), hang = Math.max(0, Math.min(1, (58 - y) / 46));
  // carved folds: sharp creases (|sin| has cusped valleys) in two scales, plus a few deep pleats
  const wp = n3(x * 0.05, 0, z * 0.05) * 4;
  d -= hang * (3.2 * (Math.abs(Math.sin(th * 10.5 + wp)) - 0.5) + 1.3 * (Math.abs(Math.sin(th * 24 + wp * 1.6 + y * 0.025)) - 0.5));
  d += hang * 1.6 * Math.max(0, Math.sin(th * 5.5 + wp * 0.5) - 0.55);
  d -= (1 - hang * 0.5) * 0.8 * Math.sin(th * 33 + n3(x * 0.08, y * 0.04, z * 0.08) * 6);
  d += (n3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 0.7 + (n3(x * 0.11, y * 0.03, z * 0.11) - 0.5) * 1.4;
  return d;
}
/** The mantle, its sleeves and the hood: a heavy cowl over the shoulders with a ragged hem, flowing up into a hollow hood. */
function mantleHood(x, y, z) {
  if (y < 40) return 48 - y;
  const ax = Math.abs(x);
  let m = ellP(x, y, z, 0, 86, 4, 42, 21, 28, 0.25);
  const th = Math.atan2(x, z - 4), back = 0.5 - 0.5 * Math.cos(th), side = Math.abs(Math.sin(th));
  const hem = 72 - back * 12 - side * 3 + (n3(x * 0.16, 0, z * 0.16) - 0.5) * 9 + Math.max(0, Math.sin(th * 13)) * 3;
  m = Math.max(m, hem - y);
  m = Math.max(m, -ellP(x, y, z, 0, 79, 8, 37, 17, 22, 0.35));                   // hollow: a garment, not a boulder
  // sleeves: the cowl continues down each upper arm to a torn edge above the elbow
  let sl = cap(ax, y, z, SH[0] - 2, SH[1] + 3, SH[2], EL[0] + 0.5, EL[1] + 4, EL[2] - 1, 12.5, 11.5);
  const ux = EL[0] - SH[0], uy = EL[1] - SH[1], uz = EL[2] - SH[2], ul = Math.hypot(ux, uy, uz);
  const along = ((ax - SH[0]) * ux + (y - SH[1]) * uy + (z - SH[2]) * uz) / ul;
  sl = Math.max(sl, along - (ul * 0.72 + (n3(x * 0.2, y * 0.2, z * 0.2) - 0.5) * 10));
  sl = Math.max(sl, -cap(ax, y, z, SH[0] - 2, SH[1] + 3, SH[2], EL[0] + 0.5, EL[1] + 4, EL[2] - 1, 10.4, 9.6));
  m = smin(m, sl, 5);
  // the hood: an outer shell, hollowed, its opening cut toward the ground in front of the knees
  const ho = ellP(x, y, z, HOOD.c[0], HOOD.c[1], HOOD.c[2], HOOD.r[0], HOOD.r[1], HOOD.r[2], HOOD.pitch);
  const hi = ellP(x, y, z, HOOD.ci[0], HOOD.ci[1], HOOD.ci[2], HOOD.ri[0], HOOD.ri[1], HOOD.ri[2], HOOD.pitch);
  let h = Math.max(ho, -hi);
  h = Math.max(h, (x - CUT.p[0]) * CUT.n[0] + (y - CUT.p[1]) * CUT.n[1] + (z - CUT.p[2]) * CUT.n[2]);
  h = smin(h, Math.max(cap(x, y, z, 0, 104, 16, 0, 99, 2, 6.5, 8.5), -hi), 5);   // a soft peak at the crown, falling back
  let d = smin(m, h, 7);
  const th2 = Math.atan2(x, z - 6);
  const wt = Math.max(0, Math.min(1, (90 - y) / 24));
  d -= wt * (0.9 * Math.sin(th2 * 19) + 2.2 * (Math.abs(Math.sin(th2 * 8.5 + n3(x * 0.06, y * 0.03, z * 0.06) * 3)) - 0.5));
  d += (n3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 0.5;
  return d;
}
function field(x, y, z) { return smin(body(x, y, z), smin(robe(x, y, z), mantleHood(x, y, z), 5), 2.5); }
/** 0 = cloth, 1 = stone, 2 = the dark inside of the hood. */
function material(x, y, z) {
  const b = body(x, y, z), r = Math.min(robe(x, y, z), mantleHood(x, y, z));
  if (ellP(x, y, z, HOOD.ci[0], HOOD.ci[1], HOOD.ci[2], HOOD.ri[0], HOOD.ri[1], HOOD.ri[2], HOOD.pitch) < 1.5 && r > 0.6) return 2;
  return r < b + 0.8 ? 0 : 1;
}

// ---------- surface nets over a culled grid ----------
/** Sample the field on a grid: exact near the surface, trilinear from a coarse pass elsewhere. Then surface nets. */
function mesh(f, bmin, bmax, step) {
  const nx = Math.ceil((bmax[0] - bmin[0]) / step) + 1, ny = Math.ceil((bmax[1] - bmin[1]) / step) + 1, nz = Math.ceil((bmax[2] - bmin[2]) / step) + 1;
  // three levels (spacing 4s, 2s, s): each is exact only within ~one parent cell of the surface, else interpolated
  const level = (parent, pn, ratio, sp, n) => {
    const out = new Float32Array(n[0] * n[1] * n[2]), near = sp * ratio * 1.15;
    for (let k = 0; k < n[2]; k++) {
      const pk = parent ? Math.min(pn[2] - 2, Math.floor(k / ratio)) : 0, fk = k / ratio - pk;
      for (let j = 0; j < n[1]; j++) {
        const pj = parent ? Math.min(pn[1] - 2, Math.floor(j / ratio)) : 0, fj = j / ratio - pj;
        for (let i = 0; i < n[0]; i++) {
          let v;
          if (parent) {
            const pi = Math.min(pn[0] - 2, Math.floor(i / ratio)), fi = i / ratio - pi, o = pi + pn[0] * (pj + pn[1] * pk), o2 = o + pn[0] * pn[1];
            const a = parent[o] + (parent[o + 1] - parent[o]) * fi, b = parent[o + pn[0]] + (parent[o + pn[0] + 1] - parent[o + pn[0]]) * fi;
            const c = parent[o2] + (parent[o2 + 1] - parent[o2]) * fi, d = parent[o2 + pn[0]] + (parent[o2 + pn[0] + 1] - parent[o2 + pn[0]]) * fi;
            const e = a + (b - a) * fj; v = e + ((c + (d - c) * fj) - e) * fk;
            if (Math.abs(v) <= near) v = f(bmin[0] + i * sp, bmin[1] + j * sp, bmin[2] + k * sp);
          } else v = f(bmin[0] + i * sp, bmin[1] + j * sp, bmin[2] + k * sp);
          out[i + n[0] * (j + n[1] * k)] = v;
        }
      }
    }
    return out;
  };
  const n4 = [Math.ceil((nx - 1) / 4) + 2, Math.ceil((ny - 1) / 4) + 2, Math.ceil((nz - 1) / 4) + 2];
  const n2 = [n4[0] * 2 - 1, n4[1] * 2 - 1, n4[2] * 2 - 1];
  const L4 = level(null, null, 1, step * 4, n4);
  const L2 = level(L4, n4, 2, step * 2, n2);
  const F = level(L2, n2, 2, step, [nx, ny, nz]);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1, cell = new Int32Array(cx * cy * cz).fill(-1);
  const pos = [], idx = [], g = new Float32Array(8);
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const R = [1, cx, cx * cy];
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const v = F[(i + (c & 1)) + nx * ((j + ((c >> 1) & 1)) + ny * (k + ((c >> 2) & 1)))]; g[c] = v; if (v < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) {
      if (((mask >> a) & 1) === ((mask >> b) & 1)) continue;
      const t = g[a] / (g[a] - g[b]);
      sx += (a & 1) + (((b & 1) - (a & 1)) * t); sy += ((a >> 1) & 1) + ((((b >> 1) & 1) - ((a >> 1) & 1)) * t); sz += ((a >> 2) & 1) + ((((b >> 2) & 1) - ((a >> 2) & 1)) * t); n++;
    }
    const m = i + cx * (j + cy * k);
    cell[m] = pos.length / 3;
    pos.push(bmin[0] + (i + sx / n) * step, bmin[1] + (j + sy / n) * step, bmin[2] + (k + sz / n) * step);
    const x = [i, j, k];
    for (let a = 0; a < 3; a++) {
      if (((mask & 1) !== 0) === (((mask >> (1 << a)) & 1) !== 0)) continue;
      const iu = (a + 1) % 3, iv = (a + 2) % 3;
      if (x[iu] === 0 || x[iv] === 0) continue;
      const du = R[iu], dv = R[iv];
      const q0 = cell[m], q1 = cell[m - du], q2 = cell[m - du - dv], q3 = cell[m - dv];
      if (q1 < 0 || q2 < 0 || q3 < 0) continue;
      if (mask & 1) idx.push(q0, q1, q2, q0, q2, q3);
      else idx.push(q0, q3, q2, q0, q2, q1);
    }
  }
  /** Trilinear lookup into the sampled field (cheap; used for occlusion). */
  const sample = (x, y, z) => {
    const fx = Math.max(0, Math.min(nx - 1.001, (x - bmin[0]) / step)), fy = Math.max(0, Math.min(ny - 1.001, (y - bmin[1]) / step)), fz = Math.max(0, Math.min(nz - 1.001, (z - bmin[2]) / step));
    const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), u = fx - i, v = fy - j, w = fz - k, o = i + nx * (j + ny * k), o2 = o + nx * ny;
    const a = F[o] + (F[o + 1] - F[o]) * u, b = F[o + nx] + (F[o + nx + 1] - F[o + nx]) * u;
    const c = F[o2] + (F[o2 + 1] - F[o2]) * u, d = F[o2 + nx] + (F[o2 + nx + 1] - F[o2 + nx]) * u;
    const e = a + (b - a) * v, h = c + (d - c) * v;
    return e + (h - e) * w;
  };
  return { pos: new Float32Array(pos), idx, sample };
}

function grad(f, x, y, z, e = 0.35) {
  const gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
}
/** Pull a point onto the surface along the field gradient. */
function project(f, p, it = 3) {
  for (let i = 0; i < it; i++) { const d = f(p[0], p[1], p[2]), n = grad(f, p[0], p[1], p[2]); p[0] -= n[0] * d; p[1] -= n[1] * d; p[2] -= n[2] * d; }
  return p;
}

// ---------- the shader: triplanar pixel stone / cloth, glowing cracks, the hood's faint breath, a sky rim ----------
function colossusMaterial(tex) {
  const U = {
    tStone: { value: tex.stone }, tCloth: { value: tex.cloth }, tCrack: { value: tex.crack },
    uTile: { value: 1 / 56 }, uCrack: { value: 2.2 }, uTime: { value: 0 }, uRim: { value: new THREE.Color(1, 0.7, 0.4) },
    uSunV: { value: new THREE.Vector3(0, 0, -1) }, uHood: { value: 1 },
  };
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true, envMapIntensity: 0.25 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aMat; varying float vMat; varying vec3 vWPos; varying vec3 vWNrm; varying vec3 vLocal;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vMat = aMat; vLocal = position; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWNrm = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D tStone; uniform sampler2D tCloth; uniform sampler2D tCrack; uniform float uTile; uniform float uCrack; uniform float uTime;
        uniform vec3 uRim; uniform vec3 uSunV; uniform float uHood;
        varying float vMat; varying vec3 vWPos; varying vec3 vWNrm; varying vec3 vLocal;
        vec4 tri(sampler2D t, vec3 p, vec3 w) { return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z; }`)
      .replace('#include <map_fragment>', `
        vec3 tN = normalize(vWNrm); vec3 tw = pow(abs(tN), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
        vec3 tP = vWPos * uTile;
        float ms = clamp(vMat, 0.0, 1.0), md = clamp(vMat - 1.0, 0.0, 1.0);
        vec3 aStone = tri(tStone, tP, tw).rgb, aCloth = tri(tCloth, tP * vec3(1.0, 0.55, 1.0), tw).rgb;
        diffuseColor.rgb *= mix(mix(aCloth, aStone, ms), aStone * 0.42, md);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float crack = tri(tCrack, tP * 0.9, tw).r * ms * (1.0 - md);
          float pulse = 0.6 + 0.4 * sin(uTime * 0.55 + vWPos.y * 0.04 + vWPos.x * 0.02);
          totalEmissiveRadiance += vec3(0.2, 0.85, 1.0) * crack * uCrack * pulse * 0.32;
          // the Signal core: a dim seam down the stone of the chest, and the breath of light inside the hood
          float seam = (1.0 - smoothstep(0.5, 1.3, abs(vLocal.x))) * smoothstep(56.0, 62.0, vLocal.y) * (1.0 - smoothstep(70.0, 76.0, vLocal.y)) * ms * (1.0 - md);
          totalEmissiveRadiance += vec3(0.15, 0.75, 0.95) * seam * uCrack * pulse * 0.18;
          float deep = 1.0 - smoothstep(4.0, 14.0, length(vLocal - vec3(0.0, 88.0, 31.0)));
          totalEmissiveRadiance += vec3(0.004, 0.022, 0.026) * md * deep * uHood * (0.75 + 0.25 * sin(uTime * 0.4));
          vec3 vv = normalize(vViewPosition);
          float fres = pow(1.0 - clamp(dot(normal, vv), 0.0, 1.0), 2.2);
          float toSky = clamp(dot(normal, uSunV) * 0.55 + 0.45, 0.0, 1.0) * (0.55 + 0.45 * clamp(normal.y, 0.0, 1.0));
          totalEmissiveRadiance += uRim * fres * toSky * (1.0 - md) * 2.0;
        }`);
  };
  m.customProgramCacheKey = () => 'colossus-v2';
  m.userData.U = U;
  return m;
}

/**
 * Build the colossus. Returns { group, headLocal, update(t), setDay(k, camera) }.
 * opts.gold: material for the bands and the crest (the scene's brass/gold); opts.scale: metres per sculpt unit.
 */
export function buildColossus({ gold, scale = 1, seed = 7 } = {}) {
  const t0 = performance.now();
  const R = rng(seed);
  const stone = paintColossusStone(seed), cloth = paintColossusCloth(seed + 2);
  const tx = (pc, color = true) => { const t = pc.texture({ kind: color ? 'color' : 'data', repeat: true, mips: true }); t.magFilter = THREE.NearestFilter; t.anisotropy = 4; return t; };
  const mat = colossusMaterial({ stone: tx(stone.map), cloth: tx(cloth.map), crack: tx(stone.crack, false) });
  const group = new THREE.Group();

  // ---- the body ----
  const tA = performance.now();
  const { pos, idx, sample } = mesh(field, [-72, -3, -46], [72, 124, 78], 1.4);
  const tB = performance.now();
  const n = pos.length / 3, col = new Float32Array(n * 3), am = new Float32Array(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal.array;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], gx = nrm[i * 3], gy = nrm[i * 3 + 1], gz = nrm[i * 3 + 2];
    // ambient occlusion from the field: how much nearer stone crowds each point along its normal
    let occ = 0, w = 1;
    for (const h of [1.8, 4, 8, 14, 22]) { occ += w * Math.max(0, h - sample(x + gx * h, y + gy * h, z + gz * h)) / h; w *= 0.62; }
    let ao = Math.max(0.12, 1 - occ * 0.55);
    ao *= 0.72 + 0.28 * Math.min(1, y / 30);                          // the ground darkens the lowest folds
    am[i] = material(x, y, z);
    if (am[i] > 1.5) ao = Math.max(ao, 0.5);                       // the bowed face inside the hood stays faintly readable
    const v = 0.92 + (R() - 0.5) * 0.05;
    // moss: soft green on the upward faces low on the body (knees, lap, the pooled robe) where the damp collects
    const up = Math.max(0, gy - 0.25), low = Math.max(0, Math.min(1, (70 - y) / 50));
    const mo = Math.min(1, up * low * Math.max(0, (n3(x * 0.09, y * 0.09, z * 0.09) - 0.42) * 6)) * (am[i] > 1.5 ? 0 : 1);
    col[i * 3] = ao * v * (1 - mo * 0.5); col[i * 3 + 1] = ao * v * (1 + mo * 0.35); col[i * 3 + 2] = ao * v * (1 - mo * 0.6);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aMat', new THREE.BufferAttribute(am, 1));
  geo.computeBoundingSphere();
  const tC = performance.now();
  const bodyMesh = new THREE.Mesh(geo, mat);
  group.add(bodyMesh);

  // ---- rubble: fallen chunks of the giant's own stone at its base (one merged mesh, same stone shader) ----
  const rocks = [];
  const rock = (x, z, r, sy = 0.6, mossy = true) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const px = pa.getX(i), py = pa.getY(i), pz = pa.getZ(i), k = 1 + (n3(px * 0.7 + x, py * 0.7, pz * 0.7 + z) - 0.5) * 0.7;
      pa.setXYZ(i, px * k, py * k * sy, pz * k);
    }
    g.rotateY(R() * 6.28); g.rotateZ((R() - 0.5) * 0.5);
    g.translate(x, r * sy * 0.55 - 0.5, z);
    const gg = g.toNonIndexed(); gg.deleteAttribute('uv'); gg.computeVertexNormals();
    const p = gg.attributes.position, nm = gg.attributes.normal, c = new Float32Array(p.count * 3), m = new Float32Array(p.count).fill(1);
    for (let i = 0; i < p.count; i++) {
      const up = Math.max(0, nm.getY(i) - 0.2), mo = mossy ? Math.min(1, up * 1.8 * Math.max(0, (n3(p.getX(i) * 0.2, p.getY(i) * 0.2, p.getZ(i) * 0.2) - 0.35) * 4)) : 0;
      const sh = 0.55 + 0.35 * Math.min(1, (p.getY(i) + 1) / (r * sy + 2));
      c[i * 3] = sh * (1 - mo * 0.5); c[i * 3 + 1] = sh * (1 + mo * 0.4); c[i * 3 + 2] = sh * (1 - mo * 0.6);
    }
    gg.setAttribute('color', new THREE.BufferAttribute(c, 3)); gg.setAttribute('aMat', new THREE.BufferAttribute(m, 1));
    rocks.push(gg);
  };
  rock(-47, 38, 9, 0.8); rock(-58, 22, 6.5); rock(-63, 50, 5); rock(52, 44, 8, 0.75); rock(60, 28, 6); rock(46, 63, 5.5);
  rock(-8, 74, 7, 0.55); rock(14, 80, 4.5); rock(-24, 69, 4); rock(-70, 4, 8); rock(70, 10, 7.5); rock(-52, -22, 6); rock(56, -18, 6.5);
  rock(0, -34, 8, 0.7); rock(-30, -30, 5); rock(30, -30, 4.5);
  for (let k = 0; k < 22; k++) { const a = R() * 6.28, rr = 38 + R() * 38; rock(Math.cos(a) * rr * 1.1, Math.sin(a) * rr * 0.75 + 20, 1.2 + R() * 2.8, 0.55 + R() * 0.4); }
  // a fallen piece of the great hand's finger, lying on the causeway in front of the knee
  {
    const g = new THREE.CapsuleGeometry(2.1, 9, 3, 6); g.rotateZ(Math.PI / 2 - 0.15); g.rotateY(0.5); g.translate(-35, 2.2, 82);
    const gg = g.toNonIndexed(); gg.deleteAttribute('uv'); gg.computeVertexNormals();
    gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 3).fill(0.62), 3));
    gg.setAttribute('aMat', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count).fill(1), 1));
    rocks.push(gg);
  }
  const rubble = new THREE.Mesh(mergeGeometries(rocks, false), mat);
  group.add(rubble);

  // ---- tatters: strips of robe hanging from the mantle's hem, under the forearms, and a veil at the hood's rim ----
  const strips = [];
  const strip = (x, y, z, len, r, outX, outZ, bend) => {
    // a ribbon of torn robe: flattened, tapering, curling outward as it falls
    const g = new THREE.ConeGeometry(r, len, 5, 5, false);
    g.scale(1, 1, 0.35);
    g.rotateX(Math.PI); g.translate(0, -len / 2, 0);
    g.rotateY(Math.atan2(outX, outZ) + Math.PI / 2 + (R() - 0.5) * 0.6);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const t = -pa.getY(i) / len; pa.setX(i, pa.getX(i) + outX * t * t * bend); pa.setZ(i, pa.getZ(i) + outZ * t * t * bend); }
    g.translate(x, y, z);
    g.computeVertexNormals();
    const c = new Float32Array(pa.count * 3), m = new Float32Array(pa.count);
    for (let i = 0; i < pa.count; i++) { const t = (y - pa.getY(i)) / len; const a = 0.62 - t * 0.22; c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = a; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(m, 1));
    g.deleteAttribute('uv');
    strips.push(g);
  };
  for (let k = 0; k < 46; k++) {
    const th = R() * Math.PI * 2, sx = Math.sin(th), sz = Math.cos(th);
    const back = 0.5 - 0.5 * sz, side = Math.abs(sx);
    if (sz > 0.75 && R() < 0.7) continue;                      // fewer across the chest: the hood's veil is the front
    const q = [sx * 42, 72 - back * 12 - side * 3 + 1, 4 + sz * 28];
    project(mantleHood, q, 5);
    if (q[1] < 30) continue;
    strip(q[0] + sx * 0.5, q[1] + 2, q[2] + sz * 0.5, 6 + R() * R() * 34, 1.6 + R() * 2.2, sx, sz, 2 + R() * 4);
  }
  for (const s of [-1, 1]) for (let k = 0; k < 12; k++) {
    // from the torn sleeve edges and along the forearms, hanging toward the ground
    const t = R(), onSleeve = k < 6;
    const a = onSleeve ? [SH[0] + (EL[0] - SH[0]) * (0.62 + t * 0.12), SH[1] + (EL[1] - SH[1]) * (0.62 + t * 0.12) - 8, SH[2] + (EL[2] - SH[2]) * (0.62 + t * 0.12)]
      : [EL[0] + (WR[0] - EL[0]) * t * 0.8, EL[1] + (WR[1] - EL[1]) * t * 0.8 - 6.5, EL[2] + (WR[2] - EL[2]) * t * 0.8];
    strip(s * (a[0] + (R() - 0.5) * 4), a[1], a[2] + (R() - 0.5) * 6, 6 + R() * R() * 26, 1.2 + R() * 1.6, s * 0.4, 0.3, 2.5);
  }
  // the hood's rim, and a veil of strands falling across the dark opening
  const rim = [];
  {
    const nC = new THREE.Vector3(...CUT.n), u = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3().crossVectors(nC, u).normalize();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2, q = [CUT.p[0] + Math.cos(a) * 14, CUT.p[1] + v.y * Math.sin(a) * 15, CUT.p[2] + v.z * Math.sin(a) * 15];
      project(mantleHood, q, 6);
      rim.push(new THREE.Vector3(q[0], q[1], q[2]));
    }
    for (let k = 0; k < 13; k++) {
      const q = rim[4 + Math.floor(R() * 17)];
      if (q.y > 92) continue;
      strip(q.x * 0.92, q.y + 0.5, q.z + 0.3, 5 + R() * 10, 0.7 + R() * 0.6, 0, 0.4, 1.5);
    }
  }
  const tatters = new THREE.Mesh(mergeGeometries(strips, false), mat);
  group.add(tatters);

  // ---- worn gold: bands on the arms and wrists, a rim around the hood's mouth, a four-point star on its brow ----
  const goldM = gold || new THREE.MeshStandardMaterial({ color: '#b08d4a', metalness: 1, roughness: 0.45 });
  const golds = [];
  const band = (a, b, t, r, w) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A).normalize(), c = A.clone().lerp(B, t);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    for (const [off, tube] of [[0, w], [-w * 2.2, w * 0.45], [w * 2.2, w * 0.45]]) {
      const g = new THREE.TorusGeometry(r + tube * 0.6, tube, 6, 40);
      g.applyQuaternion(q); g.translate(c.x + dir.x * off, c.y + dir.y * off, c.z + dir.z * off);
      golds.push(g);
    }
  };
  for (const s of [-1, 1]) {
    band([s * SH[0], SH[1], SH[2]], [s * EL[0], EL[1], EL[2]], 0.83, 8.7, 1.5);
    band([s * EL[0], EL[1], EL[2]], [s * WR[0], WR[1], WR[2]], 0.84, 7.2, 1.25);
  }
  {
    const curve = new THREE.CatmullRomCurve3(rim, true);
    golds.push(new THREE.TubeGeometry(curve, 96, 0.6, 5, true));
    // the crest: a four-point star on the hood's brow (the Burden Colossus, the ladder's helm)
    const sh = new THREE.Shape(), Rr = 6.5, r = 1.6;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 2, rr = k % 2 ? r : Rr; k ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const star = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 1 });
    const q = project(mantleHood, [0, 104, 36], 8), nn = grad(mantleHood, q[0], q[1], q[2]);
    star.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...nn)));
    star.translate(q[0] + nn[0] * 0.3, q[1] + nn[1] * 0.3, q[2] + nn[2] * 0.3);
    golds.push(star);
  }
  const goldMesh = new THREE.Mesh(mergeGeometries(golds.map((g) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k); return g; }), false), goldM);
  group.add(goldMesh);

  group.scale.setScalar(scale);
  for (const o of [bodyMesh, tatters, goldMesh, rubble]) { o.castShadow = false; o.receiveShadow = false; }
  const U = mat.userData.U;
  const sunV = new THREE.Vector3();
  const ms = performance.now() - t0;
  return {
    group, material: mat, buildMs: ms, triangles: idx.length / 3, timing: { paint: tA - t0, field: tB - tA, vertices: tC - tB, rest: performance.now() - tC },
    headLocal: new THREE.Vector3(0, 95, 24),
    update(t) { U.uTime.value = t; },
    /** Follow the day: rim from the sky glow behind it, crack glow, the light's direction in view space. */
    setDay(k, camera) {
      U.uRim.value.copy(k.glow).multiplyScalar(0.55).lerp(k.rim, 0.5).multiplyScalar(0.8);
      U.uCrack.value = k.colossus;
      U.uHood.value = k.colossus * 0.45;
      if (camera) sunV.copy(k.lightDir).transformDirection(camera.matrixWorldInverse), U.uSunV.value.copy(sunV);
    },
    viewDir(k, camera) { U.uSunV.value.copy(k.lightDir).transformDirection(camera.matrixWorldInverse); },
  };
}
