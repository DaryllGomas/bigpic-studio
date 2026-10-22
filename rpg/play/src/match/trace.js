// Snapshots from the authoritative resolver; never draws tiles or chooses actions.
import * as K from './weighing-kernel.js';
const copy = s => ({board:[...s.board], vessels:s.vessels.map(v=>[...v]), burden:[...s.burden], mask:[...s.clearMask], reshuffles:s.freeReshuffleCountI, overflow:s.cascadeOverflowI});
export function resolutionTrace(state, action) {
 const before=copy(state),actor=state.actorI,events=[];
 const accepted=K.applyAction(state,action,(phase,s)=>events.push({phase,...copy(s)}));
 if(!accepted)return null;
 const committed=events.find(e=>e.phase==='committed'),dispatched=events.find(e=>e.phase==='dispatched');
 const swaps=K.actionKind(action)===K.kindSwap?K.actionIdToSwap(action):[];
 const conversions=swaps.length?[]:dispatched.board.flatMap((kind,cell)=>kind!==committed.board[cell]? [{cell,from:committed.board[cell],kind}]:[]);
 const waves=[];
 for(let i=0;i<events.length;i++)if(events[i].phase==='wave'){
  const w=events[i],credit=events[i+1],fallen=events[i+3],refilled=events[i+4];
  const cells=w.mask.flatMap((n,cell)=>n?[{cell,kind:w.board[cell],credit:0}]:[]);
  const left=credit.vessels[actor].map((n,j)=>n-w.vessels[actor][j]);
  for(const c of cells)if(c.kind>=2&&left[c.kind-2]>0){c.credit=1;left[c.kind-2]--;}
  const falls=[];
  for(let x=0;x<8;x++){let y=7;for(let r=7;r>=0;r--){const from=r*8+x;if(!w.mask[from]){const to=y--*8+x;if(to!==from)falls.push({from,to,kind:w.board[from]});}}}
  const refills=refilled.board.flatMap((kind,cell)=>fallen.board[cell]===K.empty?[{cell,kind}]:[]);
  waves.push({board:w.board,cells,falls,refills,after:refilled.board,vessels:credit.vessels});
 }
 // Bar credit is applied once after all waves. Allocate only actual capped
 // credit to particles, in resolution order; wasted tiles simply dissolve.
 let damage=state.lastDamageI,relief=state.lastReliefI;
 for(const w of waves)for(const c of w.cells){if(c.kind===0){c.credit=Math.min(2,damage);damage-=c.credit;}if(c.kind===1){c.credit=Math.min(3,relief);relief-=c.credit;}}
 const lastRefill=events.filter(e=>e.phase==='refilled').at(-1)?.board||dispatched.board;
 return {before,swaps,conversions,waves,damage:state.lastDamageI,relief:state.lastReliefI,directRelief:K.actionKind(action)===K.kindLift?state.lastReliefI:0,
  after:copy(state),reshuffle:state.freeReshuffleCountI>before.reshuffles||state.cascadeOverflowI>before.overflow||lastRefill.some((n,i)=>n!==state.board[i])};
}
export function directPreview(state,action){
 const s=structuredClone(state),kind=K.actionKind(action),before=[...s.board],actor=s.actorI;
 K.commitActionPhase(s,action,kind);K.dispatchActionPhase(s,action,kind);
 const affected=s.clearMask.flatMap((v,cell)=>v?[cell]:[]),conversions=s.board.flatMap((v,cell)=>v!==before[cell]?[{cell,from:before[cell],kind:v}]:[]);
 K.creditWavePhase(s);K.applyBurdenPhase(s);
 return {action,affected,conversions,board:s.board,damage:s.lastDamageI,relief:s.lastReliefI,vessels:s.vessels[actor].map((n,i)=>n-state.vessels[actor][i]+(K.actionPowerGodIndex(kind)===i?K.powerCosts[i]:0))};
}
export function tideLeader(state){
 const s=structuredClone(state);s.winnerI=-1;K.adjudicateActionCap(s);return s.winnerI;
}
