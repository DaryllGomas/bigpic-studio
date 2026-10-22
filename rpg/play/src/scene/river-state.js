// A separate deed: waking the river never changes Sloth's quest or replay state.
export const RIVER_KEY = 'atlas.road.current';
export const TOBIN_BEFORE = [
  'The boats keep slipping their ropes. Nobody in them seems to mind.',
  'They just watch the water. Even my wheel has stopped listening to the river.',
  'There is bread here, if you are staying a while.',
];
export const TOBIN_AFTER = [
  'Look at them rowing. I had forgotten how much noise coming home makes.',
  'The wheel has found its beat again. Thank you, Atlas.',
  'Warm bread tomorrow. The first loaf is yours.',
];
export function riverAwake(storage) { try { return storage.getItem(RIVER_KEY) === '1'; } catch { return false; } }
export function wakeRiver(storage, result) {
  if(!result || result.won===false)return;
  try {
    storage.setItem(RIVER_KEY, '1');
    if(result.won){
      storage.setItem('atlas.match.current',JSON.stringify(result));
      return;
    }
    const key = 'atlas.beat.best.current', old = JSON.parse(storage.getItem(key) || 'null');
    if (!old || result.perfects + result.goods * .7 > old.perfects + old.goods * .7)
      storage.setItem(key, JSON.stringify({grade: result.grade, perfects: result.perfects, goods: result.goods, maxCombo: result.maxCombo}));
  } catch {}
}
// The bank and branch are deliberately bounded; the water is scenery, not an invisible route past the world edge.
export const RIVER_PATH = [[0,-228],[12,-233],[25,-243],[36,-254],[53,-266],[67,-275]];
export function onRiverPath(x,z) {
  for (let i=1;i<RIVER_PATH.length;i++) {
    const [ax,az]=RIVER_PATH[i-1], [bx,bz]=RIVER_PATH[i], dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    if (Math.hypot(x-ax-t*dx,z-az-t*dz)<3.5) return true;
  }
  return x>35 && x<89 && z< -261 && z> -281;
}
