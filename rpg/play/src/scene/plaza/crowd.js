// The crowd: every citizen is one instance of a single billboarded sprite mesh (one draw call, one shadow draw), its frame
// picked per instance from the citizens sheet. Simple lives: strolling between places, browsing at stalls, selling,
// chatting in twos and threes, children darting about, keepers standing by the temple doors.
// recognize(): the moment Atlas is seen. A ripple from the nearest outward: each one stops, turns to him, looks up for a
// few seconds (a child points), then life resumes. Nobody kneels, nobody runs.
import * as THREE from 'three';
import { addSpriteRim } from '../../engine/actors/character.js';
import { paintCitizenSheet, cellUV, VARIANTS, CHILD_VARIANTS, COL, ELDER_VARIANT, CIT_FW, CIT_FH } from './citizens-art.js';

const PPU = 40;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _y = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _p = new THREE.Vector3();

function patchCells(mat, cellSize, key) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    sh.uniforms.uCellSize = { value: cellSize };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aCell; uniform vec2 uCellSize;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = uv * uCellSize + aCell;\n#endif');
  };
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => prevKey() + '|cells-' + key;
  mat.needsUpdate = true;
}

export class Crowd {
  constructor({ scene, glow, rim, walkable, heightAt, seed = 7, max = 120 }) {
    this.walkable = walkable; this.heightAt = heightAt;
    let s = seed * 9301 + 49297;
    this.R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const sheet = paintCitizenSheet();
    this.sheetW = sheet.w; this.sheetH = sheet.h;
    const tex = sheet.map.texture({ repeat: false, mips: false });
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    const cell = new THREE.Vector2(CIT_FW / sheet.w, CIT_FH / sheet.h);
    const geo = new THREE.PlaneGeometry(CIT_FW / PPU, CIT_FH / PPU); geo.translate(0, CIT_FH / PPU / 2, 0);
    this.cells = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2);
    this.cells.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aCell', this.cells);
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 });
    patchCells(mat, cell, 'crowd');
    addSpriteRim(mat, new THREE.Vector2(1 / sheet.w, 1 / sheet.h), rim, 0.9);
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    patchCells(depth, cell, 'crowd-depth');
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.customDepthMaterial = depth;
    this.mesh.castShadow = true; this.mesh.receiveShadow = false; this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.material = mat;
    const sg = new THREE.PlaneGeometry(1.3, 0.75); sg.rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ map: glow, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }), max);
    this.shadows.frustumCulled = false; this.shadows.renderOrder = 2; this.shadows.count = 0;
    scene.add(this.mesh, this.shadows);
    this.agents = [];
    this.max = max;
    this.stallSlots = [];
    this.regions = [];
    this.time = 0;
  }

  /** Add a citizen. kind: wander | child | stall | merchant | chat | attendant. */
  add({ x, z, kind = 'wander', variant, face = [0, 1], speed, path = null, ping = false, pi = 0, pause = 0, sy = 1, lift = 0, bob = 0, bobF = 2.4, talk = false }) {
    if (this.agents.length >= this.max) return null;
    const R = this.R;
    if (variant === undefined) {
      if (kind === 'child') variant = CHILD_VARIANTS[(R() * CHILD_VARIANTS.length) | 0];
      else { do variant = (R() * ELDER_VARIANT) | 0; while (CHILD_VARIANTS.includes(variant)); }
    }
    const child = CHILD_VARIANTS.includes(variant);
    const a = {
      p: new THREE.Vector3(x, this.heightAt(x, z), z), v: new THREE.Vector3(), variant, kind, child,
      speed: speed ?? (child ? 2.4 + R() * 0.8 : 1.05 + R() * 0.45), target: null, wait: R() * 3,
      faceVec: new THREE.Vector3(face[0], 0, face[1]).normalize(), dir: 'down', animT: R() * 10, phase: R() * 10,
      home: new THREE.Vector3(x, 0, z), homeFace: new THREE.Vector3(face[0], 0, face[1]).normalize(), recog: null, stuck: 0, turnT: 2 + R() * 6,
      col: 0, path, ping, pi, pdir: 1, pause, sy, lift, bob, bobF, talk,
    };
    this.agents.push(a);
    this.mesh.count = this.shadows.count = this.agents.length;
    return a;
  }

  pickTarget(a) {
    const R = this.R;
    for (let k = 0; k < 12; k++) {
      const reg = this.regions[(R() * this.regions.length) | 0];
      if (!reg) return null;
      const x = reg[0] + R() * (reg[2] - reg[0]), z = reg[1] + R() * (reg[3] - reg[1]);
      if (!this.walkable(x, z)) continue;
      // a straight walk that stays on walkable ground most of the way
      let ok = true;
      for (let t = 0.2; t < 1; t += 0.2) if (!this.walkable(a.p.x + (x - a.p.x) * t, a.p.z + (z - a.p.z) * t)) { ok = false; break; }
      if (ok || k > 9) return new THREE.Vector3(x, 0, z);
    }
    return null;
  }

  /** The moment he is seen: a ripple from the nearest outward. */
  recognize(heroPos, { radius = 26, max = 34, hold = 3.6 } = {}) {
    const now = this.time, R = this.R;
    const list = this.agents.map((a) => [a, Math.hypot(a.p.x - heroPos.x, a.p.z - heroPos.z)]).filter((e) => e[1] < radius).sort((p, q) => p[1] - q[1]).slice(0, max);
    let pointer = list.find((e) => e[0].child && e[1] < radius * 0.8);
    for (const [a, d] of list) {
      const t0 = now + 0.15 + d * 0.05 + R() * 0.3;
      a.recog = { t0, t1: t0 + hold + R() * 1.8, point: pointer && a === pointer[0], look: heroPos.clone() };
      if (a.recog.point) { a.recog.p0 = t0 + 0.8; a.recog.p1 = t0 + 3.0; a.recog.t1 = Math.max(a.recog.t1, t0 + 4.4); }
    }
    return list.length;
  }

  update(dt, t, camera, camRight, camFwd, hero) {
    this.time += dt;
    const now = this.time, R = this.R, A = this.agents, n = A.length;
    for (let i = 0; i < n; i++) {
      const a = A[i];
      let wantV = _v.set(0, 0, 0), moving = false, col = -1;
      const rc = a.recog && now >= a.recog.t0 ? a.recog : null;
      if (a.recog && now >= a.recog.t1) { a.recog = null; a.wait = Math.max(a.wait, 0.4 + R() * 1.4); }
      if (rc) {
        // stopped, turned to him, looking up
        a.faceVec.set(rc.look.x - a.p.x, 0, rc.look.z - a.p.z).normalize();
        const k = now - rc.t0;
        col = k < 0.28 ? 0 : COL.look;
        if (rc.point && now > rc.p0 && now < rc.p1) col = COL.point;
      } else if (a.faceAt) {
        // in conversation (talk.js): stand still and keep facing whoever they are talking to
        a.faceVec.set(a.faceAt.x - a.p.x, 0, a.faceAt.z - a.p.z); if (a.faceVec.lengthSq() < 1e-6) a.faceVec.set(0, 0, 1); a.faceVec.normalize();
      } else if (a.wait > 0) {
        a.wait -= dt;
        a.turnT -= dt;
        if (a.turnT < 0 && (a.kind === 'wander' || a.kind === 'child')) { a.turnT = 2 + R() * 5; const ang = R() * 6.28; a.faceVec.set(Math.sin(ang), 0, Math.cos(ang)); }
      } else if (a.kind === 'path' && a.path) {
        // a little life on a loop: kids chasing round a pool, a sweeper along the paving
        const w = a.path[a.pi], dx = w[0] - a.p.x, dz = w[1] - a.p.z, d = Math.hypot(dx, dz);
        if (d < 0.4) {
          a.pi += a.pdir;
          if (a.pi >= a.path.length || a.pi < 0) { if (a.ping) { a.pdir = -a.pdir; a.pi += 2 * a.pdir; } else a.pi = 0; }
          a.wait = a.pause;
        } else { wantV.set(dx / d, 0, dz / d).multiplyScalar(a.speed); moving = true; }
      } else if (a.kind === 'wander' || a.kind === 'child') {
        if (!a.target) a.target = this.pickTarget(a);
        if (a.target) {
          const dx = a.target.x - a.p.x, dz = a.target.z - a.p.z, d = Math.hypot(dx, dz);
          if (d < 0.45) { a.target = null; a.wait = a.child ? 0.3 + R() * 1.8 : 1.2 + R() * 5; }
          else { wantV.set(dx / d, 0, dz / d).multiplyScalar(a.speed); moving = true; }
        }
      } else {
        // anchored lives: stand at home, face the work; drift back if pushed off
        const dx = a.home.x - a.p.x, dz = a.home.z - a.p.z, d = Math.hypot(dx, dz);
        if (d > 0.35) { wantV.set(dx / d, 0, dz / d).multiplyScalar(Math.min(a.speed, d * 2)); moving = d > 0.5; }
        else {
          a.turnT -= dt;
          if (a.turnT < 0) {
            a.turnT = 3 + R() * 7;
            if (a.kind === 'stall' && this.stallSlots.length && R() < 0.35) {
              const s = this.stallSlots[(R() * this.stallSlots.length) | 0];
              a.home.set(s[0], 0, s[1]); a.homeFace.set(s[2], 0, s[3]).normalize();
            }
            a.look = R() < 0.3 ? new THREE.Vector3(R() - 0.5, 0, R() - 0.5).normalize() : null;
          }
          a.faceVec.copy(a.look || a.homeFace);
        }
      }
      // ease velocity (people don't snap), separation from neighbours and from Atlas
      a.v.lerp(wantV, 1 - Math.exp(-dt * (rc ? 9 : 5)));
      for (let j = i + 1; j < n; j++) {
        const b = A[j], dx = b.p.x - a.p.x, dz = b.p.z - a.p.z, d2 = dx * dx + dz * dz;
        if (d2 < 0.72 && d2 > 1e-6) {
          const d = Math.sqrt(d2), push = (0.85 - d) * 1.6 * dt / d;
          if (!a.recog) { a.p.x -= dx * push; a.p.z -= dz * push; }
          if (!b.recog) { b.p.x += dx * push; b.p.z += dz * push; }
        }
      }
      if (hero) {
        const dx = a.p.x - hero.x, dz = a.p.z - hero.z, d2 = dx * dx + dz * dz;
        if (d2 < 1.3 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (1.15 - d) * 3 * dt / d; const nx = a.p.x + dx * push, nz = a.p.z + dz * push; if (this.walkable(nx, nz, a)) { a.p.x = nx; a.p.z = nz; } }
      }
      const nx = a.p.x + a.v.x * dt, nz = a.p.z + a.v.z * dt;
      if (this.walkable(nx, nz, a)) { a.p.x = nx; a.p.z = nz; a.stuck = 0; }
      else if (this.walkable(nx, a.p.z, a)) { a.p.x = nx; a.stuck += dt * 0.5; }
      else if (this.walkable(a.p.x, nz, a)) { a.p.z = nz; a.stuck += dt * 0.5; }
      else { a.stuck += dt; a.v.multiplyScalar(0.5); }
      if (a.stuck > 0.8) { a.target = null; a.stuck = 0; a.wait = 0.2; }
      const sp = Math.hypot(a.v.x, a.v.z);
      if (!rc && sp > 0.25 && moving) a.faceVec.set(a.v.x, 0, a.v.z).normalize();
      a.p.y = this.heightAt(a.p.x, a.p.z);
      // facing -> one of four sprite rows, relative to the camera
      const lx = a.faceVec.dot(camRight), ly = a.faceVec.dot(camFwd);
      a.dir = Math.abs(lx) > Math.abs(ly) * 1.05 ? (lx > 0 ? 'right' : 'left') : ly > 0 ? 'up' : 'down';
      if (col < 0) {
        if (sp > 0.3) { a.animT += dt * sp * 3.4; col = COL.walk + (Math.floor(a.animT) % 4); }
        else { a.animT += dt * (a.talk || a.faceAt || a.kind === 'chat' ? 2.2 : 0.8); col = Math.floor(a.animT + a.phase) % 2; }
      }
      if (a.pose !== undefined) col = a.pose;
      a.col = col;
      const uv = cellUV(this.sheetW, this.sheetH, a.variant, a.dir, col);
      this.cells.setXY(i, uv[0], uv[1]);
      _q.setFromAxisAngle(_y, Math.atan2(camera.position.x - a.p.x, camera.position.z - a.p.z));
      _s.set(1, a.sy, 1);
      _p.copy(a.p); _p.y += a.lift + (a.bob ? Math.abs(Math.sin(now * a.bobF + a.phase)) * a.bob : 0);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
      _m.makeTranslation(a.p.x, a.p.y + 0.02, a.p.z);
      this.shadows.setMatrixAt(i, _m);
    }
    this.cells.needsUpdate = true;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.shadows.instanceMatrix.needsUpdate = true;
  }

  /** Is anyone standing at (x, z)? (Atlas walks around people, not through them.) */
  occupied(x, z, r = 0.55) {
    for (const a of this.agents) { const dx = a.p.x - x, dz = a.p.z - z; if (dx * dx + dz * dz < r * r) return a; }
    return null;
  }
}
