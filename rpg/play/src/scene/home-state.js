// Rest changes only the current visit's light; it never writes a save.
export const nextRestTime = time => time === 'night' ? 'dawn' : time === 'dawn' ? 'dusk' : time === 'golden' ? 'dusk' : 'night';
export const HOME_SPOTS = { bed: {x:-4,z:-1}, hearth:{x:0,z:-3}, window:{x:3.8,z:-3}, trophies:{x:-3.7,z:-3}, door:{x:-4.9,z:3.2} };
export const homeWalkable = (x,z) => Math.abs(x)<5.5 && Math.abs(z)<4.2 && !(x < -3 && z < .6) && !(Math.abs(x)<1.6 && z < -3.2) && !(x>2.1 && x<4.7 && z>-.6 && z<2);
