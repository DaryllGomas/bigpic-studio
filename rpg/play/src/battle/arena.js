// The old road by the stone bridge, at dusk. Graybox geometry, real lighting.
import * as THREE from 'three';

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
export const SUN = new THREE.Vector3(1, .16, -.18).normalize();

function groundTexture() {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rnd(7);
  g.fillStyle = '#2b2a22'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { const x = r() * W, y = r() * H, a = r() * .12; g.fillStyle = r() < .5 ? `rgba(70,80,45,${a})` : `rgba(20,18,12,${a + .05})`; g.fillRect(x, y, 3 + r() * 14, 3 + r() * 10); }
  const y0 = H / 2 - 4.2 * 25.6, y1 = H / 2 + 4.2 * 25.6; g.fillStyle = '#4a4338'; g.fillRect(0, y0, W, y1 - y0);
  for (let y = y0; y < y1; y += 22) { let x = -(r() * 40); while (x < W) { const w = 26 + r() * 30, sh = 62 + r() * 38; g.fillStyle = `rgb(${sh + 14},${sh + 6},${sh - 6})`; g.fillRect(x + 1, y + 1, w - 2, 20); x += w; } }
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(0,0,0,${r() * .25})`; g.fillRect(r() * W, y0 + r() * (y1 - y0), 8 + r() * 24, 4 + r() * 10); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(80,90,50,${.2 + r() * .3})`; g.fillRect(r() * W, y0 + (r() < .5 ? r() * 20 : (y1 - y0) - r() * 20), 10 + r() * 30, 6 + r() * 8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

const SKY_FRAG = /* glsl */ `
varying vec3 vD; uniform vec3 uSun;
void main(){
  vec3 d = normalize(vD); float h = d.y;
  vec3 hor = vec3(1.25, .50, .22), mid = vec3(.46, .24, .42), top = vec3(.025, .045, .16);
  vec3 c = mix(hor, mid, smoothstep(0., .22, h)); c = mix(c, top, smoothstep(.12, .75, h));
  c = mix(c, vec3(.10,.08,.12), smoothstep(0., -.25, h));
  float s = max(dot(d, uSun), 0.);
  c += vec3(2.4,1.2,.45) * pow(s, 700.) * 2. + vec3(1.0,.45,.15) * pow(s, 18.) * .55 + vec3(.5,.22,.1) * pow(s, 3.) * .35;
  float st = step(.9965, fract(sin(dot(floor(d.xz / (abs(d.y) + .4) * 190.), vec2(12.9898, 78.233))) * 43758.5453)) * smoothstep(.25, .6, h);
  c += st * vec3(.8,.85,1.) * .6;
  gl_FragColor = vec4(c, 1.);
}`;

export function buildArena(scene, renderer) {
  const A = { lanterns: [], flick: [], water: null };
  scene.fog = new THREE.FogExp2(0x3a2a3c, .017);
  scene.background = null;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: SUN } }, vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: SKY_FRAG }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky); A.sky = sky;

  // lights: warm low sun from behind the bridge + cool fill from the camera side + sky bounce
  const key = new THREE.DirectionalLight(0xffa860, 3.4); key.position.copy(SUN).multiplyScalar(40).add(new THREE.Vector3(0, 0, 0)); key.target.position.set(1, 1, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 14; sc.bottom = -10; sc.near = 1; sc.far = 90; key.shadow.bias = -.0004; key.shadow.normalBias = .04;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0x6f8cff, 1.1); fill.position.set(-14, 9, 16); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff7ab0, .7); rim.position.set(-6, 5, -16); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x8d7fb8, 0x2a2018, .75));
  A.key = key; A.fill = fill;

  // ground
  const gtex = groundTexture(), gmat = new THREE.MeshStandardMaterial({ map: gtex, roughness: .72, metalness: .02 });
  const gL = new THREE.Mesh(new THREE.BoxGeometry(48, 4, 40), gmat); gL.position.set(-24 + 8.2, -2, 0); gL.receiveShadow = true;
  const gR = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 40), gmat); gR.position.set(13.8 + 30, -2, 0); gR.receiveShadow = true;
  // UV: the box top maps whole texture over 48 / 60 wide; fix by using separate textures with repeat
  const tl = gtex.clone(); tl.needsUpdate = true; tl.repeat.set(48 / 80, 1); tl.offset.set(0, 0); const tr = gtex.clone(); tr.needsUpdate = true; tr.repeat.set(60 / 80, 1); tr.offset.set(.2, 0);
  gL.material = new THREE.MeshStandardMaterial({ map: tl, roughness: .72 }); gR.material = new THREE.MeshStandardMaterial({ map: tr, roughness: .72 });
  scene.add(gL, gR);
  // stream channel + water
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a2b44, roughness: .12, metalness: .6, emissive: 0x3a2646, emissiveIntensity: .7 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(11, -1.3, 0); scene.add(water); A.water = water;
  const bank = new THREE.MeshStandardMaterial({ color: 0x3b362e, roughness: .9 });
  for (const x of [8.1, 13.9]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.3, 1.5, 40), bank); b.position.set(x, -.7, 0); scene.add(b); }

  // the bridge: arch body extruded along z, deck, parapets
  const stone = new THREE.MeshStandardMaterial({ color: 0x77706a, roughness: .88, flatShading: true });
  const sh = new THREE.Shape(); sh.moveTo(-3.6, -1.6); sh.lineTo(3.6, -1.6); sh.lineTo(3.6, .15); sh.lineTo(-3.6, .15); sh.lineTo(-3.6, -1.6);
  const hole = new THREE.Path(); hole.moveTo(-2.4, -1.6); hole.lineTo(-2.4, -.6); hole.absarc(0, -.6, 2.4, Math.PI, 0, true); hole.lineTo(2.4, -1.6); hole.lineTo(-2.4, -1.6); sh.holes.push(hole);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 7, bevelEnabled: false, curveSegments: 16 }), stone); body.position.set(11, 0, -3.5); body.castShadow = body.receiveShadow = true; scene.add(body);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, .12, 7), new THREE.MeshStandardMaterial({ color: 0x5b554c, roughness: .9 })); deck.position.set(11, .2, 0); deck.receiveShadow = true; scene.add(deck);
  for (const z of [-3.4, 3.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1, .5), stone); p.position.set(11, .75, z); p.castShadow = p.receiveShadow = true; scene.add(p); for (const x of [7.4, 14.6]) { const pc = new THREE.Mesh(new THREE.BoxGeometry(.8, 1.7, .8), stone); pc.position.set(x, .85, z); pc.castShadow = true; scene.add(pc); } }
  // far road beyond the bridge, rising into the dusk
  const far = new THREE.Mesh(new THREE.BoxGeometry(30, .15, 8.4), new THREE.MeshStandardMaterial({ color: 0x4a4338, roughness: .8 })); far.position.set(30, .05, 0); scene.add(far);

  // standing stones, trees, rocks (silhouettes in the haze)
  const r = rnd(33), dark = new THREE.MeshStandardMaterial({ color: 0x14180f, roughness: 1, flatShading: true });
  for (let i = 0; i < 70; i++) {
    const x = -22 + r() * 70, z = (r() < .5 ? -1 : 1) * (7 + r() * 16); const h = 2.5 + r() * 5;
    const tr = new THREE.Mesh(new THREE.ConeGeometry(1 + r() * 1.2, h, 6), dark); tr.position.set(x, h / 2 - .3, z); tr.castShadow = true; scene.add(tr);
  }
  for (let i = 0; i < 14; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(.4 + r() * .9, 0), stone); rk.position.set(-10 + r() * 20, .1, (r() < .5 ? -1 : 1) * (4.6 + r() * 3)); rk.rotation.set(r() * 3, r() * 3, r() * 3); rk.castShadow = rk.receiveShadow = true; scene.add(rk); }
  for (const [x, z, h] of [[-9, -6.5, 4.2], [-6.4, -7.2, 3.1], [6, 7.6, 3.6]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.9, h, .8), stone); m.position.set(x, h / 2, z); m.rotation.y = r(); m.rotation.z = (r() - .5) * .1; m.castShadow = m.receiveShadow = true; scene.add(m); }
  const hills = new THREE.Mesh(new THREE.SphereGeometry(70, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1b1428, fog: true })); hills.scale.set(1, .16, 1); hills.position.set(0, -2, 0); scene.add(hills);

  // lanterns on posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: .8 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xffa040, emissiveIntensity: 4 });
  for (const [x, z] of [[-5.5, -4.6], [0.5, 5.0], [6.9, -3.9], [6.9, 3.9], [-9, 3.8]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 3, 6), postMat); post.position.set(x, 1.5, z); post.castShadow = true; scene.add(post);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.32, .42, .32), lampMat); lamp.position.set(x, 3.15, z); scene.add(lamp);
    const L = new THREE.PointLight(0xffa850, 18, 14, 1.6); L.position.set(x, 3.1, z); scene.add(L); A.lanterns.push(L); A.flick.push(Math.random() * 10);
  }

  // motes
  const N = 260, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = -14 + r() * 32; pos[i * 3 + 1] = r() * 8; pos[i * 3 + 2] = -9 + r() * 18; seed[i] = r() * 100; }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 32; const dg = dot.getContext('2d'), gr = dg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,220,150,.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, 32, 32);
  A.dotTex = new THREE.CanvasTexture(dot);
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ map: A.dotTex, size: .16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9a0, opacity: .8 }));
  scene.add(motes);

  A.update = (dt, t) => {
    const p = mg.attributes.position;
    for (let i = 0; i < N; i++) { p.array[i * 3] += Math.sin(t * .3 + seed[i]) * dt * .25; p.array[i * 3 + 1] += (.12 + Math.sin(seed[i] + t * .5) * .08) * dt; p.array[i * 3 + 2] += Math.cos(t * .27 + seed[i] * 1.3) * dt * .2; if (p.array[i * 3 + 1] > 8) p.array[i * 3 + 1] = 0; }
    p.needsUpdate = true;
    A.lanterns.forEach((L, i) => { const f = A.flick[i]; L.intensity = 17 + Math.sin(t * 9 + f) * 1.6 + Math.sin(t * 23 + f * 2) * 1.1; });
    water.material.emissiveIntensity = .6 + Math.sin(t * .8) * .1;
  };
  return A;
}
