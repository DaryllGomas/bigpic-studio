// ORA: a ball of living light (genderless: "it"). A bright blue-white core with a four-point flare, thin filament rings
// orbiting like an orrery, gold motes woven through, a fading trail, and a real point light. It floats at Atlas's open hand.
import * as THREE from 'three';

export class Ora {
  constructor({ glow, flare }) {
    this.group = new THREE.Group();
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    const add = THREE.AdditiveBlending;
    const sprite = (tex, color, k, scale) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(k), blending: add, depthWrite: false, transparent: true, toneMapped: false });
      const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = 20; return s;
    };
    this.halo = sprite(glow, '#9fdcff', 1.2, 1.8);
    this.core = sprite(flare, '#eaf7ff', 8, 0.85);
    this.heart = sprite(glow, '#ffffff', 14, 0.26);
    this.group.add(this.halo, this.core, this.heart);
    // filament rings (orrery)
    this.rings = [];
    const ringDefs = [[0.34, '#bfe9ff', 3.5, 1.1, 0.4], [0.46, '#9fdcff', 2.4, -0.7, 1.2], [0.27, '#f1dcaa', 2.8, 1.6, 2.1]];
    for (const [r, col, k, speed, tilt] of ringDefs) {
      const pts = [];
      for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), blending: add, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
      line.renderOrder = 21;
      const pivot = new THREE.Group(); pivot.rotation.set(tilt, tilt * 0.7, tilt * 0.3); pivot.add(line);
      this.group.add(pivot);
      this.rings.push({ line, pivot, speed });
    }
    // gold motes orbiting
    const N = 18, mp = new Float32Array(N * 3);
    this.moteData = Array.from({ length: N }, (_, i) => ({ r: 0.3 + Math.random() * 0.35, a: Math.random() * 6.28, s: 0.8 + Math.random() * 1.6, y: (Math.random() - 0.5) * 0.5, tilt: Math.random() * 6.28 }));
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: new THREE.Color('#f1dcaa').multiplyScalar(5), size: 0.05, sizeAttenuation: true, blending: add, transparent: true, depthWrite: false, toneMapped: false }));
    this.motes.renderOrder = 22;
    this.group.add(this.motes);
    // trail (world space)
    this.trailN = 36;
    this.trailPos = new Float32Array(this.trailN * 3);
    this.trailHist = [];
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    const alpha = new Float32Array(this.trailN); for (let i = 0; i < this.trailN; i++) alpha[i] = 1 - i / this.trailN;
    tg.setAttribute('aA', new THREE.BufferAttribute(alpha, 1));
    this.trail = new THREE.Points(tg, new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 }, uTex: { value: glow } },
      vertexShader: `attribute float aA; varying float vA; uniform float uScale; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (0.08 + 0.32 * aA) * uScale / -mv.z; }`,
      fragmentShader: `uniform sampler2D uTex; varying float vA; void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA * vA; gl_FragColor = vec4(vec3(0.62, 0.86, 1.0) * 2.2 * a, 1.0); }`,
      blending: add, transparent: true, depthWrite: false,
    }));
    this.trail.frustumCulled = false; this.trail.renderOrder = 19;
    this.light = new THREE.PointLight('#9fdcff', 14, 10, 2);
    this.group.add(this.light);
    this.lightScale = 1;
    this.t = 0;
  }
  place(p) { this.pos.copy(p); this.trailHist = []; }
  update(dt, t, anchor, camera, height) {
    this.t = t;
    // spring toward the anchor (lags, overshoots a touch: it trails when Atlas walks)
    const target = anchor.clone();
    target.y += Math.sin(t * 2.1) * 0.12 + Math.sin(t * 0.7) * 0.06;
    target.x += Math.sin(t * 0.9) * 0.08;
    const k = 26, d = 7.5;
    const acc = target.sub(this.pos).multiplyScalar(k).addScaledVector(this.vel, -d);
    this.vel.addScaledVector(acc, dt);
    this.pos.addScaledVector(this.vel, dt);
    this.group.position.copy(this.pos);
    const pulse = 1 + Math.sin(t * 3.2) * 0.06 + Math.sin(t * 7.7) * 0.03;
    this.core.scale.setScalar(0.85 * pulse);
    this.core.material.rotation = Math.sin(t * 0.5) * 0.12;
    this.halo.scale.setScalar(1.8 * (1 + Math.sin(t * 1.7) * 0.05));
    for (const r of this.rings) r.line.rotation.y += dt * r.speed;
    const mp = this.motes.geometry.attributes.position;
    this.moteData.forEach((m, i) => {
      m.a += dt * m.s;
      const x = Math.cos(m.a) * m.r, z = Math.sin(m.a) * m.r, y = m.y + Math.sin(m.a * 2 + m.tilt) * 0.12;
      mp.setXYZ(i, x * Math.cos(m.tilt) - y * Math.sin(m.tilt) * 0.3, y + x * Math.sin(m.tilt) * 0.3, z);
    });
    mp.needsUpdate = true;
    // trail history in world space
    this.trailHist.unshift(this.pos.clone());
    if (this.trailHist.length > this.trailN) this.trailHist.pop();
    for (let i = 0; i < this.trailN; i++) {
      const p = this.trailHist[Math.min(i, this.trailHist.length - 1)] || this.pos;
      this.trailPos[i * 3] = p.x; this.trailPos[i * 3 + 1] = p.y + i * 0.004; this.trailPos[i * 3 + 2] = p.z;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.material.uniforms.uScale.value = height * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
    this.light.intensity = 14 * this.lightScale * pulse;
  }
}
