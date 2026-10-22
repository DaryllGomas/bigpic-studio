import * as THREE from 'three';
import {Batch} from '../engine/world/builders.js';
import {createParticles} from '../engine/fx/particles.js';
import {paintLeafyTree,paintReeds} from './green-art.js';
import {paintCitizenSheet} from './plaza/citizens-art.js';
import {rng} from '../engine/pixel/paint.js';
import {RIVER_PATH, TOBIN_BEFORE, TOBIN_AFTER, riverAwake, wakeRiver} from './river-state.js';

// A small river diorama, sharing the road's materials, sky, reflection, light pools and clock.
export async function createRiver({scene, M, glow, mist, mirror, talk, hero, camera, audio, open, fight}) {
  const group=new THREE.Group(); group.name='Mill Landing'; scene.add(group);
  const R=rng(20261018), B=new Batch(M);
  const foliage=[];
  function plant(map,x,z,w,h,y=0){const m=new THREE.MeshStandardMaterial({map,alphaTest:.4,side:THREE.DoubleSide,roughness:1});const g=new THREE.PlaneGeometry(w,h);g.translate(0,h/2,0);const p=new THREE.Mesh(g,m);p.position.set(x,y,z);group.add(p);foliage.push(p);return p;}
  const leaves=paintLeafyTree(81,['#172c23','#254233','#3c5a38','#627744','#899650','#aeb16b','#d4c58d'],null,'round').map;
  const reeds=paintReeds(18).map;
  for(const [x,z,w,h]of [[19,-249,9,13],[30,-263,11,15],[33,-281,9,12],[89,-277,12,16],[97,-269,10,14],[107,-284,9,12],[24,-310,12,15],[113,-314,15,18]])plant(leaves,x,z,w,h);
  for(let i=0;i<55;i++){const x=20+R()*112,z=i<30?-281-R()*2:-314-R()*5;if(Math.abs(x-69)<13&&z> -300)continue;plant(reeds,x,z,1.3+R(),1.4+R(),.25);}

  const timber=new THREE.MeshStandardMaterial({map:M.dark.map,color:'#72503b',roughness:.86});
  const roof=new THREE.MeshStandardMaterial({map:M.road.map,color:'#545b67',roughness:.78});
  const mats={...M,timber,roof}; const mill=new Batch(mats);
  // The fork bends into the sun. Kerbs and pooled lamps carry the eye, without signposts.
  for(let i=1;i<RIVER_PATH.length;i++){
    const [ax,az]=RIVER_PATH[i-1],[bx,bz]=RIVER_PATH[i],len=Math.hypot(bx-ax,bz-az),a=Math.atan2(bx-ax,bz-az);
    B.box('road',5.6,.14,len+1,(ax+bx)/2,.08,(az+bz)/2,{rotY:a});
    for(let d=0;d<len;d+=2.8){const t=d/len;for(const s of [-1,1])if(R()>.25)B.box('pale',.5,.25,.8,ax+(bx-ax)*t+Math.cos(a)*3.1*s,.13,az+(bz-az)*t-Math.sin(a)*3.1*s,{rotY:a});}
  }
  B.box('road',51,.13,15,62,.08,-270);
  // Shallow sand and submerged broken paving are visible under the glittering sheet.
  B.box('pale',124,.2,49,77,.02,-304);
  for(let i=0;i<70;i++)B.box(i%3?'dark':'gold',.5+R()*2,.12,.5+R()*1.5,21+R()*113,.16,-280-R()*44,{rotY:R()*3});
  const water=new THREE.MeshStandardMaterial({color:'#456f79',metalness:.5,roughness:.24,transparent:true,opacity:.84,emissive:'#254556',emissiveIntensity:.15});
  const waterTime={value:0};
  water.onBeforeCompile=sh=>{
    sh.uniforms.uRiverTime=waterTime;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vRiver;').replace('#include <project_vertex>','#include <project_vertex>\nvRiver=(modelMatrix*vec4(transformed,1.0)).xz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRiverTime; varying vec2 vRiver;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec2 p=floor(vRiver*12.0)/12.0;
      float wave=sin(p.x*3.2+p.y*1.7+uRiverTime*1.2)*sin(p.y*4.3-uRiverTime*.8);
      normal=normalize(normal+vec3(wave*.035,sin(p.x*2.0+uRiverTime)*.02,0.0));`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float glint=pow(max(0.0,sin(p.x*7.0+p.y*11.0+uRiverTime*.8)),32.0)*pow(max(0.0,wave),8.0);
      totalEmissiveRadiance+=vec3(1.0,.78,.42)*glint*.25;`);
  };
  water.customProgramCacheKey=()=> 'river-water-ripples-v1';
  mirror.apply(water,{base:.62,streak:.025});
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(124,49,1,1),water);surface.rotation.x=-Math.PI/2;surface.position.set(77,.28,-304);surface.layers.set(1);group.add(surface);
  // Ruined aqueduct: actual open arches, uneven crowns, broken ends, and falls from the old channel.
  const falls=[];
  const fc=document.createElement('canvas');fc.width=32;fc.height=128;const fg=fc.getContext('2d');
  for(let x=0;x<32;x++)for(let y=0;y<128;y++){const a=(.2+R()*.5)*Math.sin(Math.PI*x/32);fg.fillStyle=`rgba(208,238,234,${a})`;fg.fillRect(x,y,1,1+R()*4);}
  const fallTex=new THREE.CanvasTexture(fc);fallTex.wrapT=THREE.RepeatWrapping;fallTex.magFilter=THREE.NearestFilter;
  const fallMat=new THREE.MeshStandardMaterial({map:fallTex,color:'#b4dfdf',emissive:'#91becb',emissiveIntensity:.32,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false});
  for(let i=0;i<10;i++){
    const x=20+i*12,z=-319+(i%3)*.6,h=17+(i%4===0?1.5:0);
    B.box('pale',2.8,h,4,x,h/2,z);
    for(let v=0;v<3;v++)plant(reeds,x+1.4,h>17?-320:-317,2,5+R()*3,8+v*2);
    const crag=new THREE.DodecahedronGeometry(4+R()*3,0);crag.scale(1.4,.6,1);crag.translate(x+2,1,z+3);B.add('cliff',crag);B.box('dark',4,1,5,x,.5,z);
    if(i!==4&&i!==9){
      const sh=new THREE.Shape();sh.moveTo(-5,0);sh.lineTo(-5,5);sh.lineTo(5,5);sh.lineTo(5,0);sh.absarc(0,0,5,0,Math.PI,false);
      const g=new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:false,curveSegments:14});g.translate(x+6,h-5,z-1.5);B.add('pale',g);
      B.box('dark',12,.7,4.6,x+6,h+.35,z);
    }
    if(i===1||i===3||i===6||i===8){for(let j=0;j<5;j++){const f=new THREE.Mesh(new THREE.PlaneGeometry(.35+R()*.5,h-1),fallMat);f.position.set(x+2.5+j*.6,(h-1)/2,z+2);group.add(f);falls.push(f);}}
    for(let j=0;j<3;j++)B.box('heath',1.2,.25,1.4,x+R()*4-2,h+.8,z+R()*3-1.5);
  }
  // Mill Landing: stone mill, timber gables and flour sacks, a jetty, and an undershot wheel.
  mill.box('pale',8,6,8,42,3,-266);mill.box('dark',9,.5,9,42,.2,-266);
  for(const x of [38.1,45.9])mill.box('timber',.3,6,.35,x,3,-261.9);
  mill.box('timber',8,.3,.35,42,4,-261.9);mill.box('timber',1.8,3,.25,41,1.5,-261.8);
  for(const s of [-1,1]){const g=new THREE.BoxGeometry(5.4,.35,10);g.rotateZ(-s*.58);g.translate(42+s*2.05,6.8,-266);mill.add('roof',g);}
  for(const x of [39.5,44]){mill.box('glass',1.1,1.5,.08,x,4.6,-261.87);}
  for(let z=-267;z>=-281;z-=.65)mill.box('timber',6,.18,.58,48,.26,z);
  for(const x of [45.3,50.7])for(const z of [-268,-274,-280])mill.cyl('timber',.14,2,x,-1.1,z,6);
  for(let i=0;i<5;i++)mill.cyl('pale',.42,1,44+(i%2),.15,-264+Math.floor(i/2),7,.32);
  const built=B.build(group);built.road.layers.set(1);mill.build(group);
  const wheel=new THREE.Group();wheel.position.set(37.1,2.6,-273);group.add(wheel);
  for(const x of [-.6,.6]){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.16,5,24),timber);ring.rotation.y=Math.PI/2;ring.position.x=x;wheel.add(ring);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6,spoke=new THREE.Mesh(new THREE.BoxGeometry(1.5,.22,5.1),timber);spoke.rotation.x=a;wheel.add(spoke);const paddle=new THREE.Mesh(new THREE.BoxGeometry(1.7,.7,.25),timber);paddle.position.set(0,Math.sin(a)*2.5,Math.cos(a)*2.5);paddle.rotation.x=-a;wheel.add(paddle);}
  // Reuse Telor's shaded citizen painter, with a broad apron and flour on Tobin's shoulders.
  const citizens=paintCitizenSheet().map.toCanvas();
  function person(flour=false,variant=2,back=false,seated=false){
    const c=document.createElement('canvas');c.width=64;c.height=96;const g=c.getContext('2d');
    g.drawImage(citizens,(variant%2)*512,Math.floor(variant/2)*384+(back?96:0),64,96,0,0,64,96);
    if(flour){
      g.fillStyle='#bcb49a';g.fillRect(24,43,17,31);g.fillStyle='#eee3c8';g.fillRect(25,44,4,28);g.fillRect(28,44,10,3);
      for(let i=0;i<25;i++){g.fillStyle=i%3?'#e2d7bf':'#a09681';g.fillRect(22+Math.floor(R()*21),40+Math.floor(R()*35),2,2);}
    }
    if(seated)g.clearRect(0,77,64,19);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=tex.minFilter=THREE.NearestFilter;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,alphaTest:.1}));sp.center.set(.5,0);sp.scale.set(flour?2.1:1.6,flour?2.65:2.4,1);return sp;
  }
  const tobin=person(true,2);tobin.position.set(48,.38,-276);group.add(tobin);
  const boats=[];
  for(let i=0;i<3;i++){
    const boat=new THREE.Group(),hull=new THREE.Mesh(new THREE.SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2),timber);hull.rotation.x=Math.PI;hull.scale.set(1.15,.75,2.7);hull.position.y=.6;boat.add(hull);
    for(const z of [-1,1]){const seat=new THREE.Mesh(new THREE.BoxGeometry(2.1,.15,.4),timber);seat.position.set(0,.55,z);boat.add(seat);}
    const passenger=person(false,[9,15,0][i],true,true);const homeTexture=person(false,[9,15,0][i],false,true).material.map;const pullTexture=passenger.material.map;passenger.scale.multiplyScalar(.73);passenger.position.set(0,.4,0);boat.add(passenger);
    const oars=[];for(const s of [-1,1]){const oar=new THREE.Group();oar.position.set(s*.9,.65,.6);const shaft=new THREE.Mesh(new THREE.BoxGeometry(3.3,.09,.12),timber);shaft.position.x=s*1.1;oar.add(shaft);const blade=new THREE.Mesh(new THREE.BoxGeometry(.8,.12,.5),timber);blade.position.x=s*2.7;oar.add(blade);boat.add(oar);oars.push(oar);}
    group.add(boat);boats.push({boat,oars,passenger,homeTexture,pullTexture,x:51+i*13,z:-294-i*3});
  }
  const [idleTex,awakeTex]=await Promise.all(['idle','woken'].map(p=>new THREE.TextureLoader().loadAsync('/rpg/play/pitch/beat/art/current/poses/'+p+'.png')));
  for(const t of [idleTex,awakeTex])t.colorSpace=THREE.SRGBColorSpace;
  const current=new THREE.Sprite(new THREE.SpriteMaterial({map:idleTex,alphaTest:.035,color:'#e4f5ff'}));current.center.set(.5,0);current.scale.set(17,17*idleTex.image.height/idleTex.image.width,1);current.position.set(69,.35,-293);group.add(current);
  const shimmer=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#7bdfeb',transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending}));shimmer.position.set(69,2,-293.5);shimmer.scale.set(22,12,1);group.add(shimmer);
  const spray=createParticles({preset:'mist',count:26,min:new THREE.Vector3(20,.4,-320),max:new THREE.Vector3(132,2,-310),texture:mist,seed:18,overrides:{size:7,speed:.2}});group.add(spray);
  const glitter=createParticles({preset:'fireflies',count:100,min:new THREE.Vector3(30,.35,-312),max:new THREE.Vector3(110,1,-280),texture:glow,seed:26});group.add(glitter);
  const riverLanterns=[];
  for(let i=0;i<9;i++){const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#ffce89',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));lamp.position.set(39+i*7,.65,-286-(i%3)*4);lamp.scale.set(1.2,1.2,1);group.add(lamp);riverLanterns.push(lamp);}
  const lamps=[];
  for(const [x,z] of [[12,-233],[31,-248],[55,-265],[83,-276]]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,2,6),timber);post.position.set(x,1,z);group.add(post);
    const bulb=new THREE.Mesh(new THREE.BoxGeometry(.4,.65,.4),M.glass);bulb.position.set(x,2.1,z);group.add(bulb);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#ffcc83',transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));halo.position.copy(bulb.position);halo.scale.set(4,4,1);group.add(halo);
    const light=new THREE.PointLight('#ffcb85',0,12,2);light.position.copy(bulb.position);group.add(light);lamps.push(light);
  }
  let awake=riverAwake(localStorage),busy=false,replay=false,waterGain=null;
  const start=()=>{if(busy||!open())return;busy=true;fight(result=>{if(result?.won){wakeRiver(localStorage,result);awake=true;}busy=false;});};
  const edge={x:69,y:0,z:-279.5};
  talk.register({id:'tobin',name:'Tobin',pos:()=>open()?tobin.position:null,lines:()=>awake?TOBIN_AFTER:TOBIN_BEFORE});
  talk.register({id:'current',name:'The Current',marker:false,pos:()=>open()?edge:null,onBefore:()=>{replay=false;if(!awake)start();},lines:()=>awake?['The river has room for every way home.']:[],choices:()=>[{label:'Another time.',choose:()=>null},{label:'One more go?',choose:()=>{replay=true;return null;}}],onEnd:done=>{if(done&&replay)start();}});
  const hint=document.createElement('div');hint.textContent='A';hint.style.cssText='position:fixed;z-index:20;border:2px solid #e5c47d;border-radius:50%;width:30px;height:30px;text-align:center;font:bold 22px/30px Georgia;color:#ffe4a2;background:#18282bcc;box-shadow:0 0 18px #edbe5a66;pointer-events:none;display:none';document.body.append(hint);
  // Water noise uses the road's own audio context/master, so the door's suspend and duck cover it too.
  function sound(amount){
    if(!audio.ctx)return;
    if(!waterGain){const ctx=audio.ctx,buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),d=buffer.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=(v+.12*(R()*2-1))/1.12;d[i]=v*2;}const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;waterGain=ctx.createGain();waterGain.gain.value=0;source.connect(filter).connect(waterGain).connect(audio.master);source.start();}
    waterGain.gain.setTargetAtTime(amount*.6,audio.ctx.currentTime,.3);
  }
  const api={group,current,tobin,wheel,boats,water,edge,get awake(){return awake;},update(dt,t,day){
    group.visible=open();sound(open()?Math.max(0,1-Math.hypot(hero.x-60,hero.z+275)/75):0);if(!group.visible){hint.style.display='none';return;}
    current.material.map=awake?awakeTex:idleTex;current.scale.y=17*current.material.map.image.height/current.material.map.image.width;current.position.y=.35+Math.sin(t*.8)*.07;
    waterTime.value=t;for(const [i,l]of riverLanterns.entries()){l.material.opacity=awake?.65:0;l.position.y=.65+Math.sin(t+i)*.08;}
    water.color.set(awake?'#7aa9a7':'#456f79');water.opacity=awake?.68:.84;water.roughness=.22+Math.sin(t*.5)*.025;
    shimmer.material.opacity=.14+Math.sin(t*1.3)*.045;shimmer.material.color.set(awake?'#ffd49a':'#7bdfeb');
    if(awake)wheel.rotation.x+=dt*.42;
    for(const [i,b] of boats.entries()){
      b.passenger.material.map=awake?b.homeTexture:b.pullTexture;
      // Bounded drift out, then purposeful trips home with working oars after the wake.
      const phase=(t*(awake?.045:.012)+i*.31)%1;
      b.boat.position.set(b.x+(awake?-6:3)*phase,.32+Math.sin(t*1.1+i)*.08,b.z+(awake?14:-4)*phase);
      b.boat.rotation.y=awake?Math.PI:0;for(const [j,o]of b.oars.entries())o.rotation.y=awake?Math.sin(t*2+i)*(j?-.4:.4):0;
    }
    fallTex.offset.y=-t*.23;for(const p of foliage)p.rotation.y=Math.atan2(camera.position.x-p.position.x,camera.position.z-p.position.z);
    for(const f of falls)f.scale.x=.8+Math.sin(t*3+f.position.x)*.16;
    for(const l of lamps)l.intensity=(awake?9:4)*(1+day.stars);
    spray.update(dt,t,camera,innerHeight);glitter.material.uniforms.uIntensity.value=awake?3:1.8;glitter.update(dt,t,camera,innerHeight);
    const near=Math.hypot(hero.x-edge.x,hero.z-edge.z)<2.9&&!talk.active&&!busy,p=new THREE.Vector3(edge.x,2.6,edge.z).project(camera);
    hint.style.display=near&&p.z<1?'block':'none';hint.style.left=((p.x*.5+.5)*innerWidth-16)+'px';hint.style.top=((-p.y*.5+.5)*innerHeight-16)+'px';
  }};
  group.visible=open();return api;
}
