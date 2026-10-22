// Story structure around the unmodified THE WEIGHING duel.
import * as K from './weighing-kernel.js';
import {resolutionTrace,directPreview,tideLeader} from './trace.js';
export const moves = Object.freeze([
 {names:['Signal Flare','Her Wave'], icon:'✹', effect:'Clear a row', paintings:['story/05-atlas-reaches-through.jpg','story/04-her-wave.jpg']},
 {names:['Still Water','The Lure'], icon:'≋', effect:'Turn drops into hearts', paintings:['story/08-gathers-the-river.jpg','story/06-the-lure.jpg']},
 {names:['River Seed','The Pull'], icon:'❧', effect:'Change one gem into a power colour', paintings:['story/11-atlas-answers.jpg','story/03-the-pull.jpg']},
 {names:['Break the Loop','Undertow'], icon:'ϟ', effect:'Clear a four by four block', paintings:['story/05-atlas-reaches-through.jpg','story/09-final-attack.jpg']},
 {names:['Steady Breath','Siren Song'], icon:'❦', effect:'Relieve up to six burden, once each duel', paintings:['story/07-steady.jpg','story/02-song-reaches-out.jpg']},
].map((move,i)=>Object.freeze({...move,cost:K.powerCosts[i]})));
export const PLAYTEST_EASY = true;
export class CurrentFight {
 constructor(seed=719,{playtestEasy=PLAYTEST_EASY}={}){
  this.playtestEasy=playtestEasy;this.powerOpportunities=0;
  // Choice-only RNG never changes refills or other kernel rules.
  this.choiceRng={seedI:K.sampleSeed(seed,11)};
  this.state=K.newGame(seed);this.round=1;this.rounds=0;this.losses=0;
  this.moves=0;this.total=0;this.stage='river';this.history=[];
 }
 get health(){return this.state.burden.map(b=>K.burdenMax-b);}
 get progress(){
  if(this.stage==='awake'||this.stage==='ending')return 1;
  const within=this.state.winnerI===0?1:this.state.burden[1]/K.burdenMax;
  return Math.min(.96,((this.round-1)+within)/3);
 }
 get ahead(){return this.state.burden[1]>=this.state.burden[0];}
 act(action){
  if(this.stage!=='river')return null;
  const actor=this.state.actorI;
  const opportunity=actor===1&&K.enumerateCandidateActions(this.state).some(a=>K.actionKind(a)!==K.kindSwap);
  const before=[...this.state.board],burdenBefore=[...this.state.burden];
  const trace=resolutionTrace(this.state,action);
  if(!trace)return null;
  if(opportunity)this.powerOpportunities++;
  const cleared=new Set(trace.waves.flatMap(w=>w.cells.map(c=>c.cell)));
  const kind=K.actionKind(action);
  const result={trace,actor,action,kind,move:K.actionPowerGodIndex(kind),before,after:[...this.state.board],
   clear:this.state.lastTotalClearI,waves:this.state.creditedWavesI,maxRun:this.state.primaryMaxRunI,
   power:kind!==K.kindSwap,changed:[...cleared],burdenBefore,burdenAfter:[...this.state.burden]};
  this.moves++;if(actor===0)this.total+=result.clear;
  if(this.state.winnerI>=0){
   this.rounds++;
   this.stage=this.state.winnerI===1?'pulled-under':['summon','pearl','ending'][this.round-1];
   if(this.state.winnerI===1)this.losses++;
   result.milestone=this.stage;
   this.history.push({round:this.round,winner:this.state.winnerI,stage:this.stage});
  }
  return result;
 }
 resume(){
  if(this.stage==='ending'){this.stage='awake';return;}
  if(!['summon','pearl','pulled-under'].includes(this.stage))return;
  if(this.stage!=='pulled-under')this.round++;
  this.state=K.newGame(this.state.seedI,0);this.stage='river';this.powerOpportunities=0;
 }
 ai(){
  if(!this.playtestEasy)return K.chooseAiAction(this.state,1);
  // Only every third accepted power opportunity permits a cast.
  const allowPower=this.powerOpportunities%3===2?1:0;
  if(K.rngRoll10000(this.choiceRng)<2000)return K.chooseAiAction(this.state,1,allowPower);
  // Prefer plain swaps over direct four/five matches (and their extra turns).
  const swaps=this.swaps(),plain=swaps.filter(a=>K.previewAction(this.state,a)[K.pvMaxRun]<4);
  const choices=plain.length?plain:swaps;
  return choices[K.rngIndex(this.state,choices.length)];
 }
 get leader(){return tideLeader(this.state);}
 preview(index){const action=this.power(index);return action===undefined?null:directPreview(this.state,action);}
 swaps(){return K.enumerateLegalSwaps(this.state.board);}
 // Pick the strongest direct preview for the chosen power. No choice RNG,
 // refill prediction or rules changes; the named move always has its real cost.
 power(index){
  let best,score=-Infinity;
  for(const a of K.enumerateCandidateActions(this.state)){
   const kind=K.actionKind(a);if(kind===K.kindSwap)continue;
   if(index!==undefined&&K.actionPowerGodIndex(kind)!==index)continue;
   const p=K.previewAction(this.state,a),s=p[K.pvHeart]*2+p[K.pvFeather]+p[K.pvClear]+p[K.pvMaxRun]*3;
   if(s>score){score=s;best=a;}
  }
  return best;
 }
}
