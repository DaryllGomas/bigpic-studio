// Asset loading through a manifest. Every texture and sprite has a key; an entry is either a procedural painter or an image.
// To swap in painted art later, replace an entry with { image: 'art/foo.png', emissive?, normal?, sprite? } and nothing else changes.
import * as THREE from 'three';
import * as Tex from './pixel/textures.js';
import * as WorldSprites from './pixel/world-sprites.js';
import * as AtlasSprite from './pixel/atlas-sprite.js';

const PAINTERS = { ...Tex, ...WorldSprites, ...AtlasSprite };
const loader = new THREE.TextureLoader();

function asTexture(v, sprite) {
  if (!v) return v;
  if (v.isTexture) return v;
  return v.texture({ repeat: !sprite, mips: !sprite });  // a PixelCanvas
}

async function loadImage(url, color = true, sprite = false) {
  const t = await loader.loadAsync(url);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.magFilter = THREE.NearestFilter;
  if (sprite) { t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } else { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

export async function loadAssets(manifest) {
  const out = {};
  for (const [key, e] of Object.entries(manifest)) {
    const sprite = !!e.sprite;
    if (e.image) {
      out[key] = { map: await loadImage(e.image, true, sprite), sprite: e.sprite };
      if (e.emissive) out[key].emissiveMap = await loadImage(e.emissive, true, sprite);
      if (e.normal) out[key].normalMap = await loadImage(e.normal, false, sprite);
      continue;
    }
    const f = PAINTERS[e.painter];
    if (!f) throw new Error('no painter ' + e.painter + ' for ' + key);
    const r = f(...(e.args || []));
    const o = { sprite: e.sprite, raw: r };
    for (const k of ['map', 'normalMap', 'ormMap', 'emissiveMap']) if (r[k]) o[k] = asTexture(r[k], sprite);
    if (r.emissive) o.emissiveMap = asTexture(r.emissive, sprite);
    if (r.tpu) o.tile = r.size ? [r.size[0] / r.tpu, r.size[1] / r.tpu] : 4;
    out[key] = o;
  }
  return out;
}
