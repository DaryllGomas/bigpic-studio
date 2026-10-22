import * as THREE from 'three';
// Heavy leaves withdraw into the jambs; a quiet cool shimmer answers a blocked approach.
export function sealedWay(scene, { x, z, rotation = 0, width = 4, height = 4, open = false, sound }) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = rotation; scene.add(group);
  const material = new THREE.MeshStandardMaterial({ color:'#303c43', roughness:.9, metalness:.25, emissive:'#72d9ca', emissiveIntensity:0 });
  const leaves = [-1,1].map(side=>{const leaf=new THREE.Mesh(new THREE.BoxGeometry(width/2,height,.28),material);leaf.position.set(side*width/4,height/2,0);group.add(leaf);return {leaf,side};});
  const light = new THREE.PointLight('#79efcc',0,12);light.position.set(0,height*.7,1);group.add(light);
  let amount=open?1:0, wasOpen=open;
  return { group, get open(){return wasOpen;}, update(dt,t,hero,woken) {
    if(woken&&!wasOpen) sound?.(); wasOpen=woken;
    amount+=((woken?1:0)-amount)*(1-Math.exp(-dt*2));
    for(const {leaf,side} of leaves) {leaf.position.x=side*(width/4+amount*width*.56);leaf.visible=amount<.98;}
    const close=hero.distanceTo(group.position)<width*.65+1;
    material.emissiveIntensity=woken?.15:close?.12+.1*Math.sin(t*5):0;
    light.intensity=woken?10*(.85+.15*Math.sin(t*2)):0;
     group.userData.awake=woken;
  }, blocks(px,pz) {
    if(wasOpen)return false;
    const dx=px-x,dz=pz-z,lx=Math.cos(rotation)*dx-Math.sin(rotation)*dz,lz=Math.sin(rotation)*dx+Math.cos(rotation)*dz;
    return Math.abs(lx)<width/2+.3 && Math.abs(lz)<.65;
  } };
}
