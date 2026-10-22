import {parryGrade, DEFAULTS} from '../jam/rules.js';
export class Duel {
 constructor(c={}) {this.c={...DEFAULTS,grip:2100,damage:13,light:0,...c};this.reset();}
 reset(){Object.assign(this,{time:0,hp:100,grip:this.c.grip,shell:4,light:this.c.light,drowse:false,guard:false,revived:false,turn:0,events:[],history:[],paused:false,broken:false});this.begin('ready');}
 event(type,data={}){const e={type,time:this.time,...data};this.events.push(e);this.history.push(e);}
 begin(phase,duration=Infinity){this.phase=phase;this.start=this.time;this.end=this.time+duration;this.event('phase',{phase});}
 player(){this.begin('player');}
 crack(){if(this.shell>0){this.shell--;if(!this.shell){this.broken=true;this.light=3;this.event('break');}}}
 press(b){
 if(b==='START'){this.paused=!this.paused;return;}
 if(this.paused)return;
 if(['ready','win','lose'].includes(this.phase)){if(b==='A'){this.reset();this.player();}return;}
 if(['radiant','mini'].includes(this.phase)){if(b==='B')this.end=this.time;return;}
 if(this.phase==='windup'&&b==='A'&&!this.parried&&this.time>=(this.lockUntil||0)){
 const grade=parryGrade(this.contact-(this.time-this.c.latency),this.c);
 if(grade==='miss'){this.lockUntil=this.time+this.c.lockout;return;}
 this.parried=grade;this.event('parry',{grade});return;
 }
 if(this.phase!=='player'||!'AXYB'.includes(b))return;
 this.action=b;this.event('action',{button:b,drowse:this.drowse});
 this.begin(b==='Y'&&this.light>=3?'radiant':'action',b==='Y'&&this.light>=3?3.35:this.drowse?2.2:1.05);
 }
 resolve(){
 const b=this.action,m=this.broken?2:1;
 let damage=0;
 if(this.phase==='radiant'){damage=125*m;this.light=0;this.drowse=false;this.event('radiant');}
 else if(b==='A')damage=(this.shell?14:46)*m;
 else if(b==='X'){this.crack();damage=9*m;}
 else if(b==='Y'){this.drowse=false;this.light=Math.min(3,this.light+1);this.hp=Math.min(100,this.hp+5);this.event('rally');}
 else if(b==='B'){this.guard=true;this.light=Math.min(3,this.light+1);}
 this.grip=Math.max(0,this.grip-damage);this.event('damage',{damage});
 // A break caused by Signal belongs to the NEXT action.
 const fresh=this.history.some(e=>e.type==='break'&&e.time>=this.start);
 if(this.broken&&!fresh){this.broken=false;this.shell=4;}
 if(this.grip<=0){this.begin('wake',4);return;}
 if(this.broken){this.begin('break',1.2);return;}
 this.turn++;this.begin('enemy',1.2);
 }
 windup(){this.slam++;this.parried=false;this.hitCue=false;this.lockUntil=0;this.contact=this.time+(this.turn%3===0?2.7:2.1);this.begin('windup',this.contact-this.time+this.c.goodLate+this.c.latency);}
 update(dt){if(this.paused||['ready','win','lose'].includes(this.phase))return;
 for(let left=dt;left>1e-7;){const h=Math.min(.01,left);left-=h;this.time+=h;if(this.phase==='windup'&&!this.hitCue&&this.time>=this.contact){this.hitCue=true;this.event('hit');}if(this.time+1e-7<this.end)continue;
 if(['action','radiant'].includes(this.phase))this.resolve();
 else if(this.phase==='break')this.player();
 else if(this.phase==='enemy'){if(this.turn%4===0)this.begin('fog',3);else {this.slam=0;this.slams=1+this.turn%3;this.windup();}}
 else if(this.phase==='fog'){this.drowse=true;this.event('drowse');this.player();}
 else if(this.phase==='windup'){
 const grade=this.parried||'miss';let damage=this.c.damage*(grade==='perfect'?0:grade==='good'?.5:1)*(this.guard?.5:1);this.guard=false;this.hp-=damage;
 this.event('contact',{grade,damage});if(grade==='perfect'){this.crack();this.begin('mini',.5);}else this.begin('impact',.75);
 if(this.hp<=0){if(!this.revived){this.revived=true;this.hp=50;this.event('bent');this.begin('bent',2.3);}else this.begin('lose');}
 }else if(['mini','impact','bent'].includes(this.phase)){if(this.broken)this.begin('break',1.2);else if(this.slam<this.slams)this.windup();else this.player();}
 else if(this.phase==='wake')this.begin('win');
 }}
 snapshot(){return {...this,events:undefined,c:{...this.c}};}
}
