// Plaza-only extension of the shared fade. The cutout follows Atlas in screen space,
// so merged architecture and instanced foliage keep their existing draw-call budget.
import { addOccluderFade } from './reflection.js';
export function plazaOccluderFade(material) {
  addOccluderFade(material);
  const compile=material.onBeforeCompile, key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
    compile(shader,renderer);
    shader.fragmentShader=shader.fragmentShader
      .replace('uOcc.z - 1.2','uOcc.z - 0.25')
      .replace('smoothstep(1.0, 0.5, rr) * 0.7','smoothstep(1.0, 0.72, rr) * 0.98');
  };
  material.customProgramCacheKey=()=>key()+'|telor-clear-hero';
}
