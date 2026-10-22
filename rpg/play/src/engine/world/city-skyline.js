// One canonical distant City: three static painted depth planes, centred on the Nexus.
// Shapes stay transparent above the roofs and through the arcades; no horizon rectangle.
import * as THREE from 'three';

const WIDTH = 1024, HEIGHT = 384, WORLD_WIDTH = 280, WORLD_HEIGHT = 105;
function canvas(w = WIDTH, h = HEIGHT) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function texture(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}

function paintLayer(tier) {
  const [c,g]=canvas();
  g.scale(WIDTH/WORLD_WIDTH,HEIGHT/WORLD_HEIGHT);g.translate(WORLD_WIDTH/2,WORLD_HEIGHT);g.scale(1,-1);
  const radius=[127,100,66][tier], base=[10,23,38][tier];
  // Elliptical terrace fronts describe a round city climbing its ancient hill.
  g.fillStyle=['#887969','#a89785','#b3a18e'][tier];
  g.beginPath();g.ellipse(0,base+3,radius,12,0,Math.PI,Math.PI*2);g.lineTo(radius,base-7);g.ellipse(0,base-7,radius,12,0,0,Math.PI,true);g.closePath();g.fill();
  for(let j=0;j<3;j++){
    g.strokeStyle=j===0?'#f3cd83':'#e7d6b1';g.lineWidth=j===0?.65:.4;
    g.beginPath();g.ellipse(0,base+3-j*3,radius,12,0,Math.PI,Math.PI*2);g.stroke();
  }
  // Waterfalls and navy sanctuary standards along the curved front.
  for(let i=-5;i<=5;i++){
    const x=i*radius/6,y=base+3-12*Math.sqrt(1-(x/radius)**2);
    g.fillStyle='#b9e3e4';g.fillRect(x-1,y-6,2,6);g.fillStyle='#f6e9ce';g.fillRect(x-.65,y-6,.3,6);
    if(i%2===0){g.fillStyle='#182b45';g.fillRect(x+3,y-5,2.3,6);g.fillStyle='#e8bf73';g.fillRect(x+3.9,y-4,.4,4);}
  }
  const count=[21,17,11][tier];
  for(let i=0;i<count;i++){
    const a=(i/(count-1))*Math.PI,x=Math.cos(a)*radius*.94;
    const y=base+2+Math.sin(a)*5;
    const h=14+(1-Math.abs(x)/140)*22+((i*17+tier*11)%19),w=2.5+(i%3)*1.1;
    const grad=g.createLinearGradient(x-w,0,x+w,0);grad.addColorStop(0,'#f4e4c5');grad.addColorStop(.42,'#e9d5b2');grad.addColorStop(.44,'#526b81');grad.addColorStop(.8,'#293e57');grad.addColorStop(1,'#b3b7b3');g.fillStyle=grad;
    g.beginPath();g.moveTo(x-w,y);g.lineTo(x+w,y);g.lineTo(x+w*.6,y+h-4);g.lineTo(x+.3,y+h+5);g.lineTo(x-.4,y+h);g.lineTo(x-w*.7,y+h-6);g.closePath();g.fill();
    g.fillStyle='#eac786';g.fillRect(x-w*.65,y+2,.35,h-5);
    g.fillStyle='#9ce4e3';g.fillRect(x+w*.35,y+4,.25,h-7);
    g.fillStyle='#f9d795';for(let j=3;j<h-5;j+=4)g.fillRect(x-.1,y+j,.5,.65);
  }
  if(tier===2){
    g.fillStyle='#d8c29b';g.fillRect(-9,31,18,21);g.fillStyle='#263d56';g.fillRect(-5,35,10,25);
    for(const x of [-9,-6,6,9]){g.fillStyle='#f3d59c';g.fillRect(x-.45,32,.9,40-Math.abs(x));}
    g.strokeStyle='#ffe3a1';g.lineWidth=.9;g.beginPath();g.ellipse(0,64,24,5,-.05,0,Math.PI*2);g.stroke();
    g.strokeStyle='#a9e7eb';g.lineWidth=.35;g.beginPath();g.ellipse(0,64,22,4,-.05,0,Math.PI*2);g.stroke();
    g.strokeStyle='#ffdda0';g.lineWidth=.6;g.beginPath();g.ellipse(0,80,15,3,0,0,Math.PI*2);g.stroke();
  }
  // Luminous upper promenades tie the spires together.
  g.strokeStyle='#b4e2de';g.lineWidth=.45;
  for(const side of [-1,1]){g.beginPath();g.moveTo(side*20,base+22);g.quadraticCurveTo(side*52,base+15,side*78,base+25);g.stroke();}
  return texture(c);
}

function glowMap(beam = false) {
  const [c, g] = canvas(128, 256);
  if (beam) {
    const across = g.createLinearGradient(0, 0, 128, 0);
    across.addColorStop(0, 'transparent'); across.addColorStop(0.45, '#ffe7ac');
    across.addColorStop(0.5, '#fff9e7'); across.addColorStop(0.55, '#ffe7ac'); across.addColorStop(1, 'transparent');
    g.fillStyle = across; g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, 0, 256);
    fade.addColorStop(0, 'transparent'); fade.addColorStop(0.4, '#ffffff88'); fade.addColorStop(1, '#ffffff');
    g.fillStyle = fade; g.fillRect(0, 0, 128, 256);
  } else {
    const radial = g.createRadialGradient(64,128,0,64,128,64);
    radial.addColorStop(0, '#ffeaca90'); radial.addColorStop(0.35, '#ffe2b530'); radial.addColorStop(1, 'transparent');
    g.fillStyle = radial; g.fillRect(0,0,128,256);
  }
  return texture(c);
}

/** Add the distant City. Direction is a horizontal Vector3 (or {x,z}), distance
 * is measured from the world origin, and scale uniformly sizes the architecture.
 * Set returned group.position.y for the local hill elevation. Call update(timeSeconds)
 * for the beacon pulse; dispose() removes the City and releases its owned resources.
 * Example: createCitySkyline(scene, 470, { x: 0, z: -1 }, 1).
 */
export function createCitySkyline(scene, distance = 470, direction = { x: 0, z: -1 }, scale = 1) {
  const length = Math.hypot(direction.x, direction.z);
  if (!Number.isFinite(length) || length === 0 || !Number.isFinite(distance) || distance <= 0 || !Number.isFinite(scale) || scale <= 0) {
    throw new RangeError('City skyline needs a horizontal direction, positive distance and scale');
  }
  const group = new THREE.Group(); group.name = 'city-skyline';
  group.position.set(direction.x/length*distance, 0, direction.z/length*distance);
  group.rotation.y = Math.atan2(-direction.x, -direction.z); group.scale.setScalar(scale);
  const geometry = new THREE.PlaneGeometry(1,1), maps = [], materials = [];
  function plane(map, w, h, y, z, additive = false, opacity = 1) {
    maps.push(map);
    const material = new THREE.MeshBasicMaterial({ map, transparent: true, opacity,
      side: THREE.DoubleSide, depthWrite: !additive, alphaTest: additive ? 0 : 0.03,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material); mesh.scale.set(w,h,1); mesh.position.set(0,y,z);
    mesh.name = additive ? 'nexus-light' : 'city-depth-layer'; group.add(mesh); return mesh;
  }
  // Back to front, with distance and baked haze both increasing away from the viewer.
  for (let tier = 2; tier >= 0; tier--) plane(paintLayer(tier), WORLD_WIDTH, WORLD_HEIGHT, WORLD_HEIGHT/2+tier*2, 35-tier*35);
  plane(glowMap(), 125, 155, 65, -45, true, 0.24);
  const beam = plane(glowMap(true), 5, 92, 87, 1, true, 0.66);
  plane(glowMap(), 14, 22, 44, 2, true, 0.8);
  // A single emissive halo remains legible through the Green's dusk haze.
  const haloGeometry = new THREE.TorusGeometry(24, .28, 5, 80);
  const haloMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe3a1').multiplyScalar(2), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial); halo.scale.y=.22; halo.position.set(0,64,3); group.add(halo);
  scene.add(group);
  return {
    group,
    update(timeSeconds) { beam.material.opacity = 0.62 + Math.sin(timeSeconds*0.7)*0.06; },
    dispose() { group.removeFromParent(); geometry.dispose(); haloGeometry.dispose(); haloMaterial.dispose(); for (const m of materials) m.dispose(); for (const t of maps) t.dispose(); },
  };
}
