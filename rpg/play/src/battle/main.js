// THE RPG battle feel test: Atlas + Ora vs Sloth on the old road. Model 1 (reactive parry) + model 3 (shield / break / boost).
import * as THREE from 'three';
import { Clock, ease } from './clock.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { buildArena } from './arena.js';
import { Atlas, Ora, Sloth, HOME } from './actors.js';
import { Fx, Rig, makePost, glowTexture } from './fx.js';
import { UI } from './ui.js';

const Q = new URLSearchParams(location.search);
const TRAINED = Q.get('trained') === '1', CAP = TRAINED ? 4 : 3;
const WEAK = ['light', 'echo'];
// Parry timing (seconds, t = contact - press, positive = early). The ring closes and the hand lands ON the beat.
// LAT compensates browser input + display lag. Late presses are still read during the contact hit-stop.
const LAT = .03, PERF_EARLY = .10, PERF_LATE = .08, GOOD_EARLY = .30, GOOD_LATE = .16, LOCKOUT = .28;
// Every slam has the same shape: a wind-up hold, then a two-beat count-in (tick . tick . CONTACT) at its own tempo.
// lesser = quick, heavy = the standard, drag (slowing slam) = a dragging tempo: Sloth slows time.
const TEMPO = { lesser: { hold: .45, beat: .33, dmg: 9 }, heavy: { hold: .95, beat: .42, dmg: 18 }, drag: { hold: 1.0, beat: .58, dmg: 18 } };

// ---- renderer / scene
const canvas = document.getElementById('view'), hud = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(41, 1, .1, 600);
const W = () => innerWidth, H = () => innerHeight - 22;
renderer.setSize(W(), H(), false);
const clock = new Clock(), input = new Input(canvas), sfx = new Sfx(), ui = new UI(hud, TRAINED);
const arena = buildArena(scene, renderer), glowTex = glowTexture();
const fx = new Fx(scene), rig = new Rig(camera), post = makePost(renderer, scene, camera, W(), H());
const atlas = new Atlas(), ora = new Ora(glowTex), sloth = new Sloth(glowTex);
scene.add(atlas.group, ora.group, sloth.group);
addEventListener('resize', () => { renderer.setSize(W(), H(), false); post.comp.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
camera.aspect = W() / H();

// ---- state
const S = { aHp: 60, aMax: 60, sHp: 120, sMax: 120, shield: 6, boost: 1, broken: false, tonics: 3, queue: [], parry: null, over: false, slams: 0, mood: 'norm', phase: 'load', log: [] };
let idc = 0; const mk = (who, extra = {}) => ({ id: ++idc, who, ...extra });
// Sloth's intent is decided when his turn enters the strip: every second heavy slam is the slowing slam, so you can see it coming (and Break it away).
let heavyN = 0;
const fillQ = () => { while (S.queue.length < 7) { const l = S.queue[S.queue.length - 1]; const who = l && l.who === 'A' ? 'S' : 'A'; S.queue.push(mk(who, who === 'S' ? { drag: ++heavyN % 2 === 0 } : {})); } };
const proj = (v) => { const p = v.clone().project(camera); return [(p.x * .5 + .5) * W(), (-p.y * .5 + .5) * H()]; };
// pops that land close in time stack upward instead of piling on one spot
const recentPops = []; const popAt = (v, text, cls) => { let [x, y] = proj(v); const now = performance.now(); while (recentPops.length && now - recentPops[0].t > 450) recentPops.shift(); const near = recentPops.filter(p => Math.abs(p.x - x) < 140).length; recentPops.push({ t: now, x }); ui.pop(text, x, y - near * 46, cls); };
const atlasChest = () => atlas.group.position.clone().add(new THREE.Vector3(0, 1.3, 0));
const slothBody = () => new THREE.Vector3(1.4, 3.6, .8);
const log = (m) => { S.log.push(m); if (S.log.length > 40) S.log.shift(); };
const sleep = (s) => clock.sleep(s);
const POST = { flash: 0, ab: 0, zoom: 0, desat: 0, ink: 0, red: 0, fpos: new THREE.Vector2(.5, .5), tint: new THREE.Vector3(1, 1, 1) };
// kick: hit punch. The flash is LOCAL to the contact point `at` (world), never full-screen white.
const kick = (flash, ab, zoom, at) => { POST.flash = Math.max(POST.flash, flash); POST.ab = Math.max(POST.ab, ab); POST.zoom = Math.max(POST.zoom, zoom); if (at) { const [x, y] = proj(at); POST.fpos.set(x / W(), 1 - y / H()); } };
// ink: a 2-4 frame two-tone impact frame for the big beats (perfect parry, break, the finish)
const INK = { gold: [1, .82, .4], ice: [.75, .92, 1], white: [1, .97, .9] };
const ink = (sec, c = 'gold') => { POST.ink = Math.max(POST.ink, sec); post.u.uInkCol.value.set(...INK[c]); };
const SH = Math.PI;

// ---- HUD sync
function syncHud() {
  ui.setHp('a', S.aHp, S.aMax); ui.setHp('s', S.sHp, S.sMax); ui.setShield(S.shield, S.broken); sloth.setShield(S.shield);
  ui.setBoost(S.boost, S.pend || 0); ui.setStrip(S.queue.length ? [S.cur, ...S.queue].filter(Boolean) : []);
}

// ---- shield + damage
function crackShield(n = 1) {
  for (let k = 0; k < n && S.shield > 0; k++) {
    S.shield--; const w = sloth.shardWorld(S.shield);
    fx.burstSparks(w, 26, { speed: 9, color: [2.6, 2.2, 1.2], size: .16, life: .7 }); fx.shock(w, { color: 0xfff0c0, size: 1.6, dur: .35, ground: false, opacity: .9 });
    sfx.crack(); rig.shake(.18);
    if (S.shield === 0) doBreak();
  }
  syncHud();
}
function doBreak() {
  S.broken = true; const nxt = S.queue.find(e => e.who === 'S'); if (nxt) nxt.stun = true;
  ui.say('BREAK', 'ice', 1500); sfx.shatter(); clock.freeze(150); clock.slow(.28, .65); sfx.slowmo(true); setTimeout(() => sfx.slowmo(false), 700);
  kick(.6, .018, .06, sloth.chestWorld()); ink(.075, 'ice'); rig.shot('brk', true); rig.shake(.9); rig.dolly(1);
  const c = sloth.chestWorld(); fx.burstSparks(c, 90, { speed: 14, color: [2.2, 2.2, 3], size: .1, life: 1 }); fx.shock(c, { color: 0xbfe6ff, size: 7, dur: .6, ground: false, opacity: 1 }); fx.burstDust(sloth.group.position, 16, { speed: 5, spread: 3, size: 1.2 });
  sloth.p.glow = 0; clock.tween(sloth.p, { sag: 1, glow: 0, sh: .3 }, .9, ease.out); sloth.hit(1.4);
  log('BREAK');
}
function hitSloth({ dmg, type, label, big = false, at }) {
  const weak = WEAK.includes(type) && !S.broken;
  const d = Math.round(dmg * (S.broken ? 1.7 : 1) * (weak ? 1 : 1)); S.sHp = Math.max(0, S.sHp - d);
  const pos = at || slothBody().add(new THREE.Vector3(-2, 0, 0));
  fx.burstSparks(pos, big ? 40 : 22, { speed: big ? 11 : 8, color: type === 'light' ? [1.4, 2.2, 3] : type === 'echo' ? [2.4, 1.4, 3] : [2.8, 2, 1], life: .5 });
  fx.burstDust(new THREE.Vector3(pos.x, pos.y - 1, pos.z), 6, { speed: 3, spread: 1, size: 1 });
  popAt(pos.clone().add(new THREE.Vector3(0, 1.4, 0)), '' + d, (S.broken ? 'big ' : '') + (weak ? 'weak' : ''));
  sloth.hit(); clock.freeze(big ? 100 : 62); rig.shake(big ? .5 : .32); kick(big ? .55 : .35, .004, 0, pos); rig.dolly(.5);
  if (type === 'force') sfx.punch(); else sfx.signal();
  if (weak) { ui.flashWeak(type); popAt(pos.clone().add(new THREE.Vector3(.5, .3, 0)), 'WEAK', 'weak txt'); crackShield(1); }
  syncHud(); log(`hit ${type} ${d} sHp=${S.sHp}`);
}

// ---- Atlas actions
async function runTo(x, z = .8, dur = .4) { atlas.yawTo(atlas.faceY * (x > atlas.base.x ? 1 : -1)); atlas.play('Running', .1); sfx.whoosh(dur); await clock.tween(atlas.base, { x, z }, dur, ease.io); }
async function doStrike(hits) {
  rig.shot('run', false, 4); ora.mode = 'orbit';
  await runTo(.9, .8, .42); atlas.yawTo(atlas.faceY);
  for (let i = 0; i < hits; i++) {
    atlas.play('Punch', .04, 2.2); atlas.group.position.x += 0; await sleep(.13);
    hitSloth({ dmg: 10, type: 'force', big: i === hits - 1 && hits > 1, at: new THREE.Vector3(1.7, 1.9 + (i % 2) * .5, .8) });
    kick(0, .006, .03); await sleep(.26);
  }
  atlas.play('Idle', .2); await sleep(.15); await runTo(HOME.x, HOME.z, .4); atlas.yawTo(atlas.faceY); atlas.play('Idle', .15);
}
async function doSignal(hits) {
  rig.shot('sloth', false, 3); atlas.yawTo(atlas.faceY); atlas.play('Wave', .1, 2.4); sfx.signal();
  for (let i = 0; i < hits; i++) {
    const a = ora.group.position.clone(), tgt = slothBody().add(new THREE.Vector3(-2.1, (i - hits / 2) * .5, (i % 2 ? .6 : -.6)));
    ora.fly(tgt, 'free'); sfx.signal();
    for (let s = 0; s <= 10; s++) { const p = a.clone().lerp(tgt, s / 10); fx.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: 0, vy: .5, vz: 0, life: .35, size: .35, color: [1, 1.8, 3] }); }
    await sleep(.2); ora.pulse = 1; hitSloth({ dmg: 8, type: 'light', at: tgt }); await sleep(.28);
  }
  ora.mode = 'orbit'; atlas.play('Idle', .2); await sleep(.3);
}
async function doWake() {
  rig.shot('tele', false, 3); atlas.play('Yes', .1, 2); const up = atlas.group.position.clone().add(new THREE.Vector3(0, 3.6, 0)); ora.fly(up, 'free'); sfx.wake(); await sleep(.5); ora.pulse = 1.5;
  for (let i = 0; i < 4; i++) { fx.shock(new THREE.Vector3(atlas.base.x + 1 + i * 1.8, .2, .8), { color: 0xe3b0ff, size: 3.2, dur: .8, opacity: .8 }); fx.shock(up.clone().add(new THREE.Vector3(i * 1.2, 0, 0)), { color: 0xc9a2ff, size: 2, dur: .7, ground: false, opacity: .6 }); await sleep(.18); }
  rig.shot('sloth', false, 3); ora.fly(slothBody().add(new THREE.Vector3(-3, .5, 0)), 'free'); await sleep(.25); ora.pulse = 1.5;
  hitSloth({ dmg: 6, type: 'echo', at: slothBody().add(new THREE.Vector3(-2.2, .5, 0)) });
  S.boost = Math.min(CAP, S.boost + 1); popAt(atlasChest().add(new THREE.Vector3(0, 1.2, 0)), '+1 BOOST', 'weak txt'); syncHud(); await sleep(.4);
  ora.mode = 'orbit'; atlas.play('Idle', .2);
}
async function doTonic() {
  rig.shot('heal', false, 3); atlas.play('ThumbsUp', .1, 1.6); sfx.heal(); S.tonics--; const h = Math.min(25, S.aMax - S.aHp); S.aHp += h;
  for (let i = 0; i < 40; i++) fx.glow.spawn({ x: atlas.base.x + (Math.random() - .5) * 1.2, y: Math.random() * 1.5, z: atlas.base.z + (Math.random() - .5) * 1.2, vy: 2 + Math.random() * 2, vx: 0, vz: 0, life: 1.1, size: .22, color: [.6, 2.2, 1.0] });
  popAt(atlasChest().add(new THREE.Vector3(0, 1, 0)), '+' + h, 'heal'); ora.pulse = 1; syncHud(); await sleep(.9); atlas.play('Idle', .2);
}

// ---- choosing
function chooseAction() {
  return new Promise(resolve => {
    let sel = 0, pend = 0;
    const items = () => [
      { id: 'strike', label: 'STRIKE', sub: '10 × hits', type: 'force', boostable: true },
      { id: 'signal', label: 'SKILL · SIGNAL', sub: 'Ora', type: 'light', boostable: true, weak: true },
      { id: 'wake', label: 'WAKE', sub: '+1 Boost', type: 'echo', weak: true },
      { id: 'item', label: 'ITEM · TONIC', sub: '×' + S.tonics, type: 'balm', dim: S.tonics <= 0 || S.aHp >= S.aMax },
    ];
    const render = () => { S.pend = pend; ui.showMenu(items(), sel, S.boost, pend); ui.setBoost(S.boost, pend); };
    const confirm = () => {
      const it = items()[sel]; if (it.dim) { sfx.deny(); return; }
      off(); ui.menu.removeEventListener('click', onClick); ui.hideMenu(); S.pend = 0; S.boost -= it.boostable ? pend : 0; resolve({ id: it.id, spend: it.boostable ? pend : 0 }); sfx.select();
    };
    const clamp = () => { const it = items()[sel]; pend = it.boostable ? Math.min(pend, S.boost) : 0; };
    const off = input.on((type, arg) => {
      if (S.phase !== 'menu') return;
      if (type === 'up') { sel = (sel + 3) % 4; sfx.tick(); } else if (type === 'down') { sel = (sel + 1) % 4; sfx.tick(); }
      else if (type === 'left') { pend = Math.max(0, pend - 1); sfx.tick(); } else if (type === 'right') { if (items()[sel].boostable) pend = Math.min(S.boost, pend + 1); sfx.tick(); }
      else if (type === 'num') { sel = arg; sfx.tick(); } else if (type === 'act') { confirm(); return; }
      clamp(); render();
    });
    const onClick = (e) => { const r = e.target.closest('.row'); if (!r) return; sel = +r.dataset.i; clamp(); render(); confirm(); };
    ui.menu.addEventListener('click', onClick);
    S.phase = 'menu'; render();
  });
}

async function atlasTurn() {
  S.boost = Math.min(CAP, S.boost + 1); syncHud(); rig.shot('menu', false, 2.2); atlas.play('Idle', .2); ora.mode = 'orbit';
  await sleep(.35);
  const c = await chooseAction(); S.phase = 'act'; log('choose ' + c.id + ' +' + c.spend); syncHud();
  const hits = 1 + c.spend;
  if (c.id === 'strike') await doStrike(hits); else if (c.id === 'signal') await doSignal(hits); else if (c.id === 'wake') await doWake(); else await doTonic();
  rig.shot('main', false, 2.4);
  if (S.sHp <= 0) await victory();
}

// ---- Sloth's turn
async function slothTurn(e) {
  S.phase = 'sloth';
  if (S.broken && e.stun) { ui.say('STALLED', 'ice', 1300); ui.subtitle('Sloth is stunned. His turn is lost.', 1800); rig.shot('sloth', false, 2); await sleep(1.5); rig.shot('main', false, 2); return; }
  if (S.broken) { // wakes: shield returns
    S.broken = false; S.shield = 6; ui.say('SLOTH STIRS', '', 1200); sfx.rumble(1.2); clock.tween(sloth.p, { sag: 0, sh: .08 }, 1.0, ease.io); rig.shot('wide', false, 2); syncHud(); await sleep(1.1);
  }
  S.slams++; await slam({ lesser: !!e.lesser, drag: !e.lesser && !!e.drag });
}
function parryWindowState(t) { // t = seconds until contact (positive = early), already latency-compensated
  if (t <= PERF_EARLY && t >= -PERF_LATE) return 'perfect'; if ((t > PERF_EARLY && t <= GOOD_EARLY) || (t < -PERF_LATE && t >= -GOOD_LATE)) return 'good'; return t > GOOD_EARLY ? 'early' : 'late';
}
const nowReal = () => clock.real + (performance.now() - lastFrameWall) / 1000;
let lastFrameWall = performance.now();
input.on((type) => {
  if (type !== 'act') return; sfx.init();
  const P = S.parry; if (!P || P.pressed) return;
  const pr = nowReal(); if (pr < P.lock) return; // locked out after a too-early press
  const t = P.beatReal - pr + LAT, res = parryWindowState(t);
  if (res === 'early') { // too early: a short lockout, not the whole parry. Mashing can't win.
    P.lock = pr + LOCKOUT; P.whiffs = (P.whiffs || 0) + 1; ui.ringResult('bad'); sfx.deny(); atlas.play('No', .05, 2.4);
    popAt(atlasChest().add(new THREE.Vector3(0, 1.6, 0)), 'EARLY', 'weak txt'); log(`parry whiff t=${t.toFixed(3)}`); return;
  }
  P.pressed = true; P.t = t; P.res = res;
  atlas.play('Punch', .03, 2.4); ora.pulse = 1; fx.burstSparks(atlas.group.position.clone().add(new THREE.Vector3(.8, 1.4, 0)), 8, { speed: 4, life: .3 });
  log(`parry press t=${t.toFixed(3)} ${P.res}`);
});

async function slam({ lesser, drag }) {
  const TP = TEMPO[lesser ? 'lesser' : drag ? 'drag' : 'heavy'], B = TP.beat, D = B * 2, DESC = Math.min(.24, B * .62); S.mood = drag ? 'drag' : 'norm';
  // 1) wind-up: cut to the duel framing, then a slow creep. The camera does NOT move again until the result.
  rig.shot(lesser ? 'duel2' : 'duel', true); rig.shot(lesser ? 'duel2' : 'duelIn', false, .35);
  sloth.p.glow = 0; clock.tween(sloth.p, { glow: .7 }, TP.hold * .8, ease.out);
  sfx.rumble(TP.hold + D * .6); sfx.duck(true, TP.hold + D);
  clock.tween(sloth.p, { sh: SH * .8, el: .7, headX: .35 }, TP.hold + B * .5, ease.out);
  if (drag) ui.say('SLOWING SLAM', 'violet', 1100);
  await sleep(TP.hold);
  // 2) count-in: game clock forced to real speed so what you see is what is timed. tick . tick . CONTACT
  clock.slowT = 0; clock.scale = 1; clock.hold = 0;
  const beatReal = clock.real + D; S.parry = { beatReal, D, pressed: false, drag, lesser, lock: 0 };
  ui.cueShow(drag ? 'PARRY · SLOW' : 'PARRY'); sfx.beat(0, drag); sloth.glint(1); ui.ringBeat();
  await sleep(B); sfx.beat(1, drag); sloth.glint(1.5); ui.ringBeat(); clock.tween(sloth.p, { glow: 1.1 }, .1);
  await sleep(B - DESC);
  clock.tween(sloth.p, { sh: SH * .25, el: 0 }, DESC, ease.slam); sfx.whoosh(DESC);
  await clock.until(() => clock.real >= beatReal - 1e-3);
  // 3) contact. If you haven't pressed yet, the contact hit-stop still listens (the late window).
  const P = S.parry;
  if (!P.pressed) { clock.freeze(GOOD_LATE * 1000 + 10); await clock.until(() => P.pressed || clock.real >= beatReal + GOOD_LATE); clock.hold = 0; }
  S.parry = null; ui.ringOff(); ui.cueHide();
  let res = P.pressed ? P.res : 'miss'; if (res === 'early' || res === 'late') res = 'miss'; P.final = res; log('slam result ' + res + (P.pressed ? ' t=' + P.t.toFixed(3) : '') + (P.whiffs ? ' whiffs=' + P.whiffs : ''));
  const ground = new THREE.Vector3(atlas.base.x - .1, 0, atlas.base.z), contact = new THREE.Vector3(atlas.base.x + .1, 1.2, atlas.base.z);
  const dmgFull = TP.dmg;
  if (res === 'perfect') {
    sloth.p.sh = SH * .31; ui.ringResult('ok'); sfx.ring(); sfx.thud(.35); clock.freeze(115); kick(.7, .01, .03, contact); ink(.06, 'gold'); rig.shake(.55); rig.shot('parry2', true);
    fx.burstSparks(contact, 110, { speed: 15, color: [2.4, 1.9, 1], size: .08, life: .9 }); fx.shock(contact, { color: 0xffffff, size: 4, dur: .5, ground: false, opacity: .8 }); fx.shock(ground, { color: 0xffe9b0, size: 6, dur: .6, opacity: .9 });
    fx.burstDust(ground, 14, { speed: 4, spread: 1 }); ui.say('PERFECT', 'gold', 1200); ora.pulse = 1; sloth.hit(1.2);
    clock.slow(.2, .75); sfx.slowmo(true); setTimeout(() => sfx.slowmo(false), 800);
    clock.tween(sloth.p, { sh: SH * .6, el: .5 }, .9, ease.out);
    if (drag) popAt(atlasChest().add(new THREE.Vector3(0, 1.6, 0)), 'CLOCK HELD', 'weak txt');
    await sleep(.1);
    // the counter: Atlas answers in the slow-mo
    atlas.play('Punch', .02, 1.4); rig.shot('sloth', false, 6); await sleep(.12);
    hitSloth({ dmg: 6, type: 'force', big: true, at: new THREE.Vector3(1.7, 2.2, .8) }); if (S.shield > 0) crackShield(1); fx.shock(new THREE.Vector3(1.7, 2.2, .8), { color: 0xfff0c0, size: 4, dur: .5, ground: false });
    await sleep(.1); if (S.sHp <= 0) { await victory(); return; }
    await sleep(.2);
  } else if (res === 'good') {
    sloth.p.sh = SH * .27; const d = Math.ceil(dmgFull / 2); ui.ringResult('ok'); sfx.goodParry(); sfx.thud(.6); clock.freeze(75); kick(.4, .008, .03, contact); rig.shake(.5); rig.shot('parry2', true);
    fx.burstSparks(contact, 50, { speed: 10, life: .6, size: .08 }); fx.burstDust(ground, 22, { speed: 6, spread: 1.5 }); fx.debris(ground, 10, 6); fx.shock(ground, { color: 0xffd9a0, size: 6, dur: .55, opacity: .7 });
    damageAtlas(d, false); ui.say('GUARD', '', 900); await sleep(.5);
  } else {
    ui.ringResult('bad'); if (P.pressed && P.res === 'early') popAt(atlasChest().add(new THREE.Vector3(0, 1.6, 0)), 'TOO EARLY', 'weak txt'); else if (P.pressed) popAt(atlasChest().add(new THREE.Vector3(0, 1.6, 0)), 'LATE', 'weak txt');
    sfx.thud(1); clock.freeze(125); kick(.3, .02, .09, ground); POST.red = 1; rig.shake(1); rig.dolly(1); rig.shot('parry2', true);
    fx.burstDust(ground, 28, { speed: 9, spread: 2, size: 1.2 }); fx.debris(ground, 40, 9); fx.burstSparks(ground, 30, { speed: 9, color: [2.2, 1.4, .7] }); fx.shock(ground, { color: 0xffc080, size: 9, dur: .7, opacity: .9 });
    damageAtlas(dmgFull, true); await sleep(.65);
  }
  // sloth recovers, camera resets, the clock may be pushed
  if (S.aHp > 0) {
    clock.tween(sloth.p, { sh: .08, el: .1, headX: .55, glow: 0 }, .9, ease.io); rig.shot('main', false, 2.2); S.mood = 'norm';
    if (drag && res !== 'perfect') { const a = S.queue[0]; if (a && a.who === 'A') { a.slowed = true; S.queue.splice(0, 0, mk('S', { lesser: true })); ui.say('SLOWED', 'violet', 1100); sfx.deny(); syncHud(); } }
    await sleep(.8);
  }
}
function damageAtlas(d, big) {
  S.aHp = Math.max(0, S.aHp - d); atlas.hitFlash(1); atlas.recoil.set(-.9 * (big ? 1.3 : .6), 0, .3); sfx.hurt();
  popAt(atlasChest().add(new THREE.Vector3(0, 1.2, 0)), '' + d, 'hurt'); syncHud();
  if (S.aHp <= 0) bentNote();
}
let bent = false;
async function bentNote() {
  if (bent) return; bent = true; S.phase = 'bent';
  await sleep(.3); atlas.play('Death', .05, 1.2); sfx.bent(); ui.subtitle('The note bends. Atlas stands back up.', 3000); rig.shot('heal', false, 2); clock.tween(sloth.p, { sh: .08, el: .1, headX: .55, glow: 0 }, 1, ease.io);
  await sleep(2.3);
  S.aHp = S.aMax; S.boost = 1; S.broken = false; S.shield = 6; clock.tween(sloth.p, { sag: 0 }, .6); S.parry = null; ui.ringOff(); ui.cueHide();
  atlas.play('Idle', .5); atlas.recoil.set(0, 0, 0); sfx.heal(); ora.pulse = 2; S.queue = []; S.cur = null; fillQ(); S.restart = true; syncHud(); bent = false;
  await sleep(.8);
}

async function victory() {
  if (S.over) return; S.over = true; S.phase = 'over'; S.parry = null; ui.ringOff(); ui.cueHide();
  await sleep(.05); clock.freeze(220); clock.slow(.15, 1.1); sfx.slowmo(true); setTimeout(() => sfx.slowmo(false), 1300); kick(1, .02, .1, sloth.chestWorld()); ink(.1, 'gold'); rig.shot('brk', true); rig.shake(.8);
  sfx.shatter(); const c = sloth.chestWorld(); fx.burstSparks(c, 140, { speed: 16, color: [3, 2.2, 1], life: 1.3 }); fx.burstDust(sloth.group.position, 40, { speed: 6, spread: 3, size: 2 }); fx.debris(sloth.group.position.clone().add(new THREE.Vector3(-1, 3, 0)), 50, 8);
  clock.tween(sloth.p, { sag: 1.2, glow: 0, sh: .1, el: .1 }, 2.2, ease.out); clock.tween(sloth, { release: 1 }, 3, ease.io);
  await sleep(.4); rig.shot('victory', false, 1.2); ui.say('SLOTH LETS GO', 'gold', 4200); sfx.victory();
  await sleep(2.4); ui.subtitle(document.body.classList.contains('pad-on') ? 'Press A to fight again' : 'Space to fight again', 100000);
  input.on((t) => { if (t === 'act') location.reload(); });
}

async function intro() {
  rig.shot('wide', true); rig.p.add(new THREE.Vector3(-6, 5, 6)); sloth.p.sag = .7; sloth.p.glow = 0; ora.group.position.set(-6, 3, 2);
  document.getElementById('loading').style.opacity = 0; setTimeout(() => document.getElementById('loading').remove(), 900);
  await sleep(.6); sfx.rumble(1.5); rig.shot('wide', false, 1.2); await sleep(1.3);
  clock.tween(sloth.p, { sag: 0, glow: .8 }, 1.2, ease.out); ui.say('SLOTH', '', 1500); rig.shake(.4); await sleep(1.4);
  clock.tween(sloth.p, { glow: 0 }, .8); rig.shot('main', false, 1.6); await sleep(1.0);
}

async function fight() {
  fillQ(); S.cur = null; syncHud(); await intro();
  while (!S.over) {
    if (S.restart) { S.restart = false; rig.shot('main', true); }
    if (!S.queue.length) fillQ();
    const e = S.queue.shift(); fillQ(); S.cur = e; syncHud();
    if (e.who === 'A') await atlasTurn(); else await slothTurn(e);
    if (S.sHp <= 0 && !S.over) await victory();
    S.cur = null;
  }
}

// ---- main loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); lastFrameWall = now;
  const raw = (now - last) / 1000; last = now; clock.tick(raw); input.poll();
  const dt = clock.dt, dr = clock.dtReal, t = clock.g;
  atlas.update(dt, t); ora.update(dt, t, atlas.group.position); sloth.update(dt, t, S.mood); arena.update(dt, t); fx.update(dt);
  const shake = rig.update(dr);
  // the ring closes linearly onto the beat and never changes colour early (a colour cue baits a late reaction press)
  if (S.parry) { const rem = S.parry.beatReal - clock.real; const k = Math.max(0, Math.min(1, rem / S.parry.D)); if (!S.parry.pressed) { const [x, y] = proj(atlasChest()); ui.ring(x, y, k, S.parry.drag); } else ui.ringOff(); }
  const slowK = 1 - clock.scale;
  POST.flash *= Math.exp(-dr * 13); POST.red *= Math.exp(-dr * 3.5); POST.ink = Math.max(0, POST.ink - dr); POST.ab *= Math.exp(-dr * 6); POST.zoom *= Math.exp(-dr * 9); POST.desat += (slowK * .3 - POST.desat) * Math.min(1, dr * 10);
  const u = post.u; u.uFlash.value = POST.flash; u.uFlashPos.value.copy(POST.fpos); u.uAspect.value = W() / H(); u.uInk.value = POST.ink > 0 ? 1 : 0; u.uRed.value = POST.red; u.uAb.value = POST.ab + shake * .004; u.uZoom.value = POST.zoom; u.uDesat.value = POST.desat; u.uTime.value = t; u.uVig.value = .5 + slowK * .5;
  u.uTint.value.set(1 + slowK * .1, 1, 1 + slowK * .25); fx.glow.mat.uniforms.uScale.value = fx.dust.mat.uniforms.uScale.value = H() * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * Math.PI / 360));
  post.comp.render();
}

async function boot() {
  ui.setBoostCap(CAP); ui.setWeak(WEAK); syncHud();
  // ?atlas=3d loads the real Atlas Veyr model (static for now: no rig yet); the default stays the animated stand-in
  const AQ = new URLSearchParams(location.search).get('atlas'); const ATLAS3D = AQ === '3d' || AQ === 'v2' || AQ === 'v3';
  const ATLAS_URL = { '3d': 'atlas_veyr_v3_clean.glb', v3: 'atlas_veyr_v3_clean.glb', v2: 'atlas_veyr_v2_rigged.glb' }[AQ];
  await atlas.load(ATLAS3D ? '../../vendor/models/' + ATLAS_URL : '../../vendor/models/RobotExpressive.glb');
  atlas.yawTo(atlas.faceY); atlas.group.rotation.y = atlas.faceY;
  if (ATLAS3D) {   // the sunset arena backlights him: a soft warm key in front and a cool rim, both riding with Atlas
    const key = new THREE.PointLight(0xffe0c0, 9, 5, 1.6); key.position.set(0, 1.7, 1.4); atlas.group.add(key);
    const rim = new THREE.PointLight(0x9ad0ff, 4, 4, 1.8); rim.position.set(0, 2.1, -1.2); atlas.group.add(rim);
  }
  window.__battle = { S, clock, input, rig, ui, atlas, sloth, fx, camera, ready: true };
  requestAnimationFrame(frame);
  addEventListener('pointerdown', () => sfx.init(), { once: true }); addEventListener('keydown', () => sfx.init(), { once: true });
  fight();
}
boot().catch(e => { console.error('BOOT FAIL', e); document.getElementById('loading').textContent = 'FAILED: ' + e.message; });
