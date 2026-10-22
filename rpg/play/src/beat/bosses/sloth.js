import saved from '../charts/sloth.json' with {type:'json'};
// All times are musical beats at 112.70005 BPM. Edit this list directly.
// hold/charge: duration in beats; parry: Sloth's phrase-ending slam.
const SYNTH = typeof location !== 'undefined' && new URLSearchParams(location.search).get('music') === 'synth';
const BPM = SYNTH ? 108 : 112.70005;
const BEAT = 60 / BPM;
const PASSES = 4;
const END = SYNTH ? 192 : 132 + PASSES * 16;
const SYNTH_CHART = [
  [4,'tap'],[6,'tap'],[8,'tap'],[10,'tap',0,true],
  [16,'tap'],[18,'tap'],[20,'hold',2],[24,'tap',0,true],
  [28,'tap'],[30,'tap'],[32,'tap'],[34,'tap',0,true],
  [38,'tap'],[40,'tap'],[42,'hold',2],[46,'tap',0,true],
  [54,'tap'],[56,'tap'],[58,'tap'],[60,'tap',0,true],
  [64,'tap'],[66,'hold',2],[70,'tap'],[72,'tap',0,true],
  [76,'tap'],[78,'tap'],[80,'tap'],[82,'tap',0,true],
  [86,'tap'],[88,'tap'],[90,'hold',2],[94,'tap',0,true],
  [100,'tap'],[102,'tap'],[104,'charge',3],[108,'tap',0,true],
  [112,'tap'],[113,'tap'],[114,'tap'],[116,'tap',0,true],
  [120,'tap'],[122,'hold',2],[126,'tap'],[128,'tap',0,true],
  [132,'tap'],[134,'tap'],[136,'tap'],[140,'tap',0,true],
  [150,'tap'],[152,'tap'],[154,'tap'],[156,'tap',0,true],
  [160,'tap'],[162,'hold',2],[166,'tap'],[168,'tap',0,true],
  [172,'tap'],[174,'tap'],[176,'tap'],[178,'tap',0,true],
  [182,'tap'],[184,'tap'],[186,'hold',2],[190,'tap',0,true],
].map(([beat,type,duration=0,parry=false],i)=>({beat,type,duration,parry,number:i%4+1}));
// Hand-authored from the 44.1 kHz energy/onset grid; ambient swells are
// sustained, groove phrases breathe on quiet bars, and the ending builds.
// Four beats after each story panel remain clear so its painting can land.
const INTRO = [
 [0,'hold',2],[8,'hold',2],[15,'tap'],[22,'hold',2],[28,'charge',3],
 [36,'tap'],[38,'tap'],[40,'tap'],[44,'tap',0,true],
 [48,'tap'],[49,'tap'],[50,'tap'],[52,'tap',0,true],
 [56,'hold',2],[59,'tap'],[60,'tap',0,true],
 [64,'tap'],[65,'tap'],[66,'tap'],[68,'tap',0,true],[70,'tap'],
 [72,'hold',2],[76,'tap',0,true],[79,'tap'],
 [80,'tap'],[82,'tap'],[86,'tap'],[88,'hold',2],[92,'tap',0,true],[93.5,'tap'],
 [100,'tap'],[102,'tap'],[104,'hold',2],
 [108,'tap',0,true],[110,'tap'],[112,'tap'],[114,'tap'],
 [116,'tap',0,true],[118,'tap'],[120,'hold',2],
 [123.5,'tap',0,true],[125.5,'tap'],[127.5,'tap',0,true],[129.5,'tap'],
];
// The loop's opening breath also accommodates the beat-132 story panel.
// Base + two alternates; the fourth pass returns to the base to resolve.
// Daryll, 2026-10-17: "some of the clusters are a little too tight for a human … too intense near the end."
// Since then no two taps sit closer than two beats (~1.06 s) from beat 100 on; holds give the hands a rest.
const LOOP_PHRASES = [
 [[4,'tap',0,true],[6,'tap'],[8,'hold',2],[12,'tap',0,true],[14,'tap']],
 [[4,'tap',0,true],[6,'tap'],[8,'tap'],[10,'tap'],[12,'hold',2]],
 [[4,'tap',0,true],[6,'hold',2],[10,'tap'],[12,'tap',0,true],[14,'tap']],
];
const CHART = SYNTH ? SYNTH_CHART : [...INTRO,...Array.from({length:PASSES},(_,pass)=>
 LOOP_PHRASES[pass%3].map(([beat,...rest])=>[132+pass*16+beat,...rest])).flat()]
 .map(([beat,type,duration=0,parry=false],i)=>({beat,type,duration,parry,number:i%4+1}));
const PANELS = [
 {beat:SYNTH?48:32,id:'p1-intro',caption:'Even stone remembers a rhythm.'},
 {beat:96,id:'p2',good:'A little warmth finds its way in.',stumble:'The weight settles. Atlas stays.'},
 {beat:SYNTH?144:132,id:'p3',good:'He remembers how to rise.',stumble:'Ora keeps a small light burning.'},
 {beat:END,id:'p4-finale',caption:'The weight lifts.'},
];

export const authoredSloth = {
 id:'sloth', name:'Sloth', song:{bpm:BPM, beats:END, firstBeatOffset:SYNTH?0:.911, ...(SYNTH?{}:{passes:PASSES,loopStartBeat:132,loopBeats:16,url:'/rpg/play/pitch/beat/music/intro.flac',pieces:{intro:'/rpg/play/pitch/beat/music/intro.flac',loop:'/rpg/play/pitch/beat/music/loop.flac',outro:'/rpg/play/pitch/beat/music/outro.flac'}}), procedural:{
 chords:[[146.83,174.61,220],[130.81,164.81,196],[116.54,146.83,174.61],[130.81,164.81,196]], hook:[0,2,1,2,0,1,2,1], build:[88,104], drop:[104,144], quiet:[16,192], break:[100,104], roll:96, lift:144, intro:48}},
 chart:CHART, sections:PANELS.map((p,i)=>({...p,start:i?PANELS[i-1].beat:0,art:{good:'/rpg/play/pitch/beat/panels/'+(p.caption?p.id:p.id+'-good')+'.png',stumble:'/rpg/play/pitch/beat/panels/'+(p.caption?p.id:p.id+'-stumble')+'.png'}})),
 art:{cutins:{base:'/rpg/play/pitch/duel/assets/base.jpg',charge:'/rpg/play/pitch/duel/assets/charge.jpg',strike:'/rpg/play/pitch/duel/assets/strike.jpg'},background:'/rpg/play/pitch/duel/assets/bg.png', boss:{stirring:'/rpg/play/pitch/beat/sloth-wake/01-stage-stirring.png',waking:'/rpg/play/pitch/beat/sloth-wake/02-stage-waking.png',risen:'/rpg/play/pitch/beat/sloth-wake/03-stage-risen.png',idle:'/rpg/play/pitch/duel/assets/sloth-idle.png',windup:'/rpg/play/pitch/duel/assets/sloth-windup.png',slam:'/rpg/play/pitch/duel/assets/sloth-slam.png'},atlas:{ready:'/rpg/play/pitch/duel/assets/atlas-ready.png',strike:'/rpg/play/pitch/duel/assets/atlas-strike.png',parry:'/rpg/play/pitch/duel/assets/atlas-parry.png'},fallback:{stumble:'/rpg/play/pitch/duel/assets/charge.jpg',good:'/rpg/play/pitch/duel/assets/strike.jpg'}},
 wakeStages:{threshold:.6,crossfadeBeats:1,poses:['idle','stirring','waking','risen'],cues:[{beat:32,stage:1,start:0},{beat:96,stage:2,start:32},{beat:180,stage:3,start:164}]},
 cutins:SYNTH?[]:[{beat:96,duration:1.25,art:'/rpg/play/pitch/beat/sloth-wake/04-cutin-eyes-open.png'},{beat:132,duration:1.25,art:'/rpg/play/pitch/beat/sloth-wake/05-cutin-light-wave.png'}],
 ending:{barBeats:4,shots:[{bar:0,art:'/rpg/play/pitch/beat/sloth-wake/06-ending-rises.png'},{bar:3,art:'/rpg/play/pitch/beat/sloth-wake/07-ending-steps-aside.png'},{bar:6,finale:true}],scoreBar:8},
 streak:{fullCombo:20,motes:28,flakes:16},
 wake:{colour:[255,206,111],initial:.25,min:.08,perfect:.025,good:.016,miss:-.055},
 summon:{art:['01-call','02-rise','03-climb','04-split','05-dance','06-focus','07-impact','08-return'].map(n=>'/rpg/play/pitch/beat/summon/'+n+'.png'),icon:'/rpg/play/pitch/beat/summon/09-icon.png',beats:16,minBeat:100,fullBeat:128,downbeat:4,leadBeats:4,window:.24,wakeBeat:12,wake:.3,meter:{perfect:.03,good:.029,miss:-.008}},
 twist:null,
};

export default SYNTH ? authoredSloth : saved;
