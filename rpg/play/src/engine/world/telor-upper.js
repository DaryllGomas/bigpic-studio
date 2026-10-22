// Telor's upper city: all stationary details merge into the plaza's existing batches.
import * as THREE from 'three';
export function upperCity(scene, B, M, clock) {
  const tube = (key, points, radius) => B.add(key, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),48,radius,5,false),{uv:false});
  // Suspended promenades: pale structural ribbon, gold edge, fine Signal rail.
  for(const [x0,x1,y,z] of [[-21,23,16,-60],[-34,34,19,-28],[-33,34,22,15]]) {
    const pts=[];
    for(let i=0;i<=16;i++){const f=i/16;pts.push([x0+(x1-x0)*f,y+Math.sin(f*Math.PI)*4,z-Math.sin(f*Math.PI)*7]);}
    tube('ashlar2',pts,.65);tube('gold',pts.map(p=>[p[0],p[1]+.6,p[2]]),.12);
    for(const side of [-1,1])tube('cyan',pts.map(p=>[p[0],p[1]+1.15,p[2]+side*.65]),.075);
  }
  // Broad sanctuary halo: its scale distinguishes the Nexus from an ordinary tower.
  for(const [r,y,key,w] of [[10,26,'gold',.22],[9.5,26,'signal',.08],[6,31,'goldBright',.10]]){
    const g=new THREE.TorusGeometry(r,w,6,96);g.rotateX(Math.PI/2+.13);g.translate(0,y,-63);B.add(key,g,{uv:false});
  }
  for(let i=0;i<12;i++){const a=i*Math.PI/6;B.cyl('goldBright',.16,1.2,10*Math.cos(a),25.4,-63+10*Math.sin(a),5);}
  // Three small pilgrim craft, instanced hulls and running lights, no point lights.
  const hull=new THREE.OctahedronGeometry(1,0);hull.scale(2.4,.38,.85);
  const ships=new THREE.InstancedMesh(hull,M.gold,3), lamps=new THREE.InstancedMesh(new THREE.SphereGeometry(.12,5,4),M.cyan,3);
  ships.name='telor-sky-craft';ships.frustumCulled=lamps.frustumCulled=false;
  const matrix=new THREE.Matrix4(), pos=new THREE.Vector3(), scale=new THREE.Vector3(1,1,1), quat=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
  ships.onBeforeRender=()=>{const t=clock.uniforms.uTime.value;for(let i=0;i<3;i++){const a=t*.025+i*2.1;pos.set(Math.cos(a)*(20+i*6),17+i*3+Math.sin(a*2)*.7,-44-i*9+Math.sin(a)*8);quat.setFromAxisAngle(up,-a);matrix.compose(pos,quat,scale);ships.setMatrixAt(i,matrix);pos.y-=.3;matrix.compose(pos,quat,scale);lamps.setMatrixAt(i,matrix);}ships.instanceMatrix.needsUpdate=lamps.instanceMatrix.needsUpdate=true;};
  scene.add(ships,lamps);
}
