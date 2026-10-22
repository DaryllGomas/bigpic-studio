// Atlas (RobotExpressive stand-in), Ora (orb + rings), Sloth (procedural graybox golem).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const HOME = new THREE.Vector3(-1.7, 0, .8);
export const SLOTH_POS = new THREE.Vector3(3.6, 0, .8);

// ---------------------------------------------------------------- Atlas
export class Atlas {
  constructor() { this.group = new THREE.Group(); this.model = null; this.actions = {}; this.cur = null; this.flash = 0; this.mats = []; this.recoil = new THREE.Vector3(); this.base = HOME.clone(); this.faceY = Math.PI / 2; this.yaw = this.faceY; }
  async load(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    this.model = gltf.scene; const box = new THREE.Box3().setFromObject(this.model), h = box.max.y - box.min.y; this.model.scale.setScalar(2.35 / h);
    this.model.position.y = -box.min.y * (2.35 / h);
    this.model.traverse(o => {
      if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.material = o.material.clone();
      const n = o.material.name; const m = o.material;
      if (n === 'Main') { m.color.set(0x0e1a44); m.metalness = .55; m.roughness = .42; }
      else if (n === 'Grey') { m.color.set(0xd9a82c); m.metalness = .9; m.roughness = .28; m.emissive = new THREE.Color(0x3a2400); }
      else if (n === 'Black') { m.color.set(0x080a14); }
      m.userData.base = m.emissive.clone(); this.mats.push(m);
    });
    // gauntlet glow (cyan) on the left forearm: a tiny emissive band
    const arm = this.model.getObjectByName('Arm.L'); if (arm) { const g = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), new THREE.MeshBasicMaterial({ color: 0x66e6ff })); g.scale.setScalar(.35); g.position.y = -.5; arm.add(g); }
    this.group.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    for (const c of gltf.animations) this.actions[c.name] = this.mixer.clipAction(c);
    for (const n of ['Death', 'Punch', 'Jump', 'ThumbsUp', 'Yes', 'No', 'Wave']) { const a = this.actions[n]; if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } }
    this.static = gltf.animations.length === 0;   // the real Atlas model has no rig yet: a gentle breathing sway stands in
    this.play('Idle', .01);
    this.group.position.copy(HOME);
  }
  play(name, fade = .15, speed = 1) {
    const a = this.actions[name]; if (!a) return 0; const prev = this.cur;
    if (prev === a && a.loop !== THREE.LoopOnce) return a.getClip().duration;
    a.reset(); a.timeScale = speed; a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (prev && prev !== a) a.crossFadeFrom(prev, fade, false);
    this.cur = a; return a.getClip().duration / speed;
  }
  yawTo(y) { this.yaw = y; }
  hitFlash(v = 1) { this.flash = v; }
  update(dt, t) {
    if (!this.model) return; this.mixer.update(dt);
    if (this.static) { this.model.scale.y = this.model.userData.sy ??= this.model.scale.y; this.model.scale.y = this.model.userData.sy * (1 + Math.sin(t * 1.6) * .006); this.model.rotation.z = Math.sin(t * .8) * .01; }
    this.recoil.multiplyScalar(Math.max(0, 1 - dt * 9));
    this.group.rotation.y += (((this.yaw - this.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 14);
    this.group.position.copy(this.base).add(this.recoil);
    this.flash = Math.max(0, this.flash - dt * 4);
    for (const m of this.mats) { m.emissive.copy(m.userData.base).lerp(new THREE.Color(.5, .12, .06), this.flash * .6); m.emissiveIntensity = 1 + this.flash * .5; }
  }
}

// ---------------------------------------------------------------- Ora
export class Ora {
  constructor(glowTex) {
    this.group = new THREE.Group(); this.rings = []; this.pos = new THREE.Vector3(); this.mode = 'orbit'; this.target = new THREE.Vector3(); this.pulse = 0; this.t = 0;
    this.core = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.0, 3.0) })); this.group.add(this.core);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9ad0ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .9 })); sp.scale.setScalar(1.9); this.group.add(sp); this.halo = sp;
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.38 + i * .1, .012, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, .5) })); r.rotation.set(i * 1.1, i * .7, 0); this.group.add(r); this.rings.push(r); }
    this.light = new THREE.PointLight(0x9ad0ff, 7, 9, 1.8); this.group.add(this.light);
  }
  fly(v, mode = 'free') { this.mode = mode; this.target.copy(v); }
  update(dt, t, atlasPos) {
    this.t += dt;
    if (this.mode === 'orbit') { const a = this.t * 1.7; this.target.set(atlasPos.x + Math.cos(a) * .95, atlasPos.y + 2.5 + Math.sin(this.t * 2.3) * .22, atlasPos.z + Math.sin(a) * .95); }
    this.group.position.lerp(this.target, Math.min(1, dt * (this.mode === 'orbit' ? 7 : 12)));
    this.rings.forEach((r, i) => { r.rotation.x += dt * (1.3 + i * .6); r.rotation.y += dt * (.9 - i * .4); });
    this.pulse = Math.max(0, this.pulse - dt * 3); const s = 1 + this.pulse * .8 + Math.sin(this.t * 4) * .05;
    const pk = Math.min(this.pulse, 1); this.core.scale.setScalar(1 + pk * .45 + Math.sin(this.t * 4) * .05); this.halo.scale.setScalar(1.9 + pk * 1.1); this.light.intensity = 7 + Math.min(this.pulse, 1) * 8;
  }
}

// ---------------------------------------------------------------- Sloth
function jitter(geo, amt, seed = 1) {
  const p = geo.attributes.position; let s = seed;
  const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const map = new Map();
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!map.has(k)) map.set(k, [(R() - .5) * amt, (R() - .5) * amt, (R() - .5) * amt]); const d = map.get(k); p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]); }
  geo.computeVertexNormals(); return geo;
}
export class Sloth {
  constructor(glowTex) {
    const g = this.group = new THREE.Group(); g.position.copy(SLOTH_POS);
    this.stone = new THREE.MeshStandardMaterial({ color: 0x6d675e, roughness: .95, flatShading: true, emissive: 0x000000 });
    this.moss = new THREE.MeshStandardMaterial({ color: 0x4d5a3a, roughness: 1, flatShading: true, emissive: 0x000000 });
    this.eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, .9, .2) });
    const S = this.stone, box = (w, h, d, mat = S, j = .25, seed = 3) => { const m = new THREE.Mesh(jitter(new THREE.BoxGeometry(w, h, d, 2, 2, 2), j, seed), mat); m.castShadow = m.receiveShadow = true; return m; };
    // legs + pelvis
    for (const z of [-1.4, 1.4]) { const l = box(1.5, 2.3, 1.5, S, .3, 5 + z); l.position.set(.2, 1.15, z); g.add(l); const f = box(2.2, .5, 1.9, S, .2, 9); f.position.set(-.3, .25, z); g.add(f); }
    const pel = box(3.4, 1.5, 4.0, S, .35, 11); pel.position.set(.3, 2.9, 0); g.add(pel);
    // torso: heavy, hunched forward (toward Atlas = -x)
    this.torso = new THREE.Group(); this.torso.position.set(.2, 3.6, 0); g.add(this.torso);
    const tm = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(2.5, 1), .5, 21), S); tm.scale.set(1.15, 1.2, 1.55); tm.position.y = 1.2; tm.castShadow = tm.receiveShadow = true; this.torso.add(tm);
    const mossy = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(1.8, 1), .5, 4), this.moss); mossy.scale.set(1.2, .5, 1.6); mossy.position.set(.8, 3.2, .4); this.torso.add(mossy);
    const hump = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(1.7, 1), .4, 8), S); hump.position.set(1.4, 2.9, 0); hump.scale.set(1.2, 1, 1.5); this.torso.add(hump);
    // glowing cracks on the chest (they dim as the shield falls)
    this.crackMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .8, .25) });
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.06, .9 + i * .1, .06), this.crackMat); c.position.set(-2.55 + i * .03, .4 + i * .35, -1 + i * .5); c.rotation.z = .3 - i * .15; this.torso.add(c); }
    // head, bowed
    this.head = new THREE.Group(); this.head.position.set(-1.6, 4.5, 0); this.torso.add(this.head);
    const hd = box(1.9, 1.7, 1.9, S, .3, 17); hd.position.set(-.2, -.2, 0); this.head.add(hd);
    const brow = box(.9, .5, 2.1, S, .2, 3); brow.position.set(-1.0, .45, 0); this.head.add(brow);
    const jaw = box(1.1, .6, 1.5, S, .2, 5); jaw.position.set(-.8, -1.05, 0); this.head.add(jaw);
    this.eye = new THREE.Mesh(new THREE.BoxGeometry(.12, .22, 1.1), this.eyeMat); this.eye.position.set(-1.18, .1, 0); this.head.add(this.eye);
    this.eyeLight = new THREE.PointLight(0xff9a3a, 0, 12, 1.6); this.eyeLight.position.set(-1.8, .1, 0); this.head.add(this.eyeLight);
    this.eyeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff8a30, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); this.eyeSprite.position.set(-1.3, .1, 0); this.eyeSprite.scale.setScalar(2.6); this.head.add(this.eyeSprite);
    // small left arm (hangs, far side)
    this.armL = new THREE.Group(); this.armL.position.set(-.5, 3.8, -2.6); this.torso.add(this.armL);
    const la = box(.9, 3.2, .9, S, .25, 6); la.position.y = -1.6; this.armL.add(la); const lh = box(1.2, 1.0, 1.1, S, .2, 8); lh.position.y = -3.5; this.armL.add(lh);
    // the BIG arm (right): shoulder -> elbow -> forearm -> hand
    this.shoulder = new THREE.Group(); this.shoulder.position.set(-.3, 5.4, .0); g.add(this.shoulder);
    const sj = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(1.15, 1), .3, 12), S); sj.castShadow = true; this.shoulder.add(sj);
    const ua = box(1.5, 3.0, 1.5, S, .3, 13); ua.position.y = -1.5; this.shoulder.add(ua);
    this.elbow = new THREE.Group(); this.elbow.position.y = -3.0; this.shoulder.add(this.elbow);
    const ej = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(.95, 1), .3, 15), this.moss); this.elbow.add(ej);
    const fa = box(1.7, 2.7, 1.7, S, .3, 14); fa.position.y = -1.4; this.elbow.add(fa);
    this.hand = new THREE.Group(); this.hand.position.y = -2.9; this.elbow.add(this.hand);
    const palm = box(2.3, 1.1, 2.5, S, .3, 19); palm.position.y = -.5; this.hand.add(palm);
    for (let i = 0; i < 4; i++) { const f = box(.5, 1.7, .5, S, .15, 30 + i); f.position.set(-.1, -1.5, -.95 + i * .64); f.rotation.z = .12; this.hand.add(f); }
    const th = box(.6, 1.2, .6, S, .12, 40); th.position.set(-1.1, -.8, 1.3); th.rotation.z = -.5; this.hand.add(th);
    // shield shards orbit the torso
    this.shards = []; this.shardGroup = new THREE.Group(); this.shardGroup.position.set(.2, 5.2, 0); g.add(this.shardGroup);
    const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.0) });
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.34, 0), sm.clone()); s.scale.set(.7, 1.5, .7); this.shardGroup.add(s); this.shards.push(s); }
    this.shield = 6; this.shieldMax = 6;
    // glint: the beat flash on the raised hand (the visual twin of the count-in tick)
    this.glintSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); this.glintSp.scale.setScalar(3); this.glintSp.position.y = -1.2; this.hand.add(this.glintSp); this.glintV = 0;
    this.p = { sh: .08, el: .1, headX: .55, lean: .22, glow: 0, sag: 0, breath: 0, flinch: 0, handSpread: 0 };
    this.flinchVec = new THREE.Vector3(); this.flash = 0; this.t = 0; this.alive = true; this.release = 0;
    this.baseStone = this.stone.color.clone();
  }
  setShield(n) { this.shield = n; }
  glint(v = 1) { this.glintV = v; }
  shardWorld(i) { const v = new THREE.Vector3(); this.shards[i].getWorldPosition(v); return v; }
  handWorld() { const v = new THREE.Vector3(0, -1.2, 0); this.hand.localToWorld(v); return v; }
  chestWorld() { return new THREE.Vector3(-1.8, 5, 0).add(this.group.position); }
  hit(dir = 1) { this.p.flinch = Math.min(1.4, this.p.flinch + .7 * dir); this.flash = 1; }
  update(dt, t, mood) {
    this.t += dt; const p = this.p, b = Math.sin(this.t * 1.15);
    p.flinch *= Math.max(0, 1 - dt * 6); this.flash = Math.max(0, this.flash - dt * 9);
    const sag = p.sag;
    this.torso.rotation.z = p.lean + sag * .35 + p.flinch * -.05 + b * .012; this.torso.scale.y = 1 + b * .018 - sag * .06; this.torso.position.y = 3.6 - sag * .5;
    this.head.rotation.z = p.headX + sag * .55 + p.flinch * .15 + b * .02;
    this.shoulder.rotation.z = -p.sh + Math.sin(this.t * .7) * .015 * (1 - sag); this.elbow.rotation.z = -p.el;
    this.shoulder.position.y = 5.4 - sag * .6;
    this.armL.rotation.z = .1 + Math.sin(this.t * .9 + 1) * .03 + sag * .1;
    this.group.position.x = SLOTH_POS.x + p.flinch * .35; this.group.position.y = -sag * .25;
    const gl = p.glow; this.eyeMat.color.setRGB(2.2 * gl + .02, .9 * gl, .2 * gl + .02 + (mood === 'drag' ? gl * 1.5 : 0)); if (mood === 'drag') this.eyeMat.color.setRGB(1.2 * gl, .3 * gl, 2.2 * gl);
    this.eyeLight.intensity = gl * 40; this.eyeLight.color.set(mood === 'drag' ? 0xa066ff : 0xff9a3a); this.eyeSprite.material.opacity = Math.min(1, gl * .9); this.eyeSprite.material.color.set(mood === 'drag' ? 0xa066ff : 0xff8a30);
    this.crackMat.color.setRGB(1.8 * (.4 + .6 * this.shield / 6) + this.flash * 2, .8 * (.4 + .6 * this.shield / 6) + this.flash * 2, .25 + this.flash * 2);
    const e = this.flash * .07; this.stone.emissive.setRGB(e * 1.2, e * .85, e * .5); // a warm blink, not a flat pale wash this.moss.emissive.copy(this.stone.emissive);
    this.glintV = Math.max(0, this.glintV - dt * 5); this.glintSp.material.opacity = Math.min(1, this.glintV); this.glintSp.scale.setScalar(2 + this.glintV * 3); this.glintSp.material.color.set(mood === 'drag' ? 0xc9a2ff : 0xffd9a0);
    this.shardGroup.rotation.y = this.t * .8; this.shardGroup.position.y = 5.2 - sag * .6;
    this.shards.forEach((s, i) => { const a = i / 6 * Math.PI * 2; const R = 3.3; s.position.set(Math.cos(a) * R, Math.sin(this.t * 1.7 + i) * .3, Math.sin(a) * R * 1.1); s.rotation.y = this.t * 2; s.visible = i < this.shield; s.scale.set(.7, 1.5 + Math.sin(this.t * 3 + i) * .1, .7); });
    if (this.release > 0) { const k = this.release; this.stone.color.copy(this.baseStone).lerp(new THREE.Color(0xc79a5a), k * .6); this.stone.emissive.setRGB(k * .25, k * .17, k * .06); }
  }
}
