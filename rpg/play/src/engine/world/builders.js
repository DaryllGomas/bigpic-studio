// World construction helpers: geometry baked to world space with texel-consistent UVs, merged per material (few draw calls).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Project UVs from world position by the dominant normal axis. tile = world units per texture repeat. */
export function bakeWorldUV(geo, tile = 4, offset = [0, 0]) {
  const tu = Array.isArray(tile) ? tile[0] : tile, tv = Array.isArray(tile) ? tile[1] : tile;
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = -p.getZ(i); }
    else if (ax >= az) { u = -p.getZ(i) * Math.sign(nx); v = p.getY(i); }
    else { u = p.getX(i) * Math.sign(nz); v = p.getY(i); }
    uv[i * 2] = u / tu + offset[0]; uv[i * 2 + 1] = v / tv + offset[1];
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function clean(g) {
  let x = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
  if (!x.attributes.normal) x.computeVertexNormals();
  if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
  return x;
}

export class Batch {
  constructor(materials) { this.materials = materials; this.groups = new Map(); }
  add(key, geo, { uv = true, tile, offset } = {}) {
    if (uv) bakeWorldUV(geo, tile ?? this.materials[key]?.userData?.tile ?? 4, offset);
    if (!this.groups.has(key)) this.groups.set(key, []);
    this.groups.get(key).push(clean(geo));
    return geo;
  }
  box(key, w, h, d, x, y, z, { rotY = 0, tile, offset, uv = true } = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rotY) g.rotateY(rotY);
    g.translate(x, y, z);
    return this.add(key, g, { tile, offset, uv });
  }
  /** Square pyramid roof (4-sided cone), base centred at (x, y, z). */
  pyramid(key, w, d, h, x, y, z, rotY = 0) {
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    g.rotateY(Math.PI / 4); g.scale(w, h, d); if (rotY) g.rotateY(rotY);
    g.translate(x, y + h / 2, z);
    return this.add(key, g);
  }
  cone(key, r, h, x, y, z, seg = 8) { const g = new THREE.ConeGeometry(r, h, seg, 1); g.translate(x, y + h / 2, z); return this.add(key, g); }
  cyl(key, r, h, x, y, z, seg = 8, rTop, opts = {}) { const g = new THREE.CylinderGeometry(rTop ?? r, r, h, seg, 1); g.translate(x, y + h / 2, z); return this.add(key, g, opts); }
  build(parent, { castShadow = true, receiveShadow = true, only, except } = {}) {
    const out = {};
    for (const [key, list] of this.groups) {
      if (only && !only.includes(key)) continue;
      if (except && except.includes(key)) continue;
      const geo = mergeGeometries(list, false);
      const mesh = new THREE.Mesh(geo, this.materials[key]);
      mesh.castShadow = castShadow; mesh.receiveShadow = receiveShadow;
      mesh.name = 'batch:' + key;
      parent.add(mesh);
      out[key] = mesh;
    }
    this.groups.clear();
    return out;
  }
}
