// The ring gate: a colossal carved stone ring set into the plaza, a band of cyan Signal glyphs on both faces (procedural,
// pixel-gridded, a slow pulse travelling around the ring), brass chevrons with cyan gems, and a thin cyan seam inside the ring.
import * as THREE from 'three';

const GLYPH_FRAG = /* glsl */ `
uniform float uDraw; uniform float uTime; uniform float uIntensity; uniform vec3 uColor; uniform float uR0; uniform float uR1; uniform float uCount;
varying vec2 vPos;
float gh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  float r = length(vPos), a = atan(vPos.y, vPos.x);
  float u = a / 6.2831853 + 0.5, rn = (r - uR0) / (uR1 - uR0);
  if (u > uDraw) discard;
  float cols = uCount * 7.0;
  float cx = floor(u * cols), cy = floor(rn * 11.0);
  float gi = floor(cx / 7.0), lx = mod(cx, 7.0) - 1.0, ly = cy - 2.0;
  float on = 0.0;
  if (lx >= 0.0 && lx < 5.0 && ly >= 0.0 && ly < 7.0) {
    // Signal runes, built from a few primitives on a 5x7 grid: an axis, bars, a diamond, paired dots, a chevron
    float g1 = gh(vec2(gi, 1.0)), g2 = gh(vec2(gi, 2.0)), g3 = gh(vec2(gi, 3.0)), g4 = gh(vec2(gi, 4.0));
    float dx = abs(lx - 2.0);
    if (lx == 2.0 && (g1 > 0.25 || ly <= 1.0 || ly >= 5.0)) on = 1.0;                       // the axis
    float barRow = floor(g2 * 5.0) + 1.0;
    if (ly == barRow && dx <= 1.0 + step(0.5, g3)) on = 1.0;                                 // a crossbar
    float dc = floor(g3 * 3.0) + 2.0;                                                         // a diamond around the axis
    if (g4 > 0.45 && abs(dx) + abs(ly - dc) == 1.0) on = 1.0;
    if (g1 < 0.35 && dx == 2.0 && (ly == 1.0 || ly == 5.0)) on = 1.0;                        // paired dots
    if (g2 > 0.7 && ly == 6.0 - dx && ly >= 4.0) on = 1.0;                                   // a chevron foot
  }
  float border = (cy == 0.0 || cy == 10.0) ? 1.0 : 0.0;
  float wave = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(u * 6.2831853 * 2.0 - uTime * 0.55), 5.0);
  float flick = 0.88 + 0.12 * gh(vec2(gi, floor(uTime * 2.0)));
  if (on + border < 0.5) discard;
  gl_FragColor = vec4(uColor * uIntensity * (on * wave * flick + border * 0.35), 1.0);
}`;

export function glyphMaterial({ r0, r1, count = 64 }) {
  return new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 1 }, uTime: { value: 0 }, uIntensity: { value: 2.5 }, uColor: { value: new THREE.Color('#3fd3c8') }, uR0: { value: r0 }, uR1: { value: r1 }, uCount: { value: count } },
    vertexShader: `varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: GLYPH_FRAG,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

/** Build the gate. Returns { group, glyphMats, gemMat, lights: [positions] }. */
export function buildGate({ stone, brass, cyanMat, R = 12.5, r = 9.8, D = 3.2 }) {
  const group = new THREE.Group();
  const shape = new THREE.Shape(); shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); shape.holes.push(hole);
  const bev = 0.35;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 160 });
  geo.translate(0, 0, -D / 2);
  geo.computeVertexNormals();
  // UVs: faces planar, the rims cylindrical (texel density ~ 4 units per tile)
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (Math.abs(n.getZ(i)) > 0.7) uv.setXY(i, x / 4, y / 4);
    else uv.setXY(i, (Math.atan2(y, x) * Math.hypot(x, y)) / 4, z / 4);
  }
  const ring = new THREE.Mesh(geo, stone);
  ring.castShadow = ring.receiveShadow = true;
  group.add(ring);
  // a carved inner step ring (adds depth to the opening)
  const inner = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.22, 6, 160), brass);
  for (const zz of [D / 2 + bev, -D / 2 - bev]) { const m = inner.clone(); m.position.z = zz; group.add(m); }
  // glyph bands, both faces
  const r0 = r + 0.55, r1 = R - 0.55;
  const glyphMats = [];
  for (const side of [1, -1]) {
    const gm = glyphMaterial({ r0, r1, count: 72 });
    const band = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 256, 1), gm);
    band.position.z = side * (D / 2 + bev + 0.02);
    if (side < 0) band.rotation.y = Math.PI;
    group.add(band);
    glyphMats.push(gm);
  }
  // cyan seam inside the ring
  const seam = new THREE.Mesh(new THREE.TorusGeometry(r - 0.02, 0.06, 4, 200), cyanMat);
  seam.scale.z = 0.5;
  group.add(seam);
  // chevrons: brass wedges on the rim, each with a cyan gem
  const chev = new THREE.Shape();
  chev.moveTo(-1.5, 0); chev.lineTo(1.5, 0); chev.lineTo(0.9, 2.2); chev.lineTo(-0.9, 2.2); chev.lineTo(-1.5, 0);
  const cg = new THREE.ExtrudeGeometry(chev, { depth: D + 1.2, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1 });
  cg.translate(0, 0, -(D + 1.2) / 2);
  const gemGeo = new THREE.OctahedronGeometry(0.32); gemGeo.scale(0.8, 1.3, 0.5);
  const gems = [];
  for (const deg of [90, 50, 130, 10, 170, -30, 210]) {
    const a = THREE.MathUtils.degToRad(deg);
    const c = new THREE.Mesh(cg, brass);
    c.position.set(Math.cos(a) * (R - 0.6), Math.sin(a) * (R - 0.6), 0);
    c.rotation.z = a - Math.PI / 2;
    c.castShadow = true;
    group.add(c);
    for (const side of [1, -1]) {
      const g = new THREE.Mesh(gemGeo, cyanMat);
      g.position.set(Math.cos(a) * (R + 0.55), Math.sin(a) * (R + 0.55), side * ((D + 1.2) / 2 + 0.1));
      g.rotation.z = a - Math.PI / 2;
      group.add(g);
      gems.push(g.position.clone());
    }
  }
  return { group, glyphMats, gems };
}
