import * as THREE from 'three';
import { quests, LAMP_IDS, createSignalHold } from '../engine/quests.js';
import { signalHand } from '../engine/actors/signal.js';

// Shared materials stay batched. Spatial uniforms restore each lamp and its eight-metre road segment.
function patch(mat, uniforms, fragment, key) {
  const before = mat.onBeforeCompile, cache = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (sh, r) => {
    before?.(sh, r); Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vQuestWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvQuestWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vQuestWorld; uniform float uLamps[28]; uniform float uClear[14]; uniform float uDeed;
      float lampAt(vec3 p) { if(p.z < -33.0) return uDeed;
        int i = int(clamp(floor((72.0-p.z)/8.0+0.5),0.0,13.0)) + (p.x > 0.0 ? 14 : 0);
        return uLamps[i]; }
      float clearAt(vec3 p) { if(p.z < -36.0) return uDeed;
        int i = int(clamp(floor((72.0-p.z)/8.0+0.5),0.0,13.0));
        float c=uClear[i]; return step(.001,c)*(1.-smoothstep(c*4.,c*4.+1.,abs(p.z-(72.-float(i)*8.)))); }`)
      .replace('#include <opaque_fragment>', `${fragment}\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => cache() + '|quest-' + key;
  mat.needsUpdate = true;
}
export function roadLamps({ scene, materials, lights, gate, engine, glow }) {
  const quest = quests(), hand = signalHand(scene, glow);
  const lamps = LAMP_IDS.map((id, i) => ({ id, position: new THREE.Vector3(i < 14 ? -3.75 : 3.75, 2.43, 72 - (i % 14) * 8) }));
  const targets = [...lamps, { id: 'ring', position: new THREE.Vector3(0, 1.5, -49) }];
  const U = { uLamps: { value: new Float32Array(28) }, uClear: { value: new Float32Array(14) }, uDeed: { value: 0 } };
  const restored = new Set(quest.snapshot.lamps);
  let deed = quest.snapshot.firstDeed;
  lamps.forEach((l,i) => U.uLamps.value[i] = restored.has(l.id) || deed ? 1 : 0);
  for (let i=0;i<14;i++) U.uClear.value[i] = Math.max(U.uLamps.value[i], U.uLamps.value[i+14]);
  U.uDeed.value = deed ? 1 : 0;
  patch(materials.glass, U, 'outgoingLight *= mix(0.025, 1.0, lampAt(vQuestWorld));', 'glass');
  patch(materials.road, U, `float qClear = max(uDeed, clearAt(vQuestWorld));
    float grey = dot(outgoingLight, vec3(0.2126,0.7152,0.0722));
    outgoingLight = mix(vec3(grey)*0.48, outgoingLight, 0.18+0.82*qClear);`, 'road');
  // Low grey fog across unlit stretches, merged into one draw call.
  const fogMat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; varying float vZ; void main(){vUv=uv; vZ=(modelMatrix*vec4(position,1.)).z; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uClear[14]; uniform float uDeed; varying vec2 vUv; varying float vZ;
      void main(){ int i=int(clamp(floor((72.-vZ)/8.+.5),0.,13.)); float edge=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);
      float clear=vZ < -36. ? uDeed : max(uDeed,uClear[i]);
      gl_FragColor=vec4(.32,.35,.37, edge*.38*(1.-clear)); }`, side: THREE.DoubleSide });
  const fogPositions=[], fogUV=[];
  for(let i=0;i<15;i++) {
    const z=i===14?-44:72-i*8, half=i===14?12:4, width=i===14?24:7;
    for(const [x,y] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]) {
      fogPositions.push((x-.5)*width,1.1,z+(y-.5)*half*2); fogUV.push(x,y);
    }
  }
  const fogGeo=new THREE.BufferGeometry();
  fogGeo.setAttribute('position',new THREE.Float32BufferAttribute(fogPositions,3));
  fogGeo.setAttribute('uv',new THREE.Float32BufferAttribute(fogUV,2));
  scene.add(new THREE.Mesh(fogGeo,fogMat));
  // One stroke geometry reused for every hold; progressive draw range is the visual timer.
  const vertices = [];
  const path = [[0,-.5],[0,.5],[-.32,.1],[.32,.1],[0,-.25],[-.32,.1],[0,.45],[.32,.1],[0,-.25]];
  for(let i=1;i<path.length;i++) for(const p of [path[i-1],path[i]]) vertices.push(p[0],p[1],0);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const stroke = new THREE.LineSegments(geo,new THREE.LineBasicMaterial({ color: '#65fff0', transparent:true, opacity:1 }));
  scene.add(stroke); stroke.visible=false;
  const flowMat = new THREE.MeshBasicMaterial({ color: '#40e9df', transparent:true, opacity:0, depthWrite:false });
  const flow = new THREE.Mesh(new THREE.PlaneGeometry(.12,1),flowMat); flow.rotation.x=-Math.PI/2; scene.add(flow);
  const rise = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2,4),flowMat); scene.add(rise);
  const signalHold=createSignalHold(quest);
  let holding=null, hold=0, burst=null;
  const sources = lights.sources.filter(s=>s.role==='lantern').map(s=>({s, base:s.intensity}));
  const lampIndex = p => Math.max(0,Math.min(13,Math.round((72-p.z)/8))) + (p.x>0?14:0);
  const litAt = p => p.z < -33 ? U.uDeed.value : U.uLamps.value[lampIndex(p)];
  return { quest, targets, hand, uniforms: U,
    litAt,
    update(dt,t,hero,input,anchor,day) {
      const state=quest.snapshot;
      const nearby=targets.find(l=>!restored.has(l.id) && !(l.id==='ring'&&deed) &&
        Math.hypot(hero.group.position.x-l.position.x,hero.group.position.z-l.position.z)<3.25 &&
        (l.id!=='ring'||restored.size===28));
      const action=state.signal && input.action() && nearby;
      const held=signalHold.step(nearby?.id,!!action,dt);
      holding=action?nearby:null; hold=held.progress*1.05;
      if(action) { stroke.visible=true; stroke.position.copy(nearby.position); stroke.position.y+=.35;
        stroke.rotation.y=Math.atan2(engine.camera.position.x-stroke.position.x,engine.camera.position.z-stroke.position.z);
        stroke.scale.setScalar(nearby.id==='ring'?2:1);
        geo.setDrawRange(0,Math.min(vertices.length/3,Math.floor(hold*(vertices.length/3)/1.05/2)*2));
        if(held.relit) {
          if(nearby.id==='ring') deed=true; else restored.add(nearby.id);
          burst={p:nearby.position.clone(),t:0,ring:nearby.id==='ring'}; hold=0; holding=null;
        }
      } else stroke.visible=false;
      hand.update(anchor,state.signal,t,!!action);
      // Ora notices an unlit lamp; its circle is the invitation to try the hand.
      const notice=nearby || targets.find(l=>!restored.has(l.id) && !(l.id==='ring'&&deed) &&
        (l.id!=='ring'||restored.size===28) && hero.group.position.distanceTo(l.position)<5);
      if(state.signal && notice) {
        anchor.copy(notice.position); anchor.y+=.6;
        anchor.x+=Math.cos(t*2)*.35; anchor.z+=Math.sin(t*2)*.35;
      }
      const ease=1-Math.exp(-dt*3);
      for(let i=0;i<28;i++) U.uLamps.value[i]+=((restored.has(lamps[i].id)||deed?1:0)-U.uLamps.value[i])*ease;
      U.uDeed.value+=((deed?1:0)-U.uDeed.value)*ease;
      for(let i=0;i<14;i++) U.uClear.value[i]=Math.max(U.uLamps.value[i],U.uLamps.value[i+14]);
      for(const {s,base} of sources) s.intensity=base*litAt(s.pos);
      materials.flame.emissiveIntensity=6*U.uDeed.value;
      materials.flame.color.setRGB(U.uDeed.value, .43*U.uDeed.value, .18*U.uDeed.value);
      for(const gm of gate.glyphMats) {
        const drawing=holding?.id==='ring';
        gm.uniforms.uDraw.value=drawing ? Math.min(1,hold/1.05) : 1;
        gm.uniforms.uIntensity.value=day.glyphs*(U.uDeed.value*.95+(drawing ? .22 : 0));
      }
      materials.cyan.emissiveIntensity=2.5*U.uDeed.value;
      materials.signal.emissiveIntensity=.6*U.uDeed.value;
      lights.roleScale.glyph=day.glyphs/2.6*U.uDeed.value;
      if(burst) {
        burst.t+=dt; const a=Math.min(1,burst.t/1.5);
        rise.position.set(burst.p.x, .45+a*2,burst.p.z); rise.scale.y=Math.max(.01,a);
        flow.position.set(burst.p.x*(1-a),.43,burst.p.z-a*4); flow.scale.y=Math.max(.01,a*8);
        flowMat.opacity=Math.sin(a*Math.PI)*.9;
        if(a===1) burst=null;
      } else flowMat.opacity=0;
    },
  };
}
