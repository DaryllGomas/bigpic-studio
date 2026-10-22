import * as THREE from 'three';
// Small cosmetic glow only: no extra real light, follows the sprite's raised hand.
export function signalHand(scene, glow) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#52eee1', transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
  sprite.scale.setScalar(0.36); scene.add(sprite);
  return { sprite, update(anchor, enabled, t, casting = false) {
    sprite.visible = enabled; sprite.position.copy(anchor); sprite.position.y -= 0.12;
    sprite.scale.setScalar((casting ? 0.6 : 0.32) * (1 + Math.sin(t * 4) * 0.12));
  } };
}
