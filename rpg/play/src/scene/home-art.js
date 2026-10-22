// Hand-placed cottage details. Static pieces share the room's material batches.
import * as THREE from 'three';

export function dressCottage(B,M,mat){
  Object.assign(M,{leaf:mat('#657b4b'),leafLight:mat('#91a46a'),terra:mat('#ab7353'),ochre:mat('#d4a455'),iron:mat('#32383a'),paper:mat('#e1d3a9'),lamp:mat('#ffd895',null,{emissive:'#ffb653',emissiveIntensity:1.8})});
  const box=(...a)=>B.box(...a);
  const ball=(key,x,y,z,sx,sy,sz)=>{const g=new THREE.SphereGeometry(1,8,5);g.scale(sx,sy,sz);g.translate(x,y,z);B.add(key,g);};
  const torus=(key,r,t,x,y,z,rx=0)=>{const g=new THREE.TorusGeometry(r,t,4,16);g.rotateX(rx);g.translate(x,y,z);B.add(key,g);};
  // Ceiling rafters stop at the rear half so the cutaway remains open.
  for(const x of [-5.7,5.7])box('dark',.2,.24,4.3,x,4,-2.4);
  box('dark',11.7,.22,.24,0,4.05,-4.4);
  box('dark',2.8,.18,.2,0,4.05,-2.1);
  // Bundles of drying rosemary and sage, tied to a beam.
  for(let i=0;i<4;i++){const x=-.65+i*.4;box('gold',.025,.42,.025,x,3.76,-2.1);for(let j=0;j<5;j++){box(j%2?'leafLight':'leaf',.08,.3+(j%3)*.1,.09,x+(j-2)*.055,3.36,-2.1+(j%2)*.06);}box('terra',.24,.04,.14,x,3.57,-2.1);}
  // Lantern: luminous glass, cage, cap and hanging ring; no extra point light.
  box('iron',.035,.6,.035,4.95,3.65,-2.1);box('lamp',.32,.48,.32,4.95,3.11,-2.1);
  for(const x of [4.75,5.15])for(const z of [-2.3,-1.9])box('iron',.045,.55,.045,x,3.11,z);
  box('gold',.53,.09,.53,4.95,2.82,-2.1);B.pyramid('iron',.62,.62,.24,4.95,3.38,-2.1);torus('gold',.1,.025,4.95,3.67,-2.1);
  function plant(x,z,s){B.cyl('terra',.32*s,.5*s,x,.1,z,10,.4*s);torus('ochre',.39*s,.045*s,x,.6*s,z,Math.PI/2);for(let i=0;i<9;i++){const a=i*2.4,r=(.15+i%3*.09)*s;box('leaf',.035*s,.7*s,.035*s,x,.85*s,z);ball(i%2?'leafLight':'leaf',x+Math.cos(a)*r,(.7+i%4*.17)*s,z+Math.sin(a)*r,.17*s,.3*s,.12*s);}}
  plant(5.1,3.6,1.2);plant(-5.05,1.25,.8);
  // Coat and hooks inside the door: navy wool, gold cuffs and a folded collar.
  box('wood',.16,.17,1.2,-5.7,2.05,1.25);
  for(const z of [.85,1.25,1.65])box('gold',.23,.06,.06,-5.55,2.05,z);
  box('navy',.22,1.03,.65,-5.45,1.48,1.25);box('navy',.32,.58,.18,-5.39,1.68,.83);box('navy',.32,.58,.18,-5.39,1.68,1.67);
  for(const z of [.83,1.67])box('gold',.34,.065,.19,-5.39,1.41,z);box('gold',.24,.06,.66,-5.45,1,1.25);
  for(const x of [-3.07,-2.03])for(const y of [1.04,2.06])box('gold',.065,.065,.04,x,y,-4.24);
  // A low armchair in the bed's existing solid footprint, angled toward the hearth.
  box('dark',1.2,.22,1.15,-3.65,.5,-.25);box('rug',1,.22,.95,-3.65,.71,-.25);box('rug',1.15,1.05,.2,-3.65,1.05,.2);
  for(const x of [-4.24,-3.06]){box('dark',.14,.8,.14,x,.55,-.25);box('wood',.17,.16,1.12,x,.98,-.25);}
  box('navy',.5,.035,.9,-3.38,.85,-.25);box('navy',.5,.65,.04,-3.38,1.14,.32);
  for(const x of [-3.57,-3.2]){box('gold',.025,.02,.9,x,.88,-.25);box('gold',.025,.65,.02,x,1.14,.35);}
  // Woven rug: stepped diamonds, fine weft and fringed ends.
  for(let z=-.25;z<2.4;z+=.15)box('cream',4.1,.004,.018,-.25,.135,z);
  for(const x of [-1.65,-.25,1.15])for(const z of [.25,1,1.75])for(let row=-2;row<=2;row++)box(Math.abs(row)%2?'navy':'gold',.12+(2-Math.abs(row))*.16,.012,.105,x,.147,z+row*.12);
  for(let x=-2.3;x<1.9;x+=.14)for(const z of [-.67,2.66])box('cream',.04,.018,.2,x,.12,z);
  // Basket with woven ribs, leafy vegetables and carrots beside the table.
  B.cyl('wood',.48,.48,4.85,.1,1.75,12,.53);torus('ochre',.53,.045,4.85,.59,1.75,Math.PI/2);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box('ochre',.035,.42,.035,4.85+Math.cos(a)*.5,.35,1.75+Math.sin(a)*.5);}
  for(let i=0;i<7;i++){const a=i*2.4;ball(i%2?'leafLight':'ochre',4.85+Math.cos(a)*.28,.63,1.75+Math.sin(a)*.28,.14,.2,.14);}
  torus('wood',.5,.045,4.85,.77,1.75);
  // Open books and loose sheets, with ink lines rather than UI text.
  box('navy',.98,.06,.68,3.65,1.48,.95);for(const x of [3.4,3.88]){box('paper',.45,.045,.62,x,1.53,.95);for(let z=.74;z<1.2;z+=.085)box('terra',.28,.006,.012,x,1.559,z);}box('gold',.025,.015,.72,3.64,1.57,.97);
  box('paper',.5,.012,.38,4.05,1.46,.05);B.cyl('terra',.12,.17,3,1.45,-.03,8);
  // Iron kettle warming beside the logs, curved handle and spout.
  ball('iron',.95,.64,-3.75,.3,.29,.26);B.cyl('iron',.22,.07,.95,.88,-3.75,10);ball('gold',.95,.98,-3.75,.06,.05,.06);torus('iron',.28,.04,.95,.97,-3.75);box('iron',.3,.12,.12,1.22,.76,-3.75);
  // Ember seams in the charred, crossed logs.
  for(const [x,z,r] of [[-.4,-3.9,.2],[.3,-3.42,-.22]]){box('dark',1.35,.24,.3,x,.45,z,{rotY:r});for(let i=0;i<5;i++)box('lamp',.14,.025,.025,x-.45+i*.21,.51,z+.16,{rotY:r});}
}

export function islandMap(scene){
  const c=document.createElement('canvas');c.width=96;c.height=96;const p=c.getContext('2d');p.fillStyle='#c9b78e';p.fillRect(0,0,96,96);
  p.fillStyle='#839b91';p.fillRect(5,5,86,86);p.fillStyle='#728656';p.beginPath();p.ellipse(49,48,34,37,-.3,0,7);p.fill();p.strokeStyle='#b7ba7e';p.lineWidth=9;p.beginPath();p.arc(49,46,24,0,7);p.stroke();p.fillStyle='#d3c9a6';p.beginPath();p.arc(49,46,17,0,7);p.fill();p.strokeStyle='#777a70';p.lineWidth=2;p.beginPath();p.arc(49,46,15,0,7);p.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;p.fillStyle='#9b957d';p.fillRect(47+Math.cos(a)*10,44+Math.sin(a)*10,4,4);}p.fillStyle='#e7d3a1';p.fillRect(46,40,6,11);p.strokeStyle='#b9c2a0';p.beginPath();p.moveTo(49,64);p.lineTo(58,78);p.lineTo(62,90);p.stroke();p.fillStyle='#e4d2a3';p.fillRect(8,8,2,11);p.fillRect(5,11,8,2);
  const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.15),new THREE.MeshStandardMaterial({map:t,roughness:1}));mesh.position.set(-2.55,1.55,-4.28);scene.add(mesh);
}

export function paintGarden(ctx,name){
  const night=name==='night',dawn=name==='dawn',dusk=name==='dusk';const sky=night?['#14253d','#324253']:dawn?['#9eaeb3','#e8c79b']:dusk?['#6d788d','#d6a47d']:['#9ebbc0','#ecce9c'];
  for(let y=0;y<64;y++){ctx.fillStyle=y<16?sky[0]:sky[1];ctx.fillRect(0,y,96,1);}
  ctx.fillStyle=night?'#71869a':'#eed5a4';ctx.beginPath();ctx.arc(76,13,night?4:7,0,7);ctx.fill();
  ctx.fillStyle=night?'#293d3c':'#849365';ctx.beginPath();ctx.moveTo(0,35);ctx.quadraticCurveTo(28,20,53,35);ctx.quadraticCurveTo(78,23,96,31);ctx.lineTo(96,64);ctx.lineTo(0,64);ctx.fill();
  ctx.fillStyle=night?'#334c43':'#6e8851';ctx.fillRect(0,41,96,23);ctx.fillStyle=night?'#716954':'#c5b489';ctx.beginPath();ctx.moveTo(48,37);ctx.lineTo(52,37);ctx.lineTo(77,64);ctx.lineTo(59,64);ctx.fill();
  ctx.fillStyle='#615447';ctx.fillRect(19,21,4,30);ctx.fillRect(13,28,9,3);
  for(let i=0;i<17;i++){ctx.fillStyle=night?(i%2?'#304a40':'#3c5744'):(i%2?'#587446':'#799451');ctx.beginPath();ctx.arc(20+Math.sin(i*3.7)*12,19+Math.cos(i*2.3)*9,6+i%3,0,7);ctx.fill();}
  for(let i=0;i<80;i++){const x=i*31%96,y=44+i*7%20;ctx.fillStyle=night?'#496050':i%5?'#9ca267':'#e7c188';ctx.fillRect(x,y,1+i%2,2);}
  ctx.fillStyle=night?'#7d8070':'#d5c5a0';for(let x=38;x<96;x+=10)ctx.fillRect(x,35,2,11);ctx.fillRect(38,38,58,2);
  if(night){ctx.fillStyle='#d5d5b8';for(let i=0;i<16;i++)ctx.fillRect(i*31%96,i*7%25,1,1);}
}

export function livingFire(scene,glow){
  // One continuous, layered flame field: broad coal bed, wavering tongues and white-hot core.
  const uniforms={time:{value:0},flare:{value:0}};
  const flame=new THREE.Mesh(new THREE.PlaneGeometry(2.25,2.05),new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec2 v;uniform float time;uniform float flare;
    void main(){vec2 pixel=floor(v*64.)/64.;float y=pixel.y/(1.+flare*.08);float x=pixel.x;float field=0.;float core=0.;
      for(int i=0;i<5;i++){float n=float(i);float h=.52+.16*sin(n*4.1)+.12*sin(time*3.+n*2.);float center=.18+n*.16+sin(y*9.-time*4.+n)*.055*y;float width=(.17-y*.105+sin(y*42.-time*8.+n)*.014*y)*(1.-smoothstep(h-.14,h,y));field=max(field,1.-smoothstep(width*.65,width,abs(x-center)));core=max(core,1.-smoothstep(width*.22,width*.5,abs(x-center)));}
      float a=field*smoothstep(0.,.08,y)*(1.-smoothstep(.82,1.,y));vec3 col=mix(vec3(1.,.17,.018),vec3(1.8,.79,.10),core);col=mix(col,vec3(2.4,1.9,.75),core*(1.-smoothstep(.04,.42,y)));gl_FragColor=vec4(col,a*.94);}` }));
  flame.position.set(0,1.28,-3.6);scene.add(flame);
  const geo=new THREE.BufferGeometry(),pos=new Float32Array(26*3);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const embers=new THREE.Points(geo,new THREE.PointsMaterial({color:'#ffbc62',size:.045,map:glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(embers);
  const smokeGeo=new THREE.BufferGeometry();smokeGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9*3),3));const smoke=new THREE.Points(smokeGeo,new THREE.PointsMaterial({color:'#b9a58d',size:.48,map:glow,transparent:true,opacity:.095,depthWrite:false}));scene.add(smoke);
  return {update(t,flare){uniforms.time.value=t;uniforms.flare.value=flare;for(let i=0;i<26;i++){const age=(t*(.24+i%3*.055)+i*.137)%1;geo.attributes.position.setXYZ(i,Math.sin(i*12.3+age*5)*(.55-age*.25),.6+age*2.12,-3.55+Math.cos(i*5+age*3)*.14);}geo.attributes.position.needsUpdate=true;for(let i=0;i<9;i++){const a=(t*.22+i/9)%1;smokeGeo.attributes.position.setXYZ(i,Math.sin(a*7+t*.4)*.15,1.5+a*1.35,-4.02);}smokeGeo.attributes.position.needsUpdate=true;return 1+Math.sin(t*4.1)*.08+Math.sin(t*11.3)*.055;}};
}

export function warmSurround(scene){
  scene.background=new THREE.Color('#261e1b');
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShaderMaterial({vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;void main(){float r=exp(-length(p.xy)*.075);float grain=sin(p.x*12.+sin(p.y*.3)*2.)*.0015+sin(p.x*49.)*.0008;vec3 col=mix(vec3(.035,.025,.023),vec3(.13,.083,.052),r)+grain;gl_FragColor=vec4(col,1.);}`}));mesh.rotation.x=-Math.PI/2;mesh.position.y=-.48;scene.add(mesh);
}
