// Store simulation boundaries as well as inputs: miss/hold resolution must not
// depend on the frame rate at which the film is watched.
export class FightTape {
 constructor(game){this.options={boss:game.boss,assist:game.assist,latency:game.latency,summon:game.summonMode};this.steps=[];this.actions=[];}
 update(game,dt){if(dt<=0)return;this.steps.push(game.time+dt);game.update(dt);}
 input(game,type){this.actions.push({time:game.time,type});if(type==='press')game.press();if(type==='release')game.release();if(type==='summon-skip')game.skipSummon();}
 data(){return {version:1,assist:this.options.assist,latency:this.options.latency,summon:this.options.summon,steps:this.steps,actions:this.actions};}
}
export class FightPlayback {
 constructor(game,tape,onSkip=()=>{}){this.game=game;this.tape=tape;this.onSkip=onSkip;this.stepIndex=0;this.actionIndex=0;this.clock=0;game.start();}
 advance(dt){this.clock+=Math.max(0,dt);const {game,tape}=this;
 while(true){const s=tape.steps[this.stepIndex]??Infinity,a=tape.actions[this.actionIndex],t=a?.time??Infinity;if(Math.min(s,t)>this.clock)break;
 // An input at a frame boundary occurred after that frame's update.
 if(s<=t){this.stepIndex++;if(game.phase==='end')game.time=s;else game.update(s-game.time);}else{this.actionIndex++;if(a.type==='cutin-skip')this.onSkip();else if(a.type==='summon-skip')game.skipSummon();else game[a.type]();}}
 }
}
