// Atlas's cottage: a cutaway room, warm timber and a window onto the Green.
import * as THREE from 'three';
import { MANIFEST } from './manifest.js';
import { loadAssets } from '../engine/assets.js';
import { Batch } from '../engine/world/builders.js';
import { LightPool } from '../engine/lighting/lightpool.js';
import { DayCycle, KEYS, ORDER } from '../engine/lighting/daycycle.js';
import { SpriteCharacter } from '../engine/actors/character.js';
import { attachAtlasRun } from '../engine/pixel/atlas-sprite.js';
import { Ora } from '../engine/actors/ora.js';
import { DioramaCamera } from '../engine/camera.js';
import { Input } from '../engine/input.js';
import { glowTexture } from '../engine/pixel/world-sprites.js';
import { Fishing, FISH } from '../engine/fishing.js';
import { paintWood, paintPlaster } from './green-art.js';
import { dressCottage, islandMap, paintGarden, livingFire, warmSurround } from './home-art.js';
import { HOME_SPOTS, homeWalkable, nextRestTime } from './home-state.js';

export async function createHome(engine,{time='dusk',go}={}) {
  if(!KEYS.golden){KEYS.golden={...KEYS.dawn,lightColor:new THREE.Color('#ffc983'),lightInt:6.4};ORDER.unshift('golden');}
  const A=await loadAssets(MANIFEST), scene=engine.scene;
  const mat=(color,map,extra={})=>new THREE.MeshStandardMaterial({color,map,roughness:.85,...extra});
  const M={wood:mat('#a98155',paintWood(9)),dark:mat('#493b36',paintWood(3)),wall:mat('#dac9a6',paintPlaster(4)),navy:mat('#26374d'),gold:mat('#d8b768',null,{metalness:.55,roughness:.4}),stone:mat('#9c9683',A.pale.map),black:mat('#191c24'),cream:mat('#e5dcc5'),rug:mat('#79544b')};
  const B=new Batch(M),box=(k,w,h,d,x,y,z)=>B.box(k,w,h,d,x,y,z);
  box('dark',12,.35,10,0,-.25,0);
  for(let x=-5.75;x<6;x+=.5)for(let z=-4.5;z<5;z+=2.3)box('wood',.48,.12,2.27,x,0,z);
  box('wall',12,4,.25,0,2,-4.7);
  // Low side walls and open front preserve couch-camera sightlines.
  for(const x of [-5.9,5.9]){box('wall',.22,1,9.5,x,.5,0);box('dark',.3,.18,9.5,x,1,0);}
  for(const x of [-5.8,-1.9,1.9,5.8])box('dark',.18,4,.3,x,2,-4.5);
  box('dark',12,.22,.4,0,4,-4.5);box('dark',12,.18,.3,0,.2,-4.45);
  // Hearth: dark opening, stone piers and a broad lintel.
  box('black',2.8,2.5,.15,0,1.3,-4.48);box('stone',3.5,.22,1.6,0,.12,-3.9);
  for(const x of [-1.5,1.5])for(let y=.5;y<2.8;y+=.48)box('stone',.5,.44,.8,x,y,-4.1);
  box('stone',3.6,.5,1,0,2.9,-4.1);box('wood',3.8,.16,1.15,0,3.2,-4.1);
  for(const x of [-.5,.45])box('dark',1,.2,.25,x,.4,-3.95);
  // Bed and quilt: stitched gold diamonds against navy cloth.
  box('dark',2.1,.6,3.4,-4.35,.4,-1.5);box('dark',2.2,1.5,.18,-4.35,.9,-3.2);
  box('cream',1.9,.25,3.1,-4.35,.8,-1.5);box('navy',1.96,.13,2.3,-4.35,.99,-1.1);
  box('cream',1.55,.2,.55,-4.35,1.03,-2.65);
  for(let x=-5.1;x<-3.5;x+=.5)for(let z=-2;z<.1;z+=.5){box('gold',.12,.015,.12,x,1.065,z);}
  for(const x of [-5.25,-3.45])box('gold',.06,.02,2.3,x,1.07,-1.1);
  box('rug',4.5,.035,3.2,-.25,.095,1);
  for(const x of [-2.4,1.9])box('gold',.06,.015,3.1,x,.12,1);
  for(const z of [-.48,2.48])box('navy',4.3,.02,.14,-.25,.12,z);
  // Table, chair, bread, bowl and a shelf of well-kept books.
  box('wood',2.2,.18,1.8,3.4,1.35,.65);
  for(const x of [2.5,4.3])for(const z of [-.05,1.35])box('dark',.13,1.3,.13,x,.65,z);
  box('wood',.85,.15,.8,3.3,.7,2.2);box('dark',.85,1.25,.15,3.3,1.05,2.6);
  for(const x of [2.95,3.65])for(const z of [1.9,2.5])box('dark',.1,.7,.1,x,.35,z);
  B.cyl('cream',.25,.16,3.6,1.45,.55,12);box('gold',.5,.18,.3,2.9,1.5,.7);
  for(const y of [1.2,2,2.8]){box('wood',1.3,.12,.55,5, y,-4.1);for(let i=0;i<5;i++)box(i%2?'navy':'rug',.13,.45,.3,4.55+i*.2,y+.28,-4.1);}
  B.cyl('stone',.4,.65,1.9,.1,-2.8,8);B.cyl('gold',.48,.08,1.9,.75,-2.8,8);
  // Side doorway keeps the open-front camera clear; the gold diamond matches the porch.
  for(const z of [2.2,4.2])box('dark',.18,3.2,.18,-5.65,1.6,z);
  box('dark',.25,.2,2.3,-5.65,3.25,3.2);
  const mark=new THREE.BoxGeometry(.28,.28,.1);mark.rotateZ(Math.PI/4);mark.translate(-5.4,3.28,3.35);B.add('gold',mark);
  box('wood',1.1,.04,1.9,-5.15,.1,3.2);
  dressCottage(B,M,mat);
  warmSurround(scene);islandMap(scene);
  // Trophy mounts reflect validated catches, without altering their collection.
  let storage;try{storage=localStorage;}catch{}
  const catches=new Fishing(storage).tally, trophies=FISH.filter(f=>catches[f.id]);
  box('dark',3.55,1.65,.15,-3.8,2.98,-4.45);
  for(const y of [2.17,3.79])box('gold',3.55,.045,.08,-3.8,y,-4.33);
  trophies.forEach((f,i)=>{
    const x=-4.94+(i%3)*1.12,y=trophies.length>3?3.4-Math.floor(i/3)*.78:3.05;
    M[f.id]=mat(f.color,null,{emissive:f.color,emissiveIntensity:.18});
    box('wood',1.02,.66,.12,x,y,-4.3);box('gold',.3,.045,.025,x,y-.24,-4.21);
    const eel=f.id==='lantern-eel';
    const g=new THREE.SphereGeometry(1,12,6);g.scale(eel?.37:.32,eel?.075:.15,.08);g.translate(x,y+.04,-4.14);B.add(f.id,g);
    const tail=new THREE.ConeGeometry(.18,.25,3);tail.rotateZ(-Math.PI/2);tail.translate(x-.36,y+.04,-4.14);B.add(f.id,tail);
    const fin=new THREE.ConeGeometry(.12,.18,3);fin.translate(x-.04,y+.18,-4.14);B.add(f.id,fin);
    box('cream',.22,.04,.035,x+.04,y-.035,-4.05);box('black',.055,.055,.035,x+.2,y+.085,-4.045);
    if(f.id==='moon-koi')box('gold',.12,.16,.02,x-.08,y+.04,-4.045);
  });
  B.build(scene);
  // A pixel-painted landscape sits within the divided window, lit by the same day key.
  const c=document.createElement('canvas');c.width=96;c.height=64;const ctx=c.getContext('2d');
  const windowTex=new THREE.CanvasTexture(c);windowTex.magFilter=windowTex.minFilter=THREE.NearestFilter;windowTex.colorSpace=THREE.SRGBColorSpace;
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.8),new THREE.MeshBasicMaterial({map:windowTex}));pane.position.set(3.45,2.65,-4.49);scene.add(pane);
  const trim=new Batch(M);for(const x of [2.08,3.45,4.82])trim.box('dark',.12,2,.2,x,2.65,-4.35);for(const y of [1.7,2.65,3.6])trim.box('dark',2.85,.12,.2,3.45,y,-4.35);trim.build(scene);
  const glow=glowTexture(64),ora=new Ora({glow,flare:glowTexture(64,1)});scene.add(ora.group,ora.trail);ora.place(new THREE.Vector3(1.9,1.5,-2.8));
  const hearthFX=livingFire(scene,glow);
  const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(48*3);dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#edd4a0',size:.025,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);
  const spill=new THREE.Mesh(new THREE.PlaneGeometry(4,6),new THREE.MeshBasicMaterial({map:glow,color:'#efa852',transparent:true,opacity:.14,depthWrite:false,blending:THREE.AdditiveBlending}));spill.rotation.x=-Math.PI/2;spill.position.set(0,.14,-2.2);scene.add(spill);
  const lights=new LightPool(scene,2),fire=lights.add({pos:new THREE.Vector3(0,1,-3.2),intensity:28,color:'#ffae58',distance:10}),windowLight=lights.add({pos:new THREE.Vector3(3.4,2,-3.5),intensity:14,color:'#b4cfed',distance:10,flicker:0});
  const hemi=new THREE.HemisphereLight('#d0c6bb','#3a2d31',2);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffd0a0',2.5);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});scene.add(sun);
  const sheet=A.atlas,s=sheet.sprite,hero=new SpriteCharacter({map:sheet.map,emissiveMap:sheet.emissiveMap,...s,contactTex:glow});hero.applyGear();attachAtlasRun(hero,sheet);hero.group.position.set(-4.9,0,3.2);scene.add(hero.group);
  const cam=new DioramaCamera(engine.camera,{pitch:34,dist:19.5,fov:36,height:1,lead:0});cam.snap(new THREE.Vector3(0,0,0));
  const day=new DayCycle({start:time in KEYS?time:'dusk'}),input=new Input();
  let rest=0,changed=false,flare=0,visitWindow=0,board=0,leaving=false,pointer=false,lastWindow='';
  const fade=document.createElement('div');fade.id='home-rest';fade.style.cssText='position:fixed;inset:0;background:#080b14;opacity:0;pointer-events:none;z-index:35';document.body.append(fade);
  const cue=document.createElement('div');cue.id='home-a';cue.textContent='A';cue.style.cssText='position:fixed;pointer-events:none;border-radius:50%;width:26px;height:26px;line-height:26px;text-align:center;font:600 19px Cinzel;color:#332712;background:radial-gradient(circle at 35% 30%,#fff0bd,#dab76e 70%,#9c743b);border:1px solid #75582e;box-shadow:0 0 12px #e4bb7060;z-index:15';document.body.append(cue);
  addEventListener('pointerdown',e=>{if(e.target.id==='view'&&e.button===0)pointer=true;});
  let audio;const chord=()=>{audio??=new AudioContext();audio.resume();for(const f of [130.81,196,329.63]){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+3);o.connect(g).connect(audio.destination);o.start();o.stop(t+3.1);}};
  function paintWindow(){if(lastWindow===day.name)return;lastWindow=day.name;paintGarden(ctx,day.name);windowTex.needsUpdate=true;}
  day.onApply(k=>{hemi.intensity=day.name==='night'?1.1:1.8;sun.color.copy(k.lightColor);sun.intensity=k.lightInt*.45;windowLight.color.copy(k.lightColor);windowLight.intensity=day.name==='night'?8:18;hero.rim.value.copy(k.rim).multiplyScalar(.2);const F=engine.post.final.u,H=engine.post.haze.u;F.uExposure.value=1.25;F.uBloom.value=.22;F.uVignette.value=.35;F.uShaft.value=0;H.uHazeDensity.value=0;H.uFogA.value=0;H.uFocusDist.value=engine.camera.position.distanceTo(hero.group.position);paintWindow();});
  const api={hero,ora,cam,day,input,lights,trophies:trophies.map(f=>f.id),spots:HOME_SPOTS,walkable:homeWalkable,
    get moment(){return {rest,flare,window:visitWindow,board};},
    teleport(x,z,dir='up'){hero.group.position.set(x,0,z);hero.dir=dir;},setTime(name,instant=true){day.set(name,instant);},
    update(dt,t){
      const p=hero.group.position,right=cam.right(),fwd=cam.forward();
      if(input.consume('KeyT')&&!rest)day.next();if(input.consume('KeyQ'))cam.turn(-1);if(input.consume('KeyE'))cam.turn(1);
      const ax=input.axis(),move=right.clone().multiplyScalar(ax.x).addScaledVector(fwd,ax.y);if(move.length())move.normalize();
      const speed=rest||leaving?0:ax.run?5:3;const nx=p.x+move.x*speed*dt,nz=p.z+move.z*speed*dt;if(homeWalkable(nx,p.z))p.x=nx;if(homeWalkable(p.x,nz))p.z=nz;
      hero.update(dt,engine.camera,speed&&move.length()?move:null,speed,right,fwd);
      let near=null,d=1.8;for(const [id,spot]of Object.entries(HOME_SPOTS)){const nd=Math.hypot(p.x-spot.x,p.z-spot.z);if(nd<d){d=nd;near=id;}}
      const press=['Space','KeyF','Enter'].map(k=>input.consume(k)).some(Boolean)||pointer;pointer=false;
      if(press&&!rest&&!leaving){if(near==='door'){leaving=true;go?.('green',{time:day.name});}if(near==='bed'){rest=4;changed=false;chord();}if(near==='hearth'){flare=3;chord();}if(near==='window')visitWindow=7;if(near==='trophies')board=6;}
      if(rest){rest=Math.max(0,rest-dt);if(rest<2.2&&!changed){day.set(nextRestTime(day.name),true);changed=true;}fade.style.opacity=String(Math.min(1,(4-rest)*1.4,rest));hero.mesh.rotation.z=-Math.PI/2;hero.group.position.set(-4.3,1.2,-1.5);if(!rest){hero.mesh.rotation.z=0;hero.group.position.set(-2.6,0,-.7);}}
      const breath=hearthFX.update(t,flare);spill.material.opacity=.17*breath+flare*.025;
      for(let i=0;i<48;i++)dustGeo.attributes.position.setXYZ(i,2.4+Math.sin(i*7.3+t*.08)*1.6,.4+(i*.37+t*.07)%2.9,-2.6+Math.cos(i*2.1+t*.03)*1.4);dustGeo.attributes.position.needsUpdate=true;
      fire.intensity=32*breath+flare*15;flare=Math.max(0,flare-dt);visitWindow=Math.max(0,visitWindow-dt);board=Math.max(0,board-dt);
      ora.update(dt,t,new THREE.Vector3(visitWindow?3.45:1.9,visitWindow?2.5:1.5,visitWindow?-3.6:-2.8),engine.camera,engine.post.h);
      cam.target.dist=board?14.8:19.5;cam.update(dt,board?new THREE.Vector3(-2.6,.5,-2):new THREE.Vector3(0,0,0));day.update(dt);lights.update(cam.focus,dt,t);
      cue.style.display=near&&!rest?'block':'none';if(near){const s=HOME_SPOTS[near],v=new THREE.Vector3(s.x,2.2,s.z).project(engine.camera);cue.style.left=`${(v.x*.5+.5)*innerWidth-13}px`;cue.style.top=`${(-v.y*.5+.5)*innerHeight}px`;}
      input.endFrame();
    }};
  engine.add(api);return api;
}
