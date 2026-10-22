// Builds the plaza's architecture into Batches (a handful of draw calls): floor, the temple portico and steps, the old
// stone circle, pools and fountains, the white-gold buildings around the square, the City gate, the terraced City beyond
// with its waterfalls and spires, and the Nexus beacon over the crown.
import * as THREE from 'three';
import { upperCity } from '../../engine/world/telor-upper.js';
import { building as stoneBuilding } from '../../engine/world/city.js';
import { brightFallMaterial } from './falls.js';
import { P, frame, faceRot } from './layout.js';

// Plaza-local future-ancient envelope. Keeps the original footprint and seeded draws.
function building(B, R, spec) {
  const top = stoneBuilding(B, R, spec);
  const { x,z,w,d,base=0,floors,roof } = spec;
  if (base > 0 || Math.abs(x) > 44 || z < -65) return top;
  const h=floors*4;
  for(const side of [-1,1]) {
    for(let k=0;k<3;k++) {
      const zz=z+(k-1)*d*.28;
      B.box('skyglass',.06,h*.75,d*.19,x+side*(w/2+.035),base+1.2+h*.5,zz,{uv:false});
      for(const dz of [-d*.095,d*.095]) B.box('gold',.10,h*.78,.07,x+side*(w/2+.08),base+1.2+h*.5,zz+dz,{uv:false});
    }
    B.box('signal',.07,.10,d,x+side*(w/2+.09),top-.25,z,{uv:false});
    for(let k=0;k<3;k++) {
      const xx=x+(k-1)*w*.28;
      B.box('skyglass',w*.19,h*.75,.06,xx,base+1.2+h*.5,z+side*(d/2+.035),{uv:false});
      for(const dx of [-w*.095,w*.095]) B.box('gold',.07,h*.78,.10,xx+dx,base+1.2+h*.5,z+side*(d/2+.08),{uv:false});
    }
    B.box('signal',w,.10,.07,x,top-.25,z+side*(d/2+.09),{uv:false});
  }
  if(roof==='dome') {
    const r=Math.min(w,d)*.36+.035, y=top+.8;
    const glass=new THREE.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2);glass.translate(x,y,z);B.add('skyglass',glass,{uv:false});
    // Gold meridians and latitude rings over faceted glass; a warm heart under the crown.
    for(let k=0;k<8;k++) {
      const g=new THREE.TorusGeometry(r,.045,4,16,Math.PI);g.rotateY(k*Math.PI/8);g.translate(x,y,z);B.add('gold',g,{uv:false});
    }
    for(const a of [.38,.8,1.18]) {
      const g=new THREE.TorusGeometry(r*Math.sin(a),.055,4,16);g.rotateX(Math.PI/2);g.translate(x,y+r*Math.cos(a),z);B.add('gold',g,{uv:false});
    }
    B.cyl('goldBright',.28,1.2,x,y+r-.5,z,6);
    const glow=new THREE.TorusGeometry(r*.94,.065,4,24);glow.rotateX(Math.PI/2);glow.translate(x,y+r*.34,z);B.add('goldBright',glow,{uv:false});
  }
  return top;
}

const WIN = ['win0', 'win1', 'win2'];

/** Telor's split-crown spire: ivory structure, recessed navy glass, gold ribs and thin Signal seams.
 * Keep the legacy dome default's random draw so the seeded ground-level dressing stays stable. */
export function tower(B, R, { x, z, r = 2.4, h = 28, base = 0, win = 'win0', dome = R() < 0.3 }) {
  B.cyl('old', r + 0.45, 1.2, x, base, z, 8);
  B.cyl('skyglass', r, h, x, base + 1.2, z, 8, r * 0.63);
  const top = base + 1.2 + h, rt = r * 0.63;
  // Recessed midnight glass between slender white-gold ribs; asymmetrical split crowns.
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, sn = Math.sin(a), cs = Math.cos(a);
    const g = new THREE.BoxGeometry(r * .42, h * .82, .09);
    g.rotateY(a); g.translate(x + sn * r * .77, base + 1.2 + h * .49, z + cs * r * .77);
    B.add('skyglass', g, { uv: false });
    B.box('gold', .09, h * .87, .09, x + sn * r * .93, base + h * .47, z + cs * r * .93, { uv:false });
    if (k % 2 === 0) B.box('signal', .06, h * .7, .06, x + sn * r * .96, base + h * .5, z + cs * r * .96, { uv:false });
  }
  B.cyl('gold', r * .8, .2, x, base + h * .72, z, 8);
  B.cyl('ashlar2', rt * 1.5, .5, x, top - 3, z, 8);
  B.cyl('cyan', rt * 1.5, .07, x, top - 2.5, z, 8);
  const y = top, nh = rt * 6;
  for (const side of [-1, 1]) {
    B.cone('ashlar2', rt * .48, nh * (side < 0 ? 1 : .72), x + side * rt * .55, y - 1, z, 5);
    B.cone('gold', .09, nh * .9, x + side * rt * .55, y, z, 5);
  }
  return y + nh;
}

/** Transform a geometry into a local frame and add it to a batch. */
export function addLocal(B, key, geo, fr, opts) { geo.applyMatrix4(fr.m); return B.add(key, geo, opts); }
export function lbox(B, key, fr, w, h, d, x, y, z, opts = {}) { const g = new THREE.BoxGeometry(w, h, d); if (opts.rotY) g.rotateY(opts.rotY); g.translate(x, y, z); return addLocal(B, key, g, fr, opts); }
export function lcyl(B, key, fr, r, h, x, y, z, seg = 12, rTop) { const g = new THREE.CylinderGeometry(rTop ?? r, r, h, seg, 1); g.translate(x, y + h / 2, z); return addLocal(B, key, g, fr); }

/** A slab with an arched opening, extruded toward +z from z = 0 (local). */
export function archSlab(width, height, openW, springY, depth, { pointed = false } = {}) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0); s.lineTo(-openW / 2, 0); s.lineTo(-openW / 2, springY);
  if (pointed) { s.quadraticCurveTo(-openW / 2, springY + openW * 0.55, 0, springY + openW * 0.75); s.quadraticCurveTo(openW / 2, springY + openW * 0.55, openW / 2, springY); }
  else s.absarc(0, springY, openW / 2, Math.PI, 0, true);
  s.lineTo(openW / 2, 0); s.lineTo(width / 2, 0); s.lineTo(width / 2, height); s.lineTo(-width / 2, height); s.lineTo(-width / 2, 0);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 18 });
}

/** A gold half-ring tracing an arch (archivolt), at local z. */
export function archRing(B, fr, r, springY, z, tube = 0.14, key = 'gold') {
  const g = new THREE.TorusGeometry(r, tube, 6, 28, Math.PI); g.translate(0, springY, z);
  return addLocal(B, key, g, fr, { uv: false });
}

/** Dress a building's plaza-facing wall like carved white marble: an arched ground arcade with gold archivolts, fluted
 *  pilasters with gold bases and capitals up to a heavy cornice, gold string courses at each floor, and a thin Signal-cyan
 *  dashed frieze under the cornice. `p` = +1 / -1: which way (x) the wall faces the square. */
export function dressFacade(B, R, { x, z0, z1, p, floors, arcade = true }) {
  const H = 1.2 + floors * 4, wz = z1 - z0, n = Math.max(2, Math.round(wz / 3)), step = wz / n, ry = p > 0 ? Math.PI / 2 : -Math.PI / 2;
  const noUV = { uv: false };
  for (let k = 0; k < n; k++) {
    const pz = z0 + (k + 0.5) * step;
    if (arcade && step > 2.4) {
      // Recessed masonry and waist-high rails make these decorative bays read closed.
      B.box('old', .3, 3.8, step-.65, x+p*.12, 2.1, pz);
      B.box('skyglass', .035, 2.5, step-1.2, x+p*.30, 2.5, pz);
      B.box('signal', .045, 2.7, .045, x+p*.33, 2.5, pz);
      B.box('gold', .16, .12, step-.65, x+p*.55, 1.25, pz, noUV);
      for (const dz of [-.7,0,.7]) B.box('gold', .12, 1.2, .12, x+p*.55, .65, pz+dz, noUV);
      const g = archSlab(step - 0.55, 4.6, step - 1.5, 2.9, 0.34); g.translate(0, 0, -0.17); g.rotateY(ry); g.translate(x + p * 0.18, 0.2, pz); B.add('ashlar2', g);
      const r = new THREE.TorusGeometry((step - 1.5) / 2 + 0.1, 0.11, 6, 22, Math.PI); r.translate(0, 3.1, 0.2); r.rotateY(ry); r.translate(x + p * 0.18, 0.2, pz); B.add('gold', r, noUV);
      const keystone = new THREE.BoxGeometry(0.26, 0.4, 0.18); keystone.translate(0, 3.1 + (step - 1.5) / 2 + 0.1, 0.22); keystone.rotateY(ry); keystone.translate(x + p * 0.18, 0.2, pz); B.add('goldBright', keystone, noUV);
    }
    const pzp = z0 + k * step;                           // pilasters between the bays
    for (const zz of k === 0 ? [pzp, pzp + step] : [pzp + step]) {
      B.box('ashlar2', 0.5, H - 1.9, 0.5, x + p * 0.3, 1.2 + (H - 1.9) / 2 + 0.2, zz);
      B.box('gold', 0.74, 0.18, 0.74, x + p * 0.3, 1.2 + 0.1, zz, noUV);
      B.box('gold', 0.74, 0.22, 0.74, x + p * 0.3, H - 0.75, zz, noUV);
      B.box('ashlar', 0.62, 0.12, 0.62, x + p * 0.3, H - 0.6, zz);
      for (const o of [-0.13, 0.13]) B.box('ashlar', 0.07, H - 2.4, 0.07, x + p * 0.58, 1.2 + (H - 2.4) / 2 + 0.5, zz + o, noUV);   // fluting
    }
  }
  for (let f = 1; f < floors; f++) B.box('gold', 0.34, 0.13, wz, x + p * 0.17, 1.2 + f * 4 + 0.05, (z0 + z1) / 2, noUV);
  B.box('ashlar2', 0.95, 0.5, wz + 0.4, x + p * 0.45, H + 0.05, (z0 + z1) / 2);        // cornice
  B.box('gold', 1.02, 0.09, wz + 0.45, x + p * 0.47, H + 0.33, (z0 + z1) / 2, noUV);
  for (let z = z0 + 0.7; z < z1 - 0.4; z += 1.15) B.box('cyan', 0.05, 0.22, 0.6, x + p * 0.93, H - 0.35, z, noUV);   // Signal frieze
  for (const zz of [z0, z1]) { const o = new THREE.SphereGeometry(0.2, 8, 6); o.translate(x + p * 0.45, H + 0.7, zz); B.add('goldBright', o, noUV); B.box('gold', 0.18, 0.4, 0.18, x + p * 0.45, H + 0.45, zz, noUV); }
}

export function buildWorld(scene, B, Bn, M, ctx) {
  const { R, lights, lanternPos, walk } = ctx;
  const L = P.LAND_Y, I = frame(0, 0, 0);

  // ---------- floor: polished marble, the processional causeway through the middle ----------
  {
    const g = new THREE.PlaneGeometry(56, 84); g.rotateX(-Math.PI / 2); g.translate(0, 0, -7);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 8, -p.getZ(i) / 8);
    const floor = new THREE.Mesh(g, M.marble); floor.receiveShadow = true; floor.layers.set(1); scene.add(floor);
    M.road.polygonOffset = true; M.road.polygonOffsetFactor = -1; M.road.polygonOffsetUnits = -1;
    const C = P.CIRCLE;
    for (const [z0, z1] of [[C.z + C.rOut - 0.2, 31], [-96, C.z - C.rOut + 0.2]]) {
      const len = z1 - z0, rg = new THREE.PlaneGeometry(7, len); rg.rotateX(-Math.PI / 2); rg.translate(0, 0.004, (z0 + z1) / 2);
      const u = rg.attributes.uv, pp = rg.attributes.position;
      for (let i = 0; i < pp.count; i++) u.setXY(i, (pp.getX(i) + 3.5) / 7, -pp.getZ(i) / 8);
      const road = new THREE.Mesh(rg, M.road); road.receiveShadow = true; road.layers.set(1); scene.add(road);
    }
    // gold edging along the causeway
    for (const s of [-1, 1]) for (const [z0, z1] of [[C.z + C.rOut, 31], [-96, C.z - C.rOut]]) B.box('gold', 0.12, 0.03, z1 - z0, s * 3.56, 0.015, (z0 + z1) / 2, { uv: false });
  }

  // ---------- the temple: landing, steps, portico columns, braziers ----------
  {
    const dryMarble = M.marbleDry;
    const top = new THREE.PlaneGeometry(26, P.LAND_Z1 - P.STEP_Z1); top.rotateX(-Math.PI / 2); top.translate(0, L + 0.001, (P.STEP_Z1 + P.LAND_Z1) / 2);
    const u = top.attributes.uv, pp = top.attributes.position;
    for (let i = 0; i < pp.count; i++) u.setXY(i, pp.getX(i) / 8, -pp.getZ(i) / 8);
    const tm = new THREE.Mesh(top, dryMarble); tm.receiveShadow = true; scene.add(tm);
    B.box('ashlar', 26, L, P.LAND_Z1 - P.STEP_Z1, 0, L / 2 - 0.001, (P.STEP_Z1 + P.LAND_Z1) / 2);
    for (let k = 0; k < 9; k++) {
      const z0 = P.STEP_Z0 + k, y = (k + 1) * 0.4;
      B.box('ashlar', 24, y, P.STEP_Z1 - z0, 0, y / 2, (z0 + P.STEP_Z1) / 2);
      B.box('gold', 24, 0.05, 0.1, 0, y - 0.02, z0 + 0.05, { uv: false });
    }
    // cheek walls stepping down beside the stair, gold-capped, with urns of white flowers
    for (const s of [-1, 1]) {
      for (let k = 0; k < 9; k++) { const z0 = P.STEP_Z0 + k, y = (k + 1) * 0.4 + 0.9; B.box('ashlar2', 1.6, y, 1.0, s * 12.8, y / 2, z0 + 0.5); B.box('gold', 1.7, 0.06, 1.02, s * 12.8, y + 0.03, z0 + 0.5, { uv: false }); }
      B.box('ashlar2', 2.4, 1.6, 2.4, s * 12.8, 0.8, P.STEP_Z0 - 0.6);
      B.box('gold', 2.5, 0.08, 2.5, s * 12.8, 1.6, P.STEP_Z0 - 0.6, { uv: false });
      B.cyl('brass', 0.7, 0.9, s * 12.8, 1.64, P.STEP_Z0 - 0.6, 10, 0.95);
      ctx.flowerAt(s * 12.8, 2.5, P.STEP_Z0 - 0.6, 2.4, 'white');
      B.box('ashlar', 1.2, 1.1, P.LAND_Z1 - P.STEP_Z1, s * 13.4, L + 0.55, (P.STEP_Z1 + P.LAND_Z1) / 2);
      B.box('gold', 1.3, 0.06, P.LAND_Z1 - P.STEP_Z1, s * 13.4, L + 1.13, (P.STEP_Z1 + P.LAND_Z1) / 2, { uv: false });
    }
    // portico columns: four great fluted shafts, gold rings, under a gold-banded entablature
    const colZ = 45.6, H = 16;
    for (const x of [-12.4, -7.6, 7.6, 12.4]) {
      B.box('ashlar2', 2.3, 0.7, 2.3, x, L + 0.35, colZ);
      B.cyl('gold', 1.02, 0.25, x, L + 0.7, colZ, 20);
      B.cyl('ashlar2', 0.88, H - 1.6, x, L + 0.95, colZ, 16, 0.8);
      B.cyl('gold', 0.92, 0.3, x, L + H - 0.65, colZ, 20);
      B.box('ashlar2', 2.3, 0.9, 2.3, x, L + H - 0.1, colZ);
      B.box('gold', 2.36, 0.08, 2.36, x, L + H - 0.55, colZ, { uv: false });
    }
    B.box('ashlar', 28, 2.2, 2.6, 0, L + H + 1.4, colZ);
    B.box('gold', 28.1, 0.12, 2.66, 0, L + H + 0.7, colZ, { uv: false });
    B.box('gold', 28.1, 0.12, 2.66, 0, L + H + 2.2, colZ, { uv: false });
    // shrine braziers at the head of the stair (the prototype's warm gold shrine)
    for (const s of [-1, 1]) {
      const bx = s * 8.6, bz = P.STEP_Z1 + 1.4;
      B.box('ashlar2', 1.6, 0.5, 1.6, bx, L + 0.25, bz);
      B.cyl('brass', 0.32, 1.3, bx, L + 0.5, bz, 8, 0.24);
      B.cyl('brass', 0.5, 0.38, bx, L + 1.8, bz, 10, 0.8);
      ctx.flames.add(bx, L + 2.02, bz, 0.95);
      lanternPos.push(new THREE.Vector3(bx, L + 2.5, bz));
      lights.add({ pos: new THREE.Vector3(bx, L + 2.8, bz), color: '#ff9a3c', intensity: 40, distance: 15, flicker: 0.22, role: 'lantern', priority: 1.6 });
    }
    walk.rect(-P.LAND_X + 0.4, P.STEP_Z0 - 0.2, P.LAND_X - 0.4, P.DOOR_Z + 0.6, 0);
    walk.rect(-12, P.STEP_Z0 - 1.9, -11.2, P.LAND_Z1, 1); walk.rect(11.2, P.STEP_Z0 - 1.9, 12, P.LAND_Z1, 1);
    for (const x of [-12.4, -7.6, 7.6, 12.4]) walk.circle(x, colZ, 1.4);
    for (const s of [-1, 1]) walk.circle(s * 8.6, P.STEP_Z1 + 1.4, 1.0);
  }

  // ---------- the old stone circle at the heart, ringed by water ----------
  const C = P.CIRCLE;
  const circle = { stones: [], fire: new THREE.Vector3(C.x, 0.9, C.z) };
  {
    const ring = (r0, r1, y0, h, key, seg = 64) => {
      const s = new THREE.Shape(); s.absarc(0, 0, r1, 0, Math.PI * 2, false);
      const hole = new THREE.Path(); hole.absarc(0, 0, r0, 0, Math.PI * 2, true); s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg }); g.rotateX(-Math.PI / 2); g.translate(C.x, y0, C.z);
      return B.add(key, g);
    };
    // raised old floor, coping rings, and the water between them
    const inner = new THREE.CylinderGeometry(C.rIn, C.rIn, 0.12, 64, 1); inner.translate(C.x, 0.06, C.z); B.add('oldflags', inner);
    ring(C.rIn - 0.05, C.rIn + 0.35, 0, 0.3, 'old');
    ring(C.rOut - 0.35, C.rOut + 0.2, 0, 0.36, 'old');
    ring(C.rOut + 0.2, C.rOut + 0.28, 0, 0.37, 'gold', 96);
    const wg = new THREE.RingGeometry(C.rIn + 0.3, C.rOut - 0.3, 72, 1); wg.rotateX(-Math.PI / 2); wg.translate(C.x, 0.12, C.z);
    const water = new THREE.Mesh(wg, M.water); water.layers.set(1); water.receiveShadow = true; scene.add(water);
    // inlaid gold rings in the marble around it
    for (const [r, w] of [[11.2, 0.12], [12.0, 0.05], [15.5, 0.08]]) { const g = new THREE.RingGeometry(r - w, r + w, 128, 1); g.rotateX(-Math.PI / 2); g.translate(C.x, 0.006, C.z); B.add('gold', g, { uv: false }); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r0 = 12.2, r1 = k % 4 === 0 ? 15.3 : 13.6; const g = new THREE.PlaneGeometry(0.1, r1 - r0); g.rotateX(-Math.PI / 2); g.translate(0, 0.006, -(r0 + r1) / 2); g.rotateY(a); g.translate(C.x, 0, C.z); B.add('gold', g, { uv: false }); }
    // four causeways over the water (N and S carry the processional way)
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const g = new THREE.BoxGeometry(C.causeway * 2, 0.16, C.rOut - C.rIn + 1.2); g.translate(0, 0.08, -(C.rIn + C.rOut) / 2); g.rotateY(a); g.translate(C.x, 0, C.z);
      B.add('oldflags', g);
    }
    // the stones: weathered, irregular, one leaning, two lintels; gold marks carved on their inner faces
    const angles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
    const tall = [3.8, 4.4, 3.4, 4.1, 3.6, 4.6, 3.2, 4.0];
    const markGeo = [];
    angles.forEach((deg, k) => {
      const a = THREE.MathUtils.degToRad(deg), x = C.x + Math.cos(a) * C.rStones, z = C.z + Math.sin(a) * C.rStones;
      const w = 1.3 + R() * 0.4, h = tall[k], d = 0.75 + R() * 0.2;
      const g = new THREE.BoxGeometry(w, h, d, 2, 4, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i) / h + 0.5;
        p.setX(i, p.getX(i) * (1 - y * 0.22) + (R() - 0.5) * 0.12);
        p.setZ(i, p.getZ(i) * (1 - y * 0.15) + (R() - 0.5) * 0.08);
        if (y > 0.99) p.setY(i, p.getY(i) - R() * 0.35);
      }
      g.computeVertexNormals();
      const lean = k === 6 ? 0.16 : (R() - 0.5) * 0.05;
      g.translate(0, h / 2 - 0.05, 0); g.rotateZ(lean);
      g.rotateY(-a + Math.PI / 2); g.translate(x, 0.12, z);
      B.add('old', g);
      circle.stones.push({ x, z, h, a });
      walk.circle(x, z, 1.05);
      // the carving on the inner face
      const mg = new THREE.PlaneGeometry(0.9, 0.9);
      const q = k % 4, uv = mg.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (q % 2) * 0.5 + uv.getX(i) * 0.5, 0.5 - Math.floor(q / 2) * 0.5 + uv.getY(i) * 0.5);
      mg.translate(0, h * 0.55, d / 2 + 0.02); mg.rotateY(-a - Math.PI / 2);
      mg.translate(x, 0.12, z);
      markGeo.push(mg);
      // offerings at its foot: a candle or two, a few white flowers
      for (let c = 0; c < 2; c++) {
        const ca = a + (c - 0.5) * 0.25, cr = C.rStones - 0.75;
        const cx = C.x + Math.cos(ca) * cr, cz = C.z + Math.sin(ca) * cr;
        B.cyl('candle', 0.06, 0.22 + c * 0.08, cx, 0.12, cz, 6);
        ctx.candles.push(new THREE.Vector3(cx, 0.12 + 0.3 + c * 0.08, cz));
      }
    });
    // lintels across two pairs (trilithons)
    for (const [i, j] of [[1, 2], [5, 4]]) {
      const s1 = circle.stones[i], s2 = circle.stones[j];
      const hy = Math.min(s1.h, s2.h) - 0.25, mx = (s1.x + s2.x) / 2, mz = (s1.z + s2.z) / 2, len = Math.hypot(s2.x - s1.x, s2.z - s1.z) + 1.4;
      const g = new THREE.BoxGeometry(len, 0.75, 0.85, 4, 1, 1);
      const p = g.attributes.position; for (let v = 0; v < p.count; v++) p.setY(v, p.getY(v) + (R() - 0.5) * 0.1);
      g.computeVertexNormals();
      g.rotateY(-Math.atan2(s2.z - s1.z, s2.x - s1.x)); g.translate(mx, 0.12 + hy + 0.3, mz);
      B.add('old', g);
    }
    const marks = new THREE.Mesh(mergeAll(markGeo), M.marks); scene.add(marks);
    // the hearth: the first fire, still burning
    const hearth = new THREE.CylinderGeometry(1.0, 1.15, 0.45, 9, 1); hearth.translate(C.x, 0.12 + 0.22, C.z); B.add('old', hearth);
    const pit = new THREE.CylinderGeometry(0.72, 0.72, 0.05, 12); pit.translate(C.x, 0.12 + 0.45, C.z); B.add('iron', pit);
    ctx.flames.add(C.x, 0.55, C.z, 1.55); ctx.flames.add(C.x - 0.35, 0.55, C.z + 0.2, 0.9); ctx.flames.add(C.x + 0.4, 0.55, C.z - 0.15, 1.0);
    lanternPos.push(new THREE.Vector3(C.x, 1.1, C.z));
    lights.add({ pos: new THREE.Vector3(C.x, 1.6, C.z), color: '#ff9440', intensity: 46, distance: 16, flicker: 0.25, role: 'lantern', priority: 2.0 });
    walk.circle(C.x, C.z, 1.6);
    // water ring blocks the way except on the causeways
    walk.paint((x, z) => { const r = Math.hypot(x - C.x, z - C.z); if (r < C.rIn - 0.1 || r > C.rOut + 0.45) return false; const ax = Math.abs(x - C.x), az = Math.abs(z - C.z); return ax > C.causeway - 0.35 && az > C.causeway - 0.35; }, 1);
  }

  // ---------- reflecting pools below the steps, fountains in the market bays ----------
  {
    for (const [x0, x1, z0, z1] of P.POOLS) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
      B.box('ashlar2', w + 0.9, 0.42, 0.45, cx, 0.21, z0 - 0.0); B.box('ashlar2', w + 0.9, 0.42, 0.45, cx, 0.21, z1);
      B.box('ashlar2', 0.45, 0.42, d, x0, 0.21, cz); B.box('ashlar2', 0.45, 0.42, d, x1, 0.21, cz);
      for (const [bw, bd, bx, bz] of [[w + 0.95, 0.5, cx, z0], [w + 0.95, 0.5, cx, z1], [0.5, d + 0.5, x0, cz], [0.5, d + 0.5, x1, cz]]) B.box('gold', bw, 0.04, bd, bx, 0.44, bz, { uv: false });
      const wg = new THREE.PlaneGeometry(w - 0.4, d - 0.4); wg.rotateX(-Math.PI / 2); wg.translate(cx, 0.16, cz);
      const water = new THREE.Mesh(wg, M.water); water.layers.set(1); water.receiveShadow = true; scene.add(water);
      // three low jets along the middle, and a gold star at each end
      for (let k = 0; k < 3; k++) { const jz = z0 + d * (k + 1) / 4; B.cyl('brass', 0.22, 0.32, cx, 0.1, jz, 8, 0.12); ctx.jets.push([cx, jz, 0.9 + (k === 1 ? 0.6 : 0)]); }
      walk.rect(x0 - 0.45, z0 - 0.45, x1 + 0.45, z1 + 0.45, 1);
    }
    for (const [fx, fz, r] of P.FOUNTAINS) {
      const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, r - 0.4, 0, Math.PI * 2, true); s.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: false, curveSegments: 32 }); g.rotateX(-Math.PI / 2); g.translate(fx, 0, fz); B.add('ashlar2', g);
      const gr = new THREE.TorusGeometry(r - 0.2, 0.06, 4, 48); gr.rotateX(Math.PI / 2); gr.translate(fx, 0.58, fz); B.add('gold', gr, { uv: false });
      const wg = new THREE.CircleGeometry(r - 0.4, 40); wg.rotateX(-Math.PI / 2); wg.translate(fx, 0.34, fz);
      const water = new THREE.Mesh(wg, M.water); water.layers.set(1); scene.add(water);
      B.cyl('ashlar2', 0.4, 1.5, fx, 0.3, fz, 10, 0.3);
      B.cyl('ashlar2', 1.0, 0.25, fx, 1.6, fz, 14, 1.25);
      B.cyl('brass', 0.12, 0.7, fx, 1.85, fz, 8, 0.06);
      const orb = new THREE.SphereGeometry(0.2, 10, 8); orb.translate(fx, 2.6, fz); B.add('goldBright', orb, { uv: false });
      ctx.jets.push([fx, fz, 2.4, 0.5]);
      walk.circle(fx, fz, r + 0.35);
    }
  }

  // ---------- the buildings around the square ----------
  const facadeBalcony = (x, z0, z1, s, y) => {
    B.box('ashlar2', 1.1, 0.25, z1 - z0, x + s * 0.55, y, (z0 + z1) / 2);
    B.box('gold', 0.06, 0.06, z1 - z0, x + s * 1.05, y + 0.9, (z0 + z1) / 2, { uv: false });
    for (let z = z0 + 0.3; z < z1; z += 0.5) B.box('gold', 0.04, 0.9, 0.04, x + s * 1.05, y + 0.45, z, { uv: false });
  };
  for (const s of [-1, 1]) {
    // the side rows (facades on x = +-24.5), broken by the district arch
    const runs = [[10.5, 31], [-31.5, -2.5]];
    for (const [z0, z1] of runs) {
      let z = z1;
      while (z > z0 + 3) {
        const wz = Math.min(z - z0, 7 + R() * 5), d = 12 + R() * 4, cz = z - wz / 2, cx = s * (24.6 + d / 2);
        const floors = z1 > 20 ? 3 + ((R() * 2.2) | 0) : 2 + ((R() * 1.6) | 0);
        const roof = R() < 0.55 ? 'hip' : 'dome';
        building(R() < 0.3 ? Bn : B, R, { x: cx, z: cz, w: d, d: wz, floors, roof, win: WIN[(R() * 3) | 0] });
        dressFacade(B, R, { x: s * 24.6, z0: z - wz + 0.3, z1: z - 0.3, p: -s, floors });
        // ground-floor arcade: pilasters with gold capitals, an awning over the shop door
        for (let k = 0; k <= 1; k++) { const pz = z - (k ? wz - 0.6 : 0.6); B.box('ashlar2', 0.7, 4.6, 0.7, s * 24.35, 2.3, pz); B.box('gold', 0.78, 0.1, 0.78, s * 24.35, 4.55, pz, { uv: false }); }
        if (floors >= 3) facadeBalcony(s * 24.6, z - wz + 0.8, z - 0.8, -s, 5.2 + 4 * ((R() * 2) | 0));
        ctx.facades.push({ x: s * 24.6, z: cz, w: wz, s: -s, top: 1.2 + floors * 4 });
        z -= wz + 0.3;
      }
    }
    walk.rect(s > 0 ? 23.4 : -40, -40, s > 0 ? 40 : -23.4, 40, 1);
    // the district arch openings stay walkable a little way in (handled by the arch builder)
    // the rows behind (rising toward the edges)
    for (let z = 34; z > -44; z -= 10 + R() * 6) {
      const cx = s * (46 + R() * 12);
      if (R() < 0.45) tower(B, R, { x: cx, z, r: 1.9 + R() * 0.8, h: 22 + R() * 22, win: WIN[(R() * 3) | 0] });
      else building(B, R, { x: cx, z, w: 12 + R() * 6, d: 9 + R() * 5, floors: 4 + ((R() * 4) | 0), roof: R() < 0.5 ? 'hip' : 'dome', win: WIN[(R() * 3) | 0] });
    }
  }
  // masses behind the north-east and north-west chamfers (behind the House and the Ashford arch)
  for (const s of [-1, 1]) {
    building(Bn, R, { x: s * 29, z: -45, w: 14, d: 14, floors: 3, roof: 'dome', win: 'win2' });
    building(B, R, { x: s * 20, z: -53, w: 12, d: 10, floors: 2, roof: 'hip', win: 'win0' });
  }

  // ---------- the City gate: a white triumphal arch onto the gate road ----------
  const G = P.GATE;
  {
    const fr = frame(0, G.z, 0);
    const slab = archSlab(19, 12.6, G.half * 2, 7.6, 3.2); slab.translate(0, 0, -3.2 + 0.1);
    addLocal(B, 'ashlar', slab, fr);
    archRing(B, fr, G.half + 0.12, 7.6, 0.16, 0.22);
    archRing(B, fr, G.half + 0.55, 7.6, 0.16, 0.08);
    archRing(B, fr, G.half + 0.12, 7.6, -3.16, 0.2);
    lbox(B, 'ashlar2', fr, 20, 3.0, 3.6, 0, 14.1, -1.5);
    lbox(B, 'gold', fr, 20.1, 0.16, 3.7, 0, 12.6, -1.5, { uv: false });
    lbox(B, 'gold', fr, 20.1, 0.16, 3.7, 0, 15.6, -1.5, { uv: false });
    lbox(B, 'ashlar', fr, 21, 0.7, 4, 0, 15.95, -1.5);
    for (const sx of [-1, 1]) {
      for (const px of [6.4, 8.9]) { lbox(B, 'ashlar', fr, 0.9, 11.6, 0.6, sx * px, 6.3, 0.25); lbox(B, 'gold', fr, 1.05, 0.22, 0.75, sx * px, 12.1, 0.25, { uv: false }); lbox(B, 'gold', fr, 1.05, 0.22, 0.75, sx * px, 0.6, 0.25, { uv: false }); }
      const rel = new THREE.CircleGeometry(0.9, 24); rel.translate(sx * 7.65, 9.6, 0.42); addLocal(B, 'goldBright', rel, fr, { uv: false });
      const rr = new THREE.TorusGeometry(1.0, 0.07, 5, 28); rr.translate(sx * 7.65, 9.6, 0.42); addLocal(B, 'gold', rr, fr, { uv: false });
      lbox(B, 'ashlar2', fr, 4.4, 1, 4.6, sx * 7.2, 0.5, -1.5);
    }
    // the four-point star over the arch, in a gold ring
    const st = new THREE.OctahedronGeometry(1.0, 0); st.scale(0.55, 1.7, 0.25); st.translate(0, 14.1, 0.35); addLocal(B, 'goldBright', st, fr, { uv: false });
    const st2 = new THREE.OctahedronGeometry(1.0, 0); st2.scale(1.7, 0.55, 0.25); st2.translate(0, 14.1, 0.35); addLocal(B, 'goldBright', st2, fr, { uv: false });
    const rg = new THREE.TorusGeometry(1.45, 0.08, 6, 40); rg.translate(0, 14.1, 0.3); addLocal(B, 'gold', rg, fr, { uv: false });
    // flanking towers with gold domes
    for (const sx of [-1, 1]) {
      const tx = sx * 12.8, tz = G.z - 1.6;
      B.cyl('ashlar2', 2.9, 1.2, tx, 0, tz, 12);
      B.cyl(WIN[sx > 0 ? 0 : 2], 2.5, 15, tx, 1.2, tz, 12, 2.3, { tile: [8, 4] });
      B.cyl('gold', 2.6, 0.3, tx, 16.2, tz, 16);
      const dome = new THREE.SphereGeometry(2.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(tx, 16.5, tz); B.add('gold', dome, { uv: false });
      B.cone('gold', 0.16, 2.4, tx, 18.8, tz, 6);
      const orb = new THREE.SphereGeometry(0.32, 10, 8); orb.translate(tx, 21.3, tz); B.add('goldBright', orb, { uv: false });
    }
    for (const sx of [-1, 1]) ctx.lantern(sx * 5.2, 1.0, G.z + 1.4, 1.25);
    walk.rect(-G.half + 0.5, G.z - 3.6, G.half - 0.5, G.z + 0.5, 0);
    walk.rect(-G.half + 0.5, G.z - 10, G.half - 0.5, G.z - 3, 0);
    walk.rect(-24, G.z - 40, -G.half + 0.5, G.z + 0.35, 1); walk.rect(G.half - 0.5, G.z - 40, 24, G.z + 0.35, 1);
    ctx.gate = { z: G.z, half: G.half };
  }
  // the street beyond the gate: lantern posts, low houses, leading the eye to the terrace falls
  for (let z = G.z - 8; z > -66; z -= 9) for (const sx of [-1, 1]) ctx.lantern(sx * 4.6, 0, z, 1.0, true);
  for (const sx of [-1, 1]) {
    let z = G.z - 5;
    while (z > -64) {
      const wz = 7 + R() * 4, d = 9 + R() * 3;
      building(R() < 0.25 ? Bn : B, R, { x: sx * (6.5 + d / 2), z: z - wz / 2, w: d, d: wz, floors: 1 + ((R() * 2) | 0), roof: R() < 0.5 ? 'hip' : 'dome', win: WIN[(R() * 3) | 0] });
      z -= wz + 0.8;
    }
    for (let k = 0; k < 7; k++) building(B, R, { x: sx * (24 + R() * 44), z: -52 - R() * 14, w: 9 + R() * 7, d: 7 + R() * 6, floors: 1 + ((R() * 2) | 0), roof: R() < 0.5 ? 'hip' : 'dome', win: WIN[(R() * 3) | 0] });
  }

  // ---------- the City rising beyond: terraces with falls pouring from their lips, white-gold spires, the crown ----------
  const falls = [];
  const terrace = (z, y0, y1, xs) => {
    const radius = 235, arc = .94;
    const curveZ = x => z - radius + Math.sqrt(radius * radius - x * x);
    // The visible retaining walls follow Telor's circular terraces; stone under new light.
    for (let k = 0; k < 48; k++) {
      const a = -arc + (k + .5) * arc * 2 / 48;
      const x = Math.sin(a) * radius, zz = z - radius + Math.cos(a) * radius;
      const width = radius * arc * 2 / 48 + .08;
      B.box('old', width, y1-y0+1, 6, x, (y0+y1)/2-.5, zz-3, {rotY:a});
      B.box('ashlar2', width, 1.2, 1, x, y1+.6, zz+.3, {rotY:a});
      B.box('gold', width, .16, 1.2, x, y1+1.24, zz+.3, {rotY:a,uv:false});
      B.box('signal', width, .08, .12, x, y1+.95, zz+.85, {rotY:a,uv:false});
    }
    // Solid hill foundations continue beneath every upper spire, including the rear crown.
    for (let k = 0; k < 48; k++) {
      const x = -190 + (k + .5) * 380 / 48;
      const front = curveZ(x) - 3, back = -245;
      B.box('old', 380/48+.04, y1-y0, front-back, x, (y0+y1)/2, (front+back)/2);
      B.box('ashlar', 380/48+.04, .35, front-back, x, y1-.175, (front+back)/2);
    }
    for (const [x, w] of xs) {
      const lipZ = curveZ(x), angle = Math.asin(x / radius);
      const h = y1 - y0 + 0.4, fm = brightFallMaterial({ width: w, height: h, tpu: 10, speed: 8 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fm);
      m.position.set(x, (y0 + y1) / 2 + 0.2, lipZ + 1.0); m.rotation.y = angle;
      scene.add(m); falls.push(fm);
      B.box('gold', w + 0.8, 0.5, 1.6, x, y1 + 0.2, lipZ + 0.6, { uv: false });
      B.box('ashlar2', w + 1.6, 1.4, 2.2, x, y1 + 0.7, lipZ - 0.4);
      ctx.mists.push([x, y0, lipZ + 2.5, w * 0.7]);
      ctx.lipTrees.push([x - w / 2 - 2.2, y1 + 1.3, lipZ - 2], [x + w / 2 + 2.2, y1 + 1.3, lipZ - 2]);
    }
    const pool = new THREE.PlaneGeometry(400, 7); pool.rotateX(-Math.PI / 2); pool.translate(0, y0 + 0.2, z + 3.5);
    scene.add(new THREE.Mesh(pool, M.waterFar));
    B.box('ashlar2', 400, 0.6, 0.6, 0, y0 + 0.3, z + 7.2);
  };
  terrace(-72, 0, 20, [[0, 9], [-15.5, 4.5], [-29, 7], [-45, 5.5], [-62, 8], [15.5, 4.5], [30, 6], [46, 7.5], [64, 6], [-86, 7], [88, 8]]);
  terrace(-110, 20, 36, [[0, 7], [-12, 5], [-27, 4], [-50, 7], [12, 5], [28, 6], [52, 6], [-76, 6], [78, 7]]);
  // on the first terrace: white houses and domes set back from the lip, slim spires
  for (let k = 0; k < 30; k++) {
    const x = (R() - 0.5) * 230, z = -80 - R() * 24;
    if (Math.abs(x) < 7) continue;
    if (R() < 0.42) tower(B, R, { x, z, base: 20, r: 1.5 + R() * 1.0, h: 16 + R() * 22, win: WIN[(R() * 3) | 0] });
    else building(R() < 0.3 ? Bn : B, R, { x, z, base: 20, w: 8 + R() * 7, d: 7 + R() * 6, floors: 1 + ((R() * 3) | 0), roof: R() < 0.55 ? 'dome' : 'hip', win: WIN[(R() * 3) | 0] });
  }
  // the crown: the tallest spires stand around the beacon's tower
  for (let k = 0; k < 26; k++) {
    const x = (R() - 0.5) * 220, z = -118 - R() * 60;
    if (Math.abs(x) < 12) continue;
    tower(B, R, { x, z, base: 36, r: 1.7 + R() * 1.4, h: 22 + R() * 36 * (1 - Math.abs(x) / 140), win: WIN[(R() * 3) | 0] });
  }
  for (const [x, z, h, r] of [[-20, -150, 46, 3.6], [21, -154, 52, 3.9], [-38, -165, 38, 3.2], [40, -168, 40, 3.3], [-11, -178, 34, 2.8], [12, -180, 36, 2.9]])
    tower(B, R, { x, z, base: 36, r: r * 0.75, h, win: 'win2', dome: false });

  // Near skyline: crowns sit inside the normal lens, beyond the unchanged collision walls.
  for(const [x,z,h,r] of [[-21,-60,25,2.2],[-12,-66,30,1.9],[11,-65,27,2.0],[23,-60,29,2.4],[-34,-28,24,2],[34,-28,27,2],[-33,15,25,1.8],[34,15,28,1.9]])
    tower(B,()=>.5,{x,z,h,r,dome:false});
  // Flush light panels follow the existing paving; nothing crosses the old circle.
  for(const side of [-1,1]) for(const z of [-30,-24,5,11,17,23,29]) {
    B.box('gold',.55,.025,1.8,side*3.55,.025,z,{uv:false});
    B.box('signal',.28,.03,1.45,side*3.55,.044,z,{uv:false});
  }
  // Glass cores and fine gold flutes dress the existing portico columns.
  for(const x of [-12.4,-7.6,7.6,12.4]) {
    B.cyl('skyglass',.895,14.4,x,L+.95,45.6,16,.815);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;B.box('gold',.065,14.4,.065,x+Math.cos(a)*.9,L+8.15,45.6+Math.sin(a)*.9,{uv:false});}
  }

  // ---------- the Nexus beacon over the crown ----------
  const beacon = { pos: new THREE.Vector3(0, 23, -63), rings: [], mats: [] };
  {
    const bx = 0, bz = beacon.pos.z;
    B.cyl('ashlar2', 5, 2, bx, 0, bz, 16);
    B.cyl('skyglass', 3.7, 17, bx, 2, bz, 12, 2.5);
    B.cyl('gold', 3, .3, bx, 19, bz, 16);
    B.cyl('ashlar2', 2.5, 2, bx, 19.3, bz, 12, 1.2);
    B.cone('gold', 1.2, 1.7, bx, 21.3, bz, 12);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;B.box('gold',.10,17,.10,Math.cos(a)*3.6,10.5,bz+Math.sin(a)*3.6,{uv:false});}

  }
  upperCity(scene, B, M, falls[0]);
  return { circle, falls, beacon };
}

function mergeAll(list) {
  const pos = [], nor = [], uv = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
export { mergeAll };
