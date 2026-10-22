// The diorama camera: a fixed high three-quarter angle with a narrow lens that glides after the hero.
// Pitch and distance ease by zone (the scene can lower the camera for a vista); Q/E turn the view in 45-degree steps.
import * as THREE from 'three';

export class DioramaCamera {
  constructor(camera, { pitch = 16, dist = 36, fov = 30, height = 2.0, lead = 5 } = {}) {
    this.camera = camera;
    this.pitch = pitch; this.dist = dist; this.height = height; this.lead = lead;
    this.target = { pitch, dist, height, lead, fov };
    this.yaw = 0; this.yawTarget = 0;
    this.focus = new THREE.Vector3();
    this.shake = 0;
    camera.fov = fov; camera.updateProjectionMatrix();
    this._v = new THREE.Vector3();
  }
  turn(steps) {
    const step = Math.PI / 8, lim = 2 * step;           // 22.5-degree steps, at most 45 degrees either way
    this.yawTarget = Math.max(-lim, Math.min(lim, this.yawTarget + steps * step));
  }
  snap(pos) { this.focus.copy(pos); this.yaw = this.yawTarget; this.update(0, pos, true); }
  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  right() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }
  update(dt, heroPos, instant = false) {
    const k = instant ? 1 : 1 - Math.exp(-dt * 3.2);
    const kz = instant ? 1 : 1 - Math.exp(-dt * 0.9);
    this.yaw += (this.yawTarget - this.yaw) * (instant ? 1 : 1 - Math.exp(-dt * 5));
    for (const key of ['pitch', 'dist', 'height', 'lead']) this[key] += (this.target[key] - this[key]) * kz;
    if (Math.abs(this.camera.fov - this.target.fov) > 0.01) { this.camera.fov += (this.target.fov - this.camera.fov) * kz; this.camera.updateProjectionMatrix(); }
    // turned views rise and come closer, so the lens looks over the roofs instead of through the street walls
    const turn = Math.min(1, Math.abs(Math.sin(this.yaw)) * 1.25);
    const want = this._v.copy(heroPos).addScaledVector(this.forward(), this.lead * (1 - turn * 0.85));
    this.focus.lerp(want, k);
    const pitchDeg = this.pitch + (36 - this.pitch) * turn, dist = this.dist + (22 - this.dist) * turn;
    const p = THREE.MathUtils.degToRad(pitchDeg);
    const off = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(p), Math.sin(p), Math.cos(this.yaw) * Math.cos(p)).multiplyScalar(dist);
    const look = this.focus.clone(); look.y += this.height * (1 - turn * 0.5);
    this.camera.position.copy(look).add(off);
    this.camera.lookAt(look);
    this.camera.updateMatrixWorld();
  }
}
