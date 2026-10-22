// The rotunda camera: the diorama lens (high three-quarter, narrow, gliding after the hero), but in a round room it
// leans around the hall as you walk toward the rim, so whichever gate you approach turns to face you. Q/E still turn it
// by hand in 22.5-degree steps (at most 45). Unlike the street camera it never rises when turned: the hall has no roofs.
import * as THREE from 'three';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class RotundaCamera {
  constructor(camera, { pitch = 16, dist = 36, fov = 32, height = 3, lead = 3 } = {}) {
    this.camera = camera;
    this.pitch = pitch; this.dist = dist; this.height = height; this.lead = lead;
    this.target = { pitch, dist, height, lead, fov };
    this.yaw = 0; this.manual = 0; this.manualTarget = 0;
    this.auto = 1;                 // 0..1: how much the hall's lean applies
    this.lean = 0.42;
    this.zoomRate = 0.9; this.followRate = 3.2; this.yawRate = 1.6;
    this.focus = new THREE.Vector3();
    this.lookOffset = new THREE.Vector3();
    camera.fov = fov; camera.updateProjectionMatrix();
    this._v = new THREE.Vector3();
  }
  // compatibility with the street camera's API (tools set yawTarget = 0 on teleport)
  get yawTarget() { return this.manualTarget; }
  set yawTarget(v) { this.manualTarget = v; this.manual = v; }
  turn(steps) { const step = Math.PI / 8; this.manualTarget = Math.max(-2 * step, Math.min(2 * step, this.manualTarget + steps * step)); }
  autoYaw(p) {
    const th = Math.atan2(p.x, -p.z), r = Math.hypot(p.x, p.z);
    return Math.max(-0.8, Math.min(0.8, -this.lean * th * sstep(5, 15, r))) * this.auto;
  }
  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  right() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }
  snap(pos) {
    this.manual = this.manualTarget;
    this.yaw = this.autoYaw(pos) + this.manual;
    for (const k of ['pitch', 'dist', 'height', 'lead']) this[k] = this.target[k];
    if (this.camera.fov !== this.target.fov) { this.camera.fov = this.target.fov; this.camera.updateProjectionMatrix(); }
    this.focus.copy(pos).addScaledVector(this.forward(), this.lead);
    this.update(0, pos, true);
  }
  update(dt, heroPos, instant = false) {
    const k = instant ? 1 : 1 - Math.exp(-dt * this.followRate);
    const kz = instant ? 1 : 1 - Math.exp(-dt * this.zoomRate);
    this.manual += (this.manualTarget - this.manual) * (instant ? 1 : 1 - Math.exp(-dt * 5));
    const want = this.autoYaw(heroPos) + this.manual;
    this.yaw += (want - this.yaw) * (instant ? 1 : 1 - Math.exp(-dt * this.yawRate));
    for (const key of ['pitch', 'dist', 'height', 'lead']) this[key] += (this.target[key] - this[key]) * kz;
    if (Math.abs(this.camera.fov - this.target.fov) > 0.01) { this.camera.fov += (this.target.fov - this.camera.fov) * kz; this.camera.updateProjectionMatrix(); }
    const wantF = this._v.copy(heroPos).addScaledVector(this.forward(), this.lead);
    this.focus.lerp(wantF, k);
    const p = THREE.MathUtils.degToRad(this.pitch);
    const off = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(p), Math.sin(p), Math.cos(this.yaw) * Math.cos(p)).multiplyScalar(this.dist);
    const look = this.focus.clone().add(this.lookOffset); look.y += this.height;
    this.camera.position.copy(look).add(off);
    this.camera.lookAt(look);
    this.camera.updateMatrixWorld();
  }
}
